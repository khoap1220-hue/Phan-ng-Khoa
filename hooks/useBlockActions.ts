import React, { useCallback } from 'react';
import { OmniState } from '../types';

export const useBlockActions = (
  setState: React.Dispatch<React.SetStateAction<OmniState>>,
  setPreviewKey: React.Dispatch<React.SetStateAction<number>>,
  addLog: (type: 'info' | 'success' | 'error' | 'warning', message: string) => void
) => {
  const handleMoveBlock = useCallback((blockId: string, dir: 'up' | 'down') => {
    setState(prev => {
      const idx = prev.blocks.findIndex(b => b.id === blockId);
      if (idx === -1) return prev;
      const newBlocks = [...prev.blocks];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= newBlocks.length) return prev;
      [newBlocks[idx], newBlocks[target]] = [newBlocks[target], newBlocks[idx]];
      return { ...prev, blocks: newBlocks };
    });
    setPreviewKey(k => k + 1);
    addLog('info', `Đã di chuyển block ${dir === 'up' ? 'lên' : 'xuống'}`);
  }, [setState, setPreviewKey, addLog]);

  const updateBlockHtml = useCallback((blockId: string, newHtml: string) => {
    setState(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id === blockId ? { ...b, html: newHtml } : b) }));
    addLog('info', `Đã cập nhật HTML cho block ${blockId}`);
  }, [setState, addLog]);

  const updateBlockHeight = useCallback((blockId: string, device: string, height: number) => {
    setState(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, heights: { ...b.heights, [device]: height } } : b)
    }));
    addLog('info', `Đã cập nhật chiều cao cho block ${blockId} trên thiết bị ${device}`);
  }, [setState, addLog]);

  const deleteBlock = useCallback((blockId: string) => {
    if(confirm('Xóa Section này?')) {
      setState(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== blockId) }));
      addLog('warning', `Đã xóa block ${blockId}`);
    }
  }, [setState, addLog]);

  const selectBlock = useCallback((blockId: string) => {
    setState(prev => ({ ...prev, selectedBlockId: blockId }));
    addLog('info', `Đã chọn block ${blockId}`);
  }, [setState, addLog]);

  return { handleMoveBlock, updateBlockHtml, updateBlockHeight, deleteBlock, selectBlock };
};
