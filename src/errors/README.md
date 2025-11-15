# Error Handling System

Comprehensive error handling infrastructure for the e2e-seo checker tool.

## Features

- ✅ **Custom Error Types** - Categorized errors (Network, Browser, Validation, Configuration, Timeout)
- ✅ **Retry Mechanisms** - Exponential backoff with jitter for transient failures
- ✅ **Circuit Breaker** - Prevents repeated failures from overwhelming the system
- ✅ **Error Logging** - Centralized logging with multiple output targets
- ✅ **Graceful Degradation** - Continues execution even when checks fail
- ✅ **Detailed Error Context** - Rich metadata for debugging
- ✅ **Error Reporting** - Generate comprehensive error summaries

## Architecture

```
errors/
├── types.ts           # Custom error classes and categorization
├── retry.ts           # Retry logic with exponential backoff
├── logger.ts          # Centralized error logging system
├── graceful.ts        # Graceful degradation utilities
├── checkerHelpers.ts  # Helper utilities for checker modules
└── index.ts           # Public API exports
```

## Quick Start

### Basic Usage in Checkers

```typescript
import { CheckerErrorHandler } from '../errors/index.js';

export class MyChecker {
  private errorHandler: CheckerErrorHandler;

  constructor(private page: Page) {
    this.errorHandler = new CheckerErrorHandler(page, 'MyChecker');
  }

  async checkSomething(): Promise<SEOCheckResult> {
    // Automatically handles errors with graceful degradation
    return this.errorHandler.executeCheck(async () => {
      // Your check logic here
      return { passed: true, message: 'Check passed' };
    }, 'checkSomething');
  }
}
```

### Network Requests with Retry

```typescript
// Fetch a URL with automatic retries
const response = await this.errorHandler.fetchWithRetry(
  'https://example.com/robots.txt',
  'checkRobotsTxt',
  {
    maxAttempts: 3,
    initialDelay: 1000,
  }
);
```

### Custom Error Handling

```typescript
import { retry, withGracefulDegradation } from '../errors/index.js';

// Retry a function with custom options
const result = await retry(
  async (context) => {
    // Your logic here
    return await fetch('https://api.example.com/data');
  },
  {
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 2,
  }
);

// Graceful degradation
const checkResult = await withGracefulDegradation(
  async () => {
    // Check that might fail
  },
  'myCheckName',
  {
    passOnError: true,
    includeErrorDetails: true,
  }
);
```

## Error Types

### Custom Error Classes

All errors extend `SEOCheckerError` with rich context:

```typescript
import { NetworkError, BrowserError, ValidationError } from '../errors/index.js';

// Network errors (timeouts, connection failures)
throw new NetworkError('Failed to fetch robots.txt', {
  url: 'https://example.com/robots.txt',
  severity: ErrorSeverity.ERROR,
});

// Browser errors (page crashes, navigation failures)
throw new BrowserError('Page failed to load', {
  checkName: 'navigationCheck',
});

// Validation errors (invalid input)
throw new ValidationError('Invalid URL format', {
  severity: ErrorSeverity.WARNING,
});
```

### Error Context

Every error includes:
- `timestamp` - When the error occurred
- `category` - Error category (NETWORK, BROWSER, VALIDATION, etc.)
- `severity` - Error severity (CRITICAL, ERROR, WARNING, INFO)
- `url` - URL being checked (if applicable)
- `checkName` - Name of the check that failed
- `retryCount` - Number of retries attempted
- `stackTrace` - Full stack trace for debugging
- `metadata` - Custom metadata

## Retry Mechanisms

### Exponential Backoff

The retry system implements exponential backoff with jitter:

```typescript
import { retry, RetryOptions } from '../errors/index.js';

const options: RetryOptions = {
  maxAttempts: 3,      // Maximum retry attempts
  initialDelay: 1000,  // Initial delay (1 second)
  maxDelay: 10000,     // Maximum delay (10 seconds)
  backoffMultiplier: 2, // Doubles each time
  jitter: true,        // Add random jitter (0-25%)
};

await retry(async () => {
  // Your logic
}, options);
```

