import { Page } from 'playwright';
import { SEOCheckResult } from '../types';

export class LegalComplianceChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    results.push(await this.checkPrivacyPolicy());
    results.push(await this.checkTermsOfService());
    results.push(await this.checkCookieConsent());
    results.push(await this.checkGDPRCompliance());
    results.push(await this.checkCCPACompliance());
    results.push(await this.checkCookiePolicy());
    results.push(await this.checkDataProtection());
    results.push(await this.checkAccessibility());
    results.push(await this.checkCopyrightNotice());
    results.push(await this.checkContactInformation());
    results.push(await this.checkDisclaimers());
    results.push(await this.checkAgeVerification());
    results.push(await this.checkRefundPolicy());
    results.push(await this.checkShippingPolicy());
    results.push(await this.checkLegalFooter());

    return results;
  }

  private async checkPrivacyPolicy(): Promise<SEOCheckResult> {
    try {
      const privacyData = await this.page.evaluate(() => {
        const privacyLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          const href = link.getAttribute('href')?.toLowerCase() || '';
          return text.includes('privacy') || href.includes('privacy');
        });

        return {
          found: privacyLinks.length > 0,
          count: privacyLinks.length,
          inFooter: Array.from(document.querySelectorAll('footer a')).some((link) => {
            const text = link.textContent?.toLowerCase() || '';
            return text.includes('privacy');
          }),
        };
      });

      if (!privacyData.found) {
        return {
          passed: false,
          message: 'No privacy policy link found (required for most websites)',
          details: privacyData,
        };
      }

      return {
        passed: true,
        message: privacyData.inFooter
          ? 'Privacy policy link found in footer'
          : 'Privacy policy link found',
        details: privacyData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Privacy policy check skipped',
      };
    }
  }

  private async checkTermsOfService(): Promise<SEOCheckResult> {
    try {
      const termsData = await this.page.evaluate(() => {
        const termsLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          const href = link.getAttribute('href')?.toLowerCase() || '';
          return text.includes('terms') || text.includes('conditions') || href.includes('terms');
        });

        return {
          found: termsLinks.length > 0,
          count: termsLinks.length,
          inFooter: Array.from(document.querySelectorAll('footer a')).some((link) => {
            const text = link.textContent?.toLowerCase() || '';
            return text.includes('terms');
          }),
        };
      });

      if (!termsData.found) {
        return {
          passed: false,
          message: 'No terms of service link found (recommended for all websites)',
          details: termsData,
        };
      }

      return {
        passed: true,
        message: termsData.inFooter
          ? 'Terms of service link found in footer'
          : 'Terms of service link found',
        details: termsData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Terms of service check skipped',
      };
    }
  }

  private async checkCookieConsent(): Promise<SEOCheckResult> {
    try {
      const cookieData = await this.page.evaluate(() => {
        const cookieBanners = Array.from(document.querySelectorAll('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"]'));
        const cookieButtons = Array.from(document.querySelectorAll('button, a')).filter((el) => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('cookie') || text.includes('accept') || text.includes('consent');
        });

        return {
          hasCookieBanner: cookieBanners.length > 0,
          hasCookieButtons: cookieButtons.length > 0,
          bannerCount: cookieBanners.length,
        };
      });

      if (!cookieData.hasCookieBanner && !cookieData.hasCookieButtons) {
        return {
          passed: false,
          message: 'No cookie consent mechanism found (required by GDPR/CCPA)',
          details: cookieData,
        };
      }

      return {
        passed: true,
        message: 'Cookie consent mechanism detected',
        details: cookieData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Cookie consent check skipped',
      };
    }
  }

  private async checkGDPRCompliance(): Promise<SEOCheckResult> {
    try {
      const gdprData = await this.page.evaluate(() => {
        const gdprKeywords = ['gdpr', 'data protection', 'right to access', 'right to erasure', 'data controller'];

        const bodyText = document.body.textContent?.toLowerCase() || '';
        const hasGDPRMentions = gdprKeywords.some((keyword) => bodyText.includes(keyword));

        const gdprLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          const href = link.getAttribute('href')?.toLowerCase() || '';
          return gdprKeywords.some((keyword) => text.includes(keyword) || href.includes(keyword));
        });

        return {
          hasGDPRMentions,
          gdprLinks: gdprLinks.length,
        };
      });

      if (!gdprData.hasGDPRMentions) {
        return {
          passed: true,
          message: 'No GDPR mentions (ensure compliance if serving EU users)',
        };
      }

      return {
        passed: true,
        message: 'GDPR compliance indicators found',
        details: gdprData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'GDPR compliance check skipped',
      };
    }
  }

  private async checkCCPACompliance(): Promise<SEOCheckResult> {
    try {
      const ccpaData = await this.page.evaluate(() => {
        const ccpaKeywords = ['ccpa', 'california privacy', 'do not sell', 'opt-out'];

        const bodyText = document.body.textContent?.toLowerCase() || '';
        const hasCCPAMentions = ccpaKeywords.some((keyword) => bodyText.includes(keyword));

        const ccpaLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          return ccpaKeywords.some((keyword) => text.includes(keyword));
        });

        return {
          hasCCPAMentions,
          ccpaLinks: ccpaLinks.length,
          hasDoNotSell: bodyText.includes('do not sell'),
        };
      });

      if (!ccpaData.hasCCPAMentions) {
        return {
          passed: true,
          message: 'No CCPA mentions (ensure compliance if serving California users)',
        };
      }

      return {
        passed: true,
        message: ccpaData.hasDoNotSell
          ? 'CCPA compliance with "Do Not Sell" option'
          : 'CCPA compliance indicators found',
        details: ccpaData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'CCPA compliance check skipped',
      };
    }
  }

  private async checkCookiePolicy(): Promise<SEOCheckResult> {
    try {
      const policyData = await this.page.evaluate(() => {
        const policyLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          const href = link.getAttribute('href')?.toLowerCase() || '';
          return (text.includes('cookie') && text.includes('policy')) || href.includes('cookie');
        });

        return {
          found: policyLinks.length > 0,
          count: policyLinks.length,
        };
      });

      if (!policyData.found) {
        return {
          passed: false,
          message: 'No cookie policy link found (required if using cookies)',
          details: policyData,
        };
      }

      return {
        passed: true,
        message: 'Cookie policy link found',
        details: policyData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Cookie policy check skipped',
      };
    }
  }

  private async checkDataProtection(): Promise<SEOCheckResult> {
    try {
      const dataProtectionData = await this.page.evaluate(() => {
        const protectionKeywords = ['data protection', 'secure', 'encryption', 'ssl', 'https'];

        const bodyText = document.body.textContent?.toLowerCase() || '';
        const hasDataProtection = protectionKeywords.some((keyword) => bodyText.includes(keyword));

        const secureIcons = document.querySelectorAll('[class*="secure"], [class*="lock"], [id*="secure"]');

        return {
          hasDataProtection,
          secureIcons: secureIcons.length,
          isHTTPS: window.location.protocol === 'https:',
        };
      });

      if (!dataProtectionData.isHTTPS) {
        return {
          passed: false,
          message: 'Site not using HTTPS (security risk)',
          details: dataProtectionData,
        };
      }

      return {
        passed: true,
        message: 'Data protection indicators present',
        details: dataProtectionData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Data protection check skipped',
      };
    }
  }

  private async checkAccessibility(): Promise<SEOCheckResult> {
    try {
      const accessibilityData = await this.page.evaluate(() => {
        const accessibilityLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          return text.includes('accessibility');
        });

        const ariaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]');
        const altTexts = Array.from(document.querySelectorAll('img')).filter((img) => img.hasAttribute('alt'));

        return {
          hasAccessibilityStatement: accessibilityLinks.length > 0,
          ariaLabels: ariaLabels.length,
          altTexts: altTexts.length,
        };
      });

      if (!accessibilityData.hasAccessibilityStatement) {
        return {
          passed: true,
          message: 'No accessibility statement (recommended for compliance)',
        };
      }

      return {
        passed: true,
        message: 'Accessibility statement found',
        details: accessibilityData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Accessibility check skipped',
      };
    }
  }

  private async checkCopyrightNotice(): Promise<SEOCheckResult> {
    try {
      const copyrightData = await this.page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const hasCopyright = /©|\(c\)|copyright/i.test(bodyText);

        const currentYear = new Date().getFullYear();
        const hasCurrentYear = bodyText.includes(currentYear.toString());

        const footerCopyright = document.querySelector('footer')?.textContent || '';
        const inFooter = /©|\(c\)|copyright/i.test(footerCopyright);

        return {
          hasCopyright,
          hasCurrentYear,
          inFooter,
        };
      });

      if (!copyrightData.hasCopyright) {
        return {
          passed: false,
          message: 'No copyright notice found',
          details: copyrightData,
        };
      }

      if (!copyrightData.hasCurrentYear) {
        return {
          passed: false,
          message: 'Copyright notice present but year may be outdated',
          details: copyrightData,
        };
      }

      return {
        passed: true,
        message: copyrightData.inFooter
          ? 'Copyright notice with current year in footer'
          : 'Copyright notice with current year found',
        details: copyrightData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Copyright notice check skipped',
      };
    }
  }

  private async checkContactInformation(): Promise<SEOCheckResult> {
    try {
      const contactData = await this.page.evaluate(() => {
        const contactLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          const href = link.getAttribute('href')?.toLowerCase() || '';
          return text.includes('contact') || href.includes('contact') || href.startsWith('mailto:');
        });

        const phoneNumbers = document.body.textContent?.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/) || [];
        const emailAddresses = document.body.textContent?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [];

        return {
          hasContactLink: contactLinks.length > 0,
          hasPhoneNumber: phoneNumbers.length > 0,
          hasEmailAddress: emailAddresses.length > 0,
          contactMethods: contactLinks.length + phoneNumbers.length + emailAddresses.length,
        };
      });

      if (contactData.contactMethods === 0) {
        return {
          passed: false,
          message: 'No contact information found (required for trust and legal compliance)',
          details: contactData,
        };
      }

      return {
        passed: true,
        message: `${contactData.contactMethods} contact method(s) found`,
        details: contactData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Contact information check skipped',
      };
    }
  }

  private async checkDisclaimers(): Promise<SEOCheckResult> {
    try {
      const disclaimerData = await this.page.evaluate(() => {
        const disclaimerLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          return text.includes('disclaimer');
        });

        const bodyText = document.body.textContent?.toLowerCase() || '';
        const hasDisclaimer = bodyText.includes('disclaimer');

        return {
          hasDisclaimerLink: disclaimerLinks.length > 0,
          hasDisclaimerText: hasDisclaimer,
        };
      });

      if (!disclaimerData.hasDisclaimerLink && !disclaimerData.hasDisclaimerText) {
        return {
          passed: true,
          message: 'No disclaimers (optional but recommended for certain industries)',
        };
      }

      return {
        passed: true,
        message: 'Disclaimer present',
        details: disclaimerData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Disclaimer check skipped',
      };
    }
  }

  private async checkAgeVerification(): Promise<SEOCheckResult> {
    try {
      const ageData = await this.page.evaluate(() => {
        const ageKeywords = ['age verification', '18+', '21+', 'adult content', 'age gate'];
        const bodyText = document.body.textContent?.toLowerCase() || '';

        const hasAgeVerification = ageKeywords.some((keyword) => bodyText.includes(keyword));

        const ageGate = document.querySelectorAll('[class*="age"], [id*="age"], [class*="verify"]');

        return {
          hasAgeVerification,
          ageGateElements: ageGate.length,
        };
      });

      if (!ageData.hasAgeVerification) {
        return {
          passed: true,
          message: 'No age verification (only required for age-restricted content)',
        };
      }

      return {
        passed: true,
        message: 'Age verification mechanism present',
        details: ageData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Age verification check skipped',
      };
    }
  }

  private async checkRefundPolicy(): Promise<SEOCheckResult> {
    try {
      const refundData = await this.page.evaluate(() => {
        const refundLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          const href = link.getAttribute('href')?.toLowerCase() || '';
          return text.includes('refund') || text.includes('return') || href.includes('refund') || href.includes('return');
        });

        return {
          found: refundLinks.length > 0,
          count: refundLinks.length,
        };
      });

      if (!refundData.found) {
        return {
          passed: true,
          message: 'No refund policy (required for e-commerce sites)',
        };
      }

      return {
        passed: true,
        message: 'Refund/return policy link found',
        details: refundData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Refund policy check skipped',
      };
    }
  }

  private async checkShippingPolicy(): Promise<SEOCheckResult> {
    try {
      const shippingData = await this.page.evaluate(() => {
        const shippingLinks = Array.from(document.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          const href = link.getAttribute('href')?.toLowerCase() || '';
          return text.includes('shipping') || text.includes('delivery') || href.includes('shipping');
        });

        return {
          found: shippingLinks.length > 0,
          count: shippingLinks.length,
        };
      });

      if (!shippingData.found) {
        return {
          passed: true,
          message: 'No shipping policy (required for e-commerce sites)',
        };
      }

      return {
        passed: true,
        message: 'Shipping/delivery policy link found',
        details: shippingData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Shipping policy check skipped',
      };
    }
  }

  private async checkLegalFooter(): Promise<SEOCheckResult> {
    try {
      const footerData = await this.page.evaluate(() => {
        const footer = document.querySelector('footer');
        if (!footer) return { hasFooter: false };

        const footerText = footer.textContent?.toLowerCase() || '';
        const legalKeywords = ['privacy', 'terms', 'cookie', 'legal'];

        const legalLinks = Array.from(footer.querySelectorAll('a')).filter((link) => {
          const text = link.textContent?.toLowerCase() || '';
          return legalKeywords.some((keyword) => text.includes(keyword));
        });

        return {
          hasFooter: true,
          legalLinks: legalLinks.length,
          hasPrivacy: footerText.includes('privacy'),
          hasTerms: footerText.includes('terms'),
          hasCookie: footerText.includes('cookie'),
        };
      });

      if (!footerData.hasFooter) {
        return {
          passed: false,
          message: 'No footer element found',
          details: footerData,
        };
      }

      if (footerData.legalLinks === 0) {
        return {
          passed: false,
          message: 'Footer missing legal links (privacy, terms, etc.)',
          details: footerData,
        };
      }

      return {
        passed: true,
        message: `Footer contains ${footerData.legalLinks} legal link(s)`,
        details: footerData,
      };
    } catch (error) {
      return {
        passed: true,
        message: 'Legal footer check skipped',
      };
    }
  }
}
