import { useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import { useAppState } from './useAppState';
import { Block, DesignTone } from '../types';
import { compressBase64Image } from '../utils/imageProcessor';
import { PROMPTS } from '../constants/prompts';
import { getOmniPrefix, getOmniBlockStyle, getOmniModeName } from '../utils/omniParser';

export const useAIBuild = (
  appState: ReturnType<typeof useAppState>,
  handleRegenerateImage: (blockId: string, imgIndex: number, prompt: string, imageResolution?: '1K' | '2K' | '4K') => Promise<void>
) => {
  const {
    state, setState, setPreviewKey, addLog, setIsProcessing, ensureApiKey,
    inputSource, setInputSource, omniMode, omniLogo, setOmniLogo, autoGenerateLogo,
    isDeepResearch, referenceImages, thinkingLevel, omniOutputMode, imageResolution,
    setViewMode, omniAspectRatios
  } = appState;

  const getAddedHeight = useCallback((ratio: string) => {
    switch (ratio) {
      case '9:16': return 1200;
      case '3:4': return 1000;
      case '2:3': return 1000;
      case '4:5': return 1000;
      case '1:1': return 800;
      case '1:4': return 2400;
      case '1:8': return 4800;
      case '21:9': return 600;
      case '4:1': return 600;
      case '8:1': return 400;
      default: return 800; // 16:9, 4:3, 3:2, 5:4
    }
  }, []);

  const handleBuild = useCallback(async (overrideInputSource?: string) => {
    const sourceToUse = overrideInputSource || inputSource;
    if (!sourceToUse.trim() && referenceImages.length === 0) return;
    if (!(await ensureApiKey())) return;
    setIsProcessing(true);
    try {
      let finalInputSource = sourceToUse || "Phân tích hình ảnh đính kèm và tạo giao diện tương ứng.";
      let currentLogo = omniLogo;

      if (omniMode !== 'none' && !currentLogo && autoGenerateLogo) {
        addLog('info', 'Chưa có logo, hệ thống đang tự động thiết kế logo chuẩn hóa...');
        const logoPrompt = PROMPTS.getLogoPrompt(sourceToUse);
        try {
          const rawLogo = await geminiService.generateAiImage(logoPrompt, "1:1", '1K');
          currentLogo = await compressBase64Image(rawLogo, 800, 0.75);
          setOmniLogo(currentLogo);
          addLog('success', 'Đã thiết kế xong logo chuẩn hóa.');
        } catch (err) {
          addLog('error', 'Không thể tạo logo tự động, sẽ tiếp tục mà không có logo.');
        }
      }

      if (isDeepResearch || referenceImages.length > 0 || (thinkingLevel !== 'default' && omniMode !== 'none')) {
        addLog('info', 'Đang phân tích yêu cầu chuyên sâu...');
        finalInputSource = await geminiService.analyzeDeepResearch(sourceToUse, thinkingLevel, referenceImages, omniMode, omniOutputMode, isDeepResearch);
        setInputSource(finalInputSource);
        addLog('success', 'Đã phân tích xong luồng yêu cầu hệ thống.');
      }

      if (omniMode === 'text-to-product' || omniMode === 'landing-page' || omniMode === 'omni-document') {
        const isLandingPage = omniMode === 'landing-page';
        const isDocument = omniMode === 'omni-document';
        addLog('info', `Khởi động Agent ${isLandingPage ? 'Thiết kế Landing Page' : isDocument ? 'Soạn thảo Tài liệu' : 'Tổng công trình sư (Text-to-Product)'}...`);
        
        // 1. Deep Research
        addLog('info', `Agent đang phân tích và lập kế hoạch ${isLandingPage ? 'cấu trúc Landing Page' : isDocument ? 'dàn ý tài liệu' : 'tổng thể'}...`);
        const planPrompt = isLandingPage 
          ? PROMPTS.getLandingPagePlanPrompt(sourceToUse)
          : isDocument
            ? PROMPTS.getDocumentPlanPrompt(sourceToUse)
            : PROMPTS.getProductSuitePlanPrompt(sourceToUse);
        
        try {
          finalInputSource = await geminiService.analyzeDeepResearch(planPrompt, 'high', referenceImages, omniMode, 'multi-block', isDeepResearch);
          setInputSource(finalInputSource);
          addLog('success', `Đã hoàn tất bản ${isLandingPage ? 'phác thảo Landing Page' : isDocument ? 'dàn ý tài liệu' : 'thiết kế kiến trúc'}.`);
        } catch (err: any) {
          addLog('error', `Lỗi phân tích chuyên sâu: ${err.message}`);
          throw err;
        }

        // 2. Generate HTML
        addLog('info', 'Agent đang lập trình giao diện (UI/UX)...');
        const generator = geminiService.parseToBlocksStream(finalInputSource, state.designTone, undefined, 'high');
        
        let parsedBlocks: Block[] = [];
        let globalCss = "";
        
        for await (const result of generator) {
          parsedBlocks = result.blocks;
          globalCss = result.globalCss;
          
          if (parsedBlocks.length > 0) {
            setState(prev => ({ 
              ...prev, 
              blocks: parsedBlocks,
              globalCss: globalCss || prev.globalCss,
              selectedBlockId: prev.selectedBlockId || parsedBlocks[0].id
            }));
            // Update preview key to force iframe refresh for streaming effect
            setPreviewKey(k => k + 1);
          }
        }
        addLog('success', 'Đã hoàn thiện mã nguồn giao diện.');

        // 3. Generate Images
        if (!isDocument) {
          addLog('info', 'Agent đang thiết kế tài sản đồ họa (Assets/Images)...');
          
          let imagePrompts: { blockId: string, oldSrc: string, prompt: string, aspectRatio: string }[] = [];
          
          parsedBlocks.forEach(block => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(block.html, 'text/html');
            const imgs = doc.querySelectorAll('img');
            
            imgs.forEach(img => {
              const src = img.getAttribute('src') || '';
              const alt = img.getAttribute('data-ai-prompt') || img.getAttribute('alt') || 'Hình ảnh minh họa';
              
              if (src.includes('picsum.photos') || src.includes('placeholder') || src.includes('placehold.co') || src.includes('via.placeholder')) {
                let aspectRatio = '16:9';
                const className = img.className || '';
                if (className.includes('aspect-square') || className.includes('rounded-full') || className.includes('w-16 h-16') || className.includes('w-24 h-24') || className.includes('w-32 h-32')) aspectRatio = '1:1';
                else if (className.includes('aspect-[3/4]')) aspectRatio = '3:4';
                else if (className.includes('aspect-video')) aspectRatio = '16:9';
                
                imagePrompts.push({
                  blockId: block.id,
                  oldSrc: src,
                  prompt: alt,
                  aspectRatio
                });
              }
            });
          });

          if (imagePrompts.length > 0) {
            addLog('info', `Tìm thấy ${imagePrompts.length} vị trí cần thiết kế hình ảnh. Đang tiến hành vẽ...`);
            
            const prefix = isLandingPage ? 'Section' : isDocument ? 'Trang' : 'Phần';
            const combinedPrompt = imagePrompts.map((p, i) => `${prefix} ${i + 1}: ${p.prompt}`).join('\n');
            
            const imgGenerator = geminiService.generateOmniImagesStream(
              combinedPrompt, 
              omniMode,
              '16:9',
              currentLogo || undefined, 
              currentLogo ? (currentLogo.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/) || [])[1] || 'image/png' : undefined, 
              imageResolution, 
              'multi-block', 
              referenceImages
            );
            
            let imgCount = 0;
            for await (const rawImageUrl of imgGenerator) {
              if (imgCount < imagePrompts.length) {
                const target = imagePrompts[imgCount];
                const imageUrl = await compressBase64Image(rawImageUrl, 1200, 0.75);
                
                parsedBlocks = parsedBlocks.map(b => {
                  if (b.id === target.blockId) {
                    return {
                      ...b,
                      html: b.html.replace(target.oldSrc, imageUrl)
                    };
                  }
                  return b;
                });
                
                setState(prev => ({ ...prev, blocks: parsedBlocks }));
                setPreviewKey(k => k + 1);
                addLog('success', `Đã thiết kế xong hình ảnh ${imgCount + 1}/${imagePrompts.length}`);
                imgCount++;
              }
            }
          }
        }
        
        setViewMode('preview');
        addLog('success', `Agent ${isLandingPage ? 'Thiết kế Landing Page' : isDocument ? 'Soạn thảo Tài liệu' : 'Tổng công trình sư'} đã hoàn tất toàn bộ dự án!`);
      } else if (omniMode !== 'none') {
        let mimeType = 'image/png';
        if (currentLogo) {
          const match = currentLogo.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
          if (match) mimeType = match[1];
        }

        addLog('info', `Đang tạo ${omniMode} với AI...`);
        const generator = geminiService.generateOmniImagesStream(
          finalInputSource, 
          omniMode, 
          omniAspectRatios[0] || '16:9', 
          currentLogo || undefined, 
          mimeType, 
          imageResolution, 
          omniOutputMode, 
          referenceImages
        );
        
        let count = 0;
        let generatedImages: string[] = [];

        const appendBlock = (newBlock: Block, addedHeight: number, isFirstInBatch: boolean) => {
          setState(prev => {
            const prevCanvasHeights = prev.canvasHeights || { desktop: 0, tablet: 0, mobile: 0 };
            return { 
              ...prev, 
              blocks: [...prev.blocks, newBlock], 
              selectedBlockId: isFirstInBatch ? newBlock.id : prev.selectedBlockId,
              canvasHeights: {
                desktop: prevCanvasHeights.desktop + addedHeight,
                tablet: prevCanvasHeights.tablet + addedHeight * 0.8,
                mobile: prevCanvasHeights.mobile + addedHeight * 0.5
              }
            };
          });
        };
        
        if (omniMode === 'omni-auto-resize') {
          const ratios = omniAspectRatios.length > 0 ? omniAspectRatios : ['16:9', '9:16', '1:1', '4:5'];
          addLog('info', `Đang tạo thiết kế đa tỷ lệ (${ratios.join(', ')})...`);
          
          await Promise.all(ratios.map(async (ratio, index) => {
            try {
              addLog('info', `Đang vẽ tỷ lệ ${ratio}...`);
              const rawImageUrl = await geminiService.generateAiImage(finalInputSource, ratio, imageResolution);
              const imageUrl = await compressBase64Image(rawImageUrl, 1200, 0.75);
              
              const blockName = `Thiết kế ${ratio}`;
              const addedHeight = getAddedHeight(ratio);
              
              const escapedPrompt = finalInputSource.replace(/"/g, '&quot;');
              const newBlock: Block = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'omni-auto-resize',
                name: blockName,
                html: `<div class="w-full flex justify-center bg-slate-100 p-8"><img src="${imageUrl}" class="max-w-full h-auto shadow-xl rounded-lg" alt="${escapedPrompt}" data-ai-prompt="${escapedPrompt}" /></div>`
              };

              appendBlock(newBlock, addedHeight, index === 0);
              
              if (index === 0) {
                 setViewMode('preview');
              }
              setPreviewKey(k => k + 1);
              addLog('success', `Đã tạo thành công ${blockName}.`);
            } catch (e: any) {
              addLog('error', `Lỗi tạo tỷ lệ ${ratio}: ${e.message}`);
            }
          }));
          count = ratios.length;
          addLog('success', `Hoàn tất tạo ${count} hình ảnh Auto-Resize.`);
        } else if (omniMode === 'omni-tvc-video') {
          let omniAspectRatio = omniAspectRatios[0] || '16:9';
          if (omniAspectRatio !== '16:9' && omniAspectRatio !== '9:16') {
            omniAspectRatio = '16:9';
          }
          addLog('info', `Đang phân tích kịch bản TVC Video...`);
          
          try {
            const storyboardPrompt = PROMPTS.getTVCStoryboardPrompt(finalInputSource);
            const storyboardResponse = await geminiService.generateText(storyboardPrompt);
            let scenes: string[] = [];
            try {
              const jsonMatch = storyboardResponse.match(/\[.*\]/s);
              if (jsonMatch) {
                scenes = JSON.parse(jsonMatch[0]);
              } else {
                scenes = [finalInputSource];
              }
            } catch (e) {
              scenes = [finalInputSource];
            }

            addLog('info', `Đã phân tích thành ${scenes.length} cảnh. Đang tạo Storyboard...`);

            if (omniOutputMode === 'single-block') {
              const combinedPrompt = scenes.map((s, i) => `Cảnh ${i+1}: ${s}`).join('\n');
              const escapedCombinedPrompt = combinedPrompt.replace(/"/g, '&quot;');
              const rawImageUrl = await geminiService.generateAiImage(combinedPrompt, omniAspectRatio, imageResolution);
              const imageUrl = await compressBase64Image(rawImageUrl, 1200, 0.75);
              
              const blockName = `Storyboard Tổng hợp`;
              const addedHeight = getAddedHeight(omniAspectRatio);
              
              const blockStyle = getOmniBlockStyle(omniMode);
              const newBlock: Block = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'omni-tvc-video',
                name: blockName,
                html: `<div class="w-full flex justify-center ${blockStyle.bgClass} p-8"><img src="${imageUrl}" class="max-w-full h-auto ${blockStyle.shadowClass} rounded-lg" alt="${escapedCombinedPrompt}" data-ai-prompt="${escapedCombinedPrompt}" /></div>`
              };

              appendBlock(newBlock, addedHeight, true);
              
              setViewMode('preview');
              setPreviewKey(k => k + 1);
              addLog('success', `Đã tạo thành công ${blockName}.`);
            } else {
              await Promise.all(scenes.map(async (scenePrompt, i) => {
                const escapedScenePrompt = scenePrompt.replace(/"/g, '&quot;');
                addLog('info', `Đang tạo ảnh cho Cảnh ${i + 1}/${scenes.length}...`);
                
                try {
                  const rawImageUrl = await geminiService.generateAiImage(scenePrompt, omniAspectRatio, imageResolution);
                  const imageUrl = await compressBase64Image(rawImageUrl, 1200, 0.75);
                  
                  const blockName = `Cảnh ${i + 1}`;
                  const addedHeight = getAddedHeight(omniAspectRatio);
                  
                  const blockStyle = getOmniBlockStyle(omniMode);
                  const newBlock: Block = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'omni-tvc-video',
                    name: blockName,
                    html: `<div class="w-full flex justify-center ${blockStyle.bgClass} p-8"><img src="${imageUrl}" class="max-w-full h-auto ${blockStyle.shadowClass} rounded-lg" alt="${escapedScenePrompt}" data-ai-prompt="${escapedScenePrompt}" /></div>`
                  };

                  appendBlock(newBlock, addedHeight, i === 0);
                  
                  if (i === 0) setViewMode('preview');
                  setPreviewKey(k => k + 1);
                  addLog('success', `Đã tạo thành công ${blockName}.`);
                } catch (e: any) {
                  addLog('error', `Lỗi tạo Cảnh ${i + 1}: ${e.message}`);
                }
              }));
            }
            addLog('success', 'Đã tạo xong Storyboard. Bạn có thể nhấn Render Video trên từng ảnh.');
          } catch (e: any) {
            addLog('error', `Lỗi tạo Storyboard: ${e.message}`);
          }
        } else {
          const modeName = getOmniModeName(omniMode);
          addLog('info', `Đang tạo ${modeName}...`);
          for await (const rawImageUrl of generator) {
            count++;
            const imageUrl = await compressBase64Image(rawImageUrl, 1200, 0.75);
            generatedImages.push(imageUrl);
            
            if (omniOutputMode === 'multi-block') {
              const prefix = getOmniPrefix(omniMode);
              const blockName = `${prefix} ${count}`;
              const addedHeight = getAddedHeight(omniAspectRatios[0] || '16:9');
              
              const escapedPrompt = finalInputSource.replace(/"/g, '&quot;');
              const blockStyle = getOmniBlockStyle(omniMode);
              const newBlock: Block = {
                id: Math.random().toString(36).substr(2, 9),
                type: omniMode,
                name: blockName,
                html: `<div class="w-full flex justify-center ${blockStyle.bgClass} p-8"><img src="${imageUrl}" class="max-w-full h-auto ${blockStyle.shadowClass} rounded-lg" alt="${escapedPrompt}" data-ai-prompt="${escapedPrompt}" /></div>`
              };

              appendBlock(newBlock, addedHeight, count === 1);
              
              if (count === 1) {
                 setViewMode('preview');
              }
              setPreviewKey(k => k + 1);
              addLog('success', `Đã tạo thành công ${blockName}.`);
            }
          }
          
          if (omniOutputMode === 'single-block' && generatedImages.length > 0) {
            const blockName = `Thiết kế Tổng hợp`;
            const addedHeight = getAddedHeight(omniAspectRatios[0] || '16:9');
            
            const escapedPrompt = finalInputSource.replace(/"/g, '&quot;');
            const blockStyle = getOmniBlockStyle(omniMode);
            const newBlock: Block = {
              id: Math.random().toString(36).substr(2, 9),
              type: omniMode,
              name: blockName,
              html: `<div class="w-full flex justify-center ${blockStyle.bgClass} p-8"><img src="${generatedImages[0]}" class="max-w-full h-auto ${blockStyle.shadowClass} rounded-lg" alt="${escapedPrompt}" data-ai-prompt="${escapedPrompt}" /></div>`
            };

            appendBlock(newBlock, addedHeight, true);
            setViewMode('preview');
            setPreviewKey(k => k + 1);
            addLog('success', `Đã tạo thành công ${blockName} gộp chung 1 Section.`);
          }

          if (count > 0 && omniOutputMode === 'multi-block') {
             addLog('success', `Hoàn tất tạo ${count} hình ảnh Omni.`);
          }
        }
      } else {
        addLog('info', 'Đang tạo giao diện với AI...');
        const generator = geminiService.parseToBlocksStream(finalInputSource, state.designTone, undefined, thinkingLevel);
        
        let parsedBlocks: Block[] = [];
        let globalCss = "";
        
        for await (const result of generator) {
          parsedBlocks = result.blocks;
          globalCss = result.globalCss;
          
          if (parsedBlocks.length > 0) {
            setState(prev => ({ 
              ...prev, 
              blocks: parsedBlocks,
              globalCss: globalCss || prev.globalCss,
              selectedBlockId: prev.selectedBlockId || parsedBlocks[0].id
            }));
            setPreviewKey(k => k + 1);
          }
        }

        if (parsedBlocks.length > 0) {
          setViewMode('preview');
          addLog('success', 'Đã tạo xong giao diện.');
        } else {
          addLog('error', 'Không thể tạo giao diện. Vui lòng thử lại.');
        }

        const imageGenerationPromises: Promise<void>[] = [];
        for (const block of parsedBlocks) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(block.html, 'text/html');
          const imgs = Array.from(doc.querySelectorAll('img'));
          for (let idx = 0; idx < imgs.length; idx++) {
            const img = imgs[idx];
            const prompt = img.getAttribute('data-ai-prompt');
            if (prompt) {
              imageGenerationPromises.push(handleRegenerateImage(block.id, idx, prompt, imageResolution));
            }
          }
        }
        await Promise.all(imageGenerationPromises);
      }
    } catch (e: any) {
      addLog('error', e.message);
    } finally {
      setIsProcessing(false);
    }
  }, [inputSource, ensureApiKey, setIsProcessing, omniMode, omniLogo, addLog, setOmniLogo, isDeepResearch, referenceImages, thinkingLevel, omniOutputMode, setInputSource, state.designTone, setState, setPreviewKey, imageResolution, setViewMode, omniAspectRatios, getAddedHeight, handleRegenerateImage]);

  return { handleBuild };
};
