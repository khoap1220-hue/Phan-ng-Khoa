import React, { useState, useEffect } from 'react';
import { MousePointer2, ChevronUp, ChevronDown, Trash2, Sparkles, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Block } from '../../types';

interface BlocksTabProps {
  blocks: Block[];
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string) => void;
  setViewMode: (mode: 'edit' | 'preview') => void;
  moveBlock: (id: string, dir: 'up' | 'down') => void;
  deleteBlock: (id: string) => void;
  newModuleQuery: string;
  setNewModuleQuery: (val: string) => void;
  handleAddModule: () => void;
  isAddingModule: boolean;
}

export const BlocksTab: React.FC<BlocksTabProps> = ({
  blocks, selectedBlockId, setSelectedBlockId, setViewMode,
  moveBlock, deleteBlock, newModuleQuery, setNewModuleQuery,
  handleAddModule, isAddingModule
}) => {
  const [localQuery, setLocalQuery] = useState(newModuleQuery);

  useEffect(() => {
    setLocalQuery(newModuleQuery);
  }, [newModuleQuery]);

  return (
    <>
      <AnimatePresence>
        <div className="space-y-2">
          {blocks.map((block, idx) => (
            <motion.div 
              key={block.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setSelectedBlockId(block.id); setViewMode('preview'); }}
              className={`group flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${selectedBlockId === block.id ? 'bg-blue-600/20 border-blue-500/40 text-white shadow-xl' : 'bg-transparent border-transparent hover:bg-white/5 text-slate-500'}`}
            >
              <MousePointer2 className={`w-3.5 h-3.5 ${selectedBlockId === block.id ? 'text-blue-400' : 'text-slate-700'}`} />
              <span className="text-[10px] font-black uppercase truncate flex-1 tracking-tight">{block.name}</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={idx === 0} className="p-1.5 hover:text-white disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={idx === blocks.length - 1} className="p-1.5 hover:text-white disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="p-1.5 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
          {blocks.length === 0 && (
            <div className="text-[10px] text-slate-600 italic text-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-slate-900/20">
              Chưa có section nào.<br/>Nhập mô tả bên dưới để bắt đầu.
            </div>
          )}
        </div>
      </AnimatePresence>

      <div className="mt-10 pt-8 border-t border-white/5 space-y-5">
         <div className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
           <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI Widget Creator
         </div>
         <div className="relative">
           <textarea
             value={localQuery}
             onChange={(e) => setLocalQuery(e.target.value)}
             onBlur={() => setNewModuleQuery(localQuery)}
             placeholder="Ví dụ: 'Thêm bảng giá 3 cột chuyên nghiệp'..."
             className="w-full bg-slate-900 border border-white/10 rounded-2xl p-5 text-xs font-medium text-white outline-none focus:border-blue-500/50 resize-none h-32 placeholder:text-slate-700 transition-all focus:ring-2 focus:ring-blue-500/10"
           />
         </div>
         <button 
           onClick={() => {
             setNewModuleQuery(localQuery);
             handleAddModule(localQuery);
           }}
           disabled={isAddingModule || !localQuery.trim()}
           className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-800"
         >
           {isAddingModule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
           Insert Widget
         </button>
      </div>
    </>
  );
};
