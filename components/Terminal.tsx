
import React from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  onClose: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, onClose }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-64 bg-[#0b0f1a] border-t border-white/10 z-[60] flex flex-col shadow-2xl">
      <div className="h-10 bg-[#131929] border-b border-white/5 flex items-center justify-between px-6 shrink-0 text-[10px] font-black uppercase">
        <div className="flex items-center gap-2 text-indigo-400"><TerminalIcon className="w-3.5 h-3.5" /> Engine Protocol Output</div>
        <button onClick={onClose} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1 code-font custom-scrollbar bg-slate-950 text-[10px]">
        {logs.map(log => (
          <div key={log.id} className="flex gap-3 text-slate-400 hover:bg-white/5 rounded px-1">
            <span className="shrink-0 text-slate-600">[{log.timestamp}]</span>
            <span className={`font-black w-12 ${log.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>{log.type}</span>
            <div className="flex-1">{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
