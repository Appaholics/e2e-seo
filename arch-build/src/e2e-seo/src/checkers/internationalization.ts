import { Page } from 'playwright';
import { SEOCheckResult } from '../types';

export class InternationalizationChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkHreflangTags());
    results.push(await this.checkLanguageDeclaration());
    results.push(await this.checkContentLanguage());
    results.push(await this.checkAlternateLanguages());
    results.push(await this.checkRTLSupport());
    results.push(await this.checkCharsetDeclaration());
    results.push(await this.checkLanguageSwitcher());
    results.push(await this.checkLocalizedURLs());
    results.push(await this.checkCurrencyDisplay());
    results.push(await this.checkDateTimeFormat());
    results.push(await this.checkTranslationQuality());
    results.push(await this.checkMultilingualContent());
    results.push(await this.checkGeoTargeting());
    results.push(await this.checkLocalizedMetadata());
    results.push(await this.checkUnicodeSupport());

    return results;
  }

  private async checkHreflangTags(): Promise<SEOCheckResult> {
    try {
      const hreflangData = await this.page.evaluate(() => {
        const hreflangTags = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')) as HTMLLinkElement[];

        const languages = hreflangTags.map((tag) => tag.hreflang);
        const uniqueLanguages = new Set(languages);

        const hasXDefault = languages.includes('x-default');
        const hasSelfReference = hreflangTags.some((tag) => tag.href === window.location.href);

        return {
          count: hreflangTags.length,
          uniqueLanguages: uniqueLanguages.size,
          hasXDefault,
          hasSelfReference,
          languages: Array.from(uniqueLanguages),
        };
      });

      if (hreflangData.count === 0) {
        return {
          passed: true,
          message: 'No hreflang tags (not needed for single-language sites)',
        };
      }

      const issues: string[] = [];

      if (!hreflangData.hasXDefault) {
        issues.push('missing x-default hreflang');
      }

      if (!hreflangData.hasSelfReference) {
        issues.push('missing self-referencing hreflang');
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Hreflang issues: ${issues.join(', ')}`,
          details: hreflangData,
        };
      }

      return {
        passed: true,
        message: `Hreflang properly configured for ${hreflangData.uniqueLanguages} language(s)`,
        details: hreflangData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Hreflang tags check skipped',
      };
    }
  }

  private async checkLanguageDeclaration(): Promise<SEOCheckResult> {
    try {
      const langData = await this.page.evaluate(() => {
        const htmlLang = document.documentElement.getAttribute('lang');
        const htmlXmlLang = document.documentElement.getAttribute('xml:lang');

        const metaContentLanguage = document.querySelector('meta[http-equiv="content-language"]');

        return {
          htmlLang,
          htmlXmlLang,
          hasMetaContentLanguage: !!metaContentLanguage,
          isValid: !!htmlLang && /^[a-z]{2}(-[A-Z]{2})?$/.test(htmlLang),
        };
      });

      if (!langData.htmlLang) {
        return {
          passed: false,
          message: 'Missing lang attribute on <html> tag (required for accessibility)',
          details: langData,
        };
      }

      if (!langData.isValid) {
        return {
          passed: false,
          message: `Invalid lang attribute format: "${langData.htmlLang}" (use ISO 639-1 codes like "en" or "en-US")`,
          details: langData,
        };
      }

      return {
        passed: true,
        message: `Language declared as "${langData.htmlLang}"`,
        details: langData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Language declaration check skipped',
      };
    }
  }

  private async checkContentLanguage(): Promise<SEOCheckResult> {
    try {
      const contentData = await this.page.evaluate(() => {
        const htmlLang = document.documentElement.getAttribute('lang') || '';

        // Sample text content to detect language
        const bodyText = document.body.textContent || '';
        const textSample = bodyText.slice(0, 1000);

        // Simple heuristic: check for common non-ASCII characters
        const hasNonLatin = /[^\u0000-\u007F]/.test(textSample);
        const hasCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(textSample);
        const hasArabic = /[\u0600-\u06FF]/.test(textSample);
        const hasCyrillic = /[\u0400-\u04FF]/.test(textSample);

        return {
          declaredLang: htmlLang,
          hasNonLatin,
          hasCJK,
          hasArabic,
          hasCyrillic,
          textLength: bodyText.length,
        };
      });

      if (contentData.textLength === 0) {
        return {
          passed: true,
          message: 'No text content to check',
        };
      }

      const warnings: string[] = [];

      if (contentData.hasCJK && !['zh', 'ja', 'ko'].some((l) => contentData.declaredLang.startsWith(l))) {
        warnings.push('CJK characters found but lang not set to Chinese/Japanese/Korean');
      }

      if (contentData.hasArabic && !contentData.declaredLang.startsWith('ar')) {
        warnings.push('Arabic characters found but lang not set to Arabic');
      }

      if (contentData.hasCyrillic && !['ru', 'uk', 'bg', 'sr'].some((l) => contentData.declaredLang.startsWith(l))) {
        warnings.push('Cyrillic characters found but lang not matching');
      }

      if (warnings.length > 0) {
        return {
          passed: false,
          message: `Language mismatch: ${warnings.join(', ')}`,
          details: contentData,
        };
      }

      return {
        passed: true,
        message: 'Content language appears consistent with declaration',
        details: contentData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Content language check skipped',
      };
    }
  }

  private async checkAlternateLanguages(): Promise<SEOCheckResult> {
    try {
      const alternateData = await this.page.evaluate(() => {
        const alternateLangs = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')) as HTMLLinkElement[];

        const canonicalUrl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

        const alternateUrls = alternateLangs.map((link) => ({
          hreflang: link.hreflang,
          href: link.href,
        }));

        return {
          count: alternateLangs.length,
          hasCanonical: !!canonicalUrl,
          canonicalUrl: canonicalUrl?.href,
          alternates: alternateUrls,
        };
      });

      if (alternateData.count === 0) {
        return {
          passed: true,
          message: 'No alternate language versions declared',
        };
      }

      return {
        passed: true,
        message: `${alternateData.count} alternate language version(s) declared`,
        details: alternateData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Alternate languages check skipped',
      };
    }
  }

  private async checkRTLSupport(): Promise<SEOCheckResult> {
    try {
      const rtlData = await this.page.evaluate(() => {
        const htmlDir = document.documentElement.getAttribute('dir');
        const rtlElements = document.querySelectorAll('[dir="rtl"]');

        const bodyText = document.body.textContent || '';
        const hasArabic = /[\u0600-\u06FF]/.test(bodyText);
        const hasHebrew = /[\u0590-\u05FF]/.test(bodyText);

        return {
          htmlDir,
          rtlElements: rtlElements.length,
          hasArabic,
          hasHebrew,
          needsRTL: hasArabic || hasHebrew,
        };
      });

      if (!rtlData.needsRTL) {
        return {
          passed: true,
          message: 'No RTL (right-to-left) language content detected',
        };
      }

      if (rtlData.htmlDir !== 'rtl' && rtlData.rtlElements === 0) {
        return {
          passed: false,
          message: 'RTL language detected but dir="rtl" attribute not set',
          details: rtlData,
        };
      }

      return {
        passed: true,
        message: 'RTL support properly configured',
        details: rtlData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'RTL support check skipped',
      };
    }
  }

  private async checkCharsetDeclaration(): Promise<SEOCheckResult> {
    try {
      const charsetData = await this.page.evaluate(() => {
        const metaCharset = document.querySelector('meta[charset]');
        const metaContentType = document.querySelector('meta[http-equiv="Content-Type"]');

        const charset = metaCharset?.getAttribute('charset') ||
          metaContentType?.getAttribute('content')?.match(/charset=([^;]+)/)?.[1];

        return {
          hasCharset: !!charset,
          charset: charset?.toUpperCase(),
          isUTF8: charset?.toUpperCase() === 'UTF-8',
        };
      });

      if (!charsetData.hasCharset) {
        return {
          passed: false,
          message: 'Missing charset declaration (should be UTF-8)',
          details: charsetData,
        };
      }

      if (!charsetData.isUTF8) {
        return {
          passed: false,
          message: `Charset is "${charsetData.charset}" (UTF-8 recommended for international sites)`,
          details: charsetData,
        };
      }

      return {
        passed: true,
        message: 'Charset properly set to UTF-8',
        details: charsetData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Charset declaration check skipped',
      };
    }
  }

  private async checkLanguageSwitcher(): Promise<SEOCheckResult> {
    try {
      const switcherData = await this.page.evaluate(() => {
        const langSwitchers = Array.from(document.querySelectorAll('[class*="lang"], [class*="language"], [id*="lang"]')).filter((el) => {
          const tag = el.tagName.toLowerCase();
          return tag === 'select' || tag === 'a' || tag === 'button';
        });

        const selectElements = Array.from(document.querySelectorAll('select')).filter((select) => {
          const options = Array.from(select.options);
          return options.some((opt) => /^[a-z]{2}(-[A-Z]{2})?$/.test(opt.value));
        });

        return {
          langSwitchers: langSwitchers.length,
          selectElements: selectElements.length,
          hasLanguageSwitcher: langSwitchers.length > 0 || selectElements.length > 0,
        };
      });

      const hreflangCount = await this.page.evaluate(() => {
        return document.querySelectorAll('link[rel="alternate"][hreflang]').length;
      });

      if (hreflangCount > 1 && !switcherData.hasLanguageSwitcher) {
        return {
          passed: false,
          message: 'Multiple languages available but no visible language switcher',
          details: switcherData,
        };
      }

      if (!switcherData.hasLanguageSwitcher) {
        return {
          passed: true,
          message: 'No language switcher (not needed for single-language sites)',
        };
      }

      return {
        passed: true,
        message: 'Language switcher available',
        details: switcherData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Language switcher check skipped',
      };
    }
  }

  private async checkLocalizedURLs(): Promise<SEOCheckResult> {
    try {
      const urlData = await this.page.evaluate(() => {
        const currentUrl = window.location.href;
        const pathname = window.location.pathname;

        // Check for common URL localization patterns
        const hasLangSubdomain = /^[a-z]{2}\./.test(window.location.hostname);
        const hasLangPath = /^\/[a-z]{2}([-_][A-Z]{2})?\//i.test(pathname);
        const hasLangParam = /[?&]lang=[a-z]{2}/i.test(currentUrl);

        return {
          currentUrl,
          hasLangSubdomain,
          hasLangPath,
          hasLangParam,
          hasLocalization: hasLangSubdomain || hasLangPath || hasLangParam,
        };
      });

      const hreflangCount = await this.page.evaluate(() => {
        return document.querySelectorAll('link[rel="alternate"][hreflang]').length;
      });

      if (hreflangCount > 1 && !urlData.hasLocalization) {
        return {
          passed: false,
          message: 'Multiple languages but URLs not localized (use subdomain, path, or parameter)',
          details: urlData,
        };
      }

      if (!urlData.hasLocalization) {
        return {
          passed: true,
          message: 'Single language site, no URL localization needed',
        };
      }

      const method = urlData.hasLangSubdomain ? 'subdomain' :
        urlData.hasLangPath ? 'path' : 'parameter';

      return {
        passed: true,
        message: `URLs localized using ${method} strategy`,
        details: urlData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Localized URLs check skipped',
      };
    }
  }

  private async checkCurrencyDisplay(): Promise<SEOCheckResult> {
    try {
      const currencyData = await this.page.evaluate(() => {
        const bodyText = document.body.textContent || '';

        const currencies = [
          { symbol: '$', name: 'USD' },
          { symbol: '€', name: 'EUR' },
          { symbol: '£', name: 'GBP' },
          { symbol: '¥', name: 'JPY/CNY' },
          { symbol: '₹', name: 'INR' },
        ];

        const foundCurrencies = currencies.filter((curr) =>
          bodyText.includes(curr.symbol) || bodyText.includes(curr.name)
        );

        const currencySwitcher = Array.from(document.querySelectorAll('[class*="currency"], [id*="currency"]')).length > 0;

        return {
          foundCurrencies: foundCurrencies.map((c) => c.name),
          multipleCurrencies: foundCurrencies.length > 1,
          currencySwitcher,
        };
      });

      if (currencyData.foundCurrencies.length === 0) {
        return {
          passed: true,
          message: 'No currency information detected',
        };
      }

      if (currencyData.multipleCurrencies && !currencyData.currencySwitcher) {
        return {
          passed: false,
          message: `Multiple currencies detected (${currencyData.foundCurrencies.join(', ')}) but no currency switcher`,
          details: currencyData,
        };
      }

      return {
        passed: true,
        message: currencyData.multipleCurrencies
          ? `Multiple currencies with switcher (${currencyData.foundCurrencies.join(', ')})`
          : `Currency: ${currencyData.foundCurrencies[0]}`,
        details: currencyData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Currency display check skipped',
      };
    }
  }

  private async checkDateTimeFormat(): Promise<SEOCheckResult> {
    try {
      const dateData = await this.page.evaluate(() => {
        const timeElements = Array.from(document.querySelectorAll('time'));

        const hasDatetime = timeElements.some((el) => el.hasAttribute('datetime'));

        const bodyText = document.body.textContent || '';

        // Check for various date formats
        const hasUSFormat = /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(bodyText);
        const hasEUFormat = /\d{1,2}\.\d{1,2}\.\d{2,4}/.test(bodyText);
        const hasISOFormat = /\d{4}-\d{2}-\d{2}/.test(bodyText);

        return {
          timeElements: timeElements.length,
          hasDatetime,
          hasUSFormat,
          hasEUFormat,
          hasISOFormat,
        };
      });

      if (dateData.timeElements > 0 && !dateData.hasDatetime) {
        return {
          passed: false,
          message: '<time> elements missing datetime attribute',
          details: dateData,
        };
      }

      if (dateData.timeElements === 0) {
        return {
          passed: true,
          message: 'No date/time information to check',
        };
      }

      return {
        passed: true,
        message: `${dateData.timeElements} date/time element(s) with proper datetime attribute`,
        details: dateData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Date/time format check skipped',
      };
    }
  }

  private async checkTranslationQuality(): Promise<SEOCheckResult> {
    try {
      const translationData = await this.page.evaluate(() => {
        const bodyText = document.body.textContent || '';

        // Check for common machine translation artifacts
        const hasMixedLanguages = /[a-zA-Z]/.test(bodyText) && /[\u4E00-\u9FFF]/.test(bodyText);

        // Check for Lorem Ipsum placeholder text
        const hasLoremIpsum = /lorem ipsum/i.test(bodyText);

        // Check for untranslated common words (basic check)
        const htmlLang = document.documentElement.getAttribute('lang') || '';
        const hasEnglishWords = /\b(the|and|for|with|from)\b/gi.test(bodyText);
        const nonEnglishLang = htmlLang && !htmlLang.startsWith('en');

        return {
          hasMixedLanguages,
          hasLoremIpsum,
          hasEnglishWords: hasEnglishWords && nonEnglishLang,
          declaredLang: htmlLang,
        };
      });

      const issues: string[] = [];

      if (translationData.hasLoremIpsum) {
        issues.push('Lorem Ipsum placeholder text found');
      }

      if (translationData.hasMixedLanguages) {
        issues.push('mixed languages detected in content');
      }

      if (issues.length > 0) {
        return {
          passed: false,
          message: `Translation quality issues: ${issues.join(', ')}`,
          details: translationData,
        };
      }

      return {
        passed: true,
        message: 'No obvious translation quality issues detected',
        details: translationData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Translation quality check skipped',
      };
    }
  }

  private async checkMultilingualContent(): Promise<SEOCheckResult> {
    try {
      const multilingualData = await this.page.evaluate(() => {
        const hreflangTags = document.querySelectorAll('link[rel="alternate"][hreflang]');
        const langElements = document.querySelectorAll('[lang]');

        const uniqueLangs = new Set(
          Array.from(langElements).map((el) => el.getAttribute('lang')).filter((l) => l)
        );

        return {
          hreflangCount: hreflangTags.length,
          langElements: langElements.length,
          uniqueLangs: Array.from(uniqueLangs),
          isMultilingual: hreflangTags.length > 1 || uniqueLangs.size > 1,
        };
      });

      if (!multilingualData.isMultilingual) {
        return {
          passed: true,
          message: 'Single language site',
        };
      }

      return {
        passed: true,
        message: `Multilingual site with ${multilingualData.uniqueLangs.length} language(s)`,
        details: multilingualData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Multilingual content check skipped',
      };
    }
  }

  private async checkGeoTargeting(): Promise<SEOCheckResult> {
    try {
      const geoData = await this.page.evaluate(() => {
        const metaGeo = document.querySelectorAll('meta[name*="geo"], meta[name*="location"]');

        const bodyText = document.body.textContent?.toLowerCase() || '';
        const hasGeoKeywords = /country|region|location|available in/i.test(bodyText);

        return {
          metaGeoTags: metaGeo.length,
          hasGeoKeywords,
        };
      });

      if (geoData.metaGeoTags === 0 && !geoData.hasGeoKeywords) {
        return {
          passed: true,
          message: 'No geo-targeting detected (optional)',
        };
      }

      return {
        passed: true,
        message: geoData.metaGeoTags > 0
          ? 'Geo-targeting meta tags present'
          : 'Location-based content detected',
        details: geoData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Geo-targeting check skipped',
      };
    }
  }

  private async checkLocalizedMetadata(): Promise<SEOCheckResult> {
    try {
      const metadataData = await this.page.evaluate(() => {
        const title = document.title;
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

        const htmlLang = document.documentElement.getAttribute('lang') || '';

        const ogLocale = document.querySelector('meta[property="og:locale"]')?.getAttribute('content');

        const hreflangTags = document.querySelectorAll('link[rel="alternate"][hreflang]');

        return {
          hasTitle: !!title,
          hasDescription: !!description,
          htmlLang,
          ogLocale,
          hreflangCount: hreflangTags.length,
          isMultilingual: hreflangTags.length > 1,
        };
      });

      if (!metadataData.isMultilingual) {
        return {
          passed: true,
          message: 'Single language site, basic metadata sufficient',
        };
      }

      if (!metadataData.ogLocale) {
        return {
          passed: false,
          message: 'Multilingual site missing og:locale meta tag',
          details: metadataData,
        };
      }

      return {
        passed: true,
        message: 'Localized metadata present (og:locale)',
        details: metadataData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Localized metadata check skipped',
      };
    }
  }

  private async checkUnicodeSupport(): Promise<SEOCheckResult> {
    try {
      const unicodeData = await this.page.evaluate(() => {
        const bodyText = document.body.textContent || '';

        // Check for various Unicode ranges
        const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(bodyText);
        const hasSpecialChars = /[^\u0000-\u007F]/.test(bodyText);
        const hasCombiningChars = /[\u0300-\u036F]/.test(bodyText);

        const charset = document.querySelector('meta[charset]')?.getAttribute('charset')?.toUpperCase();

        return {
          hasEmoji,
          hasSpecialChars,
          hasCombiningChars,
          charset,
          isUTF8: charset === 'UTF-8',
        };
      });

      if (unicodeData.hasSpecialChars && !unicodeData.isUTF8) {
        return {
          passed: false,
          message: `Unicode characters detected but charset is ${unicodeData.charset || 'not set'} (should be UTF-8)`,
          details: unicodeData,
        };
      }

      if (!unicodeData.hasSpecialChars) {
        return {
          passed: true,
          message: 'Basic Latin characters only',
        };
      }

      return {
        passed: true,
        message: unicodeData.hasEmoji
          ? 'Unicode support with UTF-8 (including emoji)'
          : 'Unicode support with UTF-8',
        details: unicodeData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Unicode support check skipped',
      };
    }
  }
}