**Retry Schedule Example:**
- Attempt 1: Immediate
- Attempt 2: ~1000ms delay
- Attempt 3: ~2000ms delay
- Attempt 4: ~4000ms delay

### Circuit Breaker

Prevents repeated failures from overwhelming the system:

```typescript
import { CircuitBreaker } from '../errors/index.js';

const breaker = new CircuitBreaker(
  5,      // Threshold: open after 5 failures
  60000   // Timeout: 1 minute before trying again
);

await breaker.execute(async () => {
  // Your logic
});
```

**States:**
- **CLOSED** - Normal operation
- **OPEN** - Too many failures, rejects immediately
- **HALF_OPEN** - Testing if service recovered

## Error Logging

### Configuration

```typescript
import { ErrorLogger, LogLevel } from '../errors/index.js';

const logger = ErrorLogger.getInstance({
  minLevel: LogLevel.INFO,
  console: true,
  file: true,
  filePath: './logs/e2e-seo-errors.log',
  includeStackTrace: true,
  colorize: true,
});
```

### Logging Methods

```typescript
logger.debug('Debug message', { foo: 'bar' });
logger.info('Info message', { baz: 'qux' });
logger.logWarning('Warning message');
logger.logError(error); // Logs SEOCheckerError
```

### Error Summaries

Generate comprehensive error reports:

```typescript
const summary = logger.generateErrorSummary();
// Returns:
// {
//   totalErrors: 5,
//   totalLogs: 20,
//   byCategory: { NETWORK: 3, BROWSER: 2 },
//   bySeverity: { ERROR: 4, WARNING: 1 },
//   byCheck: { 'robotsTxt': 2, 'sitemap': 3 },
//   errors: [...]
// }

// Export to JSON
logger.exportToJSON('./error-report.json');
```

## Graceful Degradation

### Execute with Graceful Degradation

```typescript
import { withGracefulDegradation } from '../errors/index.js';

const result = await withGracefulDegradation(
  async () => {
    // Check logic that might fail
  },
  'checkName',
  {
    passOnError: true,           // Mark as passed if fails
    includeErrorDetails: true,   // Include error in message
    messagePrefix: 'Check skipped',
    logError: true,              // Log the error
    logSeverity: ErrorSeverity.WARNING,
  }
);
```

### Batch Execution

```typescript
import { withGracefulDegradationBatch } from '../errors/index.js';

const results = await withGracefulDegradationBatch([
  { name: 'check1', fn: async () => ({ passed: true, message: 'OK' }) },
  { name: 'check2', fn: async () => ({ passed: true, message: 'OK' }) },
  { name: 'check3', fn: async () => ({ passed: true, message: 'OK' }) },
]);
```

### Parallel Execution

```typescript
import { withGracefulDegradationParallel } from '../errors/index.js';

// Runs all checks in parallel
const results = await withGracefulDegradationParallel([
  { name: 'check1', fn: checkFn1 },
  { name: 'check2', fn: checkFn2 },
  { name: 'check3', fn: checkFn3 },
]);
```

### Fallback Mechanism

```typescript
import { withFallback } from '../errors/index.js';

const result = await withFallback(
  async () => {
    // Primary method
    return await fetchFromPrimaryAPI();
  },
  async () => {
    // Fallback method
    return await fetchFromBackupAPI();
  },
  'checkName'
);
```

### Timeout Handling

```typescript
import { withTimeout } from '../errors/index.js';

const result = await withTimeout(
  async () => {
    // Long-running operation
  },
  5000, // 5 second timeout
  'checkName',
  { passOnError: true }
);
```

## Checker Helper Utilities

The `CheckerErrorHandler` class provides convenient methods for common patterns:

### Network Requests

```typescript
// Fetch with automatic retry
const response = await this.errorHandler.fetchWithRetry(
  url,
  'checkName',
  { maxAttempts: 3 }
);

// Navigate with retry
await this.errorHandler.navigateWithRetry(
  url,
  'checkName',
  { waitUntil: 'domcontentloaded' }
);
```

