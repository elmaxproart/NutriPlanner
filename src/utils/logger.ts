type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = { level, message, timestamp, context };
    this.logs.push(entry);

    // Utilisation de console[level] pour respecter les niveaux de log
    console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, context || '');
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (__DEV__) {this.log('debug', message, context);}
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
