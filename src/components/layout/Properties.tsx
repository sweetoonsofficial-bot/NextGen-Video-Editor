import React from 'react';
import { 
  ChevronDown, 
  Info,
  Lock,
  Eye,
  Sliders,
  Type
} from 'lucide-react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useEditorStore } from '../../store/useEditorStore';

import { Mixer } from '../editor/Mixer';

export const Properties: React.FC = () => {
  const { selectedClipId, effects, setEffects, project } = useTimelineStore();
  const { assets } = useEditorStore();

  const selectedClip = project.tracks
    .flatMap(t => t.clips)
    .find(c => c.id === selectedClipId);

  // Find the corresponding asset for the selected clip
  const asset = assets.find(a => a.name === selectedClip?.name);

  return (
    <aside className="w-80 bg-[#121212] border-l border-[#282828] flex flex-col z-20">
      <div className="h-12 border-b border-[#282828] flex items-center px-4 justify-between">
        <h2 className="text-zinc-200 text-sm font-semibold uppercase tracking-wider">Properties & Mixer</h2>
        <Info size={14} className="text-zinc-500" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Mixer Section */}
        <section className="h-80 -mx-4 border-b border-[#282828]">
          <Mixer />
        </section>

        {/* Global Effects Section (Always visible) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-orange-500" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-tighter">Global Color Grading</span>
          </div>
          
          <div className="pl-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-500 uppercase">Brightness</label>
                <span className="text-[10px] text-orange-500">{(effects.brightness * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="-1" max="1" step="0.01" 
                value={effects.brightness}
                onChange={(e) => setEffects({ brightness: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-500 uppercase">Contrast</label>
                <span className="text-[10px] text-orange-500">{effects.contrast.toFixed(2)}x</span>
              </div>
              <input 
                type="range" 
                min="0" max="2" step="0.01" 
                value={effects.contrast}
                onChange={(e) => setEffects({ contrast: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-500 uppercase">Saturation</label>
                <span className="text-[10px] text-orange-500">{effects.saturation.toFixed(2)}x</span>
              </div>
              <input 
                type="range" 
                min="0" max="2" step="0.01" 
                value={effects.saturation}
                onChange={(e) => setEffects({ saturation: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase">Color Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'noir', 'vivid', 'sepia', 'cyberpunk'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setEffects({ preset: p })}
                    className={`px-2 py-1.5 rounded text-[10px] uppercase font-bold transition-all border ${
                      effects.preset === p 
                        ? 'bg-orange-500 border-orange-500 text-white' 
                        : 'bg-[#1a1a1a] border-[#282828] text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#282828]" />

        {!selectedClipId ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 opacity-40 pt-10">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-600 flex items-center justify-center">
              <Info size={20} />
            </div>
            <p className="text-xs text-zinc-400">Select a clip on the timeline to view its properties</p>
          </div>
        ) : (
          <>
            {/* Transform Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2">
                  <ChevronDown size={14} className="text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-300">Transform</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Lock size={12} className="text-zinc-600" />
                  <Eye size={12} className="text-zinc-600" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase">Position X</label>
                  <input type="number" className="w-full bg-[#1a1a1a] border border-[#282828] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-orange-500" defaultValue={0} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase">Position Y</label>
                  <input type="number" className="w-full bg-[#1a1a1a] border border-[#282828] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-orange-500" defaultValue={0} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase">Scale</label>
                  <input type="number" className="w-full bg-[#1a1a1a] border border-[#282828] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-orange-500" defaultValue={100} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase">Rotation</label>
                  <input type="number" className="w-full bg-[#1a1a1a] border border-[#282828] rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-orange-500" defaultValue={0} />
                </div>
              </div>
            </section>

            {/* Opacity Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ChevronDown size={14} className="text-zinc-500" />
                <span className="text-xs font-medium text-zinc-300">Compositing</span>
              </div>
              <div className="pl-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-zinc-500 uppercase">Opacity</label>
                    <span className="text-[10px] text-orange-500">{(selectedClip.opacity * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01"
                    value={selectedClip.opacity}
                    onChange={(e) => useTimelineStore.getState().updateClip(selectedClip.trackId, selectedClip.id, { opacity: parseFloat(e.target.value) })}
                    className="w-full accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase">Transition</label>
                  <select 
                    value={selectedClip.transition || 'none'}
                    onChange={(e) => useTimelineStore.getState().updateClip(selectedClip.trackId, selectedClip.id, { transition: e.target.value as any })}
                    className="w-full bg-[#1a1a1a] border border-[#282828] rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-orange-500"
                  >
                    <option value="none">None</option>
                    <option value="crossfade">Crossfade (Overlap)</option>
                    <option value="fade-to-black">Fade to Black</option>
                  </select>
                </div>
              </div>
            </section>

            {/* AI Transcription Section */}
            {asset?.transcription && (
              <section className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Type size={14} className="text-orange-500" />
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-tighter">AI Transcription</span>
                </div>
                <div className="pl-6">
                  <div className="bg-[#1a1a1a] border border-[#282828] rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-[11px] leading-relaxed text-zinc-400 italic">
                      "{asset.transcription}"
                    </p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
