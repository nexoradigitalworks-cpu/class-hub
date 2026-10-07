export type LogCategory = 'network' | 'adapter' | 'lifecycle' | 'push';
export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  category: LogCategory;
  level: LogLevel;
  message: string;
  details?: any;
}

const MAX_LOGS = 300;
const STORAGE_KEY = 'classhub_debug_logs';

/**
 * Sanitizes objects and strings to ensure no sensitive credentials,
 * bearer tokens, or secrets appear in debug logs.
 */
export function sanitizeLogData(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact Bearer tokens, long JWTs, or passwords in raw text
    let sanitized = data;
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, 'Bearer [REDACTED_TOKEN]');
    sanitized = sanitized.replace(/eyJ[A-Za-z0-9-_=.]+/gi, '[REDACTED_JWT]');
    sanitized = sanitized.replace(/(password|pass|secret|token|apiKey|vapidKey)=[^&\s]+/gi, '$1=[REDACTED]');
    return sanitized;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  if (typeof data === 'object') {
    const cleanObj: Record<string, any> = {};
    const sensitiveKeys = [
      'token', 'access_token', 'refresh_token', 'authorization', 'password',
      'pass', 'secret', 'client_secret', 'apikey', 'api_key', 'vapidkey', 'vapid_key',
      'private_key', 'session'
    ];

    for (const [key, val] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(s => lowerKey.includes(s))) {
        cleanObj[key] = '[REDACTED]';
      } else {
        cleanObj[key] = sanitizeLogData(val);
      }
    }
    return cleanObj;
  }

  return String(data);
}

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.logs = parsed.slice(-MAX_LOGS);
        }
      }
    } catch {
      this.logs = [];
    }
  }

  private saveToStorage() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-100)));
    } catch {
      // ignore storage quota errors
    }
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach(fn => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public log(category: LogCategory, level: LogLevel, message: string, details?: any): LogEntry {
    const entry: LogEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      }),
      category,
      level,
      message,
      details: details !== undefined ? sanitizeLogData(details) : undefined
    };

    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.pop();
    }

    // Mirror to standard browser console with prefix
    const prefix = `[ClassHub Debug::${category.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message, entry.details ?? '');
    } else if (level === 'warn') {
      console.warn(prefix, message, entry.details ?? '');
    } else {
      console.log(prefix, message, entry.details ?? '');
    }

    this.notify();
    return entry;
  }

  public network(level: LogLevel, message: string, details?: any) {
    return this.log('network', level, message, details);
  }

  public adapter(level: LogLevel, message: string, details?: any) {
    return this.log('adapter', level, message, details);
  }

  public lifecycle(level: LogLevel, message: string, details?: any) {
    return this.log('lifecycle', level, message, details);
  }

  public push(level: LogLevel, message: string, details?: any) {
    return this.log('push', level, message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }
}

export const logger = new LoggerService();
