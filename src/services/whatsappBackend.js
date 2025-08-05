const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

class WhatsAppBackend {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.connectedDevice = null;
    this.messageQueue = [];
    this.sessionPath = path.join(process.cwd(), '.wwebjs_auth');
    this.logPath = path.join(process.cwd(), 'logs', 'whatsapp.log');
    
    this.initializeClient();
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(path.dirname(this.logPath), { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  async log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.logPath, logLine);
      console.log(`[${level.toUpperCase()}] ${message}`, data || '');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  initializeClient() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'patch-library-system',
        dataPath: this.sessionPath
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('qr', async (qr) => {
      try {
        this.qrCode = await QRCode.toDataURL(qr, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        await this.log('info', 'QR Code generated');
        process.send && process.send({
          type: 'qr_generated',
          data: { qrCode: this.qrCode }
        });
      } catch (error) {
        await this.log('error', 'Failed to generate QR code', error.message);
      }
    });

    this.client.on('ready', async () => {
      this.isReady = true;
      const info = this.client.info;
      this.connectedDevice = {
        phone: info.wid.user,
        pushname: info.pushname,
        platform: info.platform
      };
      
      await this.log('info', 'WhatsApp client ready', this.connectedDevice);
      process.send && process.send({
        type: 'client_ready',
        data: this.connectedDevice
      });
    });

    this.client.on('authenticated', async () => {
      await this.log('info', 'WhatsApp authenticated');
      process.send && process.send({
        type: 'authenticated'
      });
    });

    this.client.on('auth_failure', async (msg) => {
      await this.log('error', 'Authentication failed', msg);
      process.send && process.send({
        type: 'auth_failure',
        data: { message: msg }
      });
    });

    this.client.on('disconnected', async (reason) => {
      this.isReady = false;
      this.connectedDevice = null;
      await this.log('warn', 'WhatsApp disconnected', reason);
      process.send && process.send({
        type: 'disconnected',
        data: { reason }
      });
    });

    this.client.on('message', async (message) => {
      // Log incoming messages for debugging
      await this.log('debug', 'Message received', {
        from: message.from,
        body: message.body.substring(0, 50)
      });
    });
  }

  async start() {
    try {
      await this.log('info', 'Starting WhatsApp client');
      await this.client.initialize();
    } catch (error) {
      await this.log('error', 'Failed to start WhatsApp client', error.message);
      throw error;
    }
  }

  async stop() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isReady = false;
        this.connectedDevice = null;
        await this.log('info', 'WhatsApp client stopped');
      }
    } catch (error) {
      await this.log('error', 'Failed to stop WhatsApp client', error.message);
    }
  }

  async resetSession() {
    try {
      await this.stop();
      
      // Clear session data
      try {
        await fs.rmdir(this.sessionPath, { recursive: true });
        await this.log('info', 'Session data cleared');
      } catch (error) {
        // Directory might not exist, that's fine
      }
      
      // Reinitialize
      this.initializeClient();
      await this.start();
      
    } catch (error) {
      await this.log('error', 'Failed to reset session', error.message);
      throw error;
    }
  }

  formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if missing (assuming India)
    let formatted = cleaned;
    if (cleaned.length === 10 && !cleaned.startsWith('91')) {
      formatted = '91' + cleaned;
    }
    
    // Validate
    if (formatted.length < 10 || formatted.length > 15) {
      throw new Error('Invalid phone number length');
    }
    
    return formatted + '@c.us';
  }

  async sendMessage(phoneNumber, message, attachmentPath = null) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client not ready');
      }

      const chatId = this.formatPhoneNumber(phoneNumber);
      
      await this.log('info', 'Sending message', {
        to: phoneNumber,
        hasAttachment: !!attachmentPath,
        messageLength: message.length
      });

      let result;
      
      if (attachmentPath && await this.fileExists(attachmentPath)) {
        const media = MessageMedia.fromFilePath(attachmentPath);
        result = await this.client.sendMessage(chatId, media, { caption: message });
      } else {
        result = await this.client.sendMessage(chatId, message);
      }

      await this.log('info', 'Message sent successfully', {
        to: phoneNumber,
        messageId: result.id
      });

      return {
        success: true,
        messageId: result.id,
        timestamp: result.timestamp
      };

    } catch (error) {
      await this.log('error', 'Failed to send message', {
        to: phoneNumber,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async testConnection() {
    try {
      if (!this.isReady || !this.connectedDevice) {
        return { success: false, error: 'Not connected' };
      }

      const testMessage = '🤖 Test message from PATCH Library System - Connection is working!';
      const result = await this.sendMessage(this.connectedDevice.phone, testMessage);
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      connectedDevice: this.connectedDevice,
      qrCode: this.qrCode
    };
  }

  async getLogs(limit = 50) {
    try {
      const logContent = await fs.readFile(this.logPath, 'utf8');
      const logs = logContent
        .trim()
        .split('\n')
        .filter(line => line.length > 0)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null)
        .slice(-limit);
      
      return logs;
    } catch (error) {
      return [];
    }
  }
}

// Handle process messages
const backend = new WhatsAppBackend();

process.on('message', async (message) => {
  try {
    const { type, data } = message;

    switch (type) {
      case 'start':
        await backend.start();
        break;

      case 'stop':
        await backend.stop();
        break;

      case 'reset_session':
        await backend.resetSession();
        break;

      case 'send_message':
        const result = await backend.sendMessage(
          data.phoneNumber,
          data.message,
          data.attachmentPath
        );
        process.send({
          type: 'message_result',
          id: data.id,
          result
        });
        break;

      case 'test_connection':
        const testResult = await backend.testConnection();
        process.send({
          type: 'test_result',
          result: testResult
        });
        break;

      case 'get_status':
        const status = backend.getStatus();
        process.send({
          type: 'status_result',
          result: status
        });
        break;

      case 'get_logs':
        const logs = await backend.getLogs(data?.limit || 50);
        process.send({
          type: 'logs_result',
          result: logs
        });
        break;
    }
  } catch (error) {
    process.send({
      type: 'error',
      error: error.message
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await backend.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await backend.stop();
  process.exit(0);
});

// Start the backend
backend.start().catch(console.error);