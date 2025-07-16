
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Tauri detection
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Initialize app
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

// Add Tauri-specific initialization if needed
if (isTauri) {
  console.log('Running in Tauri environment');
  // Add any Tauri-specific initialization here
}

root.render(<App />);
