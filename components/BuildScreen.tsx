
import React, { useEffect } from 'react';
import { RefreshCcw, Sparkles, Zap, Image as ImageIcon, LayoutTemplate, PenTool, Megaphone, BookOpen, Package, Wand2, Box, ShoppingBag, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { processImageFile } from '../utils/imageProcessor';
import { PipelineSettings } from './PipelineSettings';
import { OmniSettings } from './OmniSettings';
import { DesignRefiner } from './DesignRefiner';
import { HeritageDigitizer } from './HeritageDigitizer';
import { useApp } from '../context/AppContext';

interface BuildScreenProps {
  onCancel: () => void;
  hasBlocks: boolean;
}

export const BuildScreen: React.FC<BuildScreenProps> = ({ 
  onCancel, hasBlocks
}) => {
  const {
    inputSource, setInputSource, handleBuild, isProcessing, setIsProcessing,
    omniMode, setOmniMode, omniAspectRatios, setOmniAspectRatios, omniLogo, setOmniLogo,
    autoGenerateLogo, setAutoGenerateLogo,
    referenceImages, setReferenceImages,
    thinkingLevel, setThinkingLevel, isDeepResearch, setIsDeepResearch,
    imageResolution, setImageResolution, omniOutputMode, setOmniOutputMode,
    tvcOutputMode, setTvcOutputMode
  } = useApp();

  const modes = [
    { id: 'omni-slider', label: 'SLIDER', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'landing-page', label: 'LANDING PAGE', icon: <LayoutTemplate className="w-4 h-4 text-blue-400" /> },
    { id: 'omni-branding', label: 'BRANDING', icon: <PenTool className="w-4 h-4" /> },
    { id: 'omni-ux-flow', label: 'UX FLOW', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'omni-ad-campaign', label: 'AD CAMPAIGN', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'omni-catalogue', label: 'CATALOGUE', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'omni-publication', label: 'ẤN PHẨM', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'omni-product-suite', label: 'BỘ SẢN PHẨM', icon: <Package className="w-4 h-4" /> },
    { id: 'omni-interior-decor', label: 'NỘI THẤT', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'omni-comic', label: 'TRUYỆN TRANH', icon: <BookOpen className="w-4 h-4 text-purple-400" /> },
    { id: 'omni-hook-viral', label: 'HOOK VIRAL', icon: <Zap className="w-4 h-4 text-orange-400" /> },
    { id: 'omni-wall-art', label: 'WALL ART', icon: <ImageIcon className="w-4 h-4 text-emerald-400" /> },
    { id: 'text-to-product', label: 'TEXT-TO-PRODUCT', icon: <Wand2 className="w-4 h-4 text-yellow-400" /> },
    { id: 'omni-auto-resize', label: 'AUTO-RESIZE', icon: <ImageIcon className="w-4 h-4 text-blue-400" /> },
    { id: 'studio-photography', label: 'STUDIO PHOTO', icon: <ImageIcon className="w-4 h-4 text-pink-400" /> },
    { id: 'packaging-3d', label: 'PACKAGING 3D', icon: <Box className="w-4 h-4 text-green-400" /> },
    { id: 'omni-character-design', label: 'CHARACTER', icon: <PenTool className="w-4 h-4 text-indigo-400" /> },
    { id: 'omni-apparel-design', label: 'APPAREL', icon: <ShoppingBag className="w-4 h-4 text-rose-400" /> },
    { id: 'omni-tvc-video', label: 'TVC VIDEO', icon: <Sparkles className="w-4 h-4 text-red-400" /> },
    { id: 'omni-document', label: 'TÀI LIỆU', icon: <FileText className="w-4 h-4 text-indigo-400" /> },
    { id: 'design-refiner', label: 'AI DESIGN REFINER', icon: <Wand2 className="w-4 h-4 text-cyan-400" /> },
    { id: 'heritage-digitizer', label: 'DI SẢN BẢNG HIỆU', icon: <ImageIcon className="w-4 h-4 text-amber-400" /> },
  ] as const;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await processImageFile(file, 1200, 0.75);
        setOmniLogo(base64);
      } catch (err) {
        console.error("Failed to process logo image", err);
      }
    }
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    const remainingSlots = 5 - referenceImages.length;
    const filesToProcess = files.slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      alert(`Chỉ có thể tải lên tối đa 5 hình ảnh tham chiếu. Đã bỏ qua ${files.length - remainingSlots} hình ảnh.`);
    }

    try {
      const processedImages = await Promise.all(filesToProcess.map(file => processImageFile(file, 1200, 0.75)));
      setReferenceImages(prev => [...prev, ...processedImages]);
    } catch (err) {
      console.error("Failed to process reference images", err);
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const getPrefixForMode = (mode: string) => {
    switch (mode) {
      case 'omni-slider': return 'Slide';
      case 'omni-branding': return 'Item';
      case 'omni-ux-flow': return 'Màn hình';
      case 'omni-ad-campaign': return 'Ad';
      case 'omni-catalogue':
      case 'omni-publication': return 'Trang';
      case 'omni-product-suite': return 'Product';
      case 'omni-interior-decor': return 'Phòng';
      case 'omni-comic': return 'Khung hình';
      case 'omni-hook-viral': return 'Hook';
      case 'omni-wall-art': return 'Tranh';
      case 'text-to-product': return 'Phần';
      case 'landing-page': return 'Section';
      case 'omni-auto-resize': return 'Thiết kế';
      case 'studio-photography': return 'Ảnh';
      case 'omni-character-design': return 'Nhân vật';
      case 'omni-apparel-design': return 'Trang phục';
      case 'packaging-3d': return 'Bao bì';
      case 'omni-tvc-video': return 'Cảnh';
      default: return 'Section';
    }
  };

  const targetPrefix = getPrefixForMode(omniMode);

  const [localInputSource, setLocalInputSource] = React.useState(inputSource);

  // Sync local state if global state changes externally
  useEffect(() => {
    setLocalInputSource(inputSource);
  }, [inputSource]);

  const handleAutoFormat = () => {
    if (!localInputSource) return;
    
    let formatted = localInputSource;
    
    // Remove all asterisks
    formatted = formatted.replace(/\*/g, '');
    
    // Replace existing prefixes with the correct one for the current mode
    // and ensure there is a colon after the number if multi-block
    const prefixRegex = /(Section|Slide|Item|Màn hình|Ad|Trang|Product|Phần|Phòng|Khung hình|Hook|Tranh|Thiết kế|Nhãn|Ảnh|Nhân vật|Trang phục|Cảnh|Page)\s+(\d+)\s*:?/gi;
    if (omniOutputMode === 'multi-block') {
      formatted = formatted.replace(prefixRegex, `${targetPrefix} $2: `);
    } else {
      formatted = formatted.replace(prefixRegex, `${targetPrefix} $2 `);
    }
    
    // Clean up multiple spaces and empty lines
    formatted = formatted.replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    
    setLocalInputSource(formatted);
    setInputSource(formatted);
  };

  useEffect(() => {
    const prefixRegex = /(Section|Slide|Item|Màn hình|Ad|Trang|Product|Phần|Phòng|Khung hình|Hook|Tranh|Thiết kế|Nhãn|Ảnh|Nhân vật|Trang phục|Cảnh|Page)\s+(\d+)/i;
    const replaceRegex = /(Section|Slide|Item|Màn hình|Ad|Trang|Product|Phần|Phòng|Khung hình|Hook|Tranh|Thiết kế|Nhãn|Ảnh|Nhân vật|Trang phục|Cảnh|Page)\s+(\d+)\s*:?/gi;
    
    if (localInputSource && prefixRegex.test(localInputSource)) {
      let formatted = localInputSource;
      if (omniOutputMode === 'multi-block') {
        formatted = formatted.replace(replaceRegex, `${targetPrefix} $2: `);
      } else {
        formatted = formatted.replace(replaceRegex, `${targetPrefix} $2 `);
      }
      formatted = formatted.replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (formatted !== localInputSource) {
        setLocalInputSource(formatted);
        setInputSource(formatted);
      }
    }
  }, [omniMode, omniOutputMode, targetPrefix]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col p-6 lg:p-12 items-center justify-center max-w-4xl mx-auto text-center w-full h-full overflow-y-auto custom-scrollbar"
    >
      <div className="w-16 h-16 lg:w-24 lg:h-24 bg-blue-600/20 rounded-[1.5rem] lg:rounded-[2.5rem] flex items-center justify-center mb-6 lg:mb-10 border border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.2)] animate-pulse shrink-0">
        <RefreshCcw className="w-6 h-6 lg:w-10 lg:h-10 text-blue-500" />
      </div>
      <h2 className="text-3xl lg:text-5xl font-black mb-4 lg:mb-6 tracking-tighter uppercase italic text-white drop-shadow-lg leading-tight">
        {omniMode === 'design-refiner' ? 'AI Design Refiner' : 'Thiết kế & Nâng cấp AI'}
      </h2>
      <p className="text-slate-500 text-[9px] lg:text-sm mb-6 lg:mb-10 uppercase tracking-[0.2em] lg:tracking-[0.3em] font-black">
        {omniMode === 'design-refiner' ? 'Đọc bản thiết kế xấu & Vẽ lại chuyên nghiệp' : 'Mô tả hoặc dán mã nguồn HTML cũ'}
      </p>
      
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {modes.map(mode => (
          <button 
            key={mode.id}
            onClick={() => setOmniMode(omniMode === mode.id ? 'none' : mode.id)}
            className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${omniMode === mode.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'}`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thinking Level:</span>
        {(['default', 'low', 'high'] as const).map(level => (
          <button 
            key={level}
            onClick={() => setThinkingLevel(level)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${thinkingLevel === level ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'}`}
          >
            {level}
          </button>
        ))}
        
        <div className="w-px h-6 bg-white/10 mx-2"></div>

        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resolution:</span>
        {(['1K', '2K', '4K'] as const).map(res => (
          <button 
            key={res}
            onClick={() => setImageResolution(res)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${imageResolution === res ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'}`}
          >
            {res}
          </button>
        ))}
      </div>

      {omniMode === 'design-refiner' ? (
        <DesignRefiner />
      ) : omniMode === 'heritage-digitizer' ? (
        <HeritageDigitizer />
      ) : (
        <>
          <PipelineSettings 
            omniMode={omniMode}
            isDeepResearch={isDeepResearch}
            setIsDeepResearch={setIsDeepResearch}
            omniOutputMode={omniOutputMode}
            setOmniOutputMode={setOmniOutputMode}
            tvcOutputMode={tvcOutputMode}
            setTvcOutputMode={setTvcOutputMode}
            handleAutoFormat={handleAutoFormat}
          />

          <OmniSettings 
            omniMode={omniMode}
            omniAspectRatios={omniAspectRatios}
            setOmniAspectRatios={setOmniAspectRatios}
            omniLogo={omniLogo}
            handleLogoUpload={handleLogoUpload}
            autoGenerateLogo={autoGenerateLogo}
            setAutoGenerateLogo={setAutoGenerateLogo}
            referenceImages={referenceImages}
            handleReferenceUpload={handleReferenceUpload}
            removeReferenceImage={removeReferenceImage}
          />

          <div className="w-full relative group mb-6 lg:mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl lg:rounded-3xl blur opacity-15 group-hover:opacity-30 transition duration-1000"></div>
            <textarea 
              value={localInputSource} 
              onChange={(e) => setLocalInputSource(e.target.value)}
              onBlur={() => setInputSource(localInputSource)}
              placeholder={omniMode !== 'none' ? `Nhập nội dung yêu cầu cho ${modes.find(m => m.id === omniMode)?.label}...` : "Ví dụ: 'Tạo Landing Page cho quán cà phê...' hoặc Dán code HTML cũ..."}
              className="relative w-full h-48 lg:h-64 bg-slate-900 border border-white/10 rounded-2xl lg:rounded-3xl p-6 lg:p-8 text-xs lg:text-sm outline-none focus:border-blue-500 text-white shadow-2xl resize-none placeholder:text-slate-700 font-medium transition-all"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 w-full px-2">
            <button 
              onClick={() => {
                setInputSource(localInputSource);
                handleBuild(localInputSource);
              }} 
              disabled={isProcessing} 
              className="flex-1 py-4 lg:py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl lg:rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-2xl shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-3 text-[11px] lg:text-sm"
            >
              {isProcessing ? <Zap className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> : <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" />}
              {isProcessing ? 'ĐANG PHÂN TÍCH...' : 'XỬ LÝ NGAY'}
            </button>
            {isProcessing ? (
              <button 
                onClick={() => setIsProcessing(false)} 
                className="px-6 lg:px-10 py-4 lg:py-5 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl lg:rounded-2xl font-black uppercase tracking-widest hover:bg-red-600/30 text-[11px] lg:text-sm transition-colors"
              >
                DỪNG
              </button>
            ) : hasBlocks && (
              <button onClick={onCancel} className="px-6 lg:px-10 py-4 lg:py-5 bg-slate-800 text-white rounded-xl lg:rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 text-[11px] lg:text-sm transition-colors">HỦY</button>
            )}
          </div>
        </>
      )}
      <div className="h-20 lg:hidden shrink-0"></div> {/* Spacer for mobile keyboard */}
    </motion.div>
  );
};
