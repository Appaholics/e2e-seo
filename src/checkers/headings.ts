import { Page } from 'playwright';
import { SEOCheckResult, HeadingStructure } from '../types';

export class HeadingsChecker {
  constructor(private page: Page) {}

  async checkAll(): Promise<SEOCheckResult[]> {
    const results: SEOCheckResult[] = [];

    const headings = await this.getHeadings();
    results.push(this.checkH1(headings));
    results.push(this.checkHeadingHierarchy(headings));
    results.push(this.checkHeadingLength(headings));

    return results;
  }

  private async getHeadings(): Promise<HeadingStructure[]> {
    return await this.page.evaluate(() => {
      const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      const headings: HeadingStructure[] = [];

      headingTags.forEach((tag) => {
        const elements = Array.from(document.querySelectorAll(tag));
        elements.forEach((el) => {
          headings.push({
            tag,
            text: el.textContent?.trim() || '',
            level: parseInt(tag.substring(1)),
          });
        });
      });

      return headings.sort((a, b) => {
        const aIndex = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).findIndex(
          (el) => el.textContent?.trim() === a.text
        );
        const bIndex = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).findIndex(
          (el) => el.textContent?.trim() === b.text
        );
        return aIndex - bIndex;
      });
    });
  }

  private checkH1(headings: HeadingStructure[]): SEOCheckResult {
    const h1s = headings.filter((h) => h.level === 1);

    if (h1s.length === 0) {
      return {
        passed: false,
        message: 'No H1 heading found on the page',
      };
    }

    if (h1s.length > 1) {
      return {
        passed: false,
        message: `Multiple H1 headings found (${h1s.length}). Best practice: use only one H1 per page`,
        details: { h1s },
      };
    }

    return {
      passed: true,
      message: 'Single H1 heading found',
      details: { h1: h1s[0] },
    };
  }

  private checkHeadingHierarchy(headings: HeadingStructure[]): SEOCheckResult {
    const issues: string[] = [];

    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];

      if (curr.level > prev.level + 1) {
        issues.push(
          `Skipped heading level: ${prev.tag} followed by ${curr.tag} ("${curr.text.substring(0, 50)}...")`
        );
      }
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: 'Heading hierarchy has issues',
        details: { issues, headings },
      };
    }

    return {
      passed: true,
      message: `Heading hierarchy is properly structured (${headings.length} headings)`,
      details: { headings },
    };
  }

  private checkHeadingLength(headings: HeadingStructure[]): SEOCheckResult {
    const longHeadings = headings.filter((h) => h.text.length > 70);

    if (longHeadings.length > 0) {
      return {
        passed: false,
        message: `${longHeadings.length} heading(s) are too long (>70 characters)`,
        details: { longHeadings },
      };
    }

    return {
      passed: true,
      message: 'All headings are of appropriate length',
    };
  }
}
