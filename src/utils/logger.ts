interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'whatsapp' | 'pdf' | 'auth' | 'general';
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private storageKey = 'app_logs';

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  private saveLogs() {
    try {
      // Keep only the most recent logs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  private addLog(level: LogEntry['level'], category: LogEntry['category'], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);
    this.saveLogs();

    // Also log to console for debugging
    const consoleMessage = `[${category.toUpperCase()}] ${message}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, data);
        break;
      case 'warn':
        console.warn(consoleMessage, data);
        break;
      case 'debug':
        console.debug(consoleMessage, data);
        break;
      default:
        console.log(consoleMessage, data);
    }
  }

  info(category: LogEntry['category'], message: string, data?: any) {
    this.addLog('info', category, message, data);
  }

  warn(category: LogEntry['category'], message: string, data?: any) {
    this.addLog('warn', category, message, data);
  }

  error(category: LogEntry['category'], message: string, data?: any) {
    this.addLog('error', category, message, data);
  }

  debug(category: LogEntry['category'], message: string, data?: any) {
    this.addLog('debug', category, message, data);
  }

  getLogs(category?: LogEntry['category'], level?: LogEntry['level']): LogEntry[] {
    let filtered = [...this.logs];

    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    return filtered.reverse(); // Most recent first
  }

  getRecentLogs(limit = 50): LogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
    console.log('All logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
export type { LogEntry };
