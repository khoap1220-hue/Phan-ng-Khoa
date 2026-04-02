import React from 'react';
import { DesignTone } from '../../types';

interface SettingsTabProps {
  designTone: DesignTone;
  setDesignTone: (tone: DesignTone) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  designTone, setDesignTone
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Design Tone</label>
        <select 
          value={designTone}
          onChange={(e) => setDesignTone(e.target.value as DesignTone)}
          className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500/50"
        >
          <option value="professional">Professional</option>
          <option value="minimalist">Minimalist</option>
          <option value="cyberpunk">Cyberpunk</option>
          <option value="playful">Playful</option>
          <option value="brutalist">Brutalist</option>
        </select>
      </div>
    </div>
  );
};
