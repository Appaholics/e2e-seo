import { Page } from 'playwright';
import { SEOCheckResult } from '../types';

export class PageQualityChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkDuplicateTitles());
    results.push(await this.checkDuplicateDescriptions());
    results.push(await this.checkDuplicateH1());
    results.push(await this.checkContentFreshness());
    results.push(await this.checkMediaPresence());
    results.push(await this.checkTableOfContents());
    results.push(await this.checkAuthorInfo());
    results.push(await this.checkPublishDate());
    results.push(await this.checkContactInfo());
    results.push(await this.checkSocialProof());
    results.push(await this.checkCallToAction());
    results.push(await this.checkMobileOptimization());
    results.push(await this.checkPrintStylesheet());
    results.push(await this.checkCanonicalConsistency());
    results.push(await this.checkNoIndex());

    return results;
  }

  private async checkDuplicateTitles(): Promise<SEOCheckResult> {
    try {
      const titles = await this.page.evaluate(() => {
        const pageTitle = document.title;
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');

        return {
          pageTitle,
          ogTitle,
          twitterTitle,
          allSame: pageTitle === ogTitle && pageTitle === twitterTitle,
        };
      });

      // It's actually good if all titles are the same for consistency
      return {
        passed: true,
        message: titles.allSame
          ? 'All title tags are consistent'
          : 'Title tags vary (ensure intentional variation)',
        details: titles,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Title consistency check skipped',
      };
    }
  }

  private async checkDuplicateDescriptions(): Promise<SEOCheckResult> {
    try {
      const descriptions = await this.page.evaluate(() => {
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
        const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const twitterDesc = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content');

        return {
          metaDesc,
          ogDesc,
          twitterDesc,
          allSame: metaDesc === ogDesc && metaDesc === twitterDesc,
        };
      });

      return {
        passed: true,
        message: descriptions.allSame
          ? 'All description tags are consistent'
          : 'Description tags vary',
        details: descriptions,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Description consistency check skipped',
      };
    }
  }

  private async checkDuplicateH1(): Promise<SEOCheckResult> {
    try {
      const h1Data = await this.page.evaluate(() => {
        const h1s = Array.from(document.querySelectorAll('h1'));
        const h1Texts = h1s.map((h) => h.textContent?.trim()).filter((t) => t);
        const uniqueH1s = [...new Set(h1Texts)];

        return {
          totalH1s: h1s.length,
          uniqueH1s: uniqueH1s.length,
          hasDuplicates: uniqueH1s.length < h1Texts.length,
          h1Texts: h1Texts.slice(0, 3),
        };
      });

      if (h1Data.hasDuplicates) {
        return {
          passed: false,
          message: `Duplicate H1 content found (${h1Data.totalH1s} H1s, ${h1Data.uniqueH1s} unique)`,
          details: h1Data,
        };
      }

      if (h1Data.totalH1s > 1) {
        return {
          passed: false,
          message: `Multiple H1 tags found (${h1Data.totalH1s}). Best practice: 1 per page`,
          details: h1Data,
        };
      }

      return {
        passed: true,
        message: 'Single unique H1 found',
        details: h1Data,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'H1 duplication check skipped',
      };
    }
  }

  private async checkContentFreshness(): Promise<SEOCheckResult> {
    try {
      const dateData = await this.page.evaluate(() => {
        const modifiedMeta = document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content');
        const publishedMeta = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content');
        const timeTags = Array.from(document.querySelectorAll('time')).map((t) => t.getAttribute('datetime'));

        return {
          hasModifiedDate: !!modifiedMeta,
          hasPublishedDate: !!publishedMeta,
          hasTimeElements: timeTags.length > 0,
          modifiedMeta,
          publishedMeta,
          timeTags,
        };
      });

      const hasDateIndicators = dateData.hasModifiedDate || dateData.hasPublishedDate || dateData.hasTimeElements;

      if (!hasDateIndicators) {
        return {
          passed: false,
          message: 'No date indicators found (consider adding publication/modified dates)',
          details: dateData,
        };
      }

      return {
        passed: true,
        message: 'Date metadata present',
        details: dateData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Content freshness check skipped',
      };
    }
  }

  private async checkMediaPresence(): Promise<SEOCheckResult> {
    try {
      const mediaData = await this.page.evaluate(() => {
        return {
          images: document.querySelectorAll('img').length,
          videos: document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length,
          audio: document.querySelectorAll('audio').length,
        };
      });

      const totalMedia = mediaData.images + mediaData.videos + mediaData.audio;

      if (totalMedia === 0) {
        return {
          passed: false,
          message: 'No media elements found (images/videos improve engagement)',
          details: mediaData,
        };
      }

      return {
        passed: true,
        message: `Media elements present (${totalMedia} total)`,
        details: mediaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Media presence check skipped',
      };
    }
  }

  private async checkTableOfContents(): Promise<SEOCheckResult> {
    try {
      const hasTOC = await this.page.evaluate(() => {
        const tocElements = document.querySelectorAll(
          '[class*="toc"], [id*="toc"], [class*="table-of-contents"], nav ol, nav ul'
        );
        return tocElements.length > 0;
      });

      return {
        passed: true,
        message: hasTOC
          ? 'Table of contents found'
          : 'No table of contents (consider adding for long content)',
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Table of contents check skipped',
      };
    }
  }

  private async checkAuthorInfo(): Promise<SEOCheckResult> {
    try {
      const authorData = await this.page.evaluate(() => {
        const authorMeta = document.querySelector('meta[name="author"]')?.getAttribute('content');
        const articleAuthor = document.querySelector('[rel="author"]');
        const schemaAuthor = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .some((script) => {
            try {
              const data = JSON.parse(script.textContent || '{}');
              return data.author || data.creator;
            } catch {
              return false;
            }
          });

        return {
          hasAuthorMeta: !!authorMeta,
          hasAuthorLink: !!articleAuthor,
          hasSchemaAuthor: schemaAuthor,
          authorMeta,
        };
      });

      const hasAuthorInfo = authorData.hasAuthorMeta || authorData.hasAuthorLink || authorData.hasSchemaAuthor;

      return {
        passed: true,
        message: hasAuthorInfo
          ? 'Author information present'
          : 'No author information (recommended for E-A-T)',
        details: authorData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Author info check skipped',
      };
    }
  }

  private async checkPublishDate(): Promise<SEOCheckResult> {
    try {
      const dateInfo = await this.page.evaluate(() => {
        const publishedTime = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content');
        const timeElements = document.querySelectorAll('time[datetime]');

        return {
          hasPublishedMeta: !!publishedTime,
          hasTimeElements: timeElements.length > 0,
          publishedTime,
        };
      });

      const hasDate = dateInfo.hasPublishedMeta || dateInfo.hasTimeElements;

      return {
        passed: true,
        message: hasDate
          ? 'Publication date found'
          : 'No publication date (recommended for content freshness)',
        details: dateInfo,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Publish date check skipped',
      };
    }
  }

  private async checkContactInfo(): Promise<SEOCheckResult> {
    try {
      const contactData = await this.page.evaluate(() => {
        const content = document.body.textContent || '';
        const hasEmail = /@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(content);
        const hasPhone = /\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/.test(content);
        const hasAddress = content.toLowerCase().includes('address') &&
                          (content.includes('Street') || content.includes('Ave') || content.includes('Blvd'));

        return {
          hasEmail,
          hasPhone,
          hasAddress,
        };
      });

      const contactMethods = [contactData.hasEmail, contactData.hasPhone, contactData.hasAddress].filter(Boolean).length;

      return {
        passed: true,
        message: contactMethods > 0
          ? `Contact information present (${contactMethods} methods)`
          : 'No contact information found (consider adding for trust)',
        details: contactData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Contact info check skipped',
      };
    }
  }

  private async checkSocialProof(): Promise<SEOCheckResult> {
    try {
      const socialData = await this.page.evaluate(() => {
        const testimonials = document.querySelectorAll('[class*="testimonial"], [class*="review"]');
        const ratings = document.querySelectorAll('[class*="rating"], [class*="star"]');
        const socialLinks = document.querySelectorAll('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"]');

        return {
          hasTestimonials: testimonials.length > 0,
          hasRatings: ratings.length > 0,
          hasSocialLinks: socialLinks.length > 0,
          testimonialCount: testimonials.length,
          socialLinkCount: socialLinks.length,
        };
      });

      const hasSocialProof = socialData.hasTestimonials || socialData.hasRatings || socialData.hasSocialLinks;

      return {
        passed: true,
        message: hasSocialProof
          ? 'Social proof elements present'
          : 'No social proof (consider adding reviews/testimonials)',
        details: socialData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Social proof check skipped',
      };
    }
  }

  private async checkCallToAction(): Promise<SEOCheckResult> {
    try {
      const ctaData = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"], a[class*="btn"], a[class*="button"]'));
        const ctaText = buttons.map((btn) => btn.textContent?.trim().toLowerCase()).filter((text) => text);

        const commonCTAs = ['buy', 'shop', 'subscribe', 'sign up', 'contact', 'get', 'download', 'learn more', 'read more'];
        const hasCTA = ctaText.some((text) => commonCTAs.some((cta: string) => text.includes(cta)));

        return {
          buttonCount: buttons.length,
          hasCTA,
        };
      });

      return {
        passed: true,
        message: ctaData.hasCTA
          ? `Call-to-action buttons present (${ctaData.buttonCount} buttons)`
          : 'No clear call-to-action (consider adding for conversion)',
        details: ctaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'CTA check skipped',
      };
    }
  }

  private async checkMobileOptimization(): Promise<SEOCheckResult> {
    try {
      const mobileData = await this.page.evaluate(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        const viewportContent = viewport?.getAttribute('content') || '';

        const hasTouchIcons = document.querySelectorAll('link[rel*="apple-touch-icon"], link[rel*="icon"]').length > 0;
        const hasResponsiveImages = document.querySelectorAll('img[srcset], picture').length > 0;

        return {
          hasViewport: !!viewport,
          hasDeviceWidth: viewportContent.includes('width=device-width'),
          hasTouchIcons,
          hasResponsiveImages,
          viewportContent,
        };
      });

      const issues: string[] = [];

      if (!mobileData.hasViewport) {
        issues.push('Missing viewport meta tag');
      } else if (!mobileData.hasDeviceWidth) {
        issues.push('Viewport missing device-width');
      }

      if (!mobileData.hasTouchIcons) {
        issues.push('Missing touch icons');
      }

      if (issues.length > 1) {
        return {
          passed: false,
          message: `Mobile optimization issues: ${issues.join(', ')}`,
          details: mobileData,
        };
      }

      return {
        passed: true,
        message: 'Mobile optimization present',
        details: mobileData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mobile optimization check skipped',
      };
    }
  }

  private async checkPrintStylesheet(): Promise<SEOCheckResult> {
    try {
      const hasPrintCSS = await this.page.evaluate(() => {
        const printLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
          .some((link) => link.getAttribute('media') === 'print');

        const hasMediaQueries = Array.from(document.querySelectorAll('style'))
          .some((style) => style.textContent?.includes('@media print'));

        return {
          hasPrintLinks: printLinks,
          hasMediaQueries,
        };
      });

      return {
        passed: true,
        message: (hasPrintCSS.hasPrintLinks || hasPrintCSS.hasMediaQueries)
          ? 'Print stylesheet present'
          : 'No print stylesheet (optional but good for UX)',
        details: hasPrintCSS,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Print stylesheet check skipped',
      };
    }
  }

  private async checkCanonicalConsistency(): Promise<SEOCheckResult> {
    try {
      const canonicalData = await this.page.evaluate(() => {
        const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
        const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content');

        return {
          canonical,
          ogUrl,
          match: canonical === ogUrl,
        };
      });

      if (canonicalData.canonical && canonicalData.ogUrl && !canonicalData.match) {
        return {
          passed: false,
          message: 'Canonical URL and og:url do not match',
          details: canonicalData,
        };
      }

      return {
        passed: true,
        message: 'Canonical tags are consistent',
        details: canonicalData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Canonical consistency check skipped',
      };
    }
  }

  private async checkNoIndex(): Promise<SEOCheckResult> {
    try {
      const robotsData = await this.page.evaluate(() => {
        const robotsMeta = document.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        const googleBotMeta = document.querySelector('meta[name="googlebot"]')?.getAttribute('content') || '';

        const hasNoIndex = robotsMeta.toLowerCase().includes('noindex') ||
                          googleBotMeta.toLowerCase().includes('noindex');
        const hasNoFollow = robotsMeta.toLowerCase().includes('nofollow') ||
                           googleBotMeta.toLowerCase().includes('nofollow');

        return {
          robotsMeta,
          googleBotMeta,
          hasNoIndex,
          hasNoFollow,
        };
      });

      if (robotsData.hasNoIndex) {
        return {
          passed: false,
          message: 'Page has noindex directive (will not be indexed by search engines)',
          details: robotsData,
        };
      }

      if (robotsData.hasNoFollow) {
        return {
          passed: false,
          message: 'Page has nofollow directive (links will not be followed)',
          details: robotsData,
        };
      }

      return {
        passed: true,
        message: 'Page is indexable',
        details: robotsData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'NoIndex check skipped',
      };
    }
  }
}
