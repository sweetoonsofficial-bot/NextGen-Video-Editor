import { create } from 'zustand';

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  proxyUrl?: string;
  thumbnailUrl?: string;
  isProcessing: boolean;
  isTranscribing: boolean;
  transcription?: string;
  file: File;
}

interface EditorState {
  isInitialized: boolean;
  activeTool: 'select' | 'razor' | 'hand';
  previewQuality: 'auto' | '360p' | '480p' | '720p' | '1080p';
  assets: MediaAsset[];
  
  setInitialized: (val: boolean) => void;
  setActiveTool: (tool: 'select' | 'razor' | 'hand') => void;
  setPreviewQuality: (quality: 'auto' | '360p' | '480p' | '720p' | '1080p') => void;
  addAsset: (asset: MediaAsset) => void;
  updateAsset: (id: string, updates: Partial<MediaAsset>) => void;
  removeAsset: (id: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  isInitialized: false,
  activeTool: 'select',
  previewQuality: 'auto',
  assets: [],
  
  setInitialized: (isInitialized) => set({ isInitialized }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setPreviewQuality: (previewQuality) => set({ previewQuality }),
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  updateAsset: (id, updates) => set((state) => ({
    assets: state.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  })),
  removeAsset: (id) => set((state) => ({
    assets: state.assets.filter((a) => a.id !== id),
  })),
}));
