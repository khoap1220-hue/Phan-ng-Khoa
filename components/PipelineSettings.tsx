import React from 'react';
import { Settings2, Wand2, ArrowRight, BrainCircuit } from 'lucide-react';

interface PipelineSettingsProps {
  omniMode: string;
  isDeepResearch: boolean;
  setIsDeepResearch: (val: boolean) => void;
  omniOutputMode: 'single-block' | 'multi-block';
  setOmniOutputMode: (val: 'single-block' | 'multi-block') => void;
  tvcOutputMode: 'storyboard' | 'video';
  setTvcOutputMode: (val: 'storyboard' | 'video') => void;
  handleAutoFormat: () => void;
}

export const PipelineSettings: React.FC<PipelineSettingsProps> = ({
  omniMode,
  isDeepResearch,
  setIsDeepResearch,
  omniOutputMode,
  setOmniOutputMode,
  tvcOutputMode,
  setTvcOutputMode,
  handleAutoFormat
}) => {
  if (omniMode === 'none') return null;

  return (
    <div className="w-full flex flex-col gap-4 mb-6 p-5 bg-slate-900/80 rounded-2xl border border-white/10 shadow-inner">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
        <Settings2 className="w-4 h-4 text-emerald-500" /> Đồng bộ luồng xử lý (Pipeline)
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Step 1: Auto Format */}
        <div className="flex flex-col gap-1">
          <button 
            onClick={handleAutoFormat}
            className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5"
            title="Tự động định dạng lại prompt theo chuẩn"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-400" />
            1. Auto Format
          </button>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600" />

        {/* Step 2: Deep Research */}
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => setIsDeepResearch(!isDeepResearch)}
            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${isDeepResearch ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-600/30' : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'}`}
            title="AI sẽ tự động phân tích yêu cầu và viết prompt chi tiết cho từng phần"
          >
            <BrainCircuit className={`w-3.5 h-3.5 ${isDeepResearch ? 'text-white' : 'text-purple-400'}`} />
            2. Nghiên cứu sâu
          </button>
        </div>

        {omniMode === 'omni-tvc-video' && (
          <>
            <ArrowRight className="w-4 h-4 text-slate-600" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setTvcOutputMode('storyboard')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tvcOutputMode === 'storyboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  3. Storyboard (Ảnh)
                </button>
                <button 
                  onClick={() => setTvcOutputMode('video')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tvcOutputMode === 'video' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  3. Video (Trực tiếp)
                </button>
              </div>
            </div>
          </>
        )}

        {omniMode !== 'text-to-product' && omniMode !== 'omni-auto-resize' && (omniMode !== 'omni-tvc-video' || tvcOutputMode === 'storyboard') && (
          <>
            <ArrowRight className="w-4 h-4 text-slate-600" />

            {/* Step 3: Output Mode */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setOmniOutputMode('multi-block')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${omniOutputMode === 'multi-block' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {omniMode === 'omni-tvc-video' ? '3A. Tách nhiều Section' : '3. Tách nhiều Section'}
                </button>
                <button 
                  onClick={() => setOmniOutputMode('single-block')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${omniOutputMode === 'single-block' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {omniMode === 'omni-tvc-video' ? '3B. Gộp chung 1 Section' : '3. Gộp chung 1 Section'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-white/5 leading-relaxed text-left">
        {omniMode === 'omni-tvc-video' && tvcOutputMode === 'storyboard' ? (
          <span className="text-blue-300">📸 <strong>Chế độ Storyboard:</strong> AI sẽ tạo ra các hình ảnh minh họa cho từng cảnh phim. Sau đó bạn có thể chọn từng ảnh để Render thành Video.</span>
        ) : isDeepResearch ? (
          <span className="text-purple-300">✨ <strong>Nghiên cứu sâu đang BẬT:</strong> AI sẽ tự động phân tích ý tưởng của bạn, viết lại prompt chi tiết và tự động đồng bộ định dạng với Output Mode. Bạn chỉ cần nhập ý tưởng thô!</span>
        ) : (
          <span>⚡ <strong>Nghiên cứu sâu đang TẮT:</strong> Hệ thống sẽ vẽ chính xác theo những gì bạn viết. Hãy bấm <strong>Auto Format</strong> để đảm bảo prompt đúng chuẩn cú pháp của Output Mode.</span>
        )}
      </div>
    </div>
  );
};
