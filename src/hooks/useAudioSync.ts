import { useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { audioEngine } from '../lib/audioEngine';

export function useAudioSync() {
  const { isPlaying, currentTime, project } = useTimelineStore();
  const lastIsPlaying = useRef(isPlaying);
  const lastTime = useRef(currentTime);

  // Handle track settings updates (volume, pan, mute, solo)
  useEffect(() => {
    project.tracks.forEach(track => {
      audioEngine.setupTrack(track, project.tracks);
      audioEngine.updateTrackSettings(track, project.tracks);
    });
    audioEngine.setMasterVolume(project.masterVolume);
  }, [project.tracks, project.masterVolume]);

  // Handle playback sync
  useEffect(() => {
    const timeJumped = Math.abs(currentTime - lastTime.current) > 0.1;
    const playStateChanged = isPlaying !== lastIsPlaying.current;

    if (isPlaying) {
      if (playStateChanged || timeJumped) {
        audioEngine.play(project.tracks, currentTime);
      }
    } else {
      if (playStateChanged) {
        audioEngine.stopAll();
      }
    }

    lastIsPlaying.current = isPlaying;
    lastTime.current = currentTime;
  }, [isPlaying, currentTime, project.tracks]);

  // Preload clips when they are added
  useEffect(() => {
    project.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (clip.type === 'audio' || clip.type === 'video') {
          audioEngine.loadClip(clip);
        }
      });
    });
  }, [project.tracks]);

  return null;
}
