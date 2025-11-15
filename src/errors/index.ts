/**
 * Error handling module exports
 */

// Error types
export {
  SEOCheckerError,
  NetworkError,
  BrowserError,
  ValidationError,
  ConfigurationError,
  TimeoutError,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  categorizeError,
} from './types.js';

// Retry utilities
export {
  retry,
  retryWithErrorHandling,
  CircuitBreaker,
  RetryOptions,
  RetryContext,
} from './retry.js';

// Logger
export { ErrorLogger, LogLevel, LogEntry, LoggerOptions, ErrorSummary } from './logger.js';

// Graceful degradation
export {
  withGracefulDegradation,
  withGracefulDegradationBatch,
  withGracefulDegradationParallel,
  withFallback,
  withPartialSuccess,
  withTimeout,
  safeExecute,
  createSafeCheck,
  GracefulOptions,
} from './graceful.js';

// Checker helpers
export { CheckerErrorHandler } from './checkerHelpers.js';
