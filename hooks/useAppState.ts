import { useState, useCallback, useEffect } from 'react';
import { OmniState, LogEntry } from '../types';
import { get, set } from 'idb-keyval';

const STORAGE_KEY = 'omni-builder-pro-state';

export const getInitialState = (): OmniState => ({
  projectName: "Dự án Thiết kế Mới",
  metaTitle: "Landing Page Architect",
  blocks: [],
  selectedBlockId: null,
  globalCss: "",
  accentColor: "#3b82f6",
  fontFamily: "Inter",
  designTone: 'professional',
  borderRadius: '0.75rem',
  spacingScale: 1.0,
  shadowIntensity: 0.1,
  logs: [],
  snapshots: [],
  googleFormUrl: "",
  canvasHeights: {
    mobile: 800,
    tablet: 1024,
    desktop: 1800
  },
  features: {
    enableVoice: true,
    enableRemix: true,
    enableLiveEdit: true
  },
  isAudioPlaying: false,
  omniMode: 'none',
  omniAspectRatios: ['16:9'],
  omniLogo: null,
  autoGenerateLogo: true,
  referenceImages: [],
  thinkingLevel: 'default',
  isDeepResearch: false,
  imageResolution: '1K',
  omniOutputMode: 'multi-block',
  tvcOutputMode: 'storyboard',
  packagingTexture: null,
  packagingType: 'bottle',
  inputSource: '',
  viewMode: 'preview',
  previewDevice: 'desktop'
});

