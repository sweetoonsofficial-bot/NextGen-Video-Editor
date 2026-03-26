export type MediaType = 'video' | 'audio' | 'image';

export interface MediaClip {
  id: string;
  name: string;
  type: MediaType;
  startTime: number; // Start time in the timeline (seconds)
  duration: number; // Duration in the timeline (seconds)
  sourceStart: number; // Start time within the source file (seconds)
  trackId: string;
  fileHandle?: FileSystemFileHandle;
  proxyUrl?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  volume: number;
  opacity: number;
  transition?: 'none' | 'crossfade' | 'fade-to-black';
  transform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio';
  clips: MediaClip[];
  isLocked: boolean;
  isVisible: boolean;
  isMuted: boolean;
  isSoloed: boolean;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
}

export interface Project {
  id: string;
  name: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  tracks: Track[];
  masterVolume: number; // 0 to 1
}
