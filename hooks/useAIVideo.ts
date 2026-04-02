import { useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import { useAppState } from './useAppState';

export const useAIVideo = (
  appState: ReturnType<typeof useAppState>
) => {
  const {
    setState, setPreviewKey, addLog, setIsProcessing, ensureApiKey, omniAspectRatios
  } = appState;

  const handleRenderVideo = useCallback(async (blockId: string, imgIndex: number, prompt: string, imageSrc?: string, lastImageSrc?: string, voiceover?: string | null, originalPrompt?: string) => {
    if (!(await ensureApiKey())) return;
    setIsProcessing(true);
    addLog('info', `Đang render video cho cảnh này (có thể mất vài phút)...`);
    try {
      let finalVideoPrompt = prompt;
      
      if (voiceover !== "0") {
        let script = voiceover;
        if (!script && originalPrompt) {
          addLog('info', `Đang tạo kịch bản lồng tiếng từ nội dung ảnh...`);
          script = await geminiService.generateText(`Dựa vào mô tả cảnh sau đây, hãy viết một câu thoại lồng tiếng tiếng Việt ngắn gọn, tự nhiên và truyền cảm (chỉ trả về nội dung câu thoại, không thêm giải thích): "${originalPrompt}"`);
          addLog('info', `Kịch bản lồng tiếng: "${script}"`);
        }
        
        if (script) {
          finalVideoPrompt += `. Include a realistic Vietnamese voiceover saying exactly: "${script}". The voice should be natural and emotional.`;
        }
      }
      
      finalVideoPrompt += `. DO NOT include any text, subtitles, captions, or watermarks in the video. If the input image contains any text or subtitles, remove them completely and replace with natural background.`;

      let omniAspectRatio = omniAspectRatios[0] || '16:9';
      if (omniAspectRatio !== '16:9' && omniAspectRatio !== '9:16') {
        omniAspectRatio = '16:9';
      }

      let refImage;
      if (imageSrc && imageSrc.startsWith('data:')) {
        const match = imageSrc.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
        if (match) {
          refImage = { mimeType: match[1], data: match[2] };
        }
      }

      let lastRefImage;
      if (lastImageSrc && lastImageSrc.startsWith('data:')) {
        const match = lastImageSrc.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
        if (match) {
          lastRefImage = { mimeType: match[1], data: match[2] };
        }
      }

      const videoUrl = await geminiService.generateVideo(finalVideoPrompt, omniAspectRatio as any, '720p', refImage, lastRefImage);
      
      setState(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => {
          if (b.id === blockId) {
            return {
              ...b,
              html: `<div class="w-full flex justify-center bg-slate-900"><video src="${videoUrl}" class="w-full max-w-7xl h-auto object-cover" controls autoplay loop playsinline></video></div>`
            };
          }
          return b;
        })
      }));
      
      setPreviewKey(k => k + 1);
      addLog('success', `Đã render video thành công.`);
    } catch (e: any) {
      addLog('error', `Lỗi render video: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [ensureApiKey, setIsProcessing, addLog, omniAspectRatios, setState, setPreviewKey]);

  return { handleRenderVideo };
};
