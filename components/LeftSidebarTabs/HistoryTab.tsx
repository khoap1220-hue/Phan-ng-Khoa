import React from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Snapshot } from '../../types';

interface HistoryTabProps {
  snapshots: Snapshot[];
  restoreSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  snapshots, restoreSnapshot, deleteSnapshot
}) => {
  return (
    <div className="space-y-3">
      {snapshots.length === 0 ? (
        <div className="text-[10px] text-slate-600 italic text-center py-10">Chưa có bản lưu nào.</div>
      ) : (
        snapshots.map(snap => (
          <div key={snap.id} className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-slate-800/50 transition-colors">
            <div>
              <div className="text-xs font-bold text-white mb-1">{snap.name}</div>
              <div className="text-[10px] text-slate-500">{snap.timestamp}</div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => restoreSnapshot(snap.id)} className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-colors" title="Khôi phục">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => deleteSnapshot(snap.id)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors" title="Xóa">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
