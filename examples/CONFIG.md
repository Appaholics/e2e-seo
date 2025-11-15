# Configuration Guide

The e2e-seo tool supports flexible configuration through JSON or YAML files. This allows you to customize which checks are run and how they're evaluated.

## Quick Start

### Generate a default configuration file

```bash
e2e-seo --init-config
```

This creates a `.e2e-seo.json` file with the "advanced" preset.

You can also specify a preset:

```bash
e2e-seo --init-config --preset basic    # For basic checks
e2e-seo --init-config --preset strict   # For strict checks
```

### Use a configuration file

```bash
# Auto-detect config file in current directory
e2e-seo https://example.com

# Specify a custom config file
e2e-seo https://example.com --config my-config.yaml
```

### Use a preset without a file

```bash
e2e-seo https://example.com --preset basic
e2e-seo https://example.com --preset advanced
e2e-seo https://example.com --preset strict
```

## Configuration Structure

### Basic Structure (JSON)

```json
{
  "preset": "advanced",
  "severity": "warning",
  "rules": {
    "metaTags": {
      "title-exists": true,
      "title-length-valid": {
        "enabled": true,
        "severity": "error"
      }
    }
  }
}
```

### Basic Structure (YAML)

```yaml
preset: advanced
severity: warning

rules:
  metaTags:
    title-exists: true
    title-length-valid:
      enabled: true
      severity: error
```

## Presets

The tool includes three built-in presets:

### Basic Preset
- **Best for:** Quick checks, development, small websites
- **Severity:** Warning
- **Checks:** Essential SEO checks only
- **Disabled:** Advanced checkers (structured data, schema validation, etc.)

### Advanced Preset (Default)
- **Best for:** Production websites, thorough audits
- **Severity:** Warning
- **Checks:** Comprehensive SEO checks across all categories
- **Disabled:** None

### Strict Preset
- **Best for:** Enterprise websites, SEO agencies, critical launches
- **Severity:** Error
- **Checks:** All checks with maximum scrutiny
- **Disabled:** None

## Severity Levels

Each check can have one of three severity levels:

- **error** - Critical issues that must be fixed
- **warning** - Important issues that should be fixed
- **info** - Suggestions for improvement

## Enabling/Disabling Rules

### Disable an entire checker

```json
{
  "rules": {
    "structuredData": false,
    "socialMedia": false
  }
}
```

### Enable an entire checker with defaults

```json
{
  "rules": {
    "metaTags": true,
    "headings": true
  }
}
```

### Configure specific rules

```json
{
  "rules": {
    "metaTags": {
      "title-exists": {
        "enabled": true,
        "severity": "error"
      },
      "title-length-valid": {
        "enabled": true,
        "severity": "warning"
      },
      "og-title-exists": false
    }
  }
}
```

## Available Checkers

The following checkers are available:

- `metaTags` - Meta tags (title, description, Open Graph, etc.)
- `headings` - Heading structure (H1-H6 hierarchy)
- `images` - Image optimization
- `performance` - Performance metrics
- `robotsTxt` - Robots.txt validation
- `sitemap` - XML sitemap detection
- `security` - Security checks (HTTPS, mixed content, etc.)
- `structuredData` - Structured data validation
- `socialMedia` - Social media tags
- `content` - Content analysis
- `links` - Links analysis
- `uiElements` - UI elements (favicon, breadcrumbs, etc.)
- `technical` - Technical SEO
- `accessibility` - Accessibility checks
- `urlFactors` - URL optimization
- `spamDetection` - Spam detection
- `pageQuality` - Page quality checks
- `advancedImages` - Advanced image optimization
- `multimedia` - Multimedia content
- `coreWebVitals` - Core Web Vitals
- `analytics` - Analytics and tracking
- `mobileUX` - Mobile user experience
- `schemaValidation` - Schema.org validation
- `resourceOptimization` - Resource optimization
- `legalCompliance` - Legal compliance
- `ecommerce` - E-commerce specific checks
- `internationalization` - Internationalization

## Example Configurations

See the `examples/` directory for sample configuration files:

- `.e2e-seo.basic.json` - Basic preset example
- `.e2e-seo.advanced.json` - Advanced preset example
- `.e2e-seo.strict.yaml` - Strict preset example
- `.e2e-seo.custom.yaml` - Custom configuration example

## Configuration File Discovery

The tool automatically searches for configuration files in the following order:

1. `.e2e-seo.json`
2. `.e2e-seo.yaml`
3. `.e2e-seo.yml`
4. `e2e-seo.config.json`
5. `e2e-seo.config.yaml`
6. `e2e-seo.config.yml`

You can override this by using the `--config` flag.

## Programmatic Usage

```javascript
import { SEOChecker } from 'e2e-seo';

const checker = new SEOChecker({
  url: 'https://example.com',
  config: {
    preset: 'advanced',
    severity: 'warning',
    rules: {
      metaTags: {
        'title-exists': { enabled: true, severity: 'error' }
      }
    }
  }
});

const report = await checker.check();
```

Or use a config file:

```javascript
import { SEOChecker } from 'e2e-seo';

const checker = new SEOChecker({
  url: 'https://example.com',
  configFile: '.e2e-seo.json'
});

const report = await checker.check();
```
