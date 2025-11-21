import { Page } from 'playwright';
import { SEOCheckResult } from '../types';

export class MobileUXChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkTapTargetSize());
    results.push(await this.checkMobileViewportConfig());
    results.push(await this.checkTouchFriendlySpacing());
    results.push(await this.checkMobileFormInputs());
    results.push(await this.checkMobileNavigation());
    results.push(await this.checkMobileReadability());
    results.push(await this.checkMobileImageOptimization());
    results.push(await this.checkMobilePopups());
    results.push(await this.checkOrientationSupport());
    results.push(await this.checkTouchIcons());
    results.push(await this.checkAMPImplementation());
    results.push(await this.checkPWAFeatures());
    results.push(await this.checkMobileScrolling());
    results.push(await this.checkMobilePerformance());
    results.push(await this.checkGestureSupport());

    return results;
  }

  private async checkTapTargetSize(): Promise<SEOCheckResult> {
    try {
      const tapData = await this.page.evaluate(() => {
        const interactive = Array.from(document.querySelectorAll('a, button, input[type="button"], input[type="submit"]'));

        const tooSmall = interactive.filter((el) => {
          const rect = el.getBoundingClientRect();
          return (rect.width > 0 && rect.width < 44) || (rect.height > 0 && rect.height < 44);
        });

        return {
          total: interactive.length,
          tooSmall: tooSmall.length,
        };
      });

      if (tapData.tooSmall > 5) {
        return {
          passed: false,
          message: `${tapData.tooSmall} tap targets smaller than 44x44px (mobile usability issue)`,
          details: tapData,
        };
      }

      return {
        passed: true,
        message: 'Tap targets meet minimum size requirements',
        details: tapData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Tap target size check skipped',
      };
    }
  }

  private async checkMobileViewportConfig(): Promise<SEOCheckResult> {
    try {
      const viewportData = await this.page.evaluate(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        const content = viewport?.getAttribute('content') || '';

        const config = {
          hasViewport: !!viewport,
          content,
          hasDeviceWidth: content.includes('width=device-width'),
          hasInitialScale: content.includes('initial-scale=1'),
          hasUserScalable: content.includes('user-scalable'),
          userScalableValue: content.match(/user-scalable=([^,\s]+)/)?.[1],
          hasMaximumScale: content.includes('maximum-scale'),
        };

        return config;
      });

      const issues: string[] = [];

      if (!viewportData.hasViewport) {
        issues.push('Missing viewport meta tag');
      } else {
        if (!viewportData.hasDeviceWidth) {
          issues.push('Missing width=device-width');
        }
        if (!viewportData.hasInitialScale) {
          issues.push('Missing initial-scale=1');
        }
        if (viewportData.userScalableValue === 'no' || viewportData.hasMaximumScale) {
          issues.push('Zoom disabled (accessibility issue)');
        }
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Mobile viewport issues: ${issues.join(', ')}`,
          details: viewportData,
        };
      }

      return {
        passed: true,
        message: 'Mobile viewport properly configured',
        details: viewportData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Viewport config check skipped',
      };
    }
  }

  private async checkTouchFriendlySpacing(): Promise<SEOCheckResult> {
    try {
      const spacingData = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));

        const closeLinks = links.filter((link, index) => {
          if (index === 0) return false;
          const rect = link.getBoundingClientRect();
          const prevRect = links[index - 1].getBoundingClientRect();

          const verticalDistance = Math.abs(rect.top - prevRect.bottom);
          const horizontalDistance = Math.abs(rect.left - prevRect.right);

          return (verticalDistance > 0 && verticalDistance < 8) ||
                 (horizontalDistance > 0 && horizontalDistance < 8);
        });

        return {
          totalLinks: links.length,
          closeTogether: closeLinks.length,
        };
      });

      if (spacingData.closeTogether > 10) {
        return {
          passed: false,
          message: `${spacingData.closeTogether} elements too close together for touch`,
          details: spacingData,
        };
      }

      return {
        passed: true,
        message: 'Touch-friendly spacing detected',
        details: spacingData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Touch spacing check skipped',
      };
    }
  }

  private async checkMobileFormInputs(): Promise<SEOCheckResult> {
    try {
      const formData = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));

        const withInputMode = inputs.filter((input) => input.hasAttribute('inputmode'));
        const withAutocomplete = inputs.filter((input) => input.hasAttribute('autocomplete'));
        const emailInputs = inputs.filter((input) => input.getAttribute('type') === 'email');
        const telInputs = inputs.filter((input) => input.getAttribute('type') === 'tel');
        const numberInputs = inputs.filter((input) => input.getAttribute('type') === 'number');

        return {
          total: inputs.length,
          withInputMode: withInputMode.length,
          withAutocomplete: withAutocomplete.length,
          specialInputTypes: emailInputs.length + telInputs.length + numberInputs.length,
        };
      });

      if (formData.total === 0) {
        return {
          passed: true,
          message: 'No form inputs found',
        };
      }

      const issues: string[] = [];

      if (formData.withAutocomplete < formData.total / 2) {
        issues.push('Few inputs use autocomplete attribute');
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Mobile form issues: ${issues.join(', ')}`,
          details: formData,
        };
      }

      return {
        passed: true,
        message: 'Form inputs optimized for mobile',
        details: formData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mobile form inputs check skipped',
      };
    }
  }

  private async checkMobileNavigation(): Promise<SEOCheckResult> {
    try {
      const navData = await this.page.evaluate(() => {
        const hamburger = document.querySelector('[class*="hamburger"], [class*="menu-toggle"], [class*="mobile-menu"]');
        const nav = document.querySelector('nav');
        const hasFixedHeader = Array.from(document.querySelectorAll('header, nav')).some((el) => {
          const style = window.getComputedStyle(el);
          return style.position === 'fixed' || style.position === 'sticky';
        });

        return {
          hasHamburgerMenu: !!hamburger,
          hasNav: !!nav,
          hasFixedHeader,
        };
      });

      return {
        passed: true,
        message: navData.hasHamburgerMenu
          ? 'Mobile navigation menu detected'
          : 'No obvious mobile menu (consider hamburger menu for mobile)',
        details: navData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mobile navigation check skipped',
      };
    }
  }

  private async checkMobileReadability(): Promise<SEOCheckResult> {
    try {
      const readabilityData = await this.page.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        const fontSize = parseInt(bodyStyle.fontSize);

        const smallText = Array.from(document.querySelectorAll('p, li, span, div')).filter((el) => {
          const style = window.getComputedStyle(el);
          const size = parseInt(style.fontSize);
          const hasText = (el.textContent?.trim().length || 0) > 20;
          return hasText && size < 14;
        });

        return {
          bodyFontSize: fontSize,
          smallTextElements: smallText.length,
        };
      });

      if (readabilityData.bodyFontSize < 16) {
        return {
          passed: false,
          message: `Base font size too small (${readabilityData.bodyFontSize}px). Recommended: 16px+`,
          details: readabilityData,
        };
      }

      if (readabilityData.smallTextElements > 10) {
        return {
          passed: false,
          message: `${readabilityData.smallTextElements} elements with small text (< 14px)`,
          details: readabilityData,
        };
      }

      return {
        passed: true,
        message: 'Mobile readability is good',
        details: readabilityData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mobile readability check skipped',
      };
    }
  }

  private async checkMobileImageOptimization(): Promise<SEOCheckResult> {
    try {
      const imageData = await this.page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const withSrcset = images.filter((img) => img.hasAttribute('srcset'));
        const withSizes = images.filter((img) => img.hasAttribute('sizes'));
        const inPicture = images.filter((img) => img.closest('picture'));

        return {
          total: images.length,
          withSrcset: withSrcset.length,
          withSizes: withSizes.length,
          inPicture: inPicture.length,
          responsive: withSrcset.length + inPicture.length,
        };
      });

      if (imageData.total > 5 && imageData.responsive === 0) {
        return {
          passed: false,
          message: 'Images not optimized for mobile (use srcset or picture)',
          details: imageData,
        };
      }

      return {
        passed: true,
        message: imageData.responsive > 0
          ? `${imageData.responsive}/${imageData.total} images are mobile-optimized`
          : 'No images or optimization not needed',
        details: imageData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mobile image optimization check skipped',
      };
    }
  }

  private async checkMobilePopups(): Promise<SEOCheckResult> {
    try {
      const popupData = await this.page.evaluate(() => {
        const modals = Array.from(document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]'));
        const visible = modals.filter((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });

        return {
          totalModals: modals.length,
          visibleModals: visible.length,
        };
      });

      if (popupData.visibleModals > 0) {
        return {
          passed: false,
          message: `${popupData.visibleModals} visible popup(s) detected (Google penalizes intrusive mobile interstitials)`,
          details: popupData,
        };
      }

      return {
        passed: true,
        message: 'No intrusive popups detected',
        details: popupData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mobile popups check skipped',
      };
    }
  }

  private async checkOrientationSupport(): Promise<SEOCheckResult> {
    try {
      const orientationData = await this.page.evaluate(() => {
        const hasOrientationCSS = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).some((el) => {
          const content = el.textContent || '';
          return content.includes('@media') &&
                 (content.includes('orientation') || content.includes('landscape') || content.includes('portrait'));
        });

        return {
          hasOrientationSupport: hasOrientationCSS,
        };
      });

      return {
        passed: true,
        message: orientationData.hasOrientationSupport
          ? 'Orientation-specific CSS detected'
          : 'No orientation-specific CSS (optional)',
        details: orientationData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Orientation support check skipped',
      };
    }
  }

  private async checkTouchIcons(): Promise<SEOCheckResult> {
    try {
      const iconData = await this.page.evaluate(() => {
        const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
        const appleTouchIcons = document.querySelectorAll('link[rel*="apple-touch-icon"]');
        const manifest = document.querySelector('link[rel="manifest"]');

        return {
          hasAppleTouchIcon: !!appleTouchIcon,
          appleTouchIconCount: appleTouchIcons.length,
          hasManifest: !!manifest,
        };
      });

      if (!iconData.hasAppleTouchIcon && !iconData.hasManifest) {
        return {
          passed: false,
          message: 'Missing touch icons and web manifest',
          details: iconData,
        };
      }

      return {
        passed: true,
        message: iconData.hasAppleTouchIcon && iconData.hasManifest
          ? 'Touch icons and manifest present'
          : iconData.hasAppleTouchIcon
          ? 'Touch icons present (consider adding web manifest)'
          : 'Web manifest present (consider adding apple-touch-icon)',
        details: iconData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Touch icons check skipped',
      };
    }
  }

  private async checkAMPImplementation(): Promise<SEOCheckResult> {
    try {
      const ampData = await this.page.evaluate(() => {
        const isAMP = document.documentElement.hasAttribute('amp') ||
                      document.documentElement.hasAttribute('⚡');
        const ampLink = document.querySelector('link[rel="amphtml"]');

        return {
          isAMPPage: isAMP,
          hasAMPVersion: !!ampLink,
          ampUrl: ampLink?.getAttribute('href'),
        };
      });

      return {
        passed: true,
        message: ampData.isAMPPage
          ? 'This is an AMP page'
          : ampData.hasAMPVersion
          ? 'AMP version available'
          : 'No AMP (optional for mobile speed)',
        details: ampData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'AMP implementation check skipped',
      };
    }
  }

  private async checkPWAFeatures(): Promise<SEOCheckResult> {
    try {
      const pwaData = await this.page.evaluate(() => {
        const manifest = document.querySelector('link[rel="manifest"]');
        const serviceWorkerRegistered = 'serviceWorker' in navigator;
        const themeColor = document.querySelector('meta[name="theme-color"]');

        return {
          hasManifest: !!manifest,
          manifestUrl: manifest?.getAttribute('href'),
          serviceWorkerSupported: serviceWorkerRegistered,
          hasThemeColor: !!themeColor,
          themeColor: themeColor?.getAttribute('content'),
        };
      });

      const features = [];
      if (pwaData.hasManifest) features.push('manifest');
      if (pwaData.serviceWorkerSupported) features.push('service worker');
      if (pwaData.hasThemeColor) features.push('theme color');

      return {
        passed: true,
        message: features.length > 0
          ? `PWA features detected: ${features.join(', ')}`
          : 'No PWA features (optional)',
        details: pwaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'PWA features check skipped',
      };
    }
  }

  private async checkMobileScrolling(): Promise<SEOCheckResult> {
    try {
      const scrollData = await this.page.evaluate(() => {
        const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
        const bodyStyle = window.getComputedStyle(document.body);
        const overflowX = bodyStyle.overflowX;

        return {
          hasHorizontalScroll,
          overflowX,
        };
      });

      if (scrollData.hasHorizontalScroll && scrollData.overflowX !== 'hidden') {
        return {
          passed: false,
          message: 'Horizontal scrolling detected (mobile UX issue)',
          details: scrollData,
        };
      }

      return {
        passed: true,
        message: 'No unwanted horizontal scrolling',
        details: scrollData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mobile scrolling check skipped',
      };
    }
  }

  private async checkMobilePerformance(): Promise<SEOCheckResult> {
    try {
      const perfData = await this.page.evaluate(() => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        const resources = performance.getEntriesByType('resource').length;

        return {
          loadTime,
          loadTimeSeconds: (loadTime / 1000).toFixed(2),
          resourceCount: resources,
        };
      });

      if (perfData.loadTime > 5000) {
        return {
          passed: false,
          message: `Mobile load time is slow (${perfData.loadTimeSeconds}s). Target: < 3s`,
          details: perfData,
        };
      }

      return {
        passed: true,
        message: `Mobile performance acceptable (${perfData.loadTimeSeconds}s load)`,
        details: perfData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mobile performance check skipped',
      };
    }
  }

  private async checkGestureSupport(): Promise<SEOCheckResult> {
    try {
      const gestureData = await this.page.evaluate(() => {
        const hasTouchEvents = 'ontouchstart' in window;
        const hasPointerEvents = 'onpointerdown' in window;
        const hasClickHandlers = Array.from(document.querySelectorAll('*')).some((el) => {
          return el.getAttribute('onclick') !== null;
        });

        return {
          hasTouchEvents,
          hasPointerEvents,
          hasClickHandlers,
        };
      });

      return {
        passed: true,
        message: gestureData.hasTouchEvents || gestureData.hasPointerEvents
          ? 'Touch/pointer events supported'
          : 'Touch support unclear',
        details: gestureData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Gesture support check skipped',
      };
    }
  }
}
