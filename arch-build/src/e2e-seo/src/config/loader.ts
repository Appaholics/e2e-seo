import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { SEOConfig, ResolvedRuleConfig, RuleSeverity, CheckerRules } from './types';
import { presets } from './presets';

/**
 * Configuration loader for SEO checker
 * Supports JSON and YAML configuration files
 */
export class ConfigLoader {
  /**
   * Load configuration from a file
   * Supports .json, .yaml, and .yml files
   */
  static loadFromFile(configPath: string): SEOConfig {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const ext = path.extname(configPath).toLowerCase();
    const content = fs.readFileSync(configPath, 'utf-8');

    let config: SEOConfig;

    switch (ext) {
      case '.json':
        config = JSON.parse(content);
        break;
      case '.yaml':
      case '.yml':
        config = yaml.load(content) as SEOConfig;
        break;
      default:
        throw new Error(`Unsupported configuration file format: ${ext}. Use .json, .yaml, or .yml`);
    }

    return this.resolveConfig(config);
  }

  /**
   * Load configuration from an object
   */
  static loadFromObject(config: SEOConfig): SEOConfig {
    return this.resolveConfig(config);
  }

  /**
   * Resolve configuration by applying preset and merging rules
   */
  static resolveConfig(config: SEOConfig): SEOConfig {
    let resolved: SEOConfig = {
      severity: config.severity || 'warning',
      rules: {},
    };

    // Apply preset if specified
    if (config.preset && presets[config.preset]) {
      const preset = presets[config.preset];
      resolved = {
        ...resolved,
        ...preset,
        severity: config.severity || preset.severity || 'warning',
      };
    }

    // Merge custom rules over preset
    if (config.rules) {
      resolved.rules = this.mergeRules(resolved.rules || {}, config.rules);
    }

    // Preserve custom rules
    if (config.customRules) {
      resolved.customRules = config.customRules;
    }

    return resolved;
  }

  /**
   * Merge two rule configurations
   */
  private static mergeRules(
    base: NonNullable<SEOConfig['rules']>,
    override: NonNullable<SEOConfig['rules']>
  ): NonNullable<SEOConfig['rules']> {
    const merged = { ...base };

    for (const [checkerName, checkerRules] of Object.entries(override)) {
      if (checkerRules === false) {
        // Disable entire checker
        merged[checkerName as keyof typeof merged] = false as any;
      } else if (checkerRules === true) {
        // Enable entire checker with defaults
        merged[checkerName as keyof typeof merged] = true as any;
      } else if (typeof checkerRules === 'object') {
        // Merge individual rules
        const baseCheckerRules = (merged[checkerName as keyof typeof merged] || {}) as CheckerRules;
        merged[checkerName as keyof typeof merged] = {
          ...baseCheckerRules,
          ...checkerRules,
        } as any;
      }
    }

    return merged;
  }

  /**
   * Check if a checker is enabled
   */
  static isCheckerEnabled(config: SEOConfig, checkerName: string): boolean {
    if (!config.rules) return true;

    const checkerRules = config.rules[checkerName as keyof typeof config.rules];

    if (checkerRules === undefined) return true;
    if (checkerRules === false) return false;
    if (checkerRules === true) return true;

    // If it's an object with individual rules, the checker is enabled
    return true;
  }

  /**
   * Get resolved configuration for a specific rule
   */
  static getRuleConfig(
    config: SEOConfig,
    checkerName: string,
    ruleName: string
  ): ResolvedRuleConfig {
    const defaultConfig: ResolvedRuleConfig = {
      enabled: true,
      severity: config.severity || 'warning',
      options: {},
    };

    if (!config.rules) return defaultConfig;

    const checkerRules = config.rules[checkerName as keyof typeof config.rules];

    // Checker is disabled
    if (checkerRules === false) {
      return { ...defaultConfig, enabled: false };
    }

    // Checker is enabled with all defaults
    if (checkerRules === true || checkerRules === undefined) {
      return defaultConfig;
    }

    // Check specific rule configuration
    const ruleConfig = (checkerRules as CheckerRules)[ruleName];

    if (ruleConfig === undefined) {
      return defaultConfig;
    }

    if (ruleConfig === false) {
      return { ...defaultConfig, enabled: false };
    }

    if (ruleConfig === true) {
      return defaultConfig;
    }

    // Rule has detailed configuration
    return {
      enabled: ruleConfig.enabled !== false,
      severity: ruleConfig.severity || config.severity || 'warning',
      options: ruleConfig.options || {},
    };
  }

  /**
   * Find and load configuration from default locations
   * Searches for .e2e-seo.json, .e2e-seo.yaml, .e2e-seo.yml in current directory
   */
  static findAndLoad(): SEOConfig | null {
    const configFiles = [
      '.e2e-seo.json',
      '.e2e-seo.yaml',
      '.e2e-seo.yml',
      'e2e-seo.config.json',
      'e2e-seo.config.yaml',
      'e2e-seo.config.yml',
    ];

    for (const filename of configFiles) {
      const configPath = path.join(process.cwd(), filename);
      if (fs.existsSync(configPath)) {
        return this.loadFromFile(configPath);
      }
    }

    return null;
  }

  /**
   * Create a default configuration file
   */
  static createDefaultConfig(
    outputPath: string,
    preset: 'basic' | 'advanced' | 'strict' = 'advanced'
  ): void {
    const config: SEOConfig = {
      preset,
      severity: 'warning',
      rules: {
        // Example custom rule overrides
        metaTags: {
          'title-length-valid': { enabled: true, severity: 'warning' },
        },
      },
    };

    const ext = path.extname(outputPath).toLowerCase();
    let content: string;

    if (ext === '.yaml' || ext === '.yml') {
      content = yaml.dump(config, { indent: 2 });
    } else {
      content = JSON.stringify(config, null, 2);
    }

    fs.writeFileSync(outputPath, content, 'utf-8');
  }
}
