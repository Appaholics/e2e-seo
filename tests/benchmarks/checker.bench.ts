import { bench, describe } from 'vitest';
import { MetaTagsChecker } from '../../src/checkers/metaTags';
import { HeadingsChecker } from '../../src/checkers/headings';
import { ImagesChecker } from '../../src/checkers/images';
import { ContentChecker } from '../../src/checkers/content';
import { createMockPage } from '../mocks/mockPage';
import { Page } from 'playwright';
import { ImageInfo, HeadingStructure } from '../../src/types';

describe('Checker Performance Benchmarks', () => {
  describe('MetaTagsChecker Performance', () => {
    bench('checkAll - optimal case', async () => {
      const mockPage = createMockPage({
        title: 'Perfect SEO Title Length Here For Testing',
        metaTags: {
          description: 'This is an optimal meta description with perfect length between 120 and 160 characters for best SEO results.',
          viewport: 'width=device-width, initial-scale=1.0',
          canonical: 'https://example.com',
        },
        evaluateResults: {
          'og:': [
            { property: 'og:title', content: 'Test' },
            { property: 'og:description', content: 'Test' },
            { property: 'og:image', content: 'test.jpg' },
          ],
        },
      }) as Page;

      const checker = new MetaTagsChecker(mockPage);
      await checker.checkAll();
    });

    bench('checkAll - missing tags', async () => {
      const mockPage = createMockPage({
        title: 'Test',
        metaTags: {},
      }) as Page;

      const checker = new MetaTagsChecker(mockPage);
      await checker.checkAll();
    });
  });

  describe('HeadingsChecker Performance', () => {
    bench('checkAll - small document', async () => {
      const headings: HeadingStructure[] = [
        { tag: 'h1', text: 'Title', level: 1 },
        { tag: 'h2', text: 'Section 1', level: 2 },
        { tag: 'h2', text: 'Section 2', level: 2 },
      ];

      const mockPage = createMockPage({
        evaluateResults: { querySelectorAll: headings },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      await checker.checkAll();
    });

    bench('checkAll - large document', async () => {
      const headings: HeadingStructure[] = [];
      headings.push({ tag: 'h1', text: 'Main Title', level: 1 });
      for (let i = 0; i < 50; i++) {
        headings.push({ tag: 'h2', text: `Section ${i}`, level: 2 });
        headings.push({ tag: 'h3', text: `Subsection ${i}`, level: 3 });
      }

      const mockPage = createMockPage({
        evaluateResults: { querySelectorAll: headings },
      }) as Page;

      const checker = new HeadingsChecker(mockPage);
      await checker.checkAll();
    });
  });

  describe('ImagesChecker Performance', () => {
    bench('checkAll - few images', async () => {
      const images: ImageInfo[] = [
        { src: 'img1.jpg', alt: 'Image 1', hasAlt: true },
        { src: 'img2.jpg', alt: 'Image 2', hasAlt: true },
      ];

      const mockPage = createMockPage({
        evaluateResults: { querySelectorAll: images },
      }) as Page;

      const checker = new ImagesChecker(mockPage);
      await checker.checkAll();
    });

    bench('checkAll - many images', async () => {
      const images: ImageInfo[] = Array(100)
        .fill(null)
        .map((_, i) => ({
          src: `img${i}.jpg`,
          alt: `Image ${i}`,
          hasAlt: true,
        }));

      const mockPage = createMockPage({
        evaluateResults: { querySelectorAll: images },
      }) as Page;

      const checker = new ImagesChecker(mockPage);
      await checker.checkAll();
    });
  });

  describe('ContentChecker Performance', () => {
    bench('checkAll - short content', async () => {
      const mockPage = createMockPage({
        evaluateResults: { innerText: 'word '.repeat(100) },
      }) as Page;

      const checker = new ContentChecker(mockPage);
      await checker.checkAll();
    });

    bench('checkAll - long content', async () => {
      const mockPage = createMockPage({
        evaluateResults: { innerText: 'word '.repeat(5000) },
      }) as Page;

      const checker = new ContentChecker(mockPage);
      await checker.checkAll();
    });
  });

  describe('Parallel Checker Execution', () => {
    bench('run multiple checkers sequentially', async () => {
      const mockPage = createMockPage({
        title: 'Test Page',
        metaTags: { description: 'Test description' },
        evaluateResults: {
          querySelectorAll: [{ tag: 'h1', text: 'Title', level: 1 }],
          innerText: 'word '.repeat(500),
        },
      }) as Page;

      const metaChecker = new MetaTagsChecker(mockPage);
      const headingsChecker = new HeadingsChecker(mockPage);
      const contentChecker = new ContentChecker(mockPage);

      await metaChecker.checkAll();
      await headingsChecker.checkAll();
      await contentChecker.checkAll();
    });

    bench('run multiple checkers in parallel', async () => {
      const mockPage = createMockPage({
        title: 'Test Page',
        metaTags: { description: 'Test description' },
        evaluateResults: {
          querySelectorAll: [{ tag: 'h1', text: 'Title', level: 1 }],
          innerText: 'word '.repeat(500),
        },
      }) as Page;

      const metaChecker = new MetaTagsChecker(mockPage);
      const headingsChecker = new HeadingsChecker(mockPage);
      const contentChecker = new ContentChecker(mockPage);

      await Promise.all([
        metaChecker.checkAll(),
        headingsChecker.checkAll(),
        contentChecker.checkAll(),
      ]);
    });
  });
});
