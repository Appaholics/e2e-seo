/**
 * Helper utilities for checkers to handle errors consistently
 */

import { Page } from 'playwright';
import { SEOCheckResult } from '../types/index.js';
import { retry, RetryOptions } from './retry.js';
import { ErrorLogger } from './logger.js';
import { categorizeError, NetworkError, BrowserError } from './types.js';
import { withGracefulDegradation, GracefulOptions } from './graceful.js';

export class CheckerErrorHandler {
  constructor(
    private page: Page,
    private checkerName: string
  ) {}

  /**
   * Execute a network request with retry logic
   */
  async executeNetworkRequest<T>(
    requestFn: () => Promise<T>,
    checkName: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const url = this.page.url();

    return retry(
      async (context) => {
        try {
          return await requestFn();
        } catch (error) {
          const categorized = categorizeError(error);

          if (!(categorized instanceof NetworkError)) {
            throw new NetworkError(categorized.message, {
              checkName: `${this.checkerName}.${checkName}`,
              url,
              retryCount: context.attempt - 1,
              originalError: categorized.context.originalError,
            });
          }

          categorized.context.checkName = `${this.checkerName}.${checkName}`;
          categorized.context.url = url;
          categorized.context.retryCount = context.attempt - 1;
          throw categorized;
        }
      },
      {
        maxAttempts: 3,
        initialDelay: 1000,
        onRetry: (error, attempt, delay) => {
          ErrorLogger.getInstance().info(
            `Retrying ${this.checkerName}.${checkName} (attempt ${attempt}) after ${delay}ms`,
            { url, error: error instanceof Error ? error.message : String(error) }
          );
        },
        ...options,
      }
    );
  }

  /**
   * Execute a page evaluation with error handling
   */
  async executePageEvaluation<T>(
    evaluationFn: () => Promise<T>,
    checkName: string,
    options: GracefulOptions = {}
  ): Promise<T> {
    const url = this.page.url();

    try {
      return await evaluationFn();
    } catch (error) {
      const categorized = categorizeError(error);

      const browserError = new BrowserError(categorized.message, {
        checkName: `${this.checkerName}.${checkName}`,
        url,
        originalError: categorized.context.originalError,
      });

      if (options.logError !== false) {
        ErrorLogger.getInstance().logError(browserError);
      }

      throw browserError;
    }
  }

  /**
   * Execute a check with graceful degradation
   */
  async executeCheck(
    checkFn: () => Promise<SEOCheckResult>,
    checkName: string,
    options: GracefulOptions = {}
  ): Promise<SEOCheckResult> {
    return withGracefulDegradation(
      checkFn,
      `${this.checkerName}.${checkName}`,
      options
    );
  }

  /**
   * Execute multiple checks in parallel with graceful degradation
   */
  async executeChecksParallel(
    checks: Array<{
      name: string;
      fn: () => Promise<SEOCheckResult>;
      options?: GracefulOptions;
    }>
  ): Promise<SEOCheckResult[]> {
    const promises = checks.map((check) =>
      this.executeCheck(check.fn, check.name, check.options)
    );

    return Promise.all(promises);
  }

  /**
   * Fetch a URL with retry logic
   */
  async fetchWithRetry(
    url: string,
    checkName: string,
    options: RetryOptions = {}
  ): Promise<Response> {
    return this.executeNetworkRequest(
      async () => {
        const response = await this.page.context().request.get(url);
        return response;
      },
      checkName,
      options
    );
  }

  /**
   * Navigate to a URL with retry logic
   */
  async navigateWithRetry(
    url: string,
    checkName: string,
    options: RetryOptions & { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' } = {}
  ): Promise<void> {
    const { waitUntil = 'domcontentloaded', ...retryOptions } = options;

    await this.executeNetworkRequest(
      async () => {
        await this.page.goto(url, { waitUntil });
      },
      checkName,
      retryOptions
    );
  }

  /**
   * Create a result for a skipped check
   */
  createSkippedResult(
    message: string,
    checkName?: string,
    error?: unknown
  ): SEOCheckResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = error
      ? `${message}: ${errorMessage}`
      : message;

    if (error && checkName) {
      const categorized = categorizeError(error);
      categorized.context.checkName = `${this.checkerName}.${checkName}`;
      ErrorLogger.getInstance().logWarning(fullMessage, {
        error: categorized.toJSON(),
      });
    }

    return {
      passed: true,
      message: fullMessage,
    };
  }

  /**
   * Create a result for a failed check
   */
  createFailedResult(
    message: string,
    checkName?: string,
    error?: unknown
  ): SEOCheckResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fullMessage = error
      ? `${message}: ${errorMessage}`
      : message;

    if (error && checkName) {
      const categorized = categorizeError(error);
      categorized.context.checkName = `${this.checkerName}.${checkName}`;
      ErrorLogger.getInstance().logError(categorized);
    }

    return {
      passed: false,
      message: fullMessage,
    };
  }

  /**
   * Wrap a checker method with comprehensive error handling
   */
  wrapCheckerMethod<T extends SEOCheckResult>(
    checkFn: () => Promise<T>,
    checkName: string,
    options: {
      retry?: boolean;
      retryOptions?: RetryOptions;
      graceful?: boolean;
      gracefulOptions?: GracefulOptions;
    } = {}
  ): () => Promise<T> {
    return async () => {
      const fullCheckName = `${this.checkerName}.${checkName}`;

      let executeFn = checkFn;

      // Wrap with retry if requested
      if (options.retry) {
        const originalFn = executeFn;
        executeFn = async () => {
          return this.executeNetworkRequest(
            originalFn,
            checkName,
            options.retryOptions
          ) as Promise<T>;
        };
      }

      // Wrap with graceful degradation if requested
      if (options.graceful) {
        return withGracefulDegradation(executeFn, fullCheckName, options.gracefulOptions);
      }

      return executeFn();
    };
  }
}
