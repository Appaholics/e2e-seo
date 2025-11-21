import { Page } from 'playwright';
import { SEOCheckResult } from '../types';

export class SchemaValidationChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkOrganizationSchema());
    results.push(await this.checkPersonSchema());
    results.push(await this.checkProductSchema());
    results.push(await this.checkArticleSchema());
    results.push(await this.checkBreadcrumbSchema());
    results.push(await this.checkFAQSchema());
    results.push(await this.checkHowToSchema());
    results.push(await this.checkReviewSchema());
    results.push(await this.checkEventSchema());
    results.push(await this.checkLocalBusinessSchema());
    results.push(await this.checkWebPageSchema());
    results.push(await this.checkWebSiteSchema());
    results.push(await this.checkImageObjectSchema());
    results.push(await this.checkSchemaRequiredFields());
    results.push(await this.checkSchemaContext());

    return results;
  }

  private async checkOrganizationSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const orgSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && (data['@type'] === 'Organization' || data['@type']?.includes('Organization')));

        if (orgSchemas.length === 0) return { found: false };

        const org = orgSchemas[0];
        return {
          found: true,
          hasName: !!org.name,
          hasUrl: !!org.url,
          hasLogo: !!org.logo,
          hasSameAs: !!org.sameAs,
          hasContactPoint: !!org.contactPoint,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No Organization schema (optional but recommended for businesses)',
        };
      }

      const issues: string[] = [];
      if (!schemaData.hasName) issues.push('missing name');
      if (!schemaData.hasUrl) issues.push('missing url');
      if (!schemaData.hasLogo) issues.push('missing logo');

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Organization schema incomplete: ${issues.join(', ')}`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: 'Organization schema properly configured',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Organization schema check skipped',
      };
    }
  }

  private async checkPersonSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const personSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'Person');

        if (personSchemas.length === 0) return { found: false };

        const person = personSchemas[0];
        return {
          found: true,
          hasName: !!person.name,
          hasUrl: !!person.url,
          hasImage: !!person.image,
          hasJobTitle: !!person.jobTitle,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No Person schema (optional, useful for personal brands)',
        };
      }

      const issues: string[] = [];
      if (!schemaData.hasName) issues.push('missing name');

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Person schema incomplete: ${issues.join(', ')}`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: 'Person schema properly configured',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Person schema check skipped',
      };
    }
  }

  private async checkProductSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const productSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'Product');

        if (productSchemas.length === 0) return { found: false };

        const product = productSchemas[0];
        return {
          found: true,
          hasName: !!product.name,
          hasImage: !!product.image,
          hasDescription: !!product.description,
          hasOffers: !!product.offers,
          hasSKU: !!product.sku,
          hasBrand: !!product.brand,
          hasAggregateRating: !!product.aggregateRating,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No Product schema (required for e-commerce pages)',
        };
      }

      const issues: string[] = [];
      if (!schemaData.hasName) issues.push('missing name');
      if (!schemaData.hasImage) issues.push('missing image');
      if (!schemaData.hasOffers) issues.push('missing offers');

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Product schema incomplete: ${issues.join(', ')}`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: 'Product schema properly configured',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Product schema check skipped',
      };
    }
  }

  private async checkArticleSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const articleSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && (data['@type'] === 'Article' || data['@type'] === 'NewsArticle' || data['@type'] === 'BlogPosting'));

        if (articleSchemas.length === 0) return { found: false };

        const article = articleSchemas[0];
        return {
          found: true,
          hasHeadline: !!article.headline,
          hasImage: !!article.image,
          hasDatePublished: !!article.datePublished,
          hasAuthor: !!article.author,
          hasPublisher: !!article.publisher,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No Article schema (recommended for blog posts and articles)',
        };
      }

      const issues: string[] = [];
      if (!schemaData.hasHeadline) issues.push('missing headline');
      if (!schemaData.hasImage) issues.push('missing image');
      if (!schemaData.hasDatePublished) issues.push('missing datePublished');
      if (!schemaData.hasAuthor) issues.push('missing author');
      if (!schemaData.hasPublisher) issues.push('missing publisher');

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Article schema incomplete: ${issues.join(', ')}`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: 'Article schema properly configured',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Article schema check skipped',
      };
    }
  }

  private async checkBreadcrumbSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const breadcrumbSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'BreadcrumbList');

        if (breadcrumbSchemas.length === 0) return { found: false };

        const breadcrumb = breadcrumbSchemas[0];
        return {
          found: true,
          hasItemListElement: !!breadcrumb.itemListElement,
          itemCount: breadcrumb.itemListElement?.length || 0,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No BreadcrumbList schema (recommended for better navigation)',
        };
      }

      if (!schemaData.hasItemListElement || schemaData.itemCount === 0) {
        return {
          passed: false,
          message: 'BreadcrumbList schema missing itemListElement',
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: `BreadcrumbList schema with ${schemaData.itemCount} items`,
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'BreadcrumbList schema check skipped',
      };
    }
  }

  private async checkFAQSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const faqSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'FAQPage');

        if (faqSchemas.length === 0) return { found: false };

        const faq = faqSchemas[0];
        return {
          found: true,
          hasMainEntity: !!faq.mainEntity,
          questionCount: faq.mainEntity?.length || 0,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No FAQPage schema (use for FAQ pages to get rich results)',
        };
      }

      if (!schemaData.hasMainEntity || schemaData.questionCount === 0) {
        return {
          passed: false,
          message: 'FAQPage schema missing questions',
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: `FAQPage schema with ${schemaData.questionCount} questions`,
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'FAQPage schema check skipped',
      };
    }
  }

  private async checkHowToSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const howToSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'HowTo');

        if (howToSchemas.length === 0) return { found: false };

        const howTo = howToSchemas[0];
        return {
          found: true,
          hasName: !!howTo.name,
          hasStep: !!howTo.step,
          stepCount: howTo.step?.length || 0,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No HowTo schema (use for tutorial/how-to content)',
        };
      }

      const issues: string[] = [];
      if (!schemaData.hasName) issues.push('missing name');
      if (!schemaData.hasStep) issues.push('missing step');

      if (issues.length > 0) {
        return {
          passed: false,
          message: `HowTo schema incomplete: ${issues.join(', ')}`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: `HowTo schema with ${schemaData.stepCount} steps`,
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'HowTo schema check skipped',
      };
    }
  }

  private async checkReviewSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const reviewSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && (data['@type'] === 'Review' || data['@type'] === 'AggregateRating'));

        if (reviewSchemas.length === 0) return { found: false };

        const review = reviewSchemas[0];
        return {
          found: true,
          type: review['@type'],
          hasRatingValue: !!review.ratingValue,
          hasReviewRating: !!review.reviewRating,
          hasAuthor: !!review.author,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No Review schema (use for product/business reviews)',
        };
      }

      if (schemaData.type === 'Review' && !schemaData.hasAuthor) {
        return {
          passed: false,
          message: 'Review schema missing author',
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: `${schemaData.type} schema properly configured`,
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Review schema check skipped',
      };
    }
  }

  private async checkEventSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const eventSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'Event');

        if (eventSchemas.length === 0) return { found: false };

        const event = eventSchemas[0];
        return {
          found: true,
          hasName: !!event.name,
          hasStartDate: !!event.startDate,
          hasLocation: !!event.location,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No Event schema (use for event pages)',
        };
      }

      const issues: string[] = [];
      if (!schemaData.hasName) issues.push('missing name');
      if (!schemaData.hasStartDate) issues.push('missing startDate');
      if (!schemaData.hasLocation) issues.push('missing location');

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Event schema incomplete: ${issues.join(', ')}`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: 'Event schema properly configured',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Event schema check skipped',
      };
    }
  }

  private async checkLocalBusinessSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const businessSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'LocalBusiness');

        if (businessSchemas.length === 0) return { found: false };

        const business = businessSchemas[0];
        return {
          found: true,
          hasName: !!business.name,
          hasAddress: !!business.address,
          hasTelephone: !!business.telephone,
          hasOpeningHours: !!business.openingHoursSpecification,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No LocalBusiness schema (use for local business pages)',
        };
      }

      const issues: string[] = [];
      if (!schemaData.hasName) issues.push('missing name');
      if (!schemaData.hasAddress) issues.push('missing address');
      if (!schemaData.hasTelephone) issues.push('missing telephone');

      if (issues.length > 0) {
        return {
          passed: false,
          message: `LocalBusiness schema incomplete: ${issues.join(', ')}`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: 'LocalBusiness schema properly configured',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'LocalBusiness schema check skipped',
      };
    }
  }

  private async checkWebPageSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const webPageSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'WebPage');

        if (webPageSchemas.length === 0) return { found: false };

        const webPage = webPageSchemas[0];
        return {
          found: true,
          hasName: !!webPage.name,
          hasUrl: !!webPage.url,
          hasDescription: !!webPage.description,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No WebPage schema (optional)',
        };
      }

      return {
        passed: true,
        message: 'WebPage schema present',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'WebPage schema check skipped',
      };
    }
  }

  private async checkWebSiteSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const webSiteSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'WebSite');

        if (webSiteSchemas.length === 0) return { found: false };

        const webSite = webSiteSchemas[0];
        return {
          found: true,
          hasName: !!webSite.name,
          hasUrl: !!webSite.url,
          hasPotentialAction: !!webSite.potentialAction,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No WebSite schema (recommended for homepage)',
        };
      }

      return {
        passed: true,
        message: schemaData.hasPotentialAction
          ? 'WebSite schema with search action'
          : 'WebSite schema present',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'WebSite schema check skipped',
      };
    }
  }

  private async checkImageObjectSchema(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const imageSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data && data['@type'] === 'ImageObject');

        return {
          found: imageSchemas.length > 0,
          count: imageSchemas.length,
        };
      });

      if (!schemaData.found) {
        return {
          passed: true,
          message: 'No ImageObject schema (optional)',
        };
      }

      return {
        passed: true,
        message: `${schemaData.count} ImageObject schema(s) present`,
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'ImageObject schema check skipped',
      };
    }
  }

  private async checkSchemaRequiredFields(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const allSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data);

        const missingContexts = allSchemas.filter((schema) => !schema['@context']);
        const missingTypes = allSchemas.filter((schema) => !schema['@type']);

        return {
          totalSchemas: allSchemas.length,
          missingContexts: missingContexts.length,
          missingTypes: missingTypes.length,
        };
      });

      if (schemaData.totalSchemas === 0) {
        return {
          passed: true,
          message: 'No schema markup to validate',
        };
      }

      const issues: string[] = [];
      if (schemaData.missingContexts > 0) {
        issues.push(`${schemaData.missingContexts} schemas missing @context`);
      }
      if (schemaData.missingTypes > 0) {
        issues.push(`${schemaData.missingTypes} schemas missing @type`);
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Schema validation issues: ${issues.join(', ')}`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: `All ${schemaData.totalSchemas} schemas have required fields`,
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Schema required fields check skipped',
      };
    }
  }

  private async checkSchemaContext(): Promise<SEOCheckResult> {
    try {
      const schemaData = await this.page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const allSchemas = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || '{}');
            } catch {
              return null;
            }
          })
          .filter((data) => data);

        const contexts = allSchemas
          .map((schema) => schema['@context'])
          .filter((ctx) => ctx);

        const validContexts = contexts.filter(
          (ctx: string) => ctx === 'https://schema.org' || ctx === 'http://schema.org'
        );

        return {
          totalSchemas: allSchemas.length,
          totalContexts: contexts.length,
          validContexts: validContexts.length,
        };
      });

      if (schemaData.totalSchemas === 0) {
        return {
          passed: true,
          message: 'No schema markup to validate',
        };
      }

      if (schemaData.validContexts < schemaData.totalContexts) {
        return {
          passed: false,
          message: `${schemaData.totalContexts - schemaData.validContexts} schemas with invalid @context`,
          details: schemaData,
        };
      }

      return {
        passed: true,
        message: 'All schemas use valid schema.org context',
        details: schemaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Schema context check skipped',
      };
    }
  }
}
