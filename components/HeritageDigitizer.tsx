import React, { useState } from 'react';
import { Upload, Wand2, Image as ImageIcon, Loader2, Download, Palette, Type, BookOpen, AlertCircle, Briefcase, Presentation, ShieldCheck, Database, Layout, Brush, X, Check, Eraser } from 'lucide-react';
import { motion } from 'motion/react';
import { processImageFile } from '../utils/imageProcessor';
import { GeminiService } from '../services/geminiService';
import { useApp } from '../context/AppContext';

export const HeritageDigitizer: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRedrawing, setIsRedrawing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [restoredLogo, setRestoredLogo] = useState<string | null>(null);
  const [dashboardImages, setDashboardImages] = useState<{
    portfolio?: string;
    presentation?: string;
    guidelines?: string;
    assetManagement?: string;
  }>({});
  const [isGeneratingDashboards, setIsGeneratingDashboards] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useReferenceImage, setUseReferenceImage] = useState(true);
  const [isViewingImage, setIsViewingImage] = useState(false);
  const { imageResolution } = useApp();

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [isPaintingMode, setIsPaintingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskedImage, setMaskedImage] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(30);

  React.useEffect(() => {
    if (isPaintingMode && canvasRef.current && imageRef.current) {
      const initCanvas = () => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      };

      if (imageRef.current.clientWidth === 0) {
        setTimeout(initCanvas, 100);
      } else {
        initCanvas();
      }
    }
  }, [isPaintingMode, originalImage]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleApplyMask = () => {
    if (!canvasRef.current || !imageRef.current || !originalImage) return;
    
    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      ctx.drawImage(canvasRef.current!, 0, 0, img.width, img.height);

      const finalImage = tempCanvas.toDataURL('image/jpeg', 0.9);
      setMaskedImage(finalImage);
      setIsPaintingMode(false);
    };
    img.src = originalImage;
  };

  const handleClearMask = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await processImageFile(file, 1200, 0.75);
        setOriginalImage(base64);
        setMaskedImage(null);
        setIsPaintingMode(false);
        setAnalysisResult(null);
        setRestoredLogo(null);
        setError(null);
      } catch (err) {
        console.error("Failed to process image", err);
        setError("Không thể xử lý hình ảnh. Vui lòng thử lại.");
      }
    }
  };

  const handleAnalyze = async () => {
    const imageToAnalyze = maskedImage || originalImage;
    if (!imageToAnalyze) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const gemini = new GeminiService();
      const result = await gemini.analyzeHeritageSignage(imageToAnalyze);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error("Analysis failed", err);
      setError(err.message || "Phân tích thất bại. Vui lòng kiểm tra API key hoặc thử lại.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRedraw = async () => {
    if (!analysisResult?.logoPrompt) return;
    setIsRedrawing(true);
    setIsGeneratingDashboards(true);
    setError(null);
    try {
      const gemini = new GeminiService();
      
      const imageToRedraw = maskedImage || originalImage;
      // 1. Generate the main logo first
      const logoUrl = await gemini.generateAiImage(analysisResult.logoPrompt, "16:9", imageResolution, useReferenceImage ? (imageToRedraw || undefined) : undefined, 'logo-restoration');
      setRestoredLogo(logoUrl);
      
      // Stop the main button loading so the logo appears
      setIsRedrawing(false);

      // 2. Generate dashboard images in parallel using the NEW logo as reference context
      const dashboardPrompts = [
        { key: 'portfolio', prompt: analysisResult.dashboards.portfolio.imagePrompt },
        { key: 'presentation', prompt: analysisResult.dashboards.presentation.imagePrompt },
        { key: 'guidelines', prompt: analysisResult.dashboards.guidelines.imagePrompt },
        { key: 'assetManagement', prompt: analysisResult.dashboards.assetManagement.imagePrompt },
      ];

      const imagePromises = dashboardPrompts.map(async (item) => {
        try {
          // We use the restored logo as a reference for mockups to ensure brand consistency
          const url = await gemini.generateAiImage(item.prompt, "16:9", "2K", logoUrl, 'mockup');
          return { key: item.key, url };
        } catch (err) {
          console.error(`Failed to generate image for ${item.key}`, err);
          return { key: item.key, url: null };
        }
      });

      const results = await Promise.all(imagePromises);
      const newImages: any = {};
      results.forEach(res => {
        if (res.url) newImages[res.key] = res.url;
      });
      setDashboardImages(newImages);

    } catch (err: any) {
      console.error("Redraw failed", err);
      setError(err.message || "Vẽ lại thất bại. Vui lòng kiểm tra API key hoặc thử lại.");
      setIsRedrawing(false);
    } finally {
      setIsGeneratingDashboards(false);
    }
  };

  const downloadImage = () => {
    if (!restoredLogo) return;
    const link = document.createElement('a');
    link.href = restoredLogo;
    link.download = 'restored-logo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Signage Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            Hình ảnh Bảng hiệu Cũ
          </h3>
          <div className="relative w-full bg-slate-900 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden group hover:border-amber-500/50 transition-colors flex items-center justify-center min-h-[300px]">
            {originalImage ? (
              <div className="relative inline-block max-w-full">
                <img 
                  ref={imageRef}
                  src={isPaintingMode ? originalImage : (maskedImage || originalImage)} 
                  alt="Original Signage" 
                  className="max-w-full max-h-[500px] object-contain block" 
                  draggable={false}
                />
                
                {isPaintingMode && (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair touch-none"
                  />
                )}

                {!isPaintingMode && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white backdrop-blur-sm transition-colors">
                      Thay đổi ảnh
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button
                      onClick={() => setIsPaintingMode(true)}
                      className="px-4 py-2 bg-amber-600/80 hover:bg-amber-600 rounded-lg text-sm font-medium text-white backdrop-blur-sm transition-colors flex items-center gap-2"
                    >
                      <Brush className="w-4 h-4" /> {maskedImage ? 'Chọn lại vùng Logo' : 'Chọn vùng Logo'}
                    </button>
                    {maskedImage && (
                      <button
                        onClick={() => setMaskedImage(null)}
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm font-medium text-white backdrop-blur-sm transition-colors flex items-center gap-2"
                      >
                        <X className="w-4 h-4" /> Bỏ vùng chọn
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-amber-400 transition-colors">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Tải lên ảnh bảng hiệu cũ</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          {isPaintingMode && (
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400">Cỡ cọ:</span>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24 accent-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClearMask}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Xóa vùng chọn"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsPaintingMode(false)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Hủy"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleApplyMask}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Xong
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={handleAnalyze}
            disabled={!originalImage || isAnalyzing}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {isAnalyzing ? 'ĐANG PHÂN TÍCH DI SẢN...' : 'PHÂN TÍCH & SỐ HÓA'}
          </button>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 mt-2">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Sử dụng ảnh gốc làm tham chiếu</span>
              <span className="text-[10px] text-slate-400">Tắt nếu bạn muốn AI vẽ lại hoàn toàn mới</span>
            </div>
            <button 
              onClick={() => setUseReferenceImage(!useReferenceImage)}
              className={`w-12 h-6 rounded-full transition-colors relative ${useReferenceImage ? 'bg-amber-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useReferenceImage ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Restored Logo Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-cyan-400" />
            Logo Phục Chế (Vector-style)
          </h3>
          <div className="relative w-full aspect-video bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center group">
            {isRedrawing ? (
              <div className="flex flex-col items-center gap-3 text-cyan-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium animate-pulse">Đang vẽ lại logo...</span>
              </div>
            ) : restoredLogo ? (
              <>
                <img src={restoredLogo} alt="Restored Logo" className="w-full h-full object-contain bg-white" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button 
                    onClick={() => setIsViewingImage(true)}
                    className="px-6 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <ImageIcon className="w-4 h-4" /> Xem ảnh
                  </button>
                  <button 
                    onClick={downloadImage}
                    className="px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform border border-white/20"
                  >
                    <Download className="w-4 h-4" /> Tải xuống
                  </button>
                </div>
              </>
            ) : (
              <div className="text-slate-600 flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 opacity-50" />
                <span className="text-sm">Chưa có logo phục chế</span>
              </div>
            )}
          </div>

          <button
            onClick={handleRedraw}
            disabled={!analysisResult || isRedrawing}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-cyan-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRedrawing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Palette className="w-5 h-5" />}
            {isRedrawing ? 'ĐANG VẼ LẠI...' : 'VẼ LẠI LOGO (ĐỘ PHÂN GIẢI CAO)'}
          </button>
        </div>
      </div>

      {/* Analysis Results (Brand Book) */}
      {analysisResult && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-white/10 rounded-2xl p-6 lg:p-8 flex flex-col gap-8"
        >
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Brand Book Trực Tuyến</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Colors */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                Hệ Màu Nguyên Bản
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {analysisResult.colors?.map((color: any, idx: number) => (
                  <div key={idx} className="bg-slate-800 rounded-xl p-3 flex flex-col gap-2 border border-white/5">
                    <div className="w-full h-16 rounded-lg shadow-inner" style={{ backgroundColor: color.hex }}></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-white truncate">{color.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{color.hex}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{color.cmyk}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{color.pantone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography & Summary */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-400" />
                  Số Hóa Phông Chữ
                </h3>
                <div className="bg-slate-800 rounded-xl p-4 border border-white/5 flex flex-col gap-3">
                  <p className="text-sm text-slate-300 leading-relaxed">{analysisResult.typography?.analysis}</p>
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Phông chữ đề xuất:</span>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.typography?.suggestions?.map((font: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium">
                          {font}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Tổng Quan Thương Hiệu
                </h3>
                <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
                  <p className="text-sm text-slate-300 leading-relaxed">{analysisResult.brandSummary}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Brand Dashboards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-8 border-t border-white/10">
            {/* 1. Brand Identity Portfolio */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">1. Brand Identity Portfolio</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Hồ sơ năng lực thương hiệu</p>
                </div>
              </div>
              
              {dashboardImages.portfolio ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 group/img relative">
                  <img src={dashboardImages.portfolio} alt="Portfolio" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = dashboardImages.portfolio!;
                        link.download = 'portfolio-mockup.jpg';
                        link.click();
                      }}
                      className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : isGeneratingDashboards ? (
                <div className="w-full aspect-video rounded-xl bg-slate-800/50 border border-white/5 flex flex-col items-center justify-center gap-2 mb-4">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold animate-pulse">Đang tạo Mockup...</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Branding Kit</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.dashboards?.portfolio?.brandingKit}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mockup Ideas</span>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                    {analysisResult.dashboards?.portfolio?.mockupPrompts?.map((prompt: string, i: number) => (
                      <li key={i} className="italic">"{prompt}"</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Applications</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.dashboards?.portfolio?.applications}</p>
                </div>
              </div>
            </div>

            {/* 2. Brand Presentation */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 hover:border-amber-500/30 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Presentation className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">2. Brand Presentation</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Bản thuyết trình thương hiệu</p>
                </div>
              </div>

              {dashboardImages.presentation ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 group/img relative">
                  <img src={dashboardImages.presentation} alt="Presentation" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = dashboardImages.presentation!;
                        link.download = 'brand-presentation.jpg';
                        link.click();
                      }}
                      className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : isGeneratingDashboards ? (
                <div className="w-full aspect-video rounded-xl bg-slate-800/50 border border-white/5 flex flex-col items-center justify-center gap-2 mb-4">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold animate-pulse">Đang tạo Presentation...</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Rationale (Lý do thiết kế)</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.dashboards?.presentation?.rationale}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Visual Strategy</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.dashboards?.presentation?.visualStrategy}</p>
                </div>
              </div>
            </div>

            {/* 3. Brand Guidelines */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">3. Brand Guidelines</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Cẩm nang thương hiệu</p>
                </div>
              </div>

              {dashboardImages.guidelines ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 group/img relative">
                  <img src={dashboardImages.guidelines} alt="Guidelines" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = dashboardImages.guidelines!;
                        link.download = 'brand-guidelines.jpg';
                        link.click();
                      }}
                      className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : isGeneratingDashboards ? (
                <div className="w-full aspect-video rounded-xl bg-slate-800/50 border border-white/5 flex flex-col items-center justify-center gap-2 mb-4">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold animate-pulse">Đang tạo Guidelines...</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Rules (Quy định)</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.dashboards?.guidelines?.rules}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Usage Examples</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.dashboards?.guidelines?.usageExamples}</p>
                </div>
              </div>
            </div>

            {/* 4. Brand Asset Management */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-colors group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">4. Brand Asset Management</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Quản lý tài sản thương hiệu</p>
                </div>
              </div>

              {dashboardImages.assetManagement ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 group/img relative">
                  <img src={dashboardImages.assetManagement} alt="Asset Management" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = dashboardImages.assetManagement!;
                        link.download = 'asset-management.jpg';
                        link.click();
                      }}
                      className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : isGeneratingDashboards ? (
                <div className="w-full aspect-video rounded-xl bg-slate-800/50 border border-white/5 flex flex-col items-center justify-center gap-2 mb-4">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold animate-pulse">Đang tạo Assets...</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Asset List (Danh mục tài sản)</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {analysisResult.dashboards?.assetManagement?.assetList?.map((asset: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-purple-500/10 text-purple-300 rounded text-[10px] font-mono border border-purple-500/20">
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Storage Strategy</span>
                  <p className="text-xs text-slate-300 leading-relaxed">{analysisResult.dashboards?.assetManagement?.storageStrategy}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      {/* Fullscreen View Modal */}
      {isViewingImage && (restoredLogo || originalImage) && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
          <button 
            onClick={() => setIsViewingImage(false)}
            className="absolute top-8 right-8 p-4 text-white hover:bg-white/10 rounded-full transition-colors z-[110]"
          >
            <Upload className="w-8 h-8 rotate-180" />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={restoredLogo || originalImage!} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="absolute bottom-8 flex gap-4">
            <button 
              onClick={downloadImage}
              className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-amber-500 transition-all shadow-xl"
            >
              <Download className="w-5 h-5" /> Tải xuống logo
            </button>
            <button 
              onClick={() => setIsViewingImage(false)}
              className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/20 transition-all border border-white/10"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
