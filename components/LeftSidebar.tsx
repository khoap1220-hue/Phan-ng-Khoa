
import React from 'react';
import { Layers } from 'lucide-react';
import { BlocksTab } from './LeftSidebarTabs/BlocksTab';
import { HistoryTab } from './LeftSidebarTabs/HistoryTab';
import { SettingsTab } from './LeftSidebarTabs/SettingsTab';
import { useApp } from '../context/AppContext';

export const LeftSidebar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    state,
    setState,
    setViewMode,
    handleMoveBlock,
    newModuleQuery,
    setNewModuleQuery,
    handleAddModule,
    isAddingModule,
    restoreSnapshot,
    deleteSnapshot
  } = useApp();

  return (
    <aside className="w-full lg:w-72 h-full bg-[#0b0f1a] border-r border-white/5 flex flex-col shrink-0 shadow-2xl">
      <div className="p-5 bg-[#131929] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Cấu trúc trang</span>
        </div>
      </div>

      <div className="flex border-b border-white/5">
        <button 
          onClick={() => setSidebarTab('blocks')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${sidebarTab === 'blocks' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Blocks
        </button>
        <button 
          onClick={() => setSidebarTab('history')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${sidebarTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          History
        </button>
        <button 
          onClick={() => setSidebarTab('settings')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${sidebarTab === 'settings' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {sidebarTab === 'blocks' && (
          <BlocksTab 
            blocks={state.blocks}
            selectedBlockId={state.selectedBlockId}
            setSelectedBlockId={(id) => setState(prev => ({ ...prev, selectedBlockId: id }))}
            setViewMode={setViewMode}
            moveBlock={handleMoveBlock}
            deleteBlock={(id) => setState(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== id) }))}
            newModuleQuery={newModuleQuery}
            setNewModuleQuery={setNewModuleQuery}
            handleAddModule={handleAddModule}
            isAddingModule={isAddingModule}
          />
        )}

        {sidebarTab === 'history' && (
          <HistoryTab 
            snapshots={state.snapshots}
            restoreSnapshot={restoreSnapshot}
            deleteSnapshot={deleteSnapshot}
          />
        )}

        {sidebarTab === 'settings' && (
          <SettingsTab 
            designTone={state.designTone}
            setDesignTone={(tone) => setState(prev => ({ ...prev, designTone: tone }))}
          />
        )}
      </div>
      
      <div className="p-6 bg-slate-950/50 border-t border-white/5">
        <div className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em] mb-1">Omni Engine v2.5</div>
        <div className="text-[8px] font-bold text-slate-800 uppercase">Mobile-Optimized Interface</div>
      </div>
    </aside>
  );
};
