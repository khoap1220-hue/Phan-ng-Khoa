
import React, { useState } from 'react';
import { Sparkles, Volume2, VolumeX, RefreshCw, Search, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { DesignTone } from '../types';

export const MagicBar: React.FC = () => {
  const {
    state,
    playNarration,
    handleGlobalRemix,
    handleAnalyzeSEO,
    isProcessing
  } = useApp();

  const [showRemixMenu, setShowRemixMenu] = useState(false);

  const tones: { id: DesignTone; label: string; icon: string }[] = [
    { id: 'professional', label: 'Professional', icon: '🏢' },
    { id: 'minimalist', label: 'Minimalist', icon: '⚪' },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌆' },
    { id: 'playful', label: 'Playful', icon: '🎈' },
    { id: 'brutalist', label: 'Brutalist', icon: '🏗️' },
    { id: 'luxury', label: 'Luxury', icon: '💎' },
    { id: 'organic', label: 'Organic', icon: '🌿' },
    { id: 'atmospheric', label: 'Atmospheric', icon: '☁️' },
    { id: 'clean', label: 'Clean', icon: '✨' },
    { id: 'bold', label: 'Bold', icon: '🔥' }
  ];

  if (state.blocks.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 p-1.5 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* AI Voice Pitch */}
      <button
        onClick={playNarration}
        disabled={state.isAudioPlaying || isProcessing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
          ${state.isAudioPlaying 
            ? 'bg-emerald-500 text-white animate-pulse' 
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}
          disabled:opacity-50
        `}
      >
        {state.isAudioPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{state.isAudioPlaying ? 'Playing Audio' : 'AI Voice Pitch'}</span>
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* AI Global Remix */}
      <div className="relative">
        <button
          onClick={() => setShowRemixMenu(!showRemixMenu)}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border border-indigo-500/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">AI Remix</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showRemixMenu ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showRemixMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-2 grid grid-cols-1 gap-1"
            >
              <div className="px-3 py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">Select Design Tone</div>
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    handleGlobalRemix(t.id);
                    setShowRemixMenu(false);
                  }}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold transition-all
                    ${state.designTone === t.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span>{t.icon}</span>
                    {t.label}
                  </span>
                  {state.designTone === t.id && <Check className="w-3 h-3" />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* SEO Analysis */}
      <button
        onClick={handleAnalyzeSEO}
        disabled={isProcessing}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">SEO Audit</span>
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Magic Sparkles */}
      <div className="px-3 py-2 text-indigo-400 animate-pulse">
        <Sparkles className="w-4 h-4" />
      </div>
    </div>
  );
};
