import { describe, it, expect } from 'vitest';
import { ContentChecker } from '../../src/checkers/content';
import { createMockPage } from '../mocks/mockPage';
import { Page } from 'playwright';

describe('ContentChecker', () => {
  describe('checkWordCount', () => {
    it('should pass with good content length (>300 words)', async () => {
      const longContent = 'word '.repeat(500);
      const mockPage = createMockPage({
        evaluateResults: {
          innerText: longContent,
        },
      }) as Page;

      const checker = new ContentChecker(mockPage);
      const results = await checker.checkAll();
      const wordCountResult = results[0];

      expect(wordCountResult.passed).toBe(true);
      expect(wordCountResult.message).toContain('content length');
    });

    it('should fail with too short content (<300 words)', async () => {
      const shortContent = 'word '.repeat(50);
      const mockPage = createMockPage({
        evaluateResults: {
          innerText: shortContent,
        },
      }) as Page;

      const checker = new ContentChecker(mockPage);
      const results = await checker.checkAll();
      const wordCountResult = results[0];

      expect(wordCountResult.passed).toBe(false);
      expect(wordCountResult.message).toContain('too short');
    });

    it('should report excellent content length (>1000 words)', async () => {
      const excellentContent = 'word '.repeat(1500);
      const mockPage = createMockPage({
        evaluateResults: {
          innerText: excellentContent,
        },
      }) as Page;

      const checker = new ContentChecker(mockPage);
      const results = await checker.checkAll();
      const wordCountResult = results[0];

      expect(wordCountResult.passed).toBe(true);
      expect(wordCountResult.message).toContain('Excellent');
    });
  });

  describe('checkAll', () => {
    it('should return all content check results', async () => {
      const mockPage = createMockPage({
        evaluateResults: {
          innerText: 'word '.repeat(500),
        },
      }) as Page;

      const checker = new ContentChecker(mockPage);
      const results = await checker.checkAll();

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => 'passed' in r && 'message' in r)).toBe(true);
    });
  });
});
