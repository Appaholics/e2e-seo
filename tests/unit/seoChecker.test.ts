import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SEOChecker } from '../../src/index';
import { chromium } from 'playwright';

// Mock chromium
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

describe('SEOChecker', () => {
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    mockPage = {
      title: vi.fn().mockResolvedValue('Test Page'),
      url: vi.fn().mockReturnValue('https://example.com'),
      goto: vi.fn().mockResolvedValue(null),
      setDefaultTimeout: vi.fn(),
      evaluate: vi.fn().mockResolvedValue([]),
      locator: vi.fn().mockReturnValue({
        getAttribute: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    (chromium.launch as any).mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const checker = new SEOChecker({ url: 'https://example.com' });
      expect(checker).toBeInstanceOf(SEOChecker);
    });

    it('should create instance with custom options', () => {
      const checker = new SEOChecker({
        url: 'https://example.com',
        headless: false,
        timeout: 60000,
        viewport: { width: 1280, height: 720 },
      });
      expect(checker).toBeInstanceOf(SEOChecker);
    });
  });

  describe('check', () => {
    it('should return a complete SEO report', async () => {
      const checker = new SEOChecker({ url: 'https://example.com' });
      const report = await checker.check();

      expect(report).toHaveProperty('url');
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('checks');
      expect(report).toHaveProperty('score');
      expect(report).toHaveProperty('summary');

      expect(report.url).toBe('https://example.com');
      expect(report.checks).toHaveProperty('metaTags');
      expect(report.checks).toHaveProperty('headings');
      expect(report.checks).toHaveProperty('images');
      expect(report.summary).toHaveProperty('total');
      expect(report.summary).toHaveProperty('passed');
      expect(report.summary).toHaveProperty('failed');
    });

    it('should launch browser with correct options', async () => {
      const checker = new SEOChecker({
        url: 'https://example.com',
        headless: true,
      });
      await checker.check();

      expect(chromium.launch).toHaveBeenCalledWith({
        headless: true,
      });
    });

    it('should navigate to the correct URL', async () => {
      const checker = new SEOChecker({ url: 'https://example.com/page' });
      await checker.check();

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://example.com/page',
        expect.objectContaining({
          waitUntil: 'domcontentloaded',
        })
      );
    });

    it('should close browser after check', async () => {
      const checker = new SEOChecker({ url: 'https://example.com' });
      await checker.check();

      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should calculate score correctly', async () => {
      const checker = new SEOChecker({ url: 'https://example.com' });
      const report = await checker.check();

      expect(typeof report.score).toBe('number');
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });

    it('should close browser even on error', async () => {
      mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'));

      const checker = new SEOChecker({ url: 'https://example.com' });

      await expect(checker.check()).rejects.toThrow('Navigation failed');
      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should handle multiple close calls gracefully', async () => {
      const checker = new SEOChecker({ url: 'https://example.com' });
      await checker.check();

      // Calling close again should not throw
      await expect(checker.close()).resolves.not.toThrow();
    });
  });
});
