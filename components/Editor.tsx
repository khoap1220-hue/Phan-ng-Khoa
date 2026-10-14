
import React from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  title: string;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, title, readOnly = false }) => {
  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-lg border border-gray-800 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-800">
        <span className="text-sm font-medium text-gray-400 code-font uppercase tracking-wider">{title}</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        spellCheck={false}
        className="flex-1 p-4 bg-transparent text-gray-300 code-font text-sm outline-none resize-none leading-relaxed placeholder:text-gray-600"
        placeholder={readOnly ? "The upgraded code will appear here..." : "Paste your legacy HTML code here..."}
      />
    </div>
  );
};
