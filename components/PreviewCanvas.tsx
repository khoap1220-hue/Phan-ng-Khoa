
import React, { useState, useRef, useEffect, memo } from 'react';
import { Smartphone, Tablet as TabletIcon, Monitor, LayoutPanelLeft, RefreshCcw, Sliders, Zap, Settings2, GripHorizontal, Box } from 'lucide-react';
import { motion } from 'motion/react';
import { OmniState } from '../types';

interface PreviewCanvasProps {
  previewDevice: OmniState['previewDevice'];
  setPreviewDevice: (device: OmniState['previewDevice']) => void;
  setViewMode: (mode: OmniState['viewMode']) => void;
  internalHtml: string;
  previewKey: number;
  showHud: boolean;
  setShowHud: (show: boolean) => void;
  canvasHeights: OmniState['canvasHeights'];
  setCanvasHeights: (heights: OmniState['canvasHeights']) => void;
  spacingScale: number;
  setSpacingScale: (scale: number) => void;
  shadowIntensity: number;
  setShadowIntensity: (intensity: number) => void;
  omniMode: OmniState['omniMode'];
  packagingTexture: string | null;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = memo(({
  previewDevice, setPreviewDevice, setViewMode, internalHtml, previewKey,
  showHud, setShowHud, canvasHeights, setCanvasHeights,
  spacingScale, setSpacingScale, shadowIntensity, setShadowIntensity,
  omniMode, packagingTexture
}) => {
  const canvasHeight = canvasHeights[previewDevice];

  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startY.current = e.clientY;
    startHeight.current = canvasHeight;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaY = e.clientY - startY.current;
      const newHeight = Math.max(300, startHeight.current + deltaY);
      setCanvasHeights({ ...canvasHeights, [previewDevice]: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, previewDevice, canvasHeights, setCanvasHeights]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex-1 flex flex-col overflow-hidden relative"
    >
      <div className="h-14 border-b border-white/5 bg-[#0b0f1a] flex items-center justify-between px-6 shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
          <LayoutPanelLeft className="w-4 h-4 text-blue-500" /> Canvas Preview
        </div>
        <div className="flex items-center gap-4">
          {(['mobile', 'tablet', 'desktop'] as const).map(device => (
            <button 
              key={device}
              onClick={() => setPreviewDevice(device)} 
              className={`p-2.5 rounded-xl transition-all ${previewDevice === device ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
            >
              {device === 'mobile' ? <Smartphone className="w-4.5 h-4.5" /> : device === 'tablet' ? <TabletIcon className="w-4.5 h-4.5" /> : <Monitor className="w-4.5 h-4.5" />}
            </button>
          ))}
        </div>
        <button onClick={() => setViewMode('edit')} className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
          <RefreshCcw className="w-3.5 h-3.5" /> Re-Build
        </button>
      </div>

      {showHud && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70] bg-[#0b0f1a]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl p-6 flex flex-col gap-5 w-[450px] animate-in slide-in-from-bottom-10">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Visual Inspector
            </div>
            <button onClick={() => setShowHud(false)} className="p-1.5 bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"><Zap className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>Spacing</span> <span className="text-blue-400">x{spacingScale.toFixed(1)}</span></div>
               <input type="range" min="0.2" max="2.5" step="0.1" value={spacingScale} 
                 onChange={(e) => setSpacingScale(parseFloat(e.target.value))}
                 className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>Shadow</span> <span className="text-blue-400">{Math.round(shadowIntensity * 100)}%</span></div>
               <input type="range" min="0" max="0.6" step="0.01" value={shadowIntensity} 
                 onChange={(e) => setShadowIntensity(parseFloat(e.target.value))}
                 className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-12 bg-slate-950/60 custom-scrollbar relative">
        <div className="min-w-max min-h-full flex justify-center items-start">
          <div 
            ref={containerRef}
            style={{ height: `${canvasHeight}px` }}
            className={`flex-shrink-0 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] transition-[width] duration-700 rounded-sm overflow-hidden border border-white/5 relative ${previewDevice === 'desktop' ? 'w-[1280px]' : previewDevice === 'tablet' ? 'w-[768px]' : 'w-[375px]'}`}
          >
            {omniMode === 'packaging-3d' && packagingTexture ? (
              <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl">
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                  <Box className="w-4 h-4" /> Bản xem trước Mockup Bao bì (Packaging Mockup)
                </div>
                <img src={packagingTexture} alt="Packaging Mockup" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              </div>
            ) : (
              <iframe 
                key={previewKey}
                srcDoc={internalHtml} 
                className="w-full h-full border-none pointer-events-auto" 
                style={{ pointerEvents: isResizing ? 'none' : 'auto' }}
              />
            )}
            
            {/* Resize Handle */}
            <div 
              onMouseDown={handleMouseDown}
              className={`absolute bottom-0 left-0 right-0 h-4 bg-blue-600/10 hover:bg-blue-600/30 cursor-ns-resize flex items-center justify-center transition-all group ${isResizing ? 'bg-blue-600/50' : ''}`}
            >
              <GripHorizontal className="w-4 h-4 text-blue-500 opacity-50 group-hover:opacity-100" />
              {isResizing && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg">
                  {Math.round(canvasHeight)}px
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {!showHud && (
        <button onClick={() => setShowHud(true)} className="absolute bottom-8 right-8 p-5 bg-blue-600 text-white rounded-full shadow-2xl z-50 hover:scale-110 transition-transform"><Settings2 className="w-6 h-6" /></button>
      )}
    </motion.div>
  );
});
