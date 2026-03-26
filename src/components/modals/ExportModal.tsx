import React, { useState, useEffect } from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { audioEngine } from '../../lib/audioEngine';
import { Download, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { project, setCurrentTime, setIsPlaying } = useTimelineStore();
  const [status, setStatus] = useState<'idle' | 'rendering' | 'completed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState('video/webm;codecs=vp9,opus');

  const startExport = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      setStatus('error');
      return;
    }

    try {
      setStatus('rendering');
      setProgress(0);
      setIsPlaying(false);
      setCurrentTime(0);

      // Wait for seek
      await new Promise(resolve => setTimeout(resolve, 500));

      const videoStream = canvas.captureStream(30);
      const audioStream = audioEngine.getStream();
      
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...(audioStream ? audioStream.getAudioTracks() : [])
      ]);

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: format,
        videoBitsPerSecond: 5000000 // 5Mbps
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: format });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '_')}_export.webm`;
        a.click();
        setStatus('completed');
      };

      recorder.start();
      setIsPlaying(true);

      const duration = project.duration;
      const startTime = Date.now();

      const updateProgress = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(currentProgress);

        if (elapsed < duration) {
          requestAnimationFrame(updateProgress);
        } else {
          recorder.stop();
          setIsPlaying(false);
          setCurrentTime(0);
        }
      };

      updateProgress();
    } catch (error) {
      console.error('Export failed:', error);
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#181818] border border-[#282828] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[#282828] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="text-orange-500" size={20} />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Export Project</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {status === 'idle' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Format</label>
                <select 
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="video/webm;codecs=vp9,opus">WebM (VP9/Opus) - High Quality</option>
                  <option value="video/webm;codecs=vp8,opus">WebM (VP8/Opus) - Fast</option>
                </select>
              </div>

              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Resolution</span>
                  <span className="text-white">{project.width}x{project.height}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Duration</span>
                  <span className="text-white">{project.duration.toFixed(2)}s</span>
                </div>
              </div>

              <button 
                onClick={startExport}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Start Export
              </button>
            </div>
          )}

          {status === 'rendering' && (
            <div className="text-center space-y-6 py-4">
              <div className="relative inline-flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-500" size={64} strokeWidth={1} />
                <span className="absolute text-xs font-mono font-bold text-white">{Math.round(progress)}%</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold">Rendering Project...</h3>
                <p className="text-xs text-zinc-500">Please keep this tab active during export.</p>
              </div>
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-500" size={32} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold">Export Complete!</h3>
                <p className="text-xs text-zinc-500">Your file has been downloaded.</p>
              </div>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-500" size={32} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold">Export Failed</h3>
                <p className="text-xs text-zinc-500">An error occurred during rendering.</p>
              </div>
              <button 
                onClick={() => setStatus('idle')}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
