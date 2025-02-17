type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static formatDate(date: Date): string {
    return date.toISOString();
  }

  private static log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: this.formatDate(new Date()),
      level,
      message,
      data,
    };

    // In development, log to console
    if (process.env.NODE_ENV !== 'production') {
      const logFn = level === 'error' ? console.error : 
                    level === 'warn' ? console.warn : 
                    console.log;
      logFn(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
    } else {
      // In production, you might want to send logs to a service like DataDog or CloudWatch
      // TODO: Implement production logging
    }

    return entry;
  }

  static info(message: string, data?: any) {
    return this.log('info', message, data);
  }

  static warn(message: string, data?: any) {
    return this.log('warn', message, data);
  }

  static error(message: string, data?: any) {
    return this.log('error', message, data);
  }
}

export default Logger; 