
import React from 'react';
import { Palette, Maximize2, FileText, Send, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export const RightSidebar: React.FC = () => {
  const {
    state,
    setState,
    deployFormBlock,
    handleSmartPalette,
    isSyncingPalette
  } = useApp();

  const handleReset = () => setState(prev => ({ ...prev, blocks: [] }));

  return (
    <motion.aside 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-[#0b0f1a] border-l border-white/5 p-6 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar"
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Palette className="w-3.5 h-3.5 text-indigo-400" /> Identity</h3>
        <button 
          onClick={handleSmartPalette}
          disabled={isSyncingPalette}
          className="p-2 hover:bg-indigo-600/10 rounded-lg text-indigo-400 transition-all active:scale-90 disabled:opacity-50"
          title="Magic Color Sync"
        >
          {isSyncingPalette ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Accent Color */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">Accent Master</label>
          <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-white/10">
            <input type="color" value={state.accentColor} onChange={(e) => setState(prev => ({ ...prev, accentColor: e.target.value }))} className="w-8 h-8 bg-transparent cursor-pointer border-none rounded overflow-hidden" />
            <span className="text-[10px] font-mono font-black text-white uppercase flex-1">{state.accentColor}</span>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-2">Typography</label>
          <select value={state.fontFamily} onChange={(e) => setState(prev => ({ ...prev, fontFamily: e.target.value }))} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-[10px] font-black text-white outline-none focus:border-indigo-500/50">
            <option value="Inter">Inter Sans</option>
            <option value="Playfair Display">Elegant Serif</option>
            <option value="Fira Code">Mono Tech</option>
            <option value="Montserrat">Montserrat Modern</option>
            <option value="Roboto">Roboto Professional</option>
          </select>
        </div>

        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 pt-4 border-t border-white/5"><Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Spacing & Geometry</h3>

        {/* Spacing Scale */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Module Spacing</label>
            <span className="text-[9px] font-mono text-indigo-400">x{state.spacingScale.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="0.2" max="3" step="0.1" 
            value={state.spacingScale} 
            onChange={(e) => setState(prev => ({ ...prev, spacingScale: parseFloat(e.target.value) }))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase">Corner Radius</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'SHARP', val: '0px' },
              { label: 'SOFT', val: '0.5rem' },
              { label: 'ROUND', val: '1.25rem' },
              { label: 'FULL', val: '9999px' }
            ].map((r) => (
              <button 
                key={r.val} 
                onClick={() => setState(prev => ({ ...prev, borderRadius: r.val }))}
                className={`py-2 rounded-lg text-[8px] font-black border transition-all ${state.borderRadius === r.val ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-white/10 text-slate-500 hover:border-white/20'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shadow Intensity */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Shadow Depth</label>
            <span className="text-[9px] font-mono text-indigo-400">{Math.round(state.shadowIntensity * 100)}%</span>
          </div>
          <input 
            type="range" min="0" max="1" step="0.05" 
            value={state.shadowIntensity} 
            onChange={(e) => setState(prev => ({ ...prev, shadowIntensity: parseFloat(e.target.value) }))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 pt-4 border-t border-white/5"><FileText className="w-3.5 h-3.5 text-indigo-400" /> Lead Capture</h3>

        {/* Google Form Integration */}
        <div className="space-y-3">
          <label className="text-[9px] font-bold text-slate-500 uppercase">Google Form Link</label>
          <textarea 
            value={state.googleFormUrl}
            onChange={(e) => setState(prev => ({ ...prev, googleFormUrl: e.target.value }))}
            placeholder="Paste your form URL here..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-[10px] font-medium text-slate-300 outline-none focus:border-indigo-500/40 resize-none h-16 placeholder:text-slate-700"
          />
          <button 
            onClick={deployFormBlock}
            className="w-full py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-3 h-3" /> Sync Form Module
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-2">
          <button 
            onClick={handleReset} 
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Reset Studio
          </button>
          <div className="text-[7px] text-center text-slate-800 font-black uppercase tracking-[0.2em]">Omni-Builder SUPER Pro 2026</div>
        </div>
      </div>
    </motion.aside>
  );
};
