export type RuleSeverity = 'error' | 'warning' | 'info';
export type PresetName = 'basic' | 'advanced' | 'strict';

export interface RuleConfig {
  enabled: boolean;
  severity?: RuleSeverity;
  options?: Record<string, any>;
}

export interface CheckerRules {
  [checkName: string]: RuleConfig | boolean;
}

export type CheckerConfig = CheckerRules | boolean;

export interface SEOConfig {
  // Preset configuration
  preset?: PresetName;

  // Global settings
  severity?: RuleSeverity;

  // Checker-specific rules
  rules?: {
    metaTags?: CheckerConfig;
    headings?: CheckerConfig;
    images?: CheckerConfig;
    performance?: CheckerConfig;
    robotsTxt?: CheckerConfig;
    sitemap?: CheckerConfig;
    security?: CheckerConfig;
    structuredData?: CheckerConfig;
    socialMedia?: CheckerConfig;
    content?: CheckerConfig;
    links?: CheckerConfig;
    uiElements?: CheckerConfig;
    technical?: CheckerConfig;
    accessibility?: CheckerConfig;
    urlFactors?: CheckerConfig;
    spamDetection?: CheckerConfig;
    pageQuality?: CheckerConfig;
    advancedImages?: CheckerConfig;
    multimedia?: CheckerConfig;
    coreWebVitals?: CheckerConfig;
    analytics?: CheckerConfig;
    mobileUX?: CheckerConfig;
    schemaValidation?: CheckerConfig;
    resourceOptimization?: CheckerConfig;
    legalCompliance?: CheckerConfig;
    ecommerce?: CheckerConfig;
    internationalization?: CheckerConfig;
  };

  // Custom rules (extensibility for future)
  customRules?: {
    [ruleName: string]: RuleConfig;
  };
}

export interface ResolvedRuleConfig {
  enabled: boolean;
  severity: RuleSeverity;
  options: Record<string, any>;
}
