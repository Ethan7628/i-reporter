/**
 * Development Logger Utility
 * 
 * Centralized logging for development mode with consistent formatting
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class DevLogger {
  private isDevMode: boolean;

  constructor() {
    this.isDevMode = import.meta.env.DEV;
  }

  private log(level: LogLevel, context: string, message: string, data?: unknown): void {
    if (!this.isDevMode) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${context}]`;

    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, data || '');
        break;
      case 'debug':
        console.debug(`${prefix} ${message}`, data || '');
        break;
    }
  }

  info(context: string, message: string, data?: unknown): void {
    this.log('info', context, message, data);
  }

  warn(context: string, message: string, data?: unknown): void {
    this.log('warn', context, message, data);
  }

  error(context: string, message: string, data?: unknown): void {
    this.log('error', context, message, data);
  }

  debug(context: string, message: string, data?: unknown): void {
    this.log('debug', context, message, data);
  }

  group(label: string): void {
    if (this.isDevMode) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDevMode) {
      console.groupEnd();
    }
  }
}

export const devLogger = new DevLogger();
