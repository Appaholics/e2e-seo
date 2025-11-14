import { chromium, Browser, Page } from 'playwright';
import { SEOCheckerOptions, SEOReport } from './types';
import { MetaTagsChecker } from './checkers/metaTags';
import { HeadingsChecker } from './checkers/headings';
import { ImagesChecker } from './checkers/images';
import { PerformanceChecker } from './checkers/performance';
import { RobotsTxtChecker } from './checkers/robotsTxt';
import { SitemapChecker } from './checkers/sitemap';
import { SecurityChecker } from './checkers/security';
import { StructuredDataChecker } from './checkers/structuredData';
import { SocialMediaChecker } from './checkers/socialMedia';
import { ContentChecker } from './checkers/content';
import { LinksChecker } from './checkers/links';

export class SEOChecker {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(private options: SEOCheckerOptions) {
    this.options.headless = options.headless !== false;
    this.options.timeout = options.timeout || 30000;
    this.options.viewport = options.viewport || { width: 1920, height: 1080 };
  }

  async check(): Promise<SEOReport> {
    try {
      await this.launch();
      await this.navigate();

      const metaTagsChecker = new MetaTagsChecker(this.page!);
      const headingsChecker = new HeadingsChecker(this.page!);
      const imagesChecker = new ImagesChecker(this.page!);
      const performanceChecker = new PerformanceChecker(this.page!);
      const robotsTxtChecker = new RobotsTxtChecker(this.page!);
      const sitemapChecker = new SitemapChecker(this.page!);
      const securityChecker = new SecurityChecker(this.page!);
      const structuredDataChecker = new StructuredDataChecker(this.page!);
      const socialMediaChecker = new SocialMediaChecker(this.page!);
      const contentChecker = new ContentChecker(this.page!);
      const linksChecker = new LinksChecker(this.page!);

      const [metaTags, headings, images, performance, robotsTxt, sitemap, security, structuredData, socialMedia, content, links] = await Promise.all([
        metaTagsChecker.checkAll(),
        headingsChecker.checkAll(),
        imagesChecker.checkAll(),
        performanceChecker.checkAll(),
        robotsTxtChecker.checkAll(),
        sitemapChecker.checkAll(),
        securityChecker.checkAll(),
        structuredDataChecker.checkAll(),
        socialMediaChecker.checkAll(),
        contentChecker.checkAll(),
        linksChecker.checkAll(),
      ]);

      const allChecks = [...metaTags, ...headings, ...images, ...performance, ...robotsTxt, ...sitemap, ...security, ...structuredData, ...socialMedia, ...content, ...links];
      const passed = allChecks.filter((c) => c.passed).length;
      const failed = allChecks.filter((c) => !c.passed).length;
      const score = Math.round((passed / allChecks.length) * 100);

      return {
        url: this.options.url,
        timestamp: new Date().toISOString(),
        checks: {
          metaTags,
          headings,
          images,
          performance,
          robotsTxt,
          sitemap,
          security,
          structuredData,
          socialMedia,
          content,
          links,
        },
        score,
        summary: {
          total: allChecks.length,
          passed,
          failed,
        },
      };
    } finally {
      await this.close();
    }
  }

  private async launch(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.options.headless,
    });

    this.page = await this.browser.newPage({
      viewport: this.options.viewport,
    });

    await this.page.setDefaultTimeout(this.options.timeout!);
  }

  private async navigate(): Promise<void> {
    if (!this.page) {
      throw new Error('Page is not initialized');
    }

    await this.page.goto(this.options.url, {
      waitUntil: 'domcontentloaded',
    });
  }

  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export * from './types';
export { MetaTagsChecker } from './checkers/metaTags';
export { HeadingsChecker } from './checkers/headings';
export { ImagesChecker } from './checkers/images';
export { PerformanceChecker } from './checkers/performance';
export { RobotsTxtChecker } from './checkers/robotsTxt';
export { SitemapChecker } from './checkers/sitemap';
export { SecurityChecker } from './checkers/security';
export { StructuredDataChecker } from './checkers/structuredData';
export { SocialMediaChecker } from './checkers/socialMedia';
export { ContentChecker } from './checkers/content';
export { LinksChecker } from './checkers/links';
