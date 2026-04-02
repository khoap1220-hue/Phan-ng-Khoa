
import React from 'react';
import { Infinity, Edit3, Save, Terminal as TerminalIcon, Eye, Code2, DownloadCloud, Image as ImageIcon, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  handleExport: () => void;
  handleExportImages: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  handleExport, handleExportImages
}) => {
  const {
    state,
    setState,
    isEditingTitle,
    setIsEditingTitle,
    isSaved,
    createSnapshot,
    showTerminal,
    setShowTerminal,
    viewMode,
    setViewMode,
    handleNewProject
  } = useApp();

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-16 border-b border-white/5 bg-[#0b0f1a]/95 backdrop-blur-xl px-6 flex items-center justify-between z-50"
    >
      <div className="flex items-center gap-5">
        <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30 font-black flex items-center justify-center">
          <Infinity className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-3 group">
            {isEditingTitle ? (
              <input
                autoFocus
                className="bg-slate-900 border border-indigo-500/50 text-white text-sm font-black tracking-tighter uppercase px-2 py-0.5 rounded outline-none"
                value={state.projectName}
                onChange={(e) => setState(prev => ({ ...prev, projectName: e.target.value }))}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              />
            ) : (
              <h1 
                onClick={() => setIsEditingTitle(true)}
                className="text-sm font-black text-white tracking-tighter uppercase cursor-text hover:text-indigo-400 transition-colors flex items-center gap-2"
              >
                {state.projectName}
                <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
            )}
            {isSaved ? (
              <div className="text-[7px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">SYNCED</div>
            ) : (
              <div className="text-[7px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">SAVING...</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={handleNewProject} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full font-black text-xs transition-all border border-white/5"
        >
          <Plus className="w-3.5 h-3.5 text-blue-500" /> NEW PROJECT
        </button>

        <button 
          onClick={createSnapshot} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full font-black text-xs transition-all border border-white/5"
        >
          <Save className="w-3.5 h-3.5 text-emerald-500" /> SNAPSHOT
        </button>

        <button onClick={() => setShowTerminal(!showTerminal)} className={`p-2.5 rounded-full transition-all border ${showTerminal ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'}`}>
          <TerminalIcon className="w-4 h-4" />
        </button>
        
        <div className="h-6 w-px bg-white/5 mx-1"></div>

        <button onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')} className="flex items-center gap-2 px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full font-black text-xs transition-all border border-white/5 shadow-inner">
          {viewMode === 'edit' ? <Eye className="w-3.5 h-3.5 text-indigo-400" /> : <Code2 className="w-3.5 h-3.5 text-indigo-400" />}
          {viewMode === 'edit' ? 'PREVIEW' : 'EDITOR'}
        </button>

        <button onClick={handleExportImages} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full font-black text-xs transition-all border border-white/5 shadow-inner">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> MEDIA
        </button>

        <button onClick={handleExport} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-xs transition-all shadow-xl shadow-indigo-600/30 active:scale-95 border border-indigo-400/20">
          <DownloadCloud className="w-3.5 h-3.5" /> HTML
        </button>
      </div>
    </motion.header>
  );
};
