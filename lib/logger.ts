/**
 * Simple logging utility for production
 * Can be extended to integrate with services like Sentry, LogRocket, etc.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  error?: Error;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (context) {
      log += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    if (error) {
      log += `\nError: ${error.message}\nStack: ${error.stack}`;
    }
    
    return log;
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formattedLog = this.formatLog(entry);

    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }

    // In production, you would send logs to a service like:
    // - Sentry for error tracking
    // - LogRocket for session replay
    // - CloudWatch, DataDog, or similar for log aggregation
    if (!this.isDevelopment && level === LogLevel.ERROR) {
      // Example: Send to error tracking service
      // Sentry.captureException(error, { extra: context });
    }
  }

  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: any): void {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

// Export singleton instance
export const logger = new Logger();
