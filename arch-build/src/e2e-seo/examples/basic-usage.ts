import { SEOChecker } from '../src';

async function main() {
  // Example 1: Check a website with default options
  console.log('=== Example 1: Basic SEO Check ===\n');

  const checker = new SEOChecker({
    url: 'https://example.com',
    headless: true,
  });

  const report = await checker.check();

  console.log(`URL: ${report.url}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`SEO Score: ${report.score}/100\n`);

  console.log('Summary:');
  console.log(`  Total checks: ${report.summary.total}`);
  console.log(`  Passed: ${report.summary.passed}`);
  console.log(`  Failed: ${report.summary.failed}\n`);

  console.log('Meta Tags Checks:');
  report.checks.metaTags.forEach((check) => {
    console.log(`  ${check.passed ? '✓' : '✗'} ${check.message}`);
  });

  console.log('\nHeadings Checks:');
  report.checks.headings.forEach((check) => {
    console.log(`  ${check.passed ? '✓' : '✗'} ${check.message}`);
  });

  console.log('\nImages Checks:');
  report.checks.images.forEach((check) => {
    console.log(`  ${check.passed ? '✓' : '✗'} ${check.message}`);
  });

  console.log('\nPerformance Checks:');
  report.checks.performance.forEach((check) => {
    console.log(`  ${check.passed ? '✓' : '✗'} ${check.message}`);
  });

  // Example 2: Custom viewport for mobile testing
  console.log('\n\n=== Example 2: Mobile SEO Check ===\n');

  const mobileChecker = new SEOChecker({
    url: 'https://example.com',
    headless: true,
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  const mobileReport = await mobileChecker.check();
  console.log(`Mobile SEO Score: ${mobileReport.score}/100`);
  console.log(`Checks: ${mobileReport.summary.passed}/${mobileReport.summary.total} passed`);
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
