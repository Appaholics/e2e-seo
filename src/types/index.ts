export interface SEOCheckResult {
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}

export interface SEOReport {
  url: string;
  timestamp: string;
  checks: {
    metaTags: SEOCheckResult[];
    headings: SEOCheckResult[];
    images: SEOCheckResult[];
    performance: SEOCheckResult[];
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
