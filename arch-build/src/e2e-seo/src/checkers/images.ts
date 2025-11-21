import { Page } from 'playwright';
import { SEOCheckResult, ImageInfo } from '../types';

export class ImagesChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    const images = await this.getImages();
    results.push(this.checkAltTags(images));
    results.push(this.checkImageCount(images));

    return results;
  }

  private async getImages(): Promise<ImageInfo[]> {
    return await this.page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map((img) => ({
        src: img.src,
        alt: img.alt || null,
        hasAlt: img.hasAttribute('alt') && img.alt.trim().length > 0,
      }));
    });
  }

  private checkAltTags(images: ImageInfo[]): SEOCheckResult {
    const missingAlt = images.filter((img) => !img.hasAlt);

    if (missingAlt.length === 0) {
      return {
        passed: true,
        message: `All ${images.length} images have alt text`,
        details: { totalImages: images.length },
      };
    }

    if (missingAlt.length === images.length) {
      return {
        passed: false,
        message: `All ${images.length} images are missing alt text`,
        details: { missingAlt },
      };
    }

    return {
      passed: false,
      message: `${missingAlt.length} out of ${images.length} images are missing alt text`,
      details: { missingAlt, totalImages: images.length },
    };
  }

  private checkImageCount(images: ImageInfo[]): SEOCheckResult {
    if (images.length === 0) {
      return {
        passed: true,
        message: 'No images found on the page',
      };
    }

    if (images.length > 50) {
      return {
        passed: false,
        message: `High number of images (${images.length}). Consider optimization for performance`,
        details: { imageCount: images.length },
      };
    }

    return {
      passed: true,
      message: `Image count is reasonable (${images.length})`,
      details: { imageCount: images.length },
    };
  }
}
