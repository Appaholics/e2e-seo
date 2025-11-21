import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

interface SeoCheckResult {
  success: boolean;
  data?: SeoReport;
  error?: string;
}

interface SeoReport {
  url: string;
  timestamp: string;
  score: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  checks: {
    [category: string]: CheckResult[];
  };
}

interface CheckResult {
  passed: boolean;
  message: string;
  category?: string;
  severity?: 'error' | 'warning' | 'info';
}

interface FlatCheck extends CheckResult {
  categoryName: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Settings {
  defaultPreset: string;
  darkMode: boolean;
  maxRecentUrls: number;
}

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeoCheckResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('advanced');
  const [activeTab, setActiveTab] = useState<'all' | 'passed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedChecks, setExpandedChecks] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    defaultPreset: 'advanced',
    darkMode: false,
    maxRecentUrls: 5,
  });

  const urlInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('seo-checker-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setSelectedPreset(parsed.defaultPreset);
      document.documentElement.setAttribute('data-theme', parsed.darkMode ? 'dark' : 'light');
    }

    const savedUrls = localStorage.getItem('seo-checker-recent-urls');
    if (savedUrls) {
      setRecentUrls(JSON.parse(savedUrls));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('seo-checker-settings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  }, [settings]);

  // Save recent URLs to localStorage
  useEffect(() => {
    localStorage.setItem('seo-checker-recent-urls', JSON.stringify(recentUrls));
  }, [recentUrls]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + R: Rerun analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !loading && url) {
        e.preventDefault();
        handleCheck();
      }

      // Ctrl/Cmd + E: Export results
      if ((e.ctrlKey || e.metaKey) && e.key === 'e' && result?.data) {
        e.preventDefault();
        exportResults();
      }

      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && result?.data) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Ctrl/Cmd + K: Focus URL input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        urlInputRef.current?.focus();
      }

      // Ctrl/Cmd + ,: Open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }

      // Escape: Close settings or clear search
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (searchQuery) {
          setSearchQuery('');
        }
      }

      // Ctrl/Cmd + D: Toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, url, result, searchQuery, showSettings]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  }, []);

  const validateUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleCheck = async () => {
    if (!url) {
      showToast('Please enter a URL', 'error');
      return;
    }

    if (!validateUrl(url)) {
      showToast('Please enter a valid URL starting with http:// or https://', 'error');
      return;
    }

    setLoading(true);
    setResult(null);
    setSearchQuery('');
    setSelectedCategory('all');
    setActiveTab('all');
    setExpandedChecks(new Set());

    try {
      const response = await invoke<SeoCheckResult>('run_seo_check', {
        url,
        config: selectedPreset,
      });
      setResult(response);

      if (response.success) {
        showToast('Analysis completed successfully!', 'success');
        // Add to recent URLs
        setRecentUrls((prev) => {
          const updated = [url, ...prev.filter((u) => u !== url)].slice(0, settings.maxRecentUrls);
          return updated;
        });
      } else {
        showToast('Analysis failed. Please check the error details.', 'error');
      }
    } catch (error) {
      setResult({
        success: false,
        error: String(error),
      });
      showToast('An error occurred during analysis', 'error');
    } finally {
      setLoading(false);
    }
  };

  const flattenChecks = useCallback((checks: { [category: string]: CheckResult[] }): FlatCheck[] => {
    const flattened: FlatCheck[] = [];

    const categoryNames: { [key: string]: string } = {
      metaTags: 'Meta Tags',
      headings: 'Headings',
      images: 'Images',
      performance: 'Performance',
      robotsTxt: 'Robots.txt',
      sitemap: 'Sitemap',
      security: 'Security',
      structuredData: 'Structured Data',
      socialMedia: 'Social Media',
      content: 'Content',
      links: 'Links',
      uiElements: 'UI Elements',
      technical: 'Technical SEO',
      accessibility: 'Accessibility',
      urlFactors: 'URL Factors',
      spamDetection: 'Spam Detection',
      pageQuality: 'Page Quality',
      advancedImages: 'Advanced Images',
      multimedia: 'Multimedia',
      coreWebVitals: 'Core Web Vitals',
      analytics: 'Analytics & Tracking',
      mobileUX: 'Mobile UX',
      schemaValidation: 'Schema Validation',
      resourceOptimization: 'Resource Optimization',
      legalCompliance: 'Legal & Compliance',
      ecommerce: 'E-commerce',
      internationalization: 'Internationalization',
    };

    for (const [key, checkArray] of Object.entries(checks)) {
      const categoryName = categoryNames[key] || key;
      checkArray.forEach((check) => {
        flattened.push({
          ...check,
          categoryName,
        });
      });
    }

    return flattened;
  }, []);

  const { filteredChecks, categories, categoryStats } = useMemo(() => {
    if (!result?.success || !result.data) {
      return { filteredChecks: [], categories: [], categoryStats: new Map() };
    }

    const allChecks = flattenChecks(result.data.checks);

    const uniqueCategories = Array.from(
      new Set(allChecks.map((c) => c.categoryName))
    ).sort();

    // Calculate stats per category
    const stats = new Map<string, { total: number; passed: number; failed: number }>();
    allChecks.forEach(check => {
      const current = stats.get(check.categoryName) || { total: 0, passed: 0, failed: 0 };
      current.total++;
      if (check.passed) current.passed++;
      else current.failed++;
      stats.set(check.categoryName, current);
    });

    let filtered = allChecks;

    // Filter by tab
    if (activeTab === 'passed') {
      filtered = filtered.filter((c) => c.passed);
    } else if (activeTab === 'failed') {
      filtered = filtered.filter((c) => !c.passed);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.categoryName === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.message.toLowerCase().includes(query) ||
          c.categoryName.toLowerCase().includes(query)
      );
    }

    return { filteredChecks: filtered, categories: uniqueCategories, categoryStats: stats };
  }, [result, activeTab, selectedCategory, searchQuery, flattenChecks]);

  const exportResults = () => {
    if (!result?.data) return;

    const dataStr = JSON.stringify(result.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Report exported successfully!', 'success');
  };

  const toggleCheckExpansion = (index: number) => {
    setExpandedChecks(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const clearRecentUrls = () => {
    setRecentUrls([]);
    showToast('Recent URLs cleared', 'info');
  };

  const renderScoreGauge = (score: number) => {
    const rotation = (score / 100) * 180;
    const getColor = (s: number) => {
      if (s >= 80) return '#4caf50';
      if (s >= 60) return '#ff9800';
      return '#f44336';
    };

    return (
      <div className="score-gauge">
        <div className="gauge-container">
          <div className="gauge-background"></div>
          <div
            className="gauge-fill"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: getColor(score),
            }}
          ></div>
          <div className="gauge-center">
            <div className="score-value">{score}</div>
            <div className="score-label">Score</div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    if (!showSettings) return null;

    return (
      <div className="settings-overlay" onClick={() => setShowSettings(false)}>
        <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <h2>⚙️ Settings</h2>
            <button
              className="close-button"
              onClick={() => setShowSettings(false)}
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          <div className="settings-content">
            <div className="setting-item">
              <label htmlFor="default-preset">Default Preset</label>
              <select
                id="default-preset"
                value={settings.defaultPreset}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, defaultPreset: e.target.value }));
                  setSelectedPreset(e.target.value);
                }}
                className="setting-select"
              >
                <option value="basic">⚡ Basic (Fast)</option>
                <option value="advanced">🎯 Advanced (Recommended)</option>
                <option value="strict">🔬 Strict (Thorough)</option>
              </select>
            </div>

            <div className="setting-item">
              <label htmlFor="dark-mode">
                <span>Dark Mode</span>
                <small>Toggle with Ctrl/Cmd + D</small>
              </label>
              <label className="toggle-switch">
                <input
                  id="dark-mode"
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => setSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label htmlFor="max-urls">Maximum Recent URLs</label>
              <input
                id="max-urls"
                type="number"
                min="3"
                max="10"
                value={settings.maxRecentUrls}
                onChange={(e) => setSettings(prev => ({ ...prev, maxRecentUrls: parseInt(e.target.value) || 5 }))}
                className="setting-input"
              />
            </div>

            {recentUrls.length > 0 && (
              <div className="setting-item">
                <label>Recent URLs ({recentUrls.length})</label>
                <button className="clear-button" onClick={clearRecentUrls}>
                  Clear Recent URLs
                </button>
              </div>
            )}
          </div>

          <div className="settings-footer">
            <div className="keyboard-shortcuts">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <div className="shortcuts-grid">
                <div className="shortcut-item">
                  <kbd>Ctrl/Cmd + K</kbd>
                  <span>Focus URL input</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl/Cmd + R</kbd>
                  <span>Rerun analysis</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl/Cmd + E</kbd>
                  <span>Export results</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl/Cmd + F</kbd>
                  <span>Focus search</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl/Cmd + D</kbd>
                  <span>Toggle dark mode</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl/Cmd + ,</kbd>
                  <span>Open settings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;

    if (!result.success) {
      return (
        <div className="error-container" role="alert">
          <div className="error-icon" aria-hidden="true">⚠️</div>
          <h2>Analysis Failed</h2>
          <p className="error-message">{result.error}</p>
          <div className="error-actions">
            <button className="retry-button" onClick={handleCheck}>
              🔄 Try Again
            </button>
            <button className="settings-button" onClick={() => setShowSettings(true)}>
              ⚙️ Settings
            </button>
          </div>
        </div>
      );
    }

    if (!result.data) return null;

    const { summary, score, url: checkedUrl, timestamp } = result.data;
    const passRate = summary.total > 0
      ? ((summary.passed / summary.total) * 100).toFixed(1)
      : '0';

    return (
      <div className="results-container fade-in">
        <div className="summary">
          <div className="summary-header">
            <div className="summary-info">
              <h2>SEO Analysis Results</h2>
              <div className="url-info">
                <span className="url-label">URL:</span>
                <span className="url-value">{checkedUrl}</span>
              </div>
              <div className="timestamp-info">
                {new Date(timestamp).toLocaleString()}
              </div>
            </div>
            {renderScoreGauge(score)}
          </div>

          <div className="stats">
            <div className="stat-item">
              <span className="stat-value">{summary.total}</span>
              <span className="stat-label">Total Checks</span>
            </div>
            <div className="stat-item passed">
              <span className="stat-value">{summary.passed}</span>
              <span className="stat-label">Passed</span>
            </div>
            <div className="stat-item failed">
              <span className="stat-value">{summary.failed}</span>
              <span className="stat-label">Failed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{passRate}%</span>
              <span className="stat-label">Pass Rate</span>
            </div>
          </div>

          <div className="progress-bar" role="progressbar" aria-valuenow={parseFloat(passRate)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="progress-fill"
              style={{ width: `${passRate}%` }}
            ></div>
          </div>
        </div>

        <div className="filters-section">
          <div className="tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'all'}
              className={activeTab === 'all' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('all')}
            >
              All ({summary.total})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'passed'}
              className={activeTab === 'passed' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('passed')}
            >
              ✓ Passed ({summary.passed})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'failed'}
              className={activeTab === 'failed' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('failed')}
            >
              ✗ Failed ({summary.failed})
            </button>
          </div>

          <div className="filter-controls">
            <div className="search-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search checks... (Ctrl/Cmd + F)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search checks"
              />
              {searchQuery && (
                <button
                  className="clear-search-button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <select
              className="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => {
                const stats = categoryStats.get(cat);
                return (
                  <option key={cat} value={cat}>
                    {cat} {stats ? `(${stats.passed}/${stats.total})` : ''}
                  </option>
                );
              })}
            </select>
            <button
              className="export-button"
              onClick={exportResults}
              title="Export results (Ctrl/Cmd + E)"
              aria-label="Export results"
            >
              📥 Export
            </button>
          </div>

          {searchQuery && (
            <div className="filter-info">
              Showing {filteredChecks.length} result{filteredChecks.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
        </div>

        <div className="checks-list" role="list">
          {filteredChecks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">🔍</div>
              <p>No checks match your filters</p>
              {searchQuery && (
                <button className="clear-filters-button" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredChecks.map((check, index) => (
              <div
                key={index}
                role="listitem"
                className={`check-item ${check.passed ? 'passed' : 'failed'} ${
                  check.severity ? `severity-${check.severity}` : ''
                } ${expandedChecks.has(index) ? 'expanded' : ''}`}
                onClick={() => toggleCheckExpansion(index)}
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCheckExpansion(index);
                  }
                }}
              >
                <div className="check-status" aria-label={check.passed ? 'Passed' : 'Failed'}>
                  {check.passed ? '✓' : '✗'}
                </div>
                <div className="check-content">
                  <div className="check-header">
                    <span className="check-category">{check.categoryName}</span>
                    {check.severity && !check.passed && (
                      <span className={`severity-badge ${check.severity}`}>
                        {check.severity}
                      </span>
                    )}
                    <span className="expand-indicator">
                      {expandedChecks.has(index) ? '▼' : '▶'}
                    </span>
                  </div>
                  <div className="check-message">{check.message}</div>
                  {expandedChecks.has(index) && (
                    <div className="check-details">
                      <div className="detail-row">
                        <strong>Status:</strong> {check.passed ? 'Passed ✓' : 'Failed ✗'}
                      </div>
                      <div className="detail-row">
                        <strong>Category:</strong> {check.categoryName}
                      </div>
                      {check.severity && (
                        <div className="detail-row">
                          <strong>Severity:</strong> {check.severity.toUpperCase()}
                        </div>
                      )}
                      {!check.passed && (
                        <div className="detail-row recommendation">
                          <strong>💡 Recommendation:</strong>
                          <span>Review and address this issue to improve your SEO score</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {filteredChecks.length > 0 && (
          <div className="results-footer">
            Showing {filteredChecks.length} of {summary.total} checks
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🔍 E2E SEO Checker</h1>
          <p>Comprehensive SEO analysis with 260+ automated checks</p>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
            title="Toggle dark mode (Ctrl/Cmd + D)"
            aria-label="Toggle dark mode"
          >
            {settings.darkMode ? '☀️' : '🌙'}
          </button>
          <button
            className="icon-button"
            onClick={() => setShowSettings(true)}
            title="Settings (Ctrl/Cmd + ,)"
            aria-label="Open settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      <div className="input-section">
        <div className="url-input-group">
          <div className="url-input-wrapper">
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="url-input"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleCheck()}
              list="recent-urls"
              aria-label="Website URL"
            />
            {recentUrls.length > 0 && (
              <datalist id="recent-urls">
                {recentUrls.map((recentUrl, i) => (
                  <option key={i} value={recentUrl} />
                ))}
              </datalist>
            )}
          </div>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="preset-select"
            disabled={loading}
            title="Choose analysis depth"
            aria-label="Analysis preset"
          >
            <option value="basic">⚡ Basic (Fast)</option>
            <option value="advanced">🎯 Advanced (Recommended)</option>
            <option value="strict">🔬 Strict (Thorough)</option>
          </select>
        </div>
        <button
          onClick={handleCheck}
          disabled={loading || !url}
          className="check-button"
          aria-label="Run SEO analysis"
        >
          {loading ? (
            <>
              <span className="button-spinner" aria-hidden="true"></span>
              Analyzing...
            </>
          ) : (
            <>🚀 Run SEO Analysis</>
          )}
        </button>
      </div>

      {loading && (
        <div className="loading-container fade-in" role="status" aria-live="polite">
          <div className="spinner-wrapper">
            <div className="spinner" aria-hidden="true"></div>
          </div>
          <p className="loading-text">Analyzing website...</p>
          <p className="loading-subtext">This may take 10-60 seconds</p>
          <div className="loading-tips">
            <p className="tip">💡 Tip: Use keyboard shortcuts for faster workflow</p>
          </div>
        </div>
      )}

      {renderResults()}
      {renderSettings()}

      {/* Toast notifications */}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✗'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
