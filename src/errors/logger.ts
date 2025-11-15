/**
 * Error logging and reporting system
 */

import { SEOCheckerError, ErrorSeverity, ErrorCategory } from './types.js';
import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  error?: SEOCheckerError;
  metadata?: Record<string, unknown>;
}

export interface LoggerOptions {
  /**
   * Minimum log level to output
   * @default LogLevel.INFO
   */
  minLevel?: LogLevel;

  /**
   * Whether to output to console
   * @default true
   */
  console?: boolean;

  /**
   * Whether to save logs to file
   * @default false
   */
  file?: boolean;

  /**
   * Log file path (only used if file: true)
   * @default './e2e-seo-errors.log'
   */
  filePath?: string;

  /**
   * Whether to include stack traces in logs
   * @default true
   */
  includeStackTrace?: boolean;

  /**
   * Whether to use colored output in console
   * @default true
   */
  colorize?: boolean;
}

/**
 * Singleton error logger for centralized logging
 */
export class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: LogEntry[] = [];
  private options: Required<LoggerOptions>;

  private constructor(options: LoggerOptions = {}) {
    this.options = {
      minLevel: options.minLevel ?? LogLevel.INFO,
      console: options.console ?? true,
      file: options.file ?? false,
      filePath: options.filePath ?? './e2e-seo-errors.log',
      includeStackTrace: options.includeStackTrace ?? true,
      colorize: options.colorize ?? true,
    };
  }

  static getInstance(options?: LoggerOptions): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger(options);
    } else if (options) {
      // Update options if provided
      ErrorLogger.instance.options = {
        ...ErrorLogger.instance.options,
        ...options,
      };
    }
    return ErrorLogger.instance;
  }

  /**
   * Configure the logger
   */
  configure(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, undefined, metadata);
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, undefined, metadata);
  }

  /**
   * Log a warning message
   */
  logWarning(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, undefined, metadata);
  }

  /**
   * Log an error
   */
  logError(error: SEOCheckerError, metadata?: Record<string, unknown>): void {
    const level = this.severityToLogLevel(error.context.severity);
    this.log(level, error.message, error, metadata);
  }

  /**
   * Log a retry attempt
   */
  logRetry(error: SEOCheckerError, attempt: number, delay: number): void {
    this.log(LogLevel.WARN, `Retry attempt ${attempt} after ${delay}ms`, error, {
      retryAttempt: attempt,
      retryDelay: delay,
    });
  }

  /**
   * Core logging function
   */
  private log(
    level: LogLevel,
    message: string,
    error?: SEOCheckerError,
    metadata?: Record<string, unknown>
  ): void {
    if (level < this.options.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      error,
      metadata,
    };

    this.logs.push(entry);

    if (this.options.console) {
      this.logToConsole(entry);
    }

    if (this.options.file) {
      this.logToFile(entry);
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = LogLevel[entry.level];
    const prefix = `[${timestamp}] [${levelStr}]`;

    let output = `${prefix} ${entry.message}`;

    if (this.options.colorize) {
      output = this.colorize(output, entry.level);
    }

    if (entry.error) {
      const errorDetails = this.formatError(entry.error);
      output += `\n${errorDetails}`;
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    const logFn = entry.level >= LogLevel.ERROR ? console.error : console.log;
    logFn(output);
  }

  /**
   * Log to file
   */
  private logToFile(entry: LogEntry): void {
    try {
      const timestamp = entry.timestamp.toISOString();
      const levelStr = LogLevel[entry.level];
      let logLine = `[${timestamp}] [${levelStr}] ${entry.message}`;

      if (entry.error) {
        logLine += `\n${JSON.stringify(entry.error.toJSON(), null, 2)}`;
      }

      if (entry.metadata) {
        logLine += `\n  Metadata: ${JSON.stringify(entry.metadata)}`;
      }

      logLine += '\n\n';

      // Ensure directory exists
      const dir = path.dirname(this.options.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.appendFileSync(this.options.filePath, logLine, 'utf-8');
    } catch (error) {
      // Don't crash if logging fails
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Format error for display
   */
  private formatError(error: SEOCheckerError): string {
    let output = `  Error: ${error.name}\n`;
    output += `  Category: ${error.context.category}\n`;
    output += `  Severity: ${error.context.severity}\n`;

    if (error.context.url) {
      output += `  URL: ${error.context.url}\n`;
    }

    if (error.context.checkName) {
      output += `  Check: ${error.context.checkName}\n`;
    }

    if (error.context.retryCount !== undefined) {
      output += `  Retry Count: ${error.context.retryCount}\n`;
    }

    if (this.options.includeStackTrace && error.context.stackTrace) {
      output += `  Stack Trace:\n${error.context.stackTrace
        .split('\n')
        .map((line) => `    ${line}`)
        .join('\n')}`;
    }

    return output;
  }

  /**
   * Colorize output based on log level
   */
  private colorize(text: string, level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[90m', // Gray
      [LogLevel.INFO]: '\x1b[36m', // Cyan
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.CRITICAL]: '\x1b[41m\x1b[37m', // Red background, white text
    };

    const reset = '\x1b[0m';
    return `${colors[level]}${text}${reset}`;
  }

  /**
   * Convert error severity to log level
   */
  private severityToLogLevel(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return LogLevel.CRITICAL;
      case ErrorSeverity.ERROR:
        return LogLevel.ERROR;
      case ErrorSeverity.WARNING:
        return LogLevel.WARN;
      case ErrorSeverity.INFO:
        return LogLevel.INFO;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * Get all logged entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get error logs only
   */
  getErrors(): LogEntry[] {
    return this.logs.filter((log) => log.level >= LogLevel.ERROR);
  }

  /**
   * Generate error summary report
   */
  generateErrorSummary(): ErrorSummary {
    const errors = this.getErrors();
    const categoryCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    const checkCounts: Record<string, number> = {};

    for (const entry of errors) {
      if (entry.error) {
        const category = entry.error.context.category;
        const severity = entry.error.context.severity;
        const check = entry.error.context.checkName || 'unknown';

        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;
        checkCounts[check] = (checkCounts[check] || 0) + 1;
      }
    }

    return {
      totalErrors: errors.length,
      totalLogs: this.logs.length,
      byCategory: categoryCounts,
      bySeverity: severityCounts,
      byCheck: checkCounts,
      errors: errors.map((e) => ({
        timestamp: e.timestamp.toISOString(),
        message: e.message,
        category: e.error?.context.category,
        severity: e.error?.context.severity,
        checkName: e.error?.context.checkName,
      })),
    };
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Export logs to JSON file
   */
  exportToJSON(filePath: string): void {
    const summary = this.generateErrorSummary();
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf-8');
  }
}

export interface ErrorSummary {
  totalErrors: number;
  totalLogs: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byCheck: Record<string, number>;
  errors: Array<{
    timestamp: string;
    message: string;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    checkName?: string;
  }>;
}
