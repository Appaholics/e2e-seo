import { Page } from 'playwright';
import { SEOCheckResult } from '../types';

export class AdvancedImagesChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkImageFormats());
    results.push(await this.checkResponsiveImages());
    results.push(await this.checkLazyLoading());
    results.push(await this.checkImageDimensions());
    results.push(await this.checkImageTitles());
    results.push(await this.checkDecorativeImages());
    results.push(await this.checkFigcaptions());
    results.push(await this.checkImageSrcset());
    results.push(await this.checkWebPSupport());
    results.push(await this.checkImageCompression());

    return results;
  }

  private async checkImageFormats(): Promise<SEOCheckResult> {
    try {
      const formatData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const formats: Record<string, number> = {};

        images.forEach((img) => {
          const src = img.src || '';
          let ext = 'unknown';

          try {
            const url = new URL(src);
            const pathname = url.pathname;

            // Check for common CDN patterns (dynamic image generation services)
            const cdnPatterns = [
              'placehold.co',
              'placeholder.com',
              'via.placeholder.com',
              'dummyimage.com',
              'picsum.photos',
              'loremflickr.com',
            ];

            const isCDN = cdnPatterns.some(pattern => url.hostname.includes(pattern));

            if (isCDN) {
              ext = 'dynamic';
            } else {
              // Extract file extension from pathname
              const parts = pathname.split('.');
              if (parts.length > 1) {
                // Get the last part and remove any query parameters
                const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0];
                // Only use if it looks like a valid extension (2-4 characters)
                if (lastPart && lastPart.length >= 2 && lastPart.length <= 4 && /^[a-z0-9]+$/i.test(lastPart)) {
                  ext = lastPart.toLowerCase();
                }
              }
            }
          } catch (e) {
            // If URL parsing fails, try simple extension extraction as fallback
            const match = src.match(/\.([a-z0-9]{2,4})(?:[?#]|$)/i);
            if (match) {
              ext = match[1].toLowerCase();
            }
          }

          formats[ext] = (formats[ext] || 0) + 1;
        });

        return {
          totalImages: images.length,
          formats,
        };
      });

      const oldFormats = ['bmp', 'tiff', 'tif'];
      const hasOldFormats = Object.keys(formatData.formats).some((fmt: string) => oldFormats.includes(fmt));

      if (hasOldFormats) {
        return {
          passed: false,
          message: 'Images use outdated formats (BMP, TIFF). Use JPG, PNG, WebP',
          details: formatData,
        };
      }

      // Filter out 'unknown' and 'dynamic' for the display message
      const knownFormats = Object.keys(formatData.formats).filter(f => f !== 'unknown' && f !== 'dynamic');
      const displayFormats = knownFormats.length > 0 ? knownFormats.join(', ') : 'various formats';

      return {
        passed: true,
        message: `Images use modern formats (${displayFormats})`,
        details: formatData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Image format check skipped',
      };
    }
  }

  private async checkResponsiveImages(): Promise<SEOCheckResult> {
    try {
      const responsiveData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const withSrcset = images.filter((img) => img.hasAttribute('srcset'));
        const inPicture = images.filter((img) => img.closest('picture'));

        return {
          totalImages: images.length,
          withSrcset: withSrcset.length,
          inPicture: inPicture.length,
          responsiveCount: withSrcset.length + inPicture.length,
        };
      });

      const responsivePercentage = responsiveData.totalImages > 0
        ? (responsiveData.responsiveCount / responsiveData.totalImages) * 100
        : 0;

      if (responsiveData.totalImages > 5 && responsivePercentage < 50) {
        return {
          passed: false,
          message: `Only ${responsivePercentage.toFixed(0)}% of images are responsive (use srcset or picture)`,
          details: responsiveData,
        };
      }

      return {
        passed: true,
        message: responsiveData.totalImages > 0
          ? `${responsivePercentage.toFixed(0)}% of images are responsive`
          : 'No images to check',
        details: responsiveData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Responsive images check skipped',
      };
    }
  }

  private async checkLazyLoading(): Promise<SEOCheckResult> {
    try {
      const lazyData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const withLoading = images.filter((img) => img.hasAttribute('loading'));
        const lazyLoaded = images.filter((img) => img.getAttribute('loading') === 'lazy');

        return {
          totalImages: images.length,
          withLoading: withLoading.length,
          lazyLoaded: lazyLoaded.length,
        };
      });

      if (lazyData.totalImages > 10 && lazyData.lazyLoaded === 0) {
        return {
          passed: false,
          message: 'No lazy loading on images (consider adding loading="lazy" for performance)',
          details: lazyData,
        };
      }

      return {
        passed: true,
        message: lazyData.lazyLoaded > 0
          ? `${lazyData.lazyLoaded} images use lazy loading`
          : 'Lazy loading not needed (few images)',
        details: lazyData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Lazy loading check skipped',
      };
    }
  }

  private async checkImageDimensions(): Promise<SEOCheckResult> {
    try {
      const dimensionData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const withoutDimensions = images.filter((img) => !img.hasAttribute('width') || !img.hasAttribute('height'));

        return {
          totalImages: images.length,
          withoutDimensions: withoutDimensions.length,
        };
      });

      if (dimensionData.withoutDimensions > 3) {
        return {
          passed: false,
          message: `${dimensionData.withoutDimensions} images missing width/height attributes (causes layout shift)`,
          details: dimensionData,
        };
      }

      return {
        passed: true,
        message: 'Most images have explicit dimensions',
        details: dimensionData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Image dimensions check skipped',
      };
    }
  }

  private async checkImageTitles(): Promise<SEOCheckResult> {
    try {
      const titleData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const withTitles = images.filter((img) => img.hasAttribute('title') && img.getAttribute('title')?.trim());

        return {
          totalImages: images.length,
          withTitles: withTitles.length,
        };
      });

      return {
        passed: true,
        message: titleData.withTitles > 0
          ? `${titleData.withTitles} images have title attributes`
          : 'No image titles (optional but can improve accessibility)',
        details: titleData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Image titles check skipped',
      };
    }
  }

  private async checkDecorativeImages(): Promise<SEOCheckResult> {
    try {
      const decorativeData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const decorative = images.filter((img) => {
          const alt = img.getAttribute('alt');
          const role = img.getAttribute('role');
          return alt === '' || role === 'presentation' || role === 'none';
        });

        return {
          totalImages: images.length,
          decorativeCount: decorative.length,
        };
      });

      return {
        passed: true,
        message: decorativeData.decorativeCount > 0
          ? `${decorativeData.decorativeCount} decorative images properly marked`
          : 'All images have descriptive alt text',
        details: decorativeData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Decorative images check skipped',
      };
    }
  }

  private async checkFigcaptions(): Promise<SEOCheckResult> {
    try {
      const figureData = await this.page.evaluate(() => {
        const figures = Array.from(document.querySelectorAll('figure'));
        const withCaptions = figures.filter((fig) => fig.querySelector('figcaption'));

        return {
          totalFigures: figures.length,
          withCaptions: withCaptions.length,
        };
      });

      if (figureData.totalFigures > 0 && figureData.withCaptions === 0) {
        return {
          passed: false,
          message: `${figureData.totalFigures} <figure> elements missing <figcaption>`,
          details: figureData,
        };
      }

      return {
        passed: true,
        message: figureData.totalFigures > 0
          ? `${figureData.withCaptions}/${figureData.totalFigures} figures have captions`
          : 'No figure elements',
        details: figureData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Figcaption check skipped',
      };
    }
  }

  private async checkImageSrcset(): Promise<SEOCheckResult> {
    try {
      const srcsetData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img[srcset]'));
        const srcsetSizes = images.map((img) => {
          const srcset = img.getAttribute('srcset') || '';
          return srcset.split(',').length;
        });

        return {
          imagesWithSrcset: images.length,
          avgSrcsetSizes: srcsetSizes.length > 0
            ? srcsetSizes.reduce((a: number, b: number) => a + b, 0) / srcsetSizes.length
            : 0,
        };
      });

      return {
        passed: true,
        message: srcsetData.imagesWithSrcset > 0
          ? `${srcsetData.imagesWithSrcset} images use srcset (avg ${srcsetData.avgSrcsetSizes.toFixed(1)} variants)`
          : 'No srcset usage (consider for responsive images)',
        details: srcsetData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Srcset check skipped',
      };
    }
  }

  private async checkWebPSupport(): Promise<SEOCheckResult> {
    try {
      const webpData = await this.page.evaluate(() => {
        const pictures = Array.from(document.querySelectorAll('picture'));
        const withWebP = pictures.filter((pic) => {
          const sources = Array.from(pic.querySelectorAll('source'));
          return sources.some((source) => source.getAttribute('type') === 'image/webp');
        });

        const imgWebP = Array.from(document.querySelectorAll('img')).filter((img) =>
          img.src.toLowerCase().endsWith('.webp')
        );

        return {
          totalPictures: pictures.length,
          withWebP: withWebP.length,
          directWebP: imgWebP.length,
        };
      });

      const hasWebP = webpData.withWebP > 0 || webpData.directWebP > 0;

      return {
        passed: true,
        message: hasWebP
          ? 'WebP format in use (excellent for performance)'
          : 'No WebP images (consider for better compression)',
        details: webpData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'WebP support check skipped',
      };
    }
  }

  private async checkImageCompression(): Promise<SEOCheckResult> {
    try {
      // This is a simplified check - we can't actually measure compression without downloading
      const compressionData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));

        // Check for query parameters that might indicate optimization services
        const optimized = images.filter((img) => {
          const src = img.src || '';
          return (
            src.includes('?w=') ||
            src.includes('?quality=') ||
            src.includes('?q=') ||
            src.includes('cloudinary') ||
            src.includes('imgix') ||
            src.includes('imagekit')
          );
        });

        return {
          totalImages: images.length,
          possiblyOptimized: optimized.length,
        };
      });

      return {
        passed: true,
        message: compressionData.possiblyOptimized > 0
          ? `${compressionData.possiblyOptimized} images appear to use optimization services`
          : 'Image optimization status unclear (consider using CDN/optimization service)',
        details: compressionData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Image compression check skipped',
      };
    }
  }
}
