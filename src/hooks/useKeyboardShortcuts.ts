import { useEffect } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';

export const useKeyboardShortcuts = () => {
  const { isPlaying, setIsPlaying, currentTime, setCurrentTime, project } = useTimelineStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        
        case 'KeyK':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;

        case 'KeyJ':
          // Rewind 5s
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - 5));
          break;

        case 'KeyL':
          // Fast forward 5s
          e.preventDefault();
          setCurrentTime(Math.min(project.duration, currentTime + 5));
          break;

        case 'ArrowLeft':
          // Nudge 1 frame (assuming 30fps)
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - 1/30));
          break;

        case 'ArrowRight':
          // Nudge 1 frame
          e.preventDefault();
          setCurrentTime(Math.min(project.duration, currentTime + 1/30));
          break;

        case 'KeyS':
          if (cmdOrCtrl) {
            e.preventDefault();
            console.log('💾 Manual Save Triggered');
            // Project is auto-saved via socket, but we could trigger a forced sync here
          }
          break;

        case 'Delete':
        case 'Backspace':
          // We'd need a way to track selected clips to implement this
          console.log('🗑️ Delete requested');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, project.duration, setIsPlaying, setCurrentTime]);
};
