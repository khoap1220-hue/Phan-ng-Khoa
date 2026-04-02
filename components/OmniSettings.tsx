import React, { useEffect } from 'react';
import { Upload, Monitor, Smartphone, Square, X } from 'lucide-react';

interface OmniSettingsProps {
  omniMode: string;
  omniAspectRatios: string[];
  setOmniAspectRatios: (val: string[]) => void;
  omniLogo: string | null;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoGenerateLogo: boolean;
  setAutoGenerateLogo: (val: boolean) => void;
  referenceImages: string[];
  handleReferenceUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeReferenceImage: (index: number) => void;
}

export const OmniSettings: React.FC<OmniSettingsProps> = ({
  omniMode,
  omniAspectRatios,
  setOmniAspectRatios,
  omniLogo,
  handleLogoUpload,
  autoGenerateLogo,
  setAutoGenerateLogo,
  referenceImages,
  handleReferenceUpload,
  removeReferenceImage
}) => {
  useEffect(() => {
    if (omniMode !== 'omni-auto-resize' && omniAspectRatios.length > 1) {
      setOmniAspectRatios([omniAspectRatios[0]]);
    }
    if (omniMode === 'omni-tvc-video') {
      const validRatios = omniAspectRatios.filter(r => r === '16:9' || r === '9:16');
      if (validRatios.length === 0) {
        setOmniAspectRatios(['16:9']);
      } else if (validRatios.length !== omniAspectRatios.length) {
        setOmniAspectRatios(validRatios);
      }
    }
  }, [omniMode, omniAspectRatios, setOmniAspectRatios]);

  if (omniMode === 'none') return null;

  const aspectRatios = [
    { id: '16:9', label: '16:9 (Widescreen)', icon: <Monitor className="w-4 h-4" /> },
    { id: '9:16', label: '9:16 (Vertical)', icon: <Smartphone className="w-4 h-4" /> },
    ...(omniMode !== 'omni-tvc-video' ? [
      { id: '1:1', label: '1:1 (Square)', icon: <Square className="w-4 h-4" /> },
      { id: '4:3', label: '4:3', icon: <Monitor className="w-4 h-4" /> },
      { id: '3:4', label: '3:4', icon: <Smartphone className="w-4 h-4" /> },
      { id: '3:2', label: '3:2', icon: <Monitor className="w-4 h-4" /> },
      { id: '2:3', label: '2:3', icon: <Smartphone className="w-4 h-4" /> },
      { id: '5:4', label: '5:4', icon: <Monitor className="w-4 h-4" /> },
      { id: '4:5', label: '4:5', icon: <Smartphone className="w-4 h-4" /> },
      { id: '21:9', label: '21:9 (Ultrawide)', icon: <Monitor className="w-4 h-4" /> },
      { id: '4:1', label: '4:1 (Wide Banner)', icon: <Monitor className="w-4 h-4" /> },
      { id: '1:4', label: '1:4 (Tall)', icon: <Smartphone className="w-4 h-4" /> },
      { id: '8:1', label: '8:1 (Panorama)', icon: <Monitor className="w-4 h-4" /> },
      { id: '1:8', label: '1:8 (Scroll)', icon: <Smartphone className="w-4 h-4" /> },
    ] : [])
  ] as const;

  const handleRatioClick = (id: string) => {
    if (omniMode === 'omni-auto-resize') {
      if (omniAspectRatios.includes(id)) {
        if (omniAspectRatios.length > 1) {
          setOmniAspectRatios(omniAspectRatios.filter(r => r !== id));
        }
      } else {
        setOmniAspectRatios([...omniAspectRatios, id]);
      }
    } else {
      setOmniAspectRatios([id]);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-6 mb-6 p-6 bg-slate-800/50 rounded-3xl border border-white/5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {aspectRatios.map(ratio => (
          <button 
            key={ratio.id}
            onClick={() => handleRatioClick(ratio.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${omniAspectRatios.includes(ratio.id) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-slate-800'}`}
          >
            {ratio.icon}
            {ratio.label}
          </button>
        ))}
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-6 w-full">
        <div className="flex flex-col items-center gap-2">
          <input 
            type="file" 
            accept="image/*" 
            id="logo-upload" 
            className="hidden" 
            onChange={handleLogoUpload}
          />
          <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 lg:w-32 lg:h-32 rounded-2xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all text-indigo-400 overflow-hidden relative group">
            {omniLogo ? (
              <>
                <img src={omniLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black uppercase text-white">Đổi Logo</span>
                </div>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 mb-2" />
                <span className="text-[10px] font-black uppercase text-center">Tải Logo</span>
              </>
            )}
          </label>
          <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoGenerateLogo} 
              onChange={(e) => setAutoGenerateLogo(e.target.checked)}
              className="accent-indigo-500"
            />
            Tự động tạo logo
          </label>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap gap-2 justify-center">
            {referenceImages.map((img, index) => (
              <div key={index} className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-2xl border border-white/10 overflow-hidden group">
                <img src={img} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeReferenceImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {referenceImages.length < 5 && (
              <>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  id="reference-upload" 
                  className="hidden" 
                  onChange={handleReferenceUpload}
                />
                <label htmlFor="reference-upload" className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 lg:w-32 lg:h-32 rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-emerald-400">
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-black uppercase text-center px-2">Tải Ảnh<br/>Tham Khảo<br/>({referenceImages.length}/5)</span>
                </label>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-400">Tối đa 5 ảnh tham chiếu</span>
        </div>
      </div>
    </div>
  );
};
