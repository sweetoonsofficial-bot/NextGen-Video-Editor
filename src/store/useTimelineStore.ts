import { create } from 'zustand';
import { Track, MediaClip, Project } from '../types/editor';
import { socketService } from '../lib/socket';

interface TimelineState {
  project: Project;
  currentTime: number;
  zoom: number;
  selectedClipId: string | null;
  isPlaying: boolean;
  effects: {
    brightness: number;
    contrast: number;
    saturation: number;
    preset: 'none' | 'noir' | 'vivid' | 'sepia' | 'cyberpunk';
  };
  
  // Actions
  setProject: (project: Project) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
  setSelectedClipId: (id: string | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setEffects: (effects: Partial<TimelineState['effects']>) => void;
  
  addTrack: (track: Track) => void;
  addClip: (trackId: string, clip: MediaClip) => void;
  updateClip: (trackId: string, clipId: string, updates: Partial<MediaClip>) => void;
  removeClip: (trackId: string, clipId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  setMasterVolume: (volume: number) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  project: {
    id: 'default',
    name: 'NextGen Project',
    fps: 30,
    width: 1920,
    height: 1080,
    duration: 0,
    tracks: [
      { id: 'v1', name: 'Video 1', type: 'video', clips: [], isLocked: false, isVisible: true, isMuted: false, isSoloed: false, volume: 1, pan: 0 },
      { id: 'a1', name: 'Audio 1', type: 'audio', clips: [], isLocked: false, isVisible: true, isMuted: false, isSoloed: false, volume: 1, pan: 0 },
    ],
    masterVolume: 1,
  },
  currentTime: 0,
  zoom: 10, // pixels per second
  selectedClipId: null,
  isPlaying: false,
  effects: {
    brightness: 0,
    contrast: 1,
    saturation: 1,
    preset: 'none',
  },

  setProject: (project) => {
    set({ project });
    socketService.emitTimelineUpdate(project.id, project);
  },
  setCurrentTime: (currentTime) => set({ currentTime }),
  setZoom: (zoom) => set({ zoom }),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setEffects: (effects) => set((state) => {
    const newState = { effects: { ...state.effects, ...effects } };
    socketService.emitTimelineUpdate(state.project.id, newState);
    return newState;
  }),

  addTrack: (track) => set((state) => {
    const project = { ...state.project, tracks: [...state.project.tracks, track] };
    socketService.emitTimelineUpdate(project.id, project);
    return { project };
  }),

  addClip: (trackId, clip) => set((state) => {
    const tracks = state.project.tracks.map(t => 
      t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
    );
    const maxDuration = Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 0);
    const project = {
      ...state.project,
      tracks,
      duration: maxDuration
    };
    socketService.emitTimelineUpdate(project.id, project);
    return { project };
  }),

  updateClip: (trackId, clipId, updates) => set((state) => {
    const tracks = state.project.tracks.map(t => 
      t.id === trackId ? {
        ...t,
        clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c)
      } : t
    );
    const maxDuration = Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 0);
    const project = {
      ...state.project,
      tracks,
      duration: maxDuration
    };
    socketService.emitTimelineUpdate(project.id, project);
    return { project };
  }),

  removeClip: (trackId, clipId) => set((state) => {
    const tracks = state.project.tracks.map(t => 
      t.id === trackId ? { ...t, clips: t.clips.filter(c => c.id !== clipId) } : t
    );
    const maxDuration = Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 0);
    const project = {
      ...state.project,
      tracks,
      duration: maxDuration
    };
    socketService.emitTimelineUpdate(project.id, project);
    return { project };
  }),

  updateTrack: (trackId, updates) => set((state) => {
    const tracks = state.project.tracks.map(t => 
      t.id === trackId ? { ...t, ...updates } : t
    );
    
    // Handle solo logic: if any track is soloed, others are effectively muted
    const hasSolo = tracks.some(t => t.isSoloed);
    
    const project = {
      ...state.project,
      tracks
    };
    socketService.emitTimelineUpdate(project.id, project);
    return { project };
  }),

  setMasterVolume: (volume) => set((state) => {
    const project = { ...state.project, masterVolume: volume };
    socketService.emitTimelineUpdate(project.id, project);
    return { project };
  }),
}));
