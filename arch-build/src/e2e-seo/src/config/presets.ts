import { SEOConfig } from './types';

/**
 * Basic preset - Essential SEO checks only
 * Best for: Quick checks, development, small websites
 */
export const basicPreset: SEOConfig = {
  severity: 'warning',
  rules: {
    metaTags: {
      'title-exists': true,
      'meta-description-exists': true,
      'viewport-meta-exists': true,
      'canonical-url-exists': false, // Optional in basic
      'og-title-exists': false,
      'og-description-exists': false,
      'og-image-exists': false,
      'twitter-card-exists': false,
    },
    headings: {
      'h1-exists': true,
      'h1-count-valid': true,
      'heading-hierarchy-valid': { enabled: true, severity: 'info' },
    },
    images: {
      'images-have-alt': true,
      'alt-text-quality': { enabled: true, severity: 'info' },
    },
    performance: {
      'load-time-acceptable': true,
    },
    security: {
      'https-enabled': { enabled: true, severity: 'error' },
    },
    // Disable advanced checkers in basic preset
    structuredData: false,
    socialMedia: false,
    spamDetection: false,
    pageQuality: false,
    advancedImages: false,
    multimedia: false,
    coreWebVitals: false,
    analytics: false,
    mobileUX: false,
    schemaValidation: false,
    resourceOptimization: false,
    legalCompliance: false,
    ecommerce: false,
    internationalization: false,
  },
};

/**
 * Advanced preset - Comprehensive SEO checks
 * Best for: Production websites, thorough audits
 */
export const advancedPreset: SEOConfig = {
  severity: 'warning',
  rules: {
    // All checkers enabled with reasonable severity
    metaTags: {
      'title-exists': { enabled: true, severity: 'error' },
      'title-length-valid': { enabled: true, severity: 'warning' },
      'meta-description-exists': { enabled: true, severity: 'error' },
      'meta-description-length-valid': { enabled: true, severity: 'warning' },
      'viewport-meta-exists': { enabled: true, severity: 'warning' },
      'canonical-url-exists': { enabled: true, severity: 'warning' },
      'robots-meta-appropriate': { enabled: true, severity: 'info' },
    },
    headings: {
      'h1-exists': { enabled: true, severity: 'error' },
      'h1-count-valid': { enabled: true, severity: 'warning' },
      'heading-hierarchy-valid': { enabled: true, severity: 'warning' },
    },
    images: {
      'images-have-alt': { enabled: true, severity: 'warning' },
      'alt-text-quality': { enabled: true, severity: 'info' },
    },
    performance: {
      'load-time-acceptable': { enabled: true, severity: 'warning' },
    },
    robotsTxt: true,
    sitemap: true,
    security: {
      'https-enabled': { enabled: true, severity: 'error' },
      'mixed-content-check': { enabled: true, severity: 'warning' },
    },
    structuredData: true,
    socialMedia: true,
    content: true,
    links: true,
    uiElements: true,
    technical: true,
    accessibility: true,
    urlFactors: true,
    spamDetection: true,
    pageQuality: true,
    advancedImages: true,
    multimedia: true,
    coreWebVitals: { enabled: true, severity: 'warning' } as any,
    analytics: { enabled: true, severity: 'info' } as any,
    mobileUX: true,
    schemaValidation: true,
    resourceOptimization: true,
    legalCompliance: { enabled: true, severity: 'info' } as any,
    ecommerce: { enabled: true, severity: 'info' } as any,
    internationalization: { enabled: true, severity: 'info' } as any,
  },
};

/**
 * Strict preset - Maximum scrutiny for all SEO aspects
 * Best for: Enterprise websites, SEO agencies, critical launches
 */
export const strictPreset: SEOConfig = {
  severity: 'error',
  rules: {
    // All checkers enabled with strict severity
    metaTags: {
      'title-exists': { enabled: true, severity: 'error' },
      'title-length-valid': { enabled: true, severity: 'error' },
      'title-unique': { enabled: true, severity: 'error' },
      'meta-description-exists': { enabled: true, severity: 'error' },
      'meta-description-length-valid': { enabled: true, severity: 'error' },
      'meta-description-unique': { enabled: true, severity: 'error' },
      'viewport-meta-exists': { enabled: true, severity: 'error' },
      'canonical-url-exists': { enabled: true, severity: 'error' },
      'robots-meta-appropriate': { enabled: true, severity: 'warning' },
      'og-title-exists': { enabled: true, severity: 'error' },
      'og-description-exists': { enabled: true, severity: 'error' },
      'og-image-exists': { enabled: true, severity: 'error' },
      'twitter-card-exists': { enabled: true, severity: 'error' },
    },
    headings: {
      'h1-exists': { enabled: true, severity: 'error' },
      'h1-count-valid': { enabled: true, severity: 'error' },
      'heading-hierarchy-valid': { enabled: true, severity: 'error' },
      'heading-text-quality': { enabled: true, severity: 'warning' },
    },
    images: {
      'images-have-alt': { enabled: true, severity: 'error' },
      'alt-text-quality': { enabled: true, severity: 'warning' },
      'alt-text-not-redundant': { enabled: true, severity: 'warning' },
    },
    performance: {
      'load-time-acceptable': { enabled: true, severity: 'error' },
      'dom-size-acceptable': { enabled: true, severity: 'warning' },
    },
    robotsTxt: { enabled: true, severity: 'error' } as any,
    sitemap: { enabled: true, severity: 'error' } as any,
    security: {
      'https-enabled': { enabled: true, severity: 'error' },
      'mixed-content-check': { enabled: true, severity: 'error' },
      'security-headers': { enabled: true, severity: 'error' },
    },
    structuredData: { enabled: true, severity: 'error' } as any,
    socialMedia: { enabled: true, severity: 'error' } as any,
    content: { enabled: true, severity: 'warning' } as any,
    links: { enabled: true, severity: 'error' } as any,
    uiElements: { enabled: true, severity: 'warning' } as any,
    technical: { enabled: true, severity: 'error' } as any,
    accessibility: { enabled: true, severity: 'error' } as any,
    urlFactors: { enabled: true, severity: 'warning' } as any,
    spamDetection: { enabled: true, severity: 'error' } as any,
    pageQuality: { enabled: true, severity: 'warning' } as any,
    advancedImages: { enabled: true, severity: 'warning' } as any,
    multimedia: { enabled: true, severity: 'warning' } as any,
    coreWebVitals: { enabled: true, severity: 'error' } as any,
    analytics: { enabled: true, severity: 'warning' } as any,
    mobileUX: { enabled: true, severity: 'error' } as any,
    schemaValidation: { enabled: true, severity: 'error' } as any,
    resourceOptimization: { enabled: true, severity: 'warning' } as any,
    legalCompliance: { enabled: true, severity: 'error' } as any,
    ecommerce: { enabled: true, severity: 'warning' } as any,
    internationalization: { enabled: true, severity: 'warning' } as any,
  },
};

export const presets = {
  basic: basicPreset,
  advanced: advancedPreset,
  strict: strictPreset,
};
