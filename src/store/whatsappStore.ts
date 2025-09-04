/**
 * WhatsApp Broadcast State Store
 * Zustand store for managing broadcast queue and state
 */

import { create } from 'zustand';
import { 
  QueueItem, 
  BroadcastState, 
  BroadcastStats, 
  WhatsAppSettings, 
  SendStatus 
} from '@/types/whatsapp';

interface WhatsAppStore {
  // Queue Management
  queue: QueueItem[];
  currentIndex: number;
  broadcastState: BroadcastState;
  stats: BroadcastStats;
  
  // Settings
  settings: WhatsAppSettings;
  
  // Actions
  setQueue: (queue: QueueItem[]) => void;
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void;
  setBroadcastState: (state: BroadcastState) => void;
  setCurrentIndex: (index: number) => void;
  updateStats: () => void;
  resetBroadcast: () => void;
  
  // Settings Actions
  updateSettings: (settings: Partial<WhatsAppSettings>) => void;
  
  // Utility Actions
  getNextQueuedItem: () => QueueItem | null;
  markItemCompleted: (id: string, status: SendStatus, error?: string) => void;
  cancelRemaining: () => void;
}

const DEFAULT_SETTINGS: WhatsAppSettings = {
  defaultCountryCode: '+91',
  sendInterval: 5,
  enableJitter: true,
  retryAttempts: 2,
  retryBackoffMs: 3000
};

// Load settings from localStorage
function loadSettings(): WhatsAppSettings {
  try {
    const stored = localStorage.getItem('whatsapp_settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Save settings to localStorage
function saveSettings(settings: WhatsAppSettings): void {
  try {
    localStorage.setItem('whatsapp_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save WhatsApp settings:', error);
  }
}

export const useWhatsAppStore = create<WhatsAppStore>((set, get) => ({
  // Initial State
  queue: [],
  currentIndex: 0,
  broadcastState: BroadcastState.IDLE,
  stats: {
    total: 0,
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    remaining: 0
  },
  settings: loadSettings(),
  
  // Queue Management Actions
  setQueue: (queue) => {
    set({ 
      queue, 
      currentIndex: 0,
      stats: {
        total: queue.length,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        remaining: queue.length
      }
    });
  },
  
  updateQueueItem: (id, updates) => {
    set((state) => ({
      queue: state.queue.map(item => 
        item.id === id 
          ? { ...item, ...updates, lastUpdate: Date.now() }
          : item
      )
    }));
    // Auto-update stats after item update
    get().updateStats();
  },
  
  setBroadcastState: (broadcastState) => {
    set({ broadcastState });
  },
  
  setCurrentIndex: (currentIndex) => {
    set({ currentIndex });
    get().updateStats();
  },
  
  updateStats: () => {
    const { queue } = get();
    
    const stats = queue.reduce(
      (acc, item) => {
        switch (item.status) {
          case SendStatus.SENT:
            acc.sent++;
            acc.processed++;
            break;
          case SendStatus.FAILED:
            acc.failed++;
            acc.processed++;
            break;
          case SendStatus.SKIPPED:
            acc.skipped++;
            acc.processed++;
            break;
          case SendStatus.CANCELLED:
            acc.processed++;
            break;
          // QUEUED and SENDING don't count as processed
        }
        return acc;
      },
      {
        total: queue.length,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        remaining: 0
      }
    );
    
    stats.remaining = stats.total - stats.processed;
    
    set({ stats });
  },
  
  resetBroadcast: () => {
    set({
      queue: [],
      currentIndex: 0,
      broadcastState: BroadcastState.IDLE,
      stats: {
        total: 0,
        processed: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        remaining: 0
      }
    });
  },
  
  // Settings Actions
  updateSettings: (newSettings) => {
    const updatedSettings = { ...get().settings, ...newSettings };
    set({ settings: updatedSettings });
    saveSettings(updatedSettings);
  },
  
  // Utility Actions
  getNextQueuedItem: () => {
    const { queue } = get();
    return queue.find(item => item.status === SendStatus.QUEUED) || null;
  },
  
  markItemCompleted: (id, status, error) => {
    get().updateQueueItem(id, { 
      status, 
      error,
      attempts: get().queue.find(item => item.id === id)?.attempts || 0
    });
  },
  
  cancelRemaining: () => {
    const { queue } = get();
    const updatedQueue = queue.map(item => 
      item.status === SendStatus.QUEUED 
        ? { ...item, status: SendStatus.CANCELLED, lastUpdate: Date.now() }
        : item
    );
    
    set({ queue: updatedQueue });
    get().updateStats();
  }
}));