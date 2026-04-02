import React, { useCallback } from 'react';
import { OmniState, LogEntry } from '../types';
import { geminiService } from '../services/geminiService';
import { compressBase64Image, processImageFile } from '../utils/imageProcessor';

export const useImageActions = (
  setState: React.Dispatch<React.SetStateAction<OmniState>>,
  setPreviewKey: React.Dispatch<React.SetStateAction<number>>,
  addLog: (type: LogEntry['type'], message: string) => void
) => {
  const updateBlockImage = useCallback((blockId: string, imgIndex: number, newUrl?: string) => {
    setState(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => {
        if (b.id !== blockId) return b;
        const parser = new DOMParser();
        const doc = parser.parseFromString(b.html, 'text/html');
        const imgs = doc.querySelectorAll('img');
        if (imgs[imgIndex]) {
          if (newUrl) {
            imgs[imgIndex].src = newUrl;
          }
          imgs[imgIndex].classList.remove('is-generating');
        }
        return { ...b, html: doc.body.innerHTML };
      })
    }));
    setPreviewKey(k => k + 1);
  }, [setState, setPreviewKey]);

  const handleRegenerateImage = useCallback(async (blockId: string, imgIndex: number, prompt: string, imageResolution: '1K' | '2K' | '4K' = '1K') => {
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      addLog('warning', 'Vui lòng cài đặt Gemini API Key trước khi thực hiện.');
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return;
    }
    addLog('info', `AI đang xử lý hình ảnh #${imgIndex + 1}...`);
    try {
      const rawImageUrl = await geminiService.generateAiImage(prompt, "16:9", imageResolution);
      // Compress the base64 image to save space
      const compressedUrl = await compressBase64Image(rawImageUrl, 1200, 0.75);
      updateBlockImage(blockId, imgIndex, compressedUrl);
      addLog('success', 'Đã cập nhật ảnh AI.');
    } catch (e: any) { 
      addLog('error', `Lỗi AI: ${e.message}`); 
      // Revert the generating state if error
      updateBlockImage(blockId, imgIndex); 
    }
  }, [addLog, updateBlockImage]);

  const handleFileUpload = useCallback((blockId: string, imgIndex: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        addLog('info', `Đang xử lý ảnh: ${file.name}...`);
        const compressedBase64 = await processImageFile(file, 1200, 0.75);
        updateBlockImage(blockId, imgIndex, compressedBase64);
        addLog('success', `Đã upload: ${file.name}`);
      } catch (err: any) {
        addLog('error', `Lỗi upload ảnh: ${err.message}`);
      }
    };
    input.click();
  }, [addLog, updateBlockImage]);

  return { updateBlockImage, handleRegenerateImage, handleFileUpload };
};
