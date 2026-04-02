
import React from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Terminal } from './components/Terminal';
import { BuildScreen } from './components/BuildScreen';
import { PreviewCanvas } from './components/PreviewCanvas';
import { MagicBar } from './components/MagicBar';
import { generateIframeHtml } from './utils/iframeHelper';
import { Menu, X, Sparkles } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { AnimatePresence } from 'motion/react';

import { SystemChatbot } from './components/SystemChatbot';

function AppContent() {
  const appLogic = useApp();
  const {
    state,
    setState,
    isProcessing,
    isAddingModule,
    isSyncingPalette,
    viewMode,
    setViewMode,
    previewDevice,
    setPreviewDevice,
    previewKey,
    showTerminal,
    setShowTerminal,
    showHud,
    setShowHud,
    isSidebarOpen,
    setIsSidebarOpen,
    internalHtml,
    packagingTexture,
    setCanvasHeights,
    setSpacingScale,
    setShadowIntensity
  } = appLogic;

  const handleExportImages = async () => {
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("images");
      if (!imgFolder) return;

      let imageCount = 0;

      if (packagingTexture && packagingTexture.startsWith('data:image/')) {
        const base64Data = packagingTexture.split(',')[1];
        const mimeType = packagingTexture.split(';')[0].split(':')[1];
        const extension = mimeType.split('/')[1] || 'png';
        imgFolder.file(`packaging_mockup.${extension}`, base64Data, { base64: true });
        imageCount++;
      }

      const blockPromises = state.blocks.map(async (block, blockIdx) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(block.html, 'text/html');
        const imgTags = Array.from(doc.querySelectorAll('img'));

        imgTags.forEach((img, imgIdx) => {
          const src = img.getAttribute('src');
          if (src && src.startsWith('data:image/')) {
            const base64Data = src.split(',')[1];
            const mimeType = src.split(';')[0].split(':')[1];
            const extension = mimeType.split('/')[1] || 'png';
            const filename = `block_${blockIdx + 1}_img_${imgIdx + 1}.${extension}`;
            imgFolder.file(filename, base64Data, { base64: true });
            imageCount++;
          }
        });

        const videoTags = Array.from(doc.querySelectorAll('video'));
        for (let videoIdx = 0; videoIdx < videoTags.length; videoIdx++) {
          const video = videoTags[videoIdx];
          const src = video.getAttribute('src');
          if (src && src.startsWith('blob:')) {
            try {
              const response = await fetch(src);
              const blob = await response.blob();
              imgFolder.file(`block_${blockIdx + 1}_video_${videoIdx + 1}.mp4`, blob);
              imageCount++;
            } catch (e) {
              console.error('Failed to fetch video blob for export', e);
            }
          }
        }
      });

      await Promise.all(blockPromises);

      if (imageCount === 0) {
        alert("Không tìm thấy hình ảnh hoặc video nào để xuất.");
        return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${state.projectName.replace(/\\s+/g, '_')}_media.zip`);
    } catch (error) {
      console.error("Lỗi khi xuất media:", error);
      alert("Đã xảy ra lỗi khi xuất media.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-200 font-inter overflow-hidden relative">
      <Header 
        handleExport={() => {
           const finalHtml = generateIframeHtml(state, false, 'desktop');
           const blob = new Blob([finalHtml], { type: 'text/html' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url; a.download = `${state.projectName}.html`; a.click();
        }}
        handleExportImages={handleExportImages}
      />
      
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 left-6 z-[110] w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      <main className="flex-1 flex overflow-hidden relative">
        <div className={`
          fixed inset-y-0 left-0 z-[100] w-72 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <LeftSidebar />
        </div>

        {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" />}

        <section className="flex-1 flex flex-col bg-[#020617] relative">
          <AnimatePresence mode="wait">
            {((state.blocks.length === 0 && !packagingTexture) || viewMode === 'edit') ? (
              <BuildScreen 
                key="build-screen"
                hasBlocks={state.blocks.length > 0 || !!packagingTexture} onCancel={() => setViewMode('preview')} 
              />
            ) : (
              <>
                <PreviewCanvas 
                  key="preview-canvas"
                  previewDevice={previewDevice}
                  setPreviewDevice={setPreviewDevice}
                  setViewMode={setViewMode}
                  internalHtml={internalHtml}
                  previewKey={previewKey}
                  showHud={showHud}
                  setShowHud={setShowHud}
                  canvasHeights={state.canvasHeights}
                  setCanvasHeights={setCanvasHeights}
                  spacingScale={state.spacingScale}
                  setSpacingScale={setSpacingScale}
                  shadowIntensity={state.shadowIntensity}
                  setShadowIntensity={setShadowIntensity}
                  omniMode={state.omniMode}
                  packagingTexture={state.packagingTexture}
                />
                <MagicBar />
              </>
            )}
          </AnimatePresence>
        </section>

        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      </main>

      {showTerminal && <Terminal logs={state.logs} onClose={() => setShowTerminal(false)} />}
      
      <div className="fixed bottom-6 right-6 lg:left-1/2 lg:-translate-x-1/2 z-[100] flex gap-2">
         <button 
           // @ts-ignore
           onClick={() => window.aistudio.openSelectKey()}
           className="px-4 lg:px-6 py-2.5 bg-slate-900/80 backdrop-blur-xl border border-blue-500/50 text-blue-400 text-[9px] lg:text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2"
         >
           <Sparkles className="w-3 h-3" /> Cài đặt Gemini AI
         </button>
      </div>

      {(isProcessing || isAddingModule || isSyncingPalette) && (
        <div className="fixed inset-0 bg-slate-950/90 z-[200] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-white font-black uppercase tracking-widest text-sm">
            {isSyncingPalette ? "Visual Identity Syncing" : "Omni Engine Active"}
          </div>
          <div className="text-slate-400 text-[10px] mt-2 animate-pulse uppercase tracking-[0.2em]">Hệ thống AI đang xử lý yêu cầu...</div>
        </div>
      )}
      
      <SystemChatbot />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