export const useAppState = () => {
  const [state, setState] = useState<OmniState>(getInitialState());
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isSyncingPalette, setIsSyncingPalette] = useState(false);
  const [newModuleQuery, setNewModuleQuery] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [showHud, setShowHud] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'blocks' | 'history' | 'settings'>('blocks');

  const setOmniMode = useCallback((val: OmniState['omniMode'] | ((prev: OmniState['omniMode']) => OmniState['omniMode'])) => setState(prev => ({ ...prev, omniMode: typeof val === 'function' ? val(prev.omniMode) : val })), []);
  const setOmniAspectRatios = useCallback((val: string[] | ((prev: string[]) => string[])) => setState(prev => ({ ...prev, omniAspectRatios: typeof val === 'function' ? val(prev.omniAspectRatios) : val })), []);
  const setOmniLogo = useCallback((val: string | null | ((prev: string | null) => string | null)) => setState(prev => ({ ...prev, omniLogo: typeof val === 'function' ? val(prev.omniLogo) : val })), []);
  const setAutoGenerateLogo = useCallback((val: boolean | ((prev: boolean) => boolean)) => setState(prev => ({ ...prev, autoGenerateLogo: typeof val === 'function' ? val(prev.autoGenerateLogo) : val })), []);
  const setReferenceImages = useCallback((val: string[] | ((prev: string[]) => string[])) => setState(prev => ({ ...prev, referenceImages: typeof val === 'function' ? val(prev.referenceImages) : val })), []);
  const setThinkingLevel = useCallback((val: OmniState['thinkingLevel'] | ((prev: OmniState['thinkingLevel']) => OmniState['thinkingLevel'])) => setState(prev => ({ ...prev, thinkingLevel: typeof val === 'function' ? val(prev.thinkingLevel) : val })), []);
  const setIsDeepResearch = useCallback((val: boolean | ((prev: boolean) => boolean)) => setState(prev => ({ ...prev, isDeepResearch: typeof val === 'function' ? val(prev.isDeepResearch) : val })), []);
  const setImageResolution = useCallback((val: OmniState['imageResolution'] | ((prev: OmniState['imageResolution']) => OmniState['imageResolution'])) => setState(prev => ({ ...prev, imageResolution: typeof val === 'function' ? val(prev.imageResolution) : val })), []);
  const setOmniOutputMode = useCallback((val: OmniState['omniOutputMode'] | ((prev: OmniState['omniOutputMode']) => OmniState['omniOutputMode'])) => setState(prev => ({ ...prev, omniOutputMode: typeof val === 'function' ? val(prev.omniOutputMode) : val })), []);
  const setTvcOutputMode = useCallback((val: OmniState['tvcOutputMode'] | ((prev: OmniState['tvcOutputMode']) => OmniState['tvcOutputMode'])) => setState(prev => ({ ...prev, tvcOutputMode: typeof val === 'function' ? val(prev.tvcOutputMode) : val })), []);
  const setPackagingTexture = useCallback((val: string | null | ((prev: string | null) => string | null)) => setState(prev => ({ ...prev, packagingTexture: typeof val === 'function' ? val(prev.packagingTexture) : val })), []);
  const setPackagingType = useCallback((val: OmniState['packagingType'] | ((prev: OmniState['packagingType']) => OmniState['packagingType'])) => setState(prev => ({ ...prev, packagingType: typeof val === 'function' ? val(prev.packagingType) : val })), []);
  const setInputSource = useCallback((val: string | ((prev: string) => string)) => setState(prev => ({ ...prev, inputSource: typeof val === 'function' ? val(prev.inputSource) : val })), []);
  const setViewMode = useCallback((val: OmniState['viewMode'] | ((prev: OmniState['viewMode']) => OmniState['viewMode'])) => setState(prev => ({ ...prev, viewMode: typeof val === 'function' ? val(prev.viewMode) : val })), []);
  const setPreviewDevice = useCallback((val: OmniState['previewDevice'] | ((prev: OmniState['previewDevice']) => OmniState['previewDevice'])) => setState(prev => ({ ...prev, previewDevice: typeof val === 'function' ? val(prev.previewDevice) : val })), []);
  const setCanvasHeights = useCallback((val: OmniState['canvasHeights'] | ((prev: OmniState['canvasHeights']) => OmniState['canvasHeights'])) => setState(prev => ({ ...prev, canvasHeights: typeof val === 'function' ? val(prev.canvasHeights) : val })), []);
  const setSpacingScale = useCallback((val: number | ((prev: number) => number)) => setState(prev => ({ ...prev, spacingScale: typeof val === 'function' ? val(prev.spacingScale) : val })), []);
  const setShadowIntensity = useCallback((val: number | ((prev: number) => number)) => setState(prev => ({ ...prev, shadowIntensity: typeof val === 'function' ? val(prev.shadowIntensity) : val })), []);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    const newLog: LogEntry = { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toLocaleTimeString(), type, message };
    setState(prev => ({ ...prev, logs: [newLog, ...prev.logs].slice(0, 50) }));
  }, []);

  const ensureApiKey = useCallback(async () => {
    // @ts-ignore
    if (window.aistudio) {
      try {
        const hasKey = await Promise.race([
          // @ts-ignore
          window.aistudio.hasSelectedApiKey(),
          new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('Bridge Timeout')), 5000))
        ]);
        
        if (!hasKey) {
          addLog('warning', 'Vui lòng cài đặt Gemini API Key trước khi thực hiện.');
          // @ts-ignore
          await window.aistudio.openSelectKey();
          return false;
        }
      } catch (e) {
        console.warn('Bridge check failed or timed out:', e);
        return true;
      }
    }
    return true;
  }, [addLog]);

  // Load state from IndexedDB on mount
  useEffect(() => {
    const loadState = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const isFresh = urlParams.get('fresh') === '1';

      if (isFresh) {
        // Clear the fresh parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('fresh');
        window.history.replaceState({}, '', newUrl.toString());
        
        setState(getInitialState());
        setIsStateLoaded(true);
        addLog('info', 'Đã khởi tạo dự án mới.');
        return;
      }

      try {
        const saved = await get(STORAGE_KEY);
        if (saved) {
          setState({ ...getInitialState(), ...saved, logs: [] });
        }
      } catch (e) {
        console.error("Lỗi tải dữ liệu từ IndexedDB:", e);
      } finally {
        setIsStateLoaded(true);
      }
    };
    loadState();
  }, [addLog]);

  // Save state to IndexedDB when it changes
  useEffect(() => {
    if (!isStateLoaded) return; // Don't save before initial load

    setIsSaved(false);
    const timer = setTimeout(async () => {
      try {
        const { logs, ...stateToSave } = state; // Exclude logs from saving
        await set(STORAGE_KEY, stateToSave);
        setIsSaved(true);
      } catch (e) {
        console.error("Lỗi lưu dữ liệu vào IndexedDB:", e);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [state, isStateLoaded]);

  const createSnapshot = useCallback(() => {
    setState(prev => {
      const newSnapshot = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleString(),
        name: `Snapshot ${prev.snapshots.length + 1}`,
        state: {
          projectName: prev.projectName,
          metaTitle: prev.metaTitle,
          blocks: prev.blocks,
          selectedBlockId: prev.selectedBlockId,
          globalCss: prev.globalCss,
          accentColor: prev.accentColor,
          fontFamily: prev.fontFamily,
          designTone: prev.designTone,
          borderRadius: prev.borderRadius,
          spacingScale: prev.spacingScale,
          shadowIntensity: prev.shadowIntensity,
          googleFormUrl: prev.googleFormUrl,
          canvasHeights: prev.canvasHeights,
          features: prev.features,
          isAudioPlaying: prev.isAudioPlaying,
        }
      };
      return { ...prev, snapshots: [newSnapshot, ...prev.snapshots] };
    });
    addLog('success', 'Đã lưu snapshot mới.');
  }, [addLog]);

  const restoreSnapshot = useCallback((id: string) => {
    setState(prev => {
      const snapshot = prev.snapshots.find(s => s.id === id);
      if (snapshot) {
        if (confirm('Khôi phục snapshot này? Các thay đổi hiện tại sẽ bị ghi đè.')) {
          setPreviewKey(k => k + 1);
          addLog('info', `Đã khôi phục snapshot: ${snapshot.name}`);
          return { ...prev, ...snapshot.state, snapshots: prev.snapshots };
        }
      }
      return prev;
    });
  }, [addLog]);

  const deleteSnapshot = useCallback((id: string) => {
    if (confirm('Xóa snapshot này?')) {
      setState(prev => ({ ...prev, snapshots: prev.snapshots.filter(s => s.id !== id) }));
      addLog('info', 'Đã xóa snapshot.');
    }
  }, [addLog]);

  const toggleFeature = useCallback((feature: keyof OmniState['features']) => {
    setState(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
    addLog('info', `Đã ${state.features[feature] ? 'tắt' : 'bật'} tính năng: ${feature}`);
  }, [addLog, state.features]);

  const setPreviewDeviceWithLog = useCallback((device: OmniState['previewDevice']) => {
    setPreviewDevice(device);
    addLog('info', `Đã chuyển chế độ xem sang thiết bị: ${device}`);
  }, [addLog, setPreviewDevice]);

  const setViewModeWithLog = useCallback((mode: OmniState['viewMode']) => {
    setViewMode(mode);
    addLog('info', `Đã chuyển sang chế độ: ${mode === 'edit' ? 'Chỉnh sửa' : 'Xem trước'}`);
  }, [addLog, setViewMode]);

  const setOmniModeWithLog = useCallback((mode: OmniState['omniMode']) => {
    setOmniMode(mode);
    if (mode !== 'packaging-3d') {
      setPackagingTexture(null);
    }
    addLog('info', `Đã chuyển sang công cụ AI: ${mode === 'none' ? 'Không sử dụng' : mode}`);
  }, [addLog, setOmniMode, setPackagingTexture]);

  const handleNewProject = useCallback(() => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('fresh', '1');
    
    const newTab = window.open(newUrl.toString(), '_blank');
    
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      if (confirm('Trình duyệt đã chặn tab mới. Bạn có muốn đặt lại dự án hiện tại không? (Dữ liệu chưa lưu sẽ bị mất)')) {
        setState(getInitialState());
        setPreviewKey(k => k + 1);
        addLog('info', 'Dự án đã được đặt lại.');
      }
    } else {
      addLog('success', 'Đã mở dự án mới trong tab khác.');
    }
  }, [addLog, setState, setPreviewKey]);

  return {
    state, setState,
    isProcessing, setIsProcessing,
    isAddingModule, setIsAddingModule,
    isSyncingPalette, setIsSyncingPalette,
    newModuleQuery, setNewModuleQuery,
    viewMode: state.viewMode, setViewMode: setViewModeWithLog,
    previewDevice: state.previewDevice, setPreviewDevice: setPreviewDeviceWithLog,
    inputSource: state.inputSource, setInputSource,
    previewKey, setPreviewKey,
    showTerminal, setShowTerminal,
    isSaved, setIsSaved,
    showHud, setShowHud,
    isSidebarOpen, setIsSidebarOpen,
    isEditingTitle, setIsEditingTitle,
    sidebarTab, setSidebarTab,
    omniMode: state.omniMode, setOmniMode: setOmniModeWithLog,
    omniAspectRatios: state.omniAspectRatios, setOmniAspectRatios,
    omniLogo: state.omniLogo, setOmniLogo,
    autoGenerateLogo: state.autoGenerateLogo, setAutoGenerateLogo,
    referenceImages: state.referenceImages, setReferenceImages,
    thinkingLevel: state.thinkingLevel, setThinkingLevel,
    isDeepResearch: state.isDeepResearch, setIsDeepResearch,
    imageResolution: state.imageResolution, setImageResolution,
    omniOutputMode: state.omniOutputMode, setOmniOutputMode,
    tvcOutputMode: state.tvcOutputMode, setTvcOutputMode,
    packagingTexture: state.packagingTexture, setPackagingTexture,
    packagingType: state.packagingType, setPackagingType,
    setCanvasHeights,
    setSpacingScale,
    setShadowIntensity,
    addLog,
    ensureApiKey,
    toggleFeature,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    handleNewProject
  };
};
