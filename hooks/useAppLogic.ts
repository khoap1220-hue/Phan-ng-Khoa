import { useEffect, useMemo } from 'react';
import { generateIframeHtml } from '../utils/iframeHelper';
import { useAppState } from './useAppState';
import { useBlockActions } from './useBlockActions';
import { useImageActions } from './useImageActions';
import { useAIBuilder } from './useAIBuilder';
import { useAIBuild } from './useAIBuild';
import { useAIVideo } from './useAIVideo';

export const useAppLogic = () => {
  const appState = useAppState();
  const { state, setState, setPreviewKey, addLog, setViewMode } = appState;

  const { handleMoveBlock, updateBlockHtml, updateBlockHeight, deleteBlock, selectBlock } = useBlockActions(setState, setPreviewKey, addLog);
  const { updateBlockImage, handleRegenerateImage, handleFileUpload } = useImageActions(setState, setPreviewKey, addLog);
  
  const { 
    handleSmartPalette, deployFormBlock, handleAddModule,
    handleGlobalRemix, handleAnalyzeSEO, handleRefineBlock, handleMagicEnhanceBlock, playNarration, toggleFeature
  } = useAIBuilder(
    appState,
    handleRegenerateImage,
    appState.ensureApiKey
  );

  const { handleBuild } = useAIBuild(appState, handleRegenerateImage);
  const { handleRenderVideo } = useAIVideo(appState);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, blockId, newHtml, direction, imgIndex, prompt, height, device, instruction, imageSrc, lastImageSrc, voiceover, originalPrompt } = event.data;
      if (!type) return;
      switch (type) {
        case 'RENDER_VIDEO':
          handleRenderVideo(blockId, imgIndex, prompt, imageSrc, lastImageSrc, voiceover, originalPrompt);
          break;
        case 'REFINE_BLOCK':
          handleRefineBlock(blockId, instruction);
          break;
        case 'MAGIC_ENHANCE_BLOCK':
          handleMagicEnhanceBlock(blockId);
          break;
        case 'UPDATE_BLOCK_HTML':
          updateBlockHtml(blockId, newHtml);
          break;
        case 'UPDATE_BLOCK_HEIGHT':
          updateBlockHeight(blockId, device, height);
          break;
        case 'MOVE_BLOCK':
          handleMoveBlock(blockId, direction);
          break;
        case 'DELETE_BLOCK':
          deleteBlock(blockId);
          break;
        case 'SELECT_BLOCK':
          selectBlock(blockId);
          break;
        case 'ELEMENT_FOCUSED':
          appState.addLog('info', `Đang tương tác với thẻ ${event.data.tagName}: "${event.data.text}"`);
          break;
        case 'ADD_SECTION_PROMPT':
          setViewMode('edit');
          break;
        case 'REGENERATE_IMAGE':
          handleRegenerateImage(blockId, imgIndex, prompt, appState.imageResolution);
          break;
        case 'UPLOAD_IMAGE':
          handleFileUpload(blockId, imgIndex);
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [appState.addLog, updateBlockHtml, updateBlockHeight, handleMoveBlock, deleteBlock, selectBlock, setViewMode, handleRegenerateImage, handleFileUpload, appState.imageResolution, handleRefineBlock, handleMagicEnhanceBlock, handleRenderVideo]);

  const internalHtml = useMemo(() => generateIframeHtml(state, true, appState.previewDevice), [
    state.blocks,
    state.globalCss,
    state.accentColor,
    state.fontFamily,
    state.designTone,
    state.borderRadius,
    state.spacingScale,
    state.shadowIntensity,
    state.omniMode,
    state.omniOutputMode,
    appState.previewKey, 
    appState.previewDevice
  ]);

  return {
    ...appState,
    handleSmartPalette,
    handleBuild,
    deployFormBlock,
    handleMoveBlock,
    handleAddModule,
    handleRegenerateImage,
    handleGlobalRemix,
    handleAnalyzeSEO,
    handleRefineBlock,
    handleMagicEnhanceBlock,
    handleRenderVideo,
    playNarration,
    toggleFeature,
    internalHtml
  };
};
