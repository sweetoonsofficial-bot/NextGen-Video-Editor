import React, { useEffect, useRef, useState } from 'react';
import { WebGPURenderer } from '../lib/webgpu';
import { useTimelineStore } from '../store/useTimelineStore';

export function useWebGPU(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const rendererRef = useRef<WebGPURenderer | null>(null);
  const video1Ref = useRef<HTMLVideoElement | null>(null);
  const video2Ref = useRef<HTMLVideoElement | null>(null);
  const { currentTime, project, effects, isPlaying } = useTimelineStore();
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const init = async () => {
      try {
        const renderer = new WebGPURenderer(canvasRef.current!);
        await renderer.init();
        rendererRef.current = renderer;
        
        const createVideo = () => {
          const v = document.createElement('video');
          v.muted = true;
          v.playsInline = true;
          v.crossOrigin = 'anonymous';
          return v;
        };

        video1Ref.current = createVideo();
        video2Ref.current = createVideo();
      } catch (err: any) {
        setError(err.message);
      }
    };

    init();

    const resizeObserver = new ResizeObserver(() => {
      if (canvasRef.current) {
        // Handle canvas resize if needed
      }
    });
    resizeObserver.observe(canvasRef.current);

    return () => {
      rendererRef.current = null;
      video1Ref.current = null;
      video2Ref.current = null;
      resizeObserver.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [canvasRef]);

  const render = async () => {
    if (!rendererRef.current || !video1Ref.current || !video2Ref.current) return;

    // Find active clips on all video tracks
    const videoClips = project.tracks
      .filter(t => t.type === 'video' && t.isVisible)
      .flatMap(t => t.clips)
      .filter(c => currentTime >= c.startTime && currentTime <= (c.startTime + c.duration))
      .sort((a, b) => {
        // Sort by track index (higher tracks on top)
        const aIdx = project.tracks.findIndex(t => t.id === a.trackId);
        const bIdx = project.tracks.findIndex(t => t.id === b.trackId);
        return bIdx - aIdx;
      });

    if (videoClips.length > 0) {
      const clip1 = videoClips[0];
      const clip2 = videoClips[1] || null; // Second clip for transition/overlay
      
      const setupVideo = async (video: HTMLVideoElement, clip: any) => {
        const sourceUrl = clip.proxyUrl || clip.originalUrl;
        if (sourceUrl && video.src !== sourceUrl) {
          video.src = sourceUrl;
          await new Promise((resolve) => {
            video.onloadeddata = resolve;
          });
        }
        if (video.readyState >= 2) {
          const clipTime = currentTime - clip.startTime + clip.sourceStart;
          if (!isPlaying || Math.abs(video.currentTime - clipTime) > 0.1) {
            video.currentTime = clipTime;
          }
        }
      };

      await setupVideo(video1Ref.current, clip1);
      if (clip2) {
        await setupVideo(video2Ref.current, clip2);
      }

      // Calculate mixFactor based on transition type
      let mixFactor = 0.0;
      const transitionDuration = 1.0; // 1 second transition

      if (clip1.transition === 'crossfade' && clip2) {
        const overlapStart = clip2.startTime;
        const overlapEnd = clip1.startTime + clip1.duration;
        const overlapDuration = overlapEnd - overlapStart;
        
        if (currentTime >= overlapStart && currentTime <= overlapEnd) {
          // Progress from 0.0 to 1.0 over the overlap
          mixFactor = (currentTime - overlapStart) / overlapDuration;
        }
      } else if (clip1.transition === 'fade-to-black') {
        const fadeStart = (clip1.startTime + clip1.duration) - transitionDuration;
        if (currentTime >= fadeStart) {
          // Progress from 0.0 to 1.0 in the last second
          mixFactor = (currentTime - fadeStart) / transitionDuration;
        }
      }
      
      if (video1Ref.current.readyState >= 2) {
        await rendererRef.current!.renderFrame(
          video1Ref.current, 
          clip2 && video2Ref.current.readyState >= 2 ? video2Ref.current : null,
          mixFactor,
          effects
        );
      }
    } else {
      await rendererRef.current?.clear();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        render();
        requestRef.current = requestAnimationFrame(loop);
      };
      requestRef.current = requestAnimationFrame(loop);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
    } else {
      render();
    }
  }, [isPlaying, currentTime, project, effects]);

  return { error };
}
