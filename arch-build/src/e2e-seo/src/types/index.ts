import type { RuleSeverity } from '../config/types';

export interface SEOCheckResult {
  passed: boolean;
  message: string;
  severity?: RuleSeverity;
  details?: Record<string, any>;
}

export type { RuleSeverity };

export interface SEOReport {
  url: string;
  timestamp: string;
  checks: {
    metaTags: SEOCheckResult[];
    headings: SEOCheckResult[];
    images: SEOCheckResult[];
    performance: SEOCheckResult[];
    robotsTxt: SEOCheckResult[];
    sitemap: SEOCheckResult[];
    security: SEOCheckResult[];
    structuredData: SEOCheckResult[];
    socialMedia: SEOCheckResult[];
    content: SEOCheckResult[];
    links: SEOCheckResult[];
    uiElements: SEOCheckResult[];
    technical: SEOCheckResult[];
    accessibility: SEOCheckResult[];
    urlFactors: SEOCheckResult[];
    spamDetection: SEOCheckResult[];
    pageQuality: SEOCheckResult[];
    advancedImages: SEOCheckResult[];
    multimedia: SEOCheckResult[];
    coreWebVitals: SEOCheckResult[];
    analytics: SEOCheckResult[];
    mobileUX: SEOCheckResult[];
    schemaValidation: SEOCheckResult[];
    resourceOptimization: SEOCheckResult[];
    legalCompliance: SEOCheckResult[];
    ecommerce: SEOCheckResult[];
    internationalization: SEOCheckResult[];
  };
  score: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

export interface SEOCheckerOptions {
  url: string;
  headless?: boolean;
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
  config?: import('../config').SEOConfig;
  configFile?: string;
}

export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
}

export interface HeadingStructure {
  tag: string;
  text: string;
  level: number;
}

export interface ImageInfo {
  src: string;
  alt: string | null;
  hasAlt: boolean;
}

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
}
