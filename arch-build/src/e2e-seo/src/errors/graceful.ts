/**
 * Graceful degradation utilities for handling errors without failing completely
 */

import { SEOCheckResult } from '../types/index.js';
import { SEOCheckerError, categorizeError, ErrorSeverity } from './types.js';
import { ErrorLogger } from './logger.js';

export interface GracefulOptions {
  /**
   * Whether to mark check as passed when it fails
   * @default true (graceful degradation)
   */
  passOnError?: boolean;

  /**
   * Whether to include error details in the message
   * @default true
   */
  includeErrorDetails?: boolean;

  /**
   * Custom message prefix for degraded checks
   * @default 'Check skipped due to error'
   */
  messagePrefix?: string;

  /**
   * Whether to log the error
   * @default true
   */
  logError?: boolean;

  /**
   * Severity to log the error as
   * @default ErrorSeverity.WARNING
   */
  logSeverity?: ErrorSeverity;
}

const DEFAULT_GRACEFUL_OPTIONS: Required<GracefulOptions> = {
  passOnError: true,
  includeErrorDetails: true,
  messagePrefix: 'Check skipped due to error',
  logError: true,
  logSeverity: ErrorSeverity.WARNING,
};

/**
 * Execute a check with graceful degradation
 * Returns a passed check with error details if the check fails
 */
export async function withGracefulDegradation<T extends SEOCheckResult>(
  checkFn: () => Promise<T>,
  checkName: string,
  options: GracefulOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_GRACEFUL_OPTIONS, ...options };

  try {
    return await checkFn();
  } catch (error) {
    const categorized = categorizeError(error);
    categorized.context.checkName = checkName;
    categorized.context.severity = opts.logSeverity;

    if (opts.logError) {
      ErrorLogger.getInstance().logError(categorized);
    }

    const errorMessage = categorized.message;
    const detailsText = opts.includeErrorDetails ? `: ${errorMessage}` : '';
    const message = `${opts.messagePrefix}${detailsText}`;

    return {
      passed: opts.passOnError,
      message,
      category: categorized.context.category,
      severity: categorized.context.severity,
    } as unknown as T;
  }
}

/**
 * Execute multiple checks with graceful degradation
 * Continues execution even if some checks fail
 */
export async function withGracefulDegradationBatch<T extends SEOCheckResult>(
  checks: Array<{
    name: string;
    fn: () => Promise<T>;
    options?: GracefulOptions;
  }>
): Promise<T[]> {
  const results: T[] = [];

  for (const check of checks) {
    const result = await withGracefulDegradation(check.fn, check.name, check.options);
    results.push(result);
  }

  return results;
}

/**
 * Execute checks in parallel with graceful degradation
 */
export async function withGracefulDegradationParallel<T extends SEOCheckResult>(
  checks: Array<{
    name: string;
    fn: () => Promise<T>;
    options?: GracefulOptions;
  }>
): Promise<T[]> {
  const promises = checks.map((check) =>
    withGracefulDegradation(check.fn, check.name, check.options)
  );

  return Promise.all(promises);
}

/**
 * Fallback mechanism - try primary function, fall back to secondary if it fails
 */
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  checkName: string
): Promise<T> {
  try {
    return await primary();
  } catch (primaryError) {
    const categorized = categorizeError(primaryError);
    categorized.context.checkName = checkName;

    ErrorLogger.getInstance().logWarning(
      `Primary check failed for ${checkName}, attempting fallback`,
      { primaryError: categorized.message }
    );

    try {
      return await fallback();
    } catch (fallbackError) {
      const categorizedFallback = categorizeError(fallbackError);
      categorizedFallback.context.checkName = checkName;

      ErrorLogger.getInstance().logError(categorizedFallback, {
        primaryError: categorized.message,
        fallbackError: categorizedFallback.message,
      });

      throw fallbackError;
    }
  }
}

/**
 * Partial success handler - returns results for checks that succeeded
 */
export async function withPartialSuccess<T>(
  checks: Array<() => Promise<T>>,
  checkName: string,
  options: { minSuccessRate?: number } = {}
): Promise<{
  results: T[];
  failures: Array<{ index: number; error: SEOCheckerError }>;
  successRate: number;
}> {
  const results: T[] = [];
  const failures: Array<{ index: number; error: SEOCheckerError }> = [];

  for (let i = 0; i < checks.length; i++) {
    try {
      const result = await checks[i]();
      results.push(result);
    } catch (error) {
      const categorized = categorizeError(error);
      categorized.context.checkName = checkName;
      failures.push({ index: i, error: categorized });
    }
  }

  const successRate = checks.length > 0 ? results.length / checks.length : 0;
  const minSuccessRate = options.minSuccessRate ?? 0;

  if (successRate < minSuccessRate) {
    ErrorLogger.getInstance().logError(
      categorizeError(
        new Error(
          `Success rate ${(successRate * 100).toFixed(1)}% below minimum ${(minSuccessRate * 100).toFixed(1)}%`
        )
      ),
      {
        checkName,
        successRate,
        minSuccessRate,
        failureCount: failures.length,
      }
    );
  }

  return { results, failures, successRate };
}

/**
 * Timeout wrapper with graceful degradation
 */
export async function withTimeout<T extends SEOCheckResult>(
  fn: () => Promise<T>,
  timeoutMs: number,
  checkName: string,
  options: GracefulOptions = {}
): Promise<T> {
  return withGracefulDegradation(
    async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      return Promise.race([fn(), timeoutPromise]);
    },
    checkName,
    options
  );
}

/**
 * Safe execution wrapper that never throws
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  checkName?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (checkName) {
      const categorized = categorizeError(error);
      categorized.context.checkName = checkName;
      ErrorLogger.getInstance().logError(categorized);
    }
    return defaultValue;
  }
}

/**
 * Create a safe version of a check function that handles all errors gracefully
 */
export function createSafeCheck<T extends SEOCheckResult>(
  checkFn: () => Promise<T>,
  checkName: string,
  options: GracefulOptions = {}
): () => Promise<T> {
  return async () => withGracefulDegradation(checkFn, checkName, options);
}
