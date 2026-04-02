import React, { useCallback } from 'react';
import { OmniState, LogEntry, Block, DesignTone } from '../types';
import { geminiService } from '../services/geminiService';
import { useAppState } from './useAppState';
import { compressBase64Image } from '../utils/imageProcessor';
import { PROMPTS } from '../constants/prompts';

export const useAIBuilder = (
  appState: ReturnType<typeof useAppState>,
  handleRegenerateImage: (blockId: string, imgIndex: number, prompt: string, imageResolution?: '1K' | '2K' | '4K') => Promise<void>,
  ensureApiKey: () => Promise<boolean>
) => {
  const {
    state, setState, setPreviewKey, addLog,
    setIsProcessing, setIsAddingModule, setIsSyncingPalette,
    setViewMode, inputSource, setInputSource,
    omniMode, omniAspectRatios, omniLogo, setOmniLogo, autoGenerateLogo, referenceImages,
    thinkingLevel, isDeepResearch,
    newModuleQuery, setNewModuleQuery, setIsSidebarOpen,
    imageResolution, omniOutputMode,
    toggleFeature
  } = appState;

  const handleSmartPalette = useCallback(async () => {
    if (!(await ensureApiKey())) return;
    if (state.blocks.length === 0) {
      addLog('warning', 'Cần có ít nhất một Section để phân tích màu sắc.');
      return;
    }
    setIsSyncingPalette(true);
    addLog('info', 'AI đang phân tích Identity và đề xuất màu sắc đồng bộ...');
    try {
      const context = state.blocks.map(b => b.html).join(' ');
      const response = await geminiService.generateContentWithFallback({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this landing page content and suggest the best visual identity: ${context}`,
        config: {
          systemInstruction: PROMPTS.getSmartPaletteSystemInstruction(),
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT" as any,
            properties: {
              accentColor: { type: "STRING" as any },
              fontFamily: { type: "STRING" as any },
              borderRadius: { type: "STRING" as any },
              shadowIntensity: { type: "NUMBER" as any }
            },
            required: ["accentColor", "fontFamily"]
          }
        }
      });
      
      const result = geminiService.parseJsonSafely(response.text || '{}', {});
      setState(prev => ({
        ...prev,
        accentColor: result.accentColor || prev.accentColor,
        fontFamily: result.fontFamily || prev.fontFamily,
        borderRadius: result.borderRadius || prev.borderRadius,
        shadowIntensity: result.shadowIntensity ?? prev.shadowIntensity
      }));
      setPreviewKey(k => k + 1);
      addLog('success', 'Đã đồng bộ Visual Identity mới từ trang web.');
    } catch (e: any) {
      addLog('error', `Lỗi đồng bộ màu sắc: ${e.message}`);
    } finally {
      setIsSyncingPalette(false);
    }
  }, [ensureApiKey, state.blocks, addLog, setIsSyncingPalette, setState, setPreviewKey]);


  const deployFormBlock = useCallback(async () => {
    if (!state.googleFormUrl.trim()) {
      addLog('warning', 'Vui lòng nhập Link Google Form trước khi đồng bộ.');
      return;
    }
    if (!(await ensureApiKey())) return;
    setIsAddingModule(true);
    addLog('info', 'Đang thiết kế Section Lead Capture thông minh (Cảm ứng toàn màn hình)...');
    try {
      const prompt = `Create a professional Lead Capture section for this Google Form: ${state.googleFormUrl}.
      
      FINAL MOBILE UX SPECIFICATION:
      1. Structure:
         - A main section container with 'relative overflow-hidden' and Tailwind responsive height.
         - An <iframe> containing the Google Form.
         - IMPORTANT: A transparent 'trigger-div' (absolute inset-0, z-20) that covers the form ONLY on mobile screens.
      2. Invisible Tap Mechanism:
         - NO text overlays, NO labels, NO buttons to start. It must look like a clean, embedded form.
         - When a user taps the form area on mobile, the 'trigger-div' onclick handler must:
           a) Apply classes to the main container to make it 'fixed top-0 left-0 w-screen h-screen z-[99999] bg-white'.
           b) Hide the 'trigger-div' itself so the user can now touch and scroll the actual Google Form iframe.
           c) Display a high-contrast 'Close' button (X icon) in the top-right corner.
      3. Close Mechanism:
         - Clicking the 'Close' button must remove the fullscreen classes from the container and show the 'trigger-div' again.
      4. Aesthetics:
         - Use professional Tailwind design for the section background and close button.
         - Desktop view must remain a standard, clean embed without any tap-to-focus behavior.
      5. Goal: Ensure zero double-scrollbars on mobile and 100% focus on form data entry.`;
      
      const context = state.blocks.map(b => b.html).join(' ');
      const newBlock = await geminiService.generateSingleBlock(prompt, state.designTone, context, thinkingLevel);
      setState(prev => ({ ...prev, blocks: [...prev.blocks, newBlock], selectedBlockId: newBlock.id }));
      setPreviewKey(k => k + 1);
      addLog('success', 'Đã thêm Form Block thông minh: Tự động mở toàn màn hình khi chạm trên di động.');
    } catch (e: any) { addLog('error', `Lỗi khi đồng bộ Form: ${e.message}`); } finally { setIsAddingModule(false); }
  }, [state.googleFormUrl, ensureApiKey, setIsAddingModule, addLog, state.blocks, state.designTone, thinkingLevel, setState, setPreviewKey]);

  const handleAddModule = useCallback(async (overrideQuery?: string) => {
    const queryToUse = overrideQuery || newModuleQuery;
    if (!queryToUse.trim()) return;
    if (!(await ensureApiKey())) return;
    setIsAddingModule(true);
    setIsSidebarOpen(false); 
    try {
      const context = state.blocks.map(b => b.html).join(' ');
      const newBlock = await geminiService.generateSingleBlock(queryToUse, state.designTone, context, thinkingLevel);
      setState(prev => ({ ...prev, blocks: [...prev.blocks, newBlock], selectedBlockId: newBlock.id }));
      setNewModuleQuery('');
      setViewMode('preview');
      setPreviewKey(k => k + 1);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(newBlock.html, 'text/html');
      const imgs = Array.from(doc.querySelectorAll('img'));
      const imageGenerationPromises: Promise<void>[] = [];
      for (let idx = 0; idx < imgs.length; idx++) {
        const img = imgs[idx];
        const prompt = img.getAttribute('data-ai-prompt');
        if (prompt) {
          imageGenerationPromises.push(handleRegenerateImage(newBlock.id, idx, prompt, imageResolution));
        }
      }
      await Promise.all(imageGenerationPromises);
    } catch (e: any) { addLog('error', e.message); } finally { setIsAddingModule(false); }
  }, [newModuleQuery, ensureApiKey, setIsAddingModule, setIsSidebarOpen, state.blocks, state.designTone, thinkingLevel, setState, setNewModuleQuery, setViewMode, setPreviewKey, handleRegenerateImage, imageResolution]);

  const handleGlobalRemix = useCallback(async (tone: DesignTone) => {
    if (state.blocks.length === 0) return;
    if (!(await ensureApiKey())) return;
    setIsProcessing(true);
    addLog('info', `Đang Remix toàn bộ giao diện sang phong cách: ${tone.toUpperCase()}...`);
    try {
      const result = await geminiService.globalRemix(state.blocks, tone);
      setState(prev => ({
        ...prev,
        blocks: result.blocks,
        globalCss: result.globalCss || prev.globalCss,
        designTone: tone
      }));
      setPreviewKey(k => k + 1);
      addLog('success', `Đã Remix xong giao diện sang phong cách ${tone}.`);
    } catch (e: any) {
      addLog('error', `Lỗi Remix: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [state.blocks, ensureApiKey, setIsProcessing, addLog, setState, setPreviewKey]);

  const handleAnalyzeSEO = useCallback(async () => {
    if (state.blocks.length === 0) return;
    if (!(await ensureApiKey())) return;
    setIsProcessing(true);
    addLog('info', 'Đang phân tích SEO và khả năng truy cập...');
    try {
      const report = await geminiService.analyzeSEO(state.blocks);
      addLog('success', 'Đã hoàn tất phân tích SEO.');
      // Hiển thị report trong terminal
      addLog('info', `BÁO CÁO SEO:\n${report}`);
    } catch (e: any) {
      addLog('error', `Lỗi phân tích SEO: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [state.blocks, ensureApiKey, setIsProcessing, addLog]);

  const handleRefineBlock = useCallback(async (blockId: string, instruction: string) => {
    const block = state.blocks.find(b => b.id === blockId);
    if (!block || !instruction.trim()) return;
    if (!(await ensureApiKey())) return;
    setIsProcessing(true);
    addLog('info', `Đang tinh chỉnh Section: ${block.name}...`);
    try {
      const refinedBlock = await geminiService.refineBlock(block, instruction, state.designTone);
      setState(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => b.id === blockId ? refinedBlock : b)
      }));
      setPreviewKey(k => k + 1);
      addLog('success', `Đã tinh chỉnh xong Section: ${block.name}.`);
    } catch (e: any) {
      addLog('error', `Lỗi tinh chỉnh: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [state.blocks, state.designTone, ensureApiKey, setIsProcessing, addLog, setState, setPreviewKey]);

  const handleMagicEnhanceBlock = useCallback(async (blockId: string) => {
    const block = state.blocks.find(b => b.id === blockId);
    if (!block) return;
    if (!(await ensureApiKey())) return;
    setIsProcessing(true);
    addLog('info', `✨ Đang nâng cấp toàn diện Section: ${block.name}...`);
    try {
      const instruction = "Magic Enhance: Tự động phân tích và sắp xếp lại bố cục, phối màu theo chuẩn thẩm mỹ UI/UX hiện đại. Viết lại các prompt ảnh (data-ai-prompt) chi tiết hơn với độ phân giải cao và hiệu ứng ánh sáng chuyên nghiệp (ví dụ: 4k, photorealistic, cinematic lighting).";
      const refinedBlock = await geminiService.refineBlock(block, instruction, state.designTone);
      
      setState(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => b.id === blockId ? refinedBlock : b)
      }));
      setPreviewKey(k => k + 1);
      addLog('success', `✨ Đã nâng cấp bố cục Section: ${block.name}. Đang tạo lại hình ảnh...`);

      // Parse HTML to find images and regenerate them
      const parser = new DOMParser();
      const doc = parser.parseFromString(refinedBlock.html, 'text/html');
      const images = Array.from(doc.querySelectorAll('img'));
      
      const imageGenerationPromises: Promise<void>[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const prompt = img.getAttribute('data-ai-prompt');
        if (prompt) {
          addLog('info', `Đang vẽ lại ảnh ${i + 1}/${images.length} với độ phân giải cao...`);
          imageGenerationPromises.push(handleRegenerateImage(blockId, i, prompt, '4K'));
        }
      }
      await Promise.all(imageGenerationPromises);
      
      addLog('success', `✨ Hoàn tất nâng cấp toàn diện Section: ${block.name}.`);
    } catch (e: any) {
      addLog('error', `Lỗi nâng cấp: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [state.blocks, state.designTone, ensureApiKey, setIsProcessing, addLog, setState, setPreviewKey, handleRegenerateImage]);

  const playNarration = useCallback(async () => {
    if (state.blocks.length === 0) return;
    if (state.isAudioPlaying) return;
    if (!(await ensureApiKey())) return;

    const textToSpeak = state.blocks.map(b => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(b.html, 'text/html');
      return doc.body.innerText;
    }).join('. ');

    if (!textToSpeak.trim()) return;

    setState(prev => ({ ...prev, isAudioPlaying: true }));
    addLog('info', 'Đang khởi tạo AI Voice Pitch...');
    
    try {
      const audioBuffer = await geminiService.generateSpeech(textToSpeak);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createBufferSource();
      
      const decodedData = await audioContext.decodeAudioData(audioBuffer);
      source.buffer = decodedData;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setState(prev => ({ ...prev, isAudioPlaying: false }));
        addLog('info', 'Đã kết thúc AI Voice Pitch.');
      };
      
      source.start(0);
      addLog('success', 'Đang phát AI Voice Pitch.');
    } catch (e: any) {
      addLog('error', `Lỗi AI Voice: ${e.message}`);
      setState(prev => ({ ...prev, isAudioPlaying: false }));
    }
  }, [state.blocks, state.isAudioPlaying, ensureApiKey, setState, addLog]);

  return { handleSmartPalette, deployFormBlock, handleAddModule, handleGlobalRemix, handleAnalyzeSEO, handleRefineBlock, handleMagicEnhanceBlock, playNarration, toggleFeature };
};
