type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'SUCCESS' | 'ACTIVITY';

interface LogOptions {
  module?: string;
  userId?: string;
  action?: string;
  details?: Record<string, unknown>;
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const levelColors: Record<LogLevel, string> = {
  INFO: colors.blue,
  WARN: colors.yellow,
  ERROR: colors.red,
  DEBUG: colors.magenta,
  SUCCESS: colors.green,
  ACTIVITY: colors.cyan,
};

const levelIcons: Record<LogLevel, string> = {
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  DEBUG: '🔍',
  SUCCESS: '✅',
  ACTIVITY: '📝',
};

function formatTimestamp(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
  const timestamp = formatTimestamp();
  const icon = levelIcons[level];
  const color = levelColors[level];
  const module = options?.module ? `[${options.module}]` : '';
  const userId = options?.userId ? `(User: ${options.userId})` : '';
  const action = options?.action ? `Action: ${options.action}` : '';
  
  let formattedMessage = `${color}${timestamp} ${icon} ${level}${colors.reset} ${module} ${message}`;
  
  if (userId) {
    formattedMessage += ` ${colors.dim}${userId}${colors.reset}`;
  }
  
  if (action) {
    formattedMessage += ` ${colors.cyan}[${action}]${colors.reset}`;
  }
  
  return formattedMessage;
}

class Logger {
  private showDebug: boolean;

  constructor() {
    this.showDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
  }

  info(message: string, options?: LogOptions): void {
    console.log(formatMessage('INFO', message, options));
    if (options?.details) {
      console.log('   Details:', JSON.stringify(options.details, null, 2));
    }
  }

  warn(message: string, options?: LogOptions): void {
    console.warn(formatMessage('WARN', message, options));
    if (options?.details) {
      console.warn('   Details:', JSON.stringify(options.details, null, 2));
    }
  }

  error(message: string, error?: Error | unknown, options?: LogOptions): void {
    console.error(formatMessage('ERROR', message, options));
    if (error) {
      if (error instanceof Error) {
        console.error(`   Error: ${error.message}`);
        if (error.stack && this.showDebug) {
          console.error(`   Stack: ${error.stack}`);
        }
      } else {
        console.error('   Error:', error);
      }
    }
    if (options?.details) {
      console.error('   Details:', JSON.stringify(options.details, null, 2));
    }
  }

  debug(message: string, options?: LogOptions): void {
    if (this.showDebug) {
      console.log(formatMessage('DEBUG', message, options));
      if (options?.details) {
        console.log('   Details:', JSON.stringify(options.details, null, 2));
      }
    }
  }

  success(message: string, options?: LogOptions): void {
    console.log(formatMessage('SUCCESS', message, options));
    if (options?.details) {
      console.log('   Details:', JSON.stringify(options.details, null, 2));
    }
  }

  activity(message: string, options?: LogOptions): void {
    console.log(formatMessage('ACTIVITY', message, options));
    if (options?.details) {
      console.log('   Details:', JSON.stringify(options.details, null, 2));
    }
  }

  request(method: string, path: string, statusCode?: number, duration?: number, userId?: string): void {
    const status = statusCode 
      ? (statusCode >= 400 ? colors.red : statusCode >= 300 ? colors.yellow : colors.green)
      : colors.white;
    
    const durationStr = duration ? `${duration}ms` : '';
    const userStr = userId ? `(User: ${userId})` : '';
    
    console.log(
      `${colors.cyan}${formatTimestamp()}${colors.reset} ` +
      `${colors.bright}${method}${colors.reset} ${path} ` +
      `${status}${statusCode || ''}${colors.reset} ` +
      `${colors.dim}${durationStr} ${userStr}${colors.reset}`
    );
  }

  api(endpoint: string, action: string, success: boolean, details?: Record<string, unknown>): void {
    const icon = success ? '✅' : '❌';
    const color = success ? colors.green : colors.red;
    console.log(
      `${colors.cyan}${formatTimestamp()}${colors.reset} ` +
      `${color}${icon} API${colors.reset} ` +
      `[${endpoint}] ${action}`
    );
    if (details) {
      console.log('   Details:', JSON.stringify(details, null, 2));
    }
  }

  db(operation: string, table: string, success: boolean, recordCount?: number, error?: Error): void {
    const icon = success ? '💾' : '❌';
    const color = success ? colors.green : colors.red;
    const countStr = recordCount !== undefined ? `(${recordCount} records)` : '';
    
    console.log(
      `${colors.cyan}${formatTimestamp()}${colors.reset} ` +
      `${color}${icon} DB${colors.reset} ` +
      `${operation} on ${table} ${countStr}`
    );
    
    if (!success && error) {
      console.error(`   Error: ${error.message}`);
    }
  }

  auth(action: string, email: string, success: boolean, reason?: string): void {
    const icon = success ? '🔐' : '🚫';
    const color = success ? colors.green : colors.red;
    
    console.log(
      `${colors.cyan}${formatTimestamp()}${colors.reset} ` +
      `${color}${icon} AUTH${colors.reset} ` +
      `${action} - ${email} ${success ? 'SUCCESS' : 'FAILED'}` +
      (reason ? ` (${reason})` : '')
    );
  }

  security(event: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', details?: Record<string, unknown>): void {
    const severityColors = {
      LOW: colors.yellow,
      MEDIUM: colors.yellow,
      HIGH: colors.red,
      CRITICAL: colors.red + colors.bright,
    };
    
    console.warn(
      `${colors.cyan}${formatTimestamp()}${colors.reset} ` +
      `${severityColors[severity]}🚨 SECURITY [${severity}]${colors.reset} ` +
      `${event}`
    );
    
    if (details) {
      console.warn('   Details:', JSON.stringify(details, null, 2));
    }
  }

  divider(title?: string): void {
    const line = '='.repeat(60);
    if (title) {
      console.log(`\n${line}\n${title}\n${line}`);
    } else {
      console.log(line);
    }
  }
}

export const logger = new Logger();
export default logger;
