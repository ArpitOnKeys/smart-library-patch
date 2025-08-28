// Three.js type augmentations for better TypeScript support

declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

// Extend Navigator interface for deviceMemory API
declare global {
  interface Navigator {
    readonly deviceMemory?: number;
  }
}

// Extend window for Tauri context
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

export {};