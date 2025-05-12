type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logWithLevel(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const metaString = meta ? JSON.stringify(meta, null, 2) : '';
    console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}${metaString ? '\n' + metaString : ''}`);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.logWithLevel('error', message, meta);
  }
}

export const logger = new Logger(); 