### Page Evaluation

```typescript
// Execute with error handling
const data = await this.errorHandler.executePageEvaluation(
  async () => {
    return await this.page.evaluate(() => {
      // DOM manipulation
    });
  },
  'checkName'
);
```

### Result Helpers

```typescript
// Create skipped result
const result = this.errorHandler.createSkippedResult(
  'Check skipped due to missing element',
  'checkName',
  error
);

// Create failed result
const result = this.errorHandler.createFailedResult(
  'Check failed',
  'checkName',
  error
);
```

## Best Practices

### 1. Always Use Error Handlers in Checkers

```typescript
export class MyChecker {
  private errorHandler: CheckerErrorHandler;

  constructor(private page: Page) {
    this.errorHandler = new CheckerErrorHandler(page, 'MyChecker');
  }

  // Good: Uses error handler
  async checkSomething(): Promise<SEOCheckResult> {
    return this.errorHandler.executeCheck(async () => {
      // Logic
    }, 'checkSomething');
  }
}
```

### 2. Use Retry for Network Operations

```typescript
// Good: Retries on network failures
const response = await this.errorHandler.fetchWithRetry(
  url,
  'checkName',
  { maxAttempts: 3 }
);

// Bad: No retry
const response = await this.page.context().request.get(url);
```

### 3. Graceful Degradation for Non-Critical Checks

```typescript
// Good: Degrades gracefully
return this.errorHandler.executeCheck(
  async () => { /* check logic */ },
  'checkName',
  { passOnError: true }
);

// Bad: Throws and stops execution
const result = await checkLogic(); // Might throw
```

### 4. Log Important Errors

```typescript
import { ErrorLogger, categorizeError } from '../errors/index.js';

try {
  // Critical operation
} catch (error) {
  const categorized = categorizeError(error);
  ErrorLogger.getInstance().logError(categorized);
  throw error;
}
```

### 5. Provide Context in Errors

```typescript
// Good: Rich context
throw new NetworkError('Failed to fetch', {
  url,
  checkName: 'myCheck',
  severity: ErrorSeverity.ERROR,
  metadata: { statusCode: 500 },
});

// Bad: Generic error
throw new Error('Failed');
```

## Migration Guide

### Updating Existing Checkers

**Before:**
```typescript
async checkSomething(): Promise<SEOCheckResult> {
  try {
    const response = await this.page.context().request.get(url);
    // Process response
  } catch (error) {
    return {
      passed: false,
      message: `Error: ${error.message}`,
    };
  }
}
```

**After:**
```typescript
private errorHandler: CheckerErrorHandler;

constructor(private page: Page) {
  this.errorHandler = new CheckerErrorHandler(page, 'MyChecker');
}

async checkSomething(): Promise<SEOCheckResult> {
  return this.errorHandler.executeCheck(async () => {
    const response = await this.errorHandler.fetchWithRetry(
      url,
      'checkSomething',
      { maxAttempts: 3 }
    );
    // Process response
  }, 'checkSomething');
}
```

## Testing

The error handling system is fully tested. See `__tests__/errors/` for examples.

## Performance Considerations

- **Retry delays** - Default exponential backoff starts at 1 second
- **Circuit breaker** - Prevents cascading failures
- **Logging overhead** - Minimal when using appropriate log levels
- **Memory** - Error logs are kept in memory; call `logger.clear()` periodically for long-running processes

## Troubleshooting

### Errors Not Being Logged

Check the log level:
```typescript
ErrorLogger.getInstance().configure({
  minLevel: LogLevel.DEBUG, // Lower the threshold
});
```

### Too Many Retries

Reduce retry attempts:
```typescript
this.errorHandler.fetchWithRetry(url, 'check', {
  maxAttempts: 2, // Reduce from default 3
});
```

### Circuit Breaker Opening Too Quickly

Increase the threshold:
```typescript
const breaker = new CircuitBreaker(
  10,  // Increase from default 5
  60000
);
```

## Examples

See the updated `robotsTxt.ts` checker for a complete example of using the error handling system.
