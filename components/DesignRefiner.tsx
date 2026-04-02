
import React, { useState } from 'react';
import { Upload, Sparkles, Wand2, Palette, Layout, Type, ArrowRight, CheckCircle2, AlertCircle, Loader2, Eye, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processImageFile } from '../utils/imageProcessor';
import { GeminiService } from '../services/geminiService';
import { useApp } from '../context/AppContext';

const gemini = new GeminiService();

export const DesignRefiner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [redrawnImage, setRedrawnImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [additionalRequirement, setAdditionalRequirement] = useState("");
  const [useReferenceImage, setUseReferenceImage] = useState(true);
  const [isViewingImage, setIsViewingImage] = useState(false);
  const { imageResolution } = useApp();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await processImageFile(file, 1200, 0.8);
        setImage(base64);
        setResult(null);
        setRedrawnImage(null);
        setError(null);
      } catch (err) {
        setError("Không thể xử lý hình ảnh. Vui lòng thử lại.");
      }
    }
  };

  const analyzeDesign = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysisResult = await gemini.analyzeAndRefineDesign(image, additionalRequirement);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra trong quá trình phân tích.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const redrawDesign = async () => {
    if (!result?.imagePrompt) return;
    setIsRedrawing(true);
    setError(null);
    try {
      const generatedImage = await gemini.generateAiImage(result.imagePrompt, "16:9", imageResolution, useReferenceImage ? (image || undefined) : undefined);
      setRedrawnImage(generatedImage);
    } catch (err: any) {
      setError(err.message || "Không thể vẽ lại thiết kế. Vui lòng thử lại.");
    } finally {
      setIsRedrawing(false);
    }
  };

  const downloadImage = () => {
    if (!redrawnImage) return;
    const link = document.createElement('a');
    link.href = redrawnImage;
    link.download = 'ai-refined-design.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 lg:p-8 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-400" />
            1. Đọc bản thiết kế gốc
          </h3>
          <div 
            className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden bg-slate-900/50 ${image ? 'border-blue-500/50' : 'border-white/10 hover:border-blue-500/30'}`}
          >
            {image ? (
              <>
                <img src={image} alt="Original Design" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Upload className="w-4 h-4 rotate-180" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-4 p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-white font-bold">Tải lên bản thiết kế "xấu" hoặc phác thảo</p>
                  <p className="text-slate-500 text-xs mt-1">Hỗ trợ JPG, PNG, WEBP (Max 5MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
              </label>
            )}
          </div>
          
          {image && !result && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Yêu cầu bổ sung (Tùy chọn)</label>
                <textarea
                  value={additionalRequirement}
                  onChange={(e) => setAdditionalRequirement(e.target.value)}
                  placeholder="Ví dụ: Đổi màu chủ đạo thành xanh dương, làm phong cách cyberpunk..."
                  className="w-full h-24 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>
              <button 
                onClick={analyzeDesign}
                disabled={isAnalyzing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isAnalyzing ? 'ĐANG PHÂN TÍCH Ý ĐỒ...' : 'PHÂN TÍCH Ý ĐỒ NGƯỜI DÙNG'}
              </button>
            </div>
          )}
        </div>

        {/* Analysis & Refinement Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-emerald-400" />
            2. Tư duy & Sắp xếp lại
          </h3>
          
          <div className="min-h-[300px] rounded-2xl bg-slate-900/50 border border-white/5 p-6 space-y-6 overflow-y-auto max-h-[500px] custom-scrollbar">
            {!result && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <Wand2 className="w-12 h-12" />
                <p className="text-sm">AI sẽ tự động phân tích và đề xuất bố cục mới tại đây</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
                <div className="grid grid-cols-4 gap-2 pt-4">
                  {[1,2,3,4].map(i => <div key={i} className="aspect-square bg-white/10 rounded-lg"></div>)}
                </div>
              </div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="space-y-6"
              >
                <section>
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" /> Ý đồ người dùng
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed italic">"{result.intent}"</p>
                </section>

                <section>
                  <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Layout className="w-3 h-3" /> Bố cục & Phối màu chuẩn
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{result.refinementPlan}</p>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Bảng màu gợi ý</h4>
                    <div className="flex gap-2">
                      {result.palette.map((color: string, i: number) => (
                        <div 
                          key={i} 
                          className="w-8 h-8 rounded-lg shadow-lg border border-white/10 group relative"
                          style={{ backgroundColor: color }}
                        >
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">{color}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Typography</h4>
                    <p className="text-white text-xs font-medium">{result.typography}</p>
                  </section>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Sử dụng ảnh gốc làm tham chiếu</span>
                    <span className="text-[10px] text-slate-400">Tắt nếu bạn muốn AI vẽ lại hoàn toàn mới</span>
                  </div>
                  <button 
                    onClick={() => setUseReferenceImage(!useReferenceImage)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${useReferenceImage ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useReferenceImage ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <button 
                  onClick={redrawDesign}
                  disabled={isRedrawing}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                >
                  {isRedrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  {isRedrawing ? 'ĐANG VẼ LẠI...' : 'VẼ LẠI VỚI ĐỘ PHÂN GIẢI CAO'}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Redraw Result Section */}
      <AnimatePresence>
        {(redrawnImage || isRedrawing) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              3. Kết quả Hi-Fi & Ánh sáng chuyên nghiệp
            </h3>
            <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900 group">
              {isRedrawing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
                  <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white font-black uppercase tracking-[0.2em] text-xs animate-pulse">Đang kết xuất chi tiết...</p>
                </div>
              ) : (
                <img src={redrawnImage!} alt="Redrawn Design" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              )}
              
              {!isRedrawing && redrawnImage && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => setIsViewingImage(true)}
                    className="px-6 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <Eye className="w-4 h-4" /> Xem ảnh
                  </button>
                  <button 
                    onClick={downloadImage}
                    className="px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform border border-white/20"
                  >
                    <Download className="w-4 h-4" /> Tải xuống
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen View Modal */}
      <AnimatePresence>
        {isViewingImage && (redrawnImage || image) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4"
          >
            <button 
              onClick={() => setIsViewingImage(false)}
              className="absolute top-8 right-8 p-4 text-white hover:bg-white/10 rounded-full transition-colors z-[110]"
            >
              <ArrowRight className="w-8 h-8 rotate-180" />
            </button>
            
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={redrawnImage || image!} 
                alt="Full view" 
                className="max-w-full max-h-full object-contain shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="absolute bottom-8 flex gap-4">
              <button 
                onClick={downloadImage}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl"
              >
                <Download className="w-5 h-5" /> Tải xuống bản thiết kế
              </button>
              <button 
                onClick={() => setIsViewingImage(false)}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/20 transition-all border border-white/10"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};
