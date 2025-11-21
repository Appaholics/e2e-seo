import { Page } from 'playwright';
import { SEOCheckResult, MetaTag } from '../types';

export class MetaTagsChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkTitle());
    results.push(await this.checkMetaDescription());
    results.push(await this.checkMetaKeywords());
    results.push(await this.checkOpenGraphTags());
    results.push(await this.checkCanonicalUrl());
    results.push(await this.checkViewport());

    return results;
  }

  private async checkTitle(): Promise<SEOCheckResult> {
    const title = await this.page.title();
    const titleLength = title.length;

    if (!title || titleLength === 0) {
      return {
        passed: false,
        message: 'Page title is missing',
      };
    }

    if (titleLength < 30) {
      return {
        passed: false,
        message: `Title is too short (${titleLength} characters). Recommended: 30-60 characters`,
        details: { title, length: titleLength },
      };
    }

    if (titleLength > 60) {
      return {
        passed: false,
        message: `Title is too long (${titleLength} characters). Recommended: 30-60 characters`,
        details: { title, length: titleLength },
      };
    }

    return {
      passed: true,
      message: `Title is optimal (${titleLength} characters)`,
      details: { title, length: titleLength },
    };
  }

  private async checkMetaDescription(): Promise<SEOCheckResult> {
    const description = await this.page
      .locator('meta[name="description"]')
      .getAttribute('content')
      .catch(() => null);

    if (!description) {
      return {
        passed: false,
        message: 'Meta description is missing',
      };
    }

    const descLength = description.length;

    if (descLength < 120) {
      return {
        passed: false,
        message: `Meta description is too short (${descLength} characters). Recommended: 120-160 characters`,
        details: { description, length: descLength },
      };
    }

    if (descLength > 160) {
      return {
        passed: false,
        message: `Meta description is too long (${descLength} characters). Recommended: 120-160 characters`,
        details: { description, length: descLength },
      };
    }

    return {
      passed: true,
      message: `Meta description is optimal (${descLength} characters)`,
      details: { description, length: descLength },
    };
  }

  private async checkMetaKeywords(): Promise<SEOCheckResult> {
    const keywords = await this.page
      .locator('meta[name="keywords"]')
      .getAttribute('content')
      .catch(() => null);

    if (!keywords) {
      return {
        passed: true,
        message: 'Meta keywords not present (optional, not critical for modern SEO)',
      };
    }

    return {
      passed: true,
      message: 'Meta keywords present',
      details: { keywords },
    };
  }

  private async checkOpenGraphTags(): Promise<SEOCheckResult> {
    const ogTags: MetaTag[] = await this.page.evaluate(() => {
      const tags = Array.from(document.querySelectorAll('meta[property^="og:"]'));
      return tags.map((tag) => ({
        property: tag.getAttribute('property') || undefined,
        content: tag.getAttribute('content') || '',
      }));
    });

    const hasOgTitle = ogTags.some((tag) => tag.property === 'og:title');
    const hasOgDescription = ogTags.some((tag) => tag.property === 'og:description');
    const hasOgImage = ogTags.some((tag) => tag.property === 'og:image');

    if (!hasOgTitle || !hasOgDescription || !hasOgImage) {
      return {
        passed: false,
        message: 'Missing essential Open Graph tags (og:title, og:description, og:image)',
        details: { ogTags, hasOgTitle, hasOgDescription, hasOgImage },
      };
    }

    return {
      passed: true,
      message: `Open Graph tags properly configured (${ogTags.length} tags found)`,
      details: { ogTags },
    };
  }

  private async checkCanonicalUrl(): Promise<SEOCheckResult> {
    const canonical = await this.page
      .locator('link[rel="canonical"]')
      .getAttribute('href')
      .catch(() => null);

    if (!canonical) {
      return {
        passed: false,
        message: 'Canonical URL is missing',
      };
    }

    return {
      passed: true,
      message: 'Canonical URL is present',
      details: { canonical },
    };
  }

  private async checkViewport(): Promise<SEOCheckResult> {
    const viewport = await this.page
      .locator('meta[name="viewport"]')
      .getAttribute('content')
      .catch(() => null);

    if (!viewport) {
      return {
        passed: false,
        message: 'Viewport meta tag is missing (important for mobile SEO)',
      };
    }

    return {
      passed: true,
      message: 'Viewport meta tag is present',
      details: { viewport },
    };
  }
}
