/**
 * XeroxQ — Professional DevOps Logging Utility
 * 
 * Standardizes log output across the platform for better observability 
 * and production troubleshooting.
 */

type LogLevel = 'DEBUG' | 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'SECURITY' | 'SUPPORT';

class Logger {
  private format(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  debug(msg: string, ...args: any[]) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.format('DEBUG', msg), ...args);
    }
  }

  info(msg: string, ...args: any[]) {
    console.log(this.format('INFO', msg), ...args);
  }

  success(msg: string, ...args: any[]) {
    console.log(`\x1b[32m${this.format('SUCCESS', msg)}\x1b[0m`, ...args);
  }

  warn(msg: string, ...args: any[]) {
    console.warn(`\x1b[33m${this.format('WARN', msg)}\x1b[0m`, ...args);
  }

  security(msg: string, ...args: any[]) {
    // Magenta for security/audit logs
    console.log(`\x1b[35m${this.format('SECURITY', msg)}\x1b[0m`, ...args);
  }

  support(msg: string, ...args: any[]) {
    // Cyan for support/customer impacting logs
    console.log(`\x1b[36m${this.format('SUPPORT', msg)}\x1b[0m`, ...args);
  }

  error(msg: string, error?: any) {
    console.error(`\x1b[31m${this.format('ERROR', msg)}\x1b[0m`);
    if (error) {
      if (error instanceof Error) {
        console.error(error.stack);
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  }
}

export const logger = new Logger();
