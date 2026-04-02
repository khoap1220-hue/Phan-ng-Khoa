
export interface Block {
  id: string;
  type: string;
  name: string;
  html: string;
  css?: string;
  heights?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export type DesignTone = 'professional' | 'minimalist' | 'cyberpunk' | 'playful' | 'brutalist' | 'modern' | 'luxury' | 'organic' | 'atmospheric' | 'clean' | 'oversized' | 'bold';

export interface Snapshot {
  id: string;
  timestamp: string;
  name: string;
  state: Omit<OmniState, 'logs' | 'snapshots'>;
}

export interface OmniState {
  projectName: string;
  metaTitle: string;
  blocks: Block[];
  selectedBlockId: string | null;
  globalCss: string;
  accentColor: string;
  fontFamily: string;
  designTone: DesignTone;
  borderRadius: string;
  spacingScale: number;
  shadowIntensity: number;
  logs: LogEntry[];
  snapshots: Snapshot[];
  googleFormUrl: string;
  canvasHeights: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  features: {
    enableVoice: boolean;
    enableRemix: boolean;
    enableLiveEdit: boolean;
  };
  isAudioPlaying: boolean;
  omniMode: 'none' | 'landing-page' | 'omni-slider' | 'omni-branding' | 'omni-ux-flow' | 'omni-ad-campaign' | 'omni-catalogue' | 'omni-publication' | 'omni-product-suite' | 'text-to-product' | 'omni-interior-decor' | 'omni-comic' | 'omni-hook-viral' | 'omni-wall-art' | 'omni-auto-resize' | 'studio-photography' | 'packaging-3d' | 'omni-character-design' | 'omni-apparel-design' | 'omni-tvc-video' | 'design-refiner' | 'heritage-digitizer' | 'omni-document';
  omniAspectRatios: string[];
  omniLogo: string | null;
  autoGenerateLogo: boolean;
  referenceImages: string[];
  thinkingLevel: 'default' | 'low' | 'high';
  isDeepResearch: boolean;
  imageResolution: '1K' | '2K' | '4K';
  omniOutputMode: 'single-block' | 'multi-block';
  tvcOutputMode: 'storyboard' | 'video';
  packagingTexture: string | null;
  packagingType: 'bottle' | 'box' | 'jar' | 'pouch';
  inputSource: string;
  viewMode: 'edit' | 'preview';
  previewDevice: 'mobile' | 'tablet' | 'desktop';
}
