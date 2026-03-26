import React, { useEffect, useState, useRef } from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { audioEngine } from '../../lib/audioEngine';
import { Volume2, VolumeX, Headphones, Sliders } from 'lucide-react';
import { motion } from 'motion/react';

const Meter: React.FC<{ trackId: string }> = ({ trackId }) => {
  const [level, setLevel] = useState(0);
  const requestRef = useRef<number>();

  const animate = () => {
    const currentLevel = audioEngine.getLevels(trackId);
    setLevel(currentLevel);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [trackId]);

  return (
    <div className="w-2 h-32 bg-zinc-900 rounded-full overflow-hidden relative flex flex-col justify-end">
      <div 
        className="w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
        style={{ height: `${level * 100}%` }}
      />
      {/* Level Markers */}
      <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-20">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-full h-px bg-white" />
        ))}
      </div>
    </div>
  );
};

export const Mixer: React.FC = () => {
  const { project, updateTrack } = useTimelineStore();

  return (
    <div className="h-full bg-[#121212] border-l border-[#282828] flex flex-col w-80">
      <div className="p-4 border-b border-[#282828] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-orange-500" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Audio Mixer</h2>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto flex p-4 gap-4">
        {project.tracks.map((track) => (
          <div key={track.id} className="flex flex-col items-center gap-4 min-w-[80px]">
            {/* Meter and Fader */}
            <div className="flex gap-2 h-48 items-end">
              <Meter trackId={track.id} />
              <div className="relative h-40 w-8 flex items-center justify-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={track.volume}
                  onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                  className="absolute -rotate-90 w-32 appearance-none bg-zinc-800 h-1 rounded-full cursor-pointer accent-orange-500"
                  style={{ transformOrigin: 'center' }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-1">
                <button
                  onClick={() => updateTrack(track.id, { isMuted: !track.isMuted })}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                    track.isMuted ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => updateTrack(track.id, { isSoloed: !track.isSoloed })}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors ${
                    track.isSoloed ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  S
                </button>
              </div>

              {/* Pan Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
                  <span>L</span>
                  <span>C</span>
                  <span>R</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={track.pan}
                  onChange={(e) => updateTrack(track.id, { pan: parseFloat(e.target.value) })}
                  className="w-full appearance-none bg-zinc-800 h-1 rounded-full cursor-pointer accent-zinc-400"
                />
              </div>

              <div className="text-[10px] font-medium text-zinc-500 truncate text-center mt-2">
                {track.name}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Master Section */}
      <div className="p-4 bg-[#0a0a0a] border-t border-[#282828] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Master</span>
          <Volume2 size={14} className="text-zinc-500" />
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden relative group cursor-pointer">
            <input 
              type="range"
              min="0" max="1" step="0.01"
              value={project.masterVolume}
              onChange={(e) => useTimelineStore.getState().setMasterVolume(parseFloat(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div 
              className="h-full bg-orange-500 transition-all" 
              style={{ width: `${project.masterVolume * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {(20 * Math.log10(project.masterVolume || 0.0001)).toFixed(1)} dB
          </span>
        </div>
      </div>
    </div>
  );
};
