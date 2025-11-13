#!/usr/bin/env node

import { SEOChecker } from './index';
import * as fs from 'fs';

interface CliArgs {
  url?: string;
  output?: string;
  headless?: boolean;
  viewport?: string;
  help?: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        args.help = true;
        break;
      case '-u':
      case '--url':
        args.url = argv[++i];
        break;
      case '-o':
      case '--output':
        args.output = argv[++i];
        break;
      case '--headed':
        args.headless = false;
        break;
      case '--viewport':
        args.viewport = argv[++i];
        break;
      default:
        if (!arg.startsWith('-') && !args.url) {
          args.url = arg;
        }
    }
  }

  return args;
}

function printHelp() {
  console.log(`
e2e-seo - End-to-end SEO checker tool

Usage: e2e-seo [options] <url>

Options:
  -u, --url <url>        URL to check (required)
  -o, --output <file>    Output JSON report to file
  --headed               Run browser in headed mode (default: headless)
  --viewport <WxH>       Set viewport size (e.g., 1920x1080 or 375x667)
  -h, --help             Show this help message

Examples:
  e2e-seo https://example.com
  e2e-seo -u https://example.com -o report.json
  e2e-seo https://example.com --viewport 375x667
  e2e-seo https://example.com --headed

Checks performed:
  • Meta tags (title, description, Open Graph, canonical, viewport)
  • Heading structure (H1-H6 hierarchy)
  • Image optimization (alt text)
  • Performance metrics (load time, DOM content loaded)

For more information, visit: https://github.com/yourusername/e2e-seo
  `);
}

async function main() {
  const args = parseArgs();

  if (args.help || !args.url) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  console.log('🔍 Running SEO check...\n');

  let viewport = { width: 1920, height: 1080 };
  if (args.viewport) {
    const [width, height] = args.viewport.split('x').map(Number);
    if (width && height) {
      viewport = { width, height };
    }
  }

  const checker = new SEOChecker({
    url: args.url,
    headless: args.headless !== false,
    viewport,
  });

  try {
    const report = await checker.check();

    console.log(`📊 SEO Report for ${report.url}\n`);
    console.log(`Score: ${report.score}/100`);
    console.log(`Timestamp: ${report.timestamp}\n`);

    console.log('Summary:');
    console.log(`  Total checks: ${report.summary.total}`);
    console.log(`  ✓ Passed: ${report.summary.passed}`);
    console.log(`  ✗ Failed: ${report.summary.failed}\n`);

    const sections = [
      { name: 'Meta Tags', checks: report.checks.metaTags },
      { name: 'Headings', checks: report.checks.headings },
      { name: 'Images', checks: report.checks.images },
      { name: 'Performance', checks: report.checks.performance },
    ];

    sections.forEach((section) => {
      console.log(`${section.name}:`);
      section.checks.forEach((check) => {
        const icon = check.passed ? '✓' : '✗';
        const color = check.passed ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';
        console.log(`  ${color}${icon}${reset} ${check.message}`);
      });
      console.log('');
    });

    if (args.output) {
      fs.writeFileSync(args.output, JSON.stringify(report, null, 2));
      console.log(`\n💾 Report saved to ${args.output}`);
    }

    process.exit(report.summary.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
