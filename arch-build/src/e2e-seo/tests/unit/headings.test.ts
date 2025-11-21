import { describe, it, expect } from 'vitest';
import { HeadingsChecker } from '../../src/checkers/headings';
import { createMockPage } from '../mocks/mockPage';
import { Page } from 'playwright';
import { HeadingStructure } from '../../src/types';

describe('HeadingsChecker', () => {
  describe('checkH1', () => {
    it('should pass when exactly one H1 is present', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h1', text: 'Main Title', level: 1 },
        { tag: 'h2', text: 'Subtitle', level: 2 },
      ];

      const mockPage = createMockPage({
        evaluateResults: {
          querySelectorAll: headings,
        },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      const results = await checker.checkAll();
      const h1Result = results[0];

      expect(h1Result.passed).toBe(true);
      expect(h1Result.message).toContain('Single H1');
    });

    it('should fail when no H1 is present', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h2', text: 'Subtitle', level: 2 },
        { tag: 'h3', text: 'Section', level: 3 },
      ];

      const mockPage = createMockPage({
        evaluateResults: {
          querySelectorAll: headings,
        },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      const results = await checker.checkAll();
      const h1Result = results[0];

      expect(h1Result.passed).toBe(false);
      expect(h1Result.message).toContain('No H1');
    });

    it('should fail when multiple H1s are present', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h1', text: 'First Title', level: 1 },
        { tag: 'h1', text: 'Second Title', level: 1 },
        { tag: 'h2', text: 'Subtitle', level: 2 },
      ];

      const mockPage = createMockPage({
        evaluateResults: {
          querySelectorAll: headings,
        },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      const results = await checker.checkAll();
      const h1Result = results[0];

      expect(h1Result.passed).toBe(false);
      expect(h1Result.message).toContain('Multiple H1');
    });
  });

  describe('checkHeadingHierarchy', () => {
    it('should pass when heading hierarchy is correct', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h1', text: 'Main Title', level: 1 },
        { tag: 'h2', text: 'Section 1', level: 2 },
        { tag: 'h3', text: 'Subsection 1.1', level: 3 },
        { tag: 'h2', text: 'Section 2', level: 2 },
      ];

      const mockPage = createMockPage({
        evaluateResults: {
          querySelectorAll: headings,
        },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      const results = await checker.checkAll();
      const hierarchyResult = results[1];

      expect(hierarchyResult.passed).toBe(true);
      expect(hierarchyResult.message).toContain('properly structured');
    });

    it('should fail when heading levels are skipped', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h1', text: 'Main Title', level: 1 },
        { tag: 'h3', text: 'Subsection', level: 3 }, // Skipped h2
      ];

      const mockPage = createMockPage({
        evaluateResults: {
          querySelectorAll: headings,
        },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      const results = await checker.checkAll();
      const hierarchyResult = results[1];

      expect(hierarchyResult.passed).toBe(false);
      expect(hierarchyResult.message).toContain('issues');
    });
  });

  describe('checkHeadingLength', () => {
    it('should pass when all headings are appropriate length', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h1', text: 'Short Title', level: 1 },
        { tag: 'h2', text: 'Another Good Length Heading', level: 2 },
      ];

      const mockPage = createMockPage({
        evaluateResults: {
          querySelectorAll: headings,
        },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      const results = await checker.checkAll();
      const lengthResult = results[2];

      expect(lengthResult.passed).toBe(true);
      expect(lengthResult.message).toContain('appropriate length');
    });

    it('should fail when headings are too long', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h1', text: 'This is a very long heading that exceeds the recommended seventy character limit for optimal SEO', level: 1 },
      ];

      const mockPage = createMockPage({
        evaluateResults: {
          querySelectorAll: headings,
        },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      const results = await checker.checkAll();
      const lengthResult = results[2];

      expect(lengthResult.passed).toBe(false);
      expect(lengthResult.message).toContain('too long');
    });
  });

  describe('checkAll', () => {
    it('should return all heading check results', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h1', text: 'Main Title', level: 1 },
        { tag: 'h2', text: 'Section', level: 2 },
      ];

      const mockPage = createMockPage({
        evaluateResults: {
          querySelectorAll: headings,
        },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      const results = await checker.checkAll();

      expect(results).toHaveLength(3);
      expect(results.every((r) => 'passed' in r && 'message' in r)).toBe(true);
    });
  });
});
