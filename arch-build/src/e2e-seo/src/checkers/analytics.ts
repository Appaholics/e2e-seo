import { Page } from 'playwright';
import { SEOCheckResult } from '../types';

export class AnalyticsChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkGoogleAnalytics());
    results.push(await this.checkGoogleTagManager());
    results.push(await this.checkFacebookPixel());
    results.push(await this.checkGoogleAds());
    results.push(await this.checkHotjar());
    results.push(await this.checkMixpanel());
    results.push(await this.checkSegment());
    results.push(await this.checkClarityOrSimilar());
    results.push(await this.checkSearchConsoleVerification());
    results.push(await this.checkBingWebmasterVerification());
    results.push(await this.checkYandexVerification());
    results.push(await this.checkPixelTracking());
    results.push(await this.checkConversionTracking());
    results.push(await this.checkHeatmapTools());
    results.push(await this.checkABTestingTools());

    return results;
  }

  private async checkGoogleAnalytics(): Promise<SEOCheckResult> {
    try {
      const gaData = await this.page.evaluate(() => {
        const hasGA4 = !!(window as any).gtag || !!(window as any).dataLayer;
        const hasUA = !!(window as any).ga;
        const hasGtag = document.querySelector('script[src*="googletagmanager.com/gtag"]');
        const hasAnalytics = document.querySelector('script[src*="google-analytics.com/analytics"]');

        return {
          hasGA4,
          hasUA,
          hasGtag: !!hasGtag,
          hasAnalytics: !!hasAnalytics,
        };
      });

      if (!gaData.hasGA4 && !gaData.hasUA && !gaData.hasGtag && !gaData.hasAnalytics) {
        return {
          passed: false,
          message: 'Google Analytics not detected (recommended for tracking)',
          details: gaData,
        };
      }

      return {
        passed: true,
        message: gaData.hasGA4
          ? 'Google Analytics 4 detected'
          : 'Google Analytics (UA) detected - consider upgrading to GA4',
        details: gaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Google Analytics check skipped',
      };
    }
  }

  private async checkGoogleTagManager(): Promise<SEOCheckResult> {
    try {
      const gtmData = await this.page.evaluate(() => {
        const hasGTM = !!(window as any).google_tag_manager;
        const gtmScript = document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
        const gtmNoscript = document.querySelector('noscript iframe[src*="googletagmanager.com/ns.html"]');

        return {
          hasGTM,
          hasScript: !!gtmScript,
          hasNoscript: !!gtmNoscript,
        };
      });

      if (gtmData.hasGTM && !gtmData.hasNoscript) {
        return {
          passed: false,
          message: 'GTM detected but missing <noscript> fallback',
          details: gtmData,
        };
      }

      return {
        passed: true,
        message: gtmData.hasGTM
          ? 'Google Tag Manager properly implemented'
          : 'No Google Tag Manager (optional)',
        details: gtmData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'GTM check skipped',
      };
    }
  }

  private async checkFacebookPixel(): Promise<SEOCheckResult> {
    try {
      const fbData = await this.page.evaluate(() => {
        const hasFBQ = !!(window as any).fbq;
        const fbScript = document.querySelector('script[src*="connect.facebook.net"]');

        return {
          hasFacebookPixel: hasFBQ,
          hasScript: !!fbScript,
        };
      });

      return {
        passed: true,
        message: fbData.hasFacebookPixel
          ? 'Facebook Pixel detected'
          : 'No Facebook Pixel (optional)',
        details: fbData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Facebook Pixel check skipped',
      };
    }
  }

  private async checkGoogleAds(): Promise<SEOCheckResult> {
    try {
      const adsData = await this.page.evaluate(() => {
        const hasGoogleAds = document.querySelector('script[src*="googleadservices.com"]') ||
                             document.querySelector('script[src*="googlesyndication.com"]');

        return {
          hasGoogleAds: !!hasGoogleAds,
        };
      });

      return {
        passed: true,
        message: adsData.hasGoogleAds
          ? 'Google Ads tracking detected'
          : 'No Google Ads (optional)',
        details: adsData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Google Ads check skipped',
      };
    }
  }

  private async checkHotjar(): Promise<SEOCheckResult> {
    try {
      const hotjarData = await this.page.evaluate(() => {
        const hasHotjar = !!(window as any).hj;
        const hotjarScript = document.querySelector('script[src*="static.hotjar.com"]');

        return {
          hasHotjar,
          hasScript: !!hotjarScript,
        };
      });

      return {
        passed: true,
        message: hotjarData.hasHotjar
          ? 'Hotjar detected'
          : 'No Hotjar (optional heatmap tool)',
        details: hotjarData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Hotjar check skipped',
      };
    }
  }

  private async checkMixpanel(): Promise<SEOCheckResult> {
    try {
      const mixpanelData = await this.page.evaluate(() => {
        const hasMixpanel = !!(window as any).mixpanel;
        const mixpanelScript = document.querySelector('script[src*="cdn.mxpnl.com"]');

        return {
          hasMixpanel,
          hasScript: !!mixpanelScript,
        };
      });

      return {
        passed: true,
        message: mixpanelData.hasMixpanel
          ? 'Mixpanel detected'
          : 'No Mixpanel (optional)',
        details: mixpanelData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Mixpanel check skipped',
      };
    }
  }

  private async checkSegment(): Promise<SEOCheckResult> {
    try {
      const segmentData = await this.page.evaluate(() => {
        const hasSegment = !!(window as any).analytics;
        const segmentScript = document.querySelector('script[src*="cdn.segment.com"]');

        return {
          hasSegment,
          hasScript: !!segmentScript,
        };
      });

      return {
        passed: true,
        message: segmentData.hasSegment
          ? 'Segment detected'
          : 'No Segment (optional)',
        details: segmentData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Segment check skipped',
      };
    }
  }

  private async checkClarityOrSimilar(): Promise<SEOCheckResult> {
    try {
      const clarityData = await this.page.evaluate(() => {
        const hasClarity = !!(window as any).clarity;
        const clarityScript = document.querySelector('script[src*="clarity.ms"]');
        const hasMouseflow = document.querySelector('script[src*="mouseflow.com"]');
        const hasCrazyEgg = document.querySelector('script[src*="crazyegg.com"]');

        return {
          hasClarity: !!clarityScript || hasClarity,
          hasMouseflow: !!hasMouseflow,
          hasCrazyEgg: !!hasCrazyEgg,
        };
      });

      const tools = [];
      if (clarityData.hasClarity) tools.push('Clarity');
      if (clarityData.hasMouseflow) tools.push('Mouseflow');
      if (clarityData.hasCrazyEgg) tools.push('CrazyEgg');

      return {
        passed: true,
        message: tools.length > 0
          ? `Behavior analytics detected: ${tools.join(', ')}`
          : 'No behavior analytics tools',
        details: clarityData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Behavior analytics check skipped',
      };
    }
  }

  private async checkSearchConsoleVerification(): Promise<SEOCheckResult> {
    try {
      const verification = await this.page.evaluate(() => {
        const meta = document.querySelector('meta[name="google-site-verification"]');
        return {
          hasVerification: !!meta,
          content: meta?.getAttribute('content'),
        };
      });

      return {
        passed: true,
        message: verification.hasVerification
          ? 'Google Search Console verification found'
          : 'No Search Console verification (add for better SEO insights)',
        details: verification,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Search Console verification check skipped',
      };
    }
  }

  private async checkBingWebmasterVerification(): Promise<SEOCheckResult> {
    try {
      const verification = await this.page.evaluate(() => {
        const meta = document.querySelector('meta[name="msvalidate.01"]');
        return {
          hasVerification: !!meta,
          content: meta?.getAttribute('content'),
        };
      });

      return {
        passed: true,
        message: verification.hasVerification
          ? 'Bing Webmaster Tools verification found'
          : 'No Bing Webmaster verification (optional)',
        details: verification,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Bing verification check skipped',
      };
    }
  }

  private async checkYandexVerification(): Promise<SEOCheckResult> {
    try {
      const verification = await this.page.evaluate(() => {
        const meta = document.querySelector('meta[name="yandex-verification"]');
        return {
          hasVerification: !!meta,
          content: meta?.getAttribute('content'),
        };
      });

      return {
        passed: true,
        message: verification.hasVerification
          ? 'Yandex Webmaster verification found'
          : 'No Yandex verification (optional)',
        details: verification,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Yandex verification check skipped',
      };
    }
  }

  private async checkPixelTracking(): Promise<SEOCheckResult> {
    try {
      const pixelData = await this.page.evaluate(() => {
        const pixels = {
          linkedin: document.querySelector('script[src*="snap.licdn.com"]'),
          twitter: document.querySelector('script[src*="static.ads-twitter.com"]'),
          pinterest: document.querySelector('script[src*="pintrk"]'),
          tiktok: document.querySelector('script[src*="analytics.tiktok.com"]'),
          reddit: document.querySelector('script[src*="rdt.js"]'),
        };

        const detected = Object.entries(pixels)
          .filter(([_, exists]) => exists)
          .map(([name]) => name);

        return {
          pixels,
          detected,
          count: detected.length,
        };
      });

      return {
        passed: true,
        message: pixelData.count > 0
          ? `${pixelData.count} advertising pixels detected: ${pixelData.detected.join(', ')}`
          : 'No advertising pixels detected',
        details: pixelData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Pixel tracking check skipped',
      };
    }
  }

  private async checkConversionTracking(): Promise<SEOCheckResult> {
    try {
      const conversionData = await this.page.evaluate(() => {
        const hasGoogleConversion = document.querySelector('script[src*="googleadservices.com/pagead/conversion"]');
        const hasFBConversion = !!(window as any).fbq;
        const hasLinkedInConversion = document.querySelector('script[src*="snap.licdn.com"]');

        return {
          hasGoogleConversion: !!hasGoogleConversion,
          hasFBConversion,
          hasLinkedInConversion: !!hasLinkedInConversion,
        };
      });

      const tools = [];
      if (conversionData.hasGoogleConversion) tools.push('Google Ads');
      if (conversionData.hasFBConversion) tools.push('Facebook');
      if (conversionData.hasLinkedInConversion) tools.push('LinkedIn');

      return {
        passed: true,
        message: tools.length > 0
          ? `Conversion tracking: ${tools.join(', ')}`
          : 'No conversion tracking detected',
        details: conversionData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Conversion tracking check skipped',
      };
    }
  }

  private async checkHeatmapTools(): Promise<SEOCheckResult> {
    try {
      const heatmapData = await this.page.evaluate(() => {
        const tools = {
          hotjar: !!(window as any).hj,
          clarity: !!(window as any).clarity,
          mouseflow: !!document.querySelector('script[src*="mouseflow.com"]'),
          crazyegg: !!document.querySelector('script[src*="crazyegg.com"]'),
          luckyorange: !!document.querySelector('script[src*="luckyorange.com"]'),
        };

        const detected = Object.entries(tools)
          .filter(([_, exists]) => exists)
          .map(([name]) => name);

        return {
          tools,
          detected,
          count: detected.length,
        };
      });

      return {
        passed: true,
        message: heatmapData.count > 0
          ? `Heatmap tools detected: ${heatmapData.detected.join(', ')}`
          : 'No heatmap tools (consider for UX insights)',
        details: heatmapData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Heatmap tools check skipped',
      };
    }
  }

  private async checkABTestingTools(): Promise<SEOCheckResult> {
    try {
      const abTestData = await this.page.evaluate(() => {
        const tools = {
          optimizely: !!(window as any).optimizely,
          vwo: !!(window as any)._vwo_code,
          googleOptimize: !!document.querySelector('script[src*="optimize.google.com"]'),
          abtasty: !!(window as any).ABTasty,
        };

        const detected = Object.entries(tools)
          .filter(([_, exists]) => exists)
          .map(([name]) => name);

        return {
          tools,
          detected,
          count: detected.length,
        };
      });

      return {
        passed: true,
        message: abTestData.count > 0
          ? `A/B testing tools detected: ${abTestData.detected.join(', ')}`
          : 'No A/B testing tools (optional)',
        details: abTestData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'A/B testing tools check skipped',
      };
    }
  }
}
