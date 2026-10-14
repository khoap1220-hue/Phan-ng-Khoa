export const OMNI_MODE_NAMES: Record<string, string> = {
  'omni-slider': 'Slider/Banner',
  'omni-branding': 'Branding/Nhận diện thương hiệu',
  'omni-ux-flow': 'UX Flow/Giao diện ứng dụng',
  'omni-ad-campaign': 'Ad Campaign/Chiến dịch quảng cáo',
  'omni-catalogue': 'Catalogue/Lookbook',
  'omni-publication': 'Ấn phẩm/Tạp chí',
  'omni-product-suite': 'Bộ sản phẩm/Packaging',
  'omni-interior-decor': 'Nội thất/Kiến trúc',
  'omni-comic': 'Truyện tranh/Storyboard',
  'omni-hook-viral': 'Hook Viral/Thumbnail',
  'omni-wall-art': 'Tranh/Poster treo tường',
  'text-to-product': 'Sản phẩm hoàn chỉnh',
  'landing-page': 'Landing Page chuyển đổi cao',
  'omni-auto-resize': 'Auto-Resize/Đa tỷ lệ',
  'packaging-3d': 'Nhãn chai bao bì 3D',
  'studio-photography': 'Studio Photography/Chụp ảnh studio',
  'omni-character-design': 'Character Design/Thiết kế nhân vật',
  'omni-apparel-design': 'Apparel Design/Thiết kế trang phục',
  'omni-tvc-video': 'TVC Video/Storyboard',
  'omni-document': 'Tài liệu văn bản'
};

export const OMNI_PREFIX_NAMES: Record<string, string> = {
  'omni-slider': 'Slide',
  'omni-branding': 'Item',
  'omni-ux-flow': 'Màn hình',
  'omni-ad-campaign': 'Ad',
  'omni-catalogue': 'Trang',
  'omni-publication': 'Trang',
  'omni-product-suite': 'Product',
  'omni-interior-decor': 'Phòng',
  'omni-comic': 'Khung hình',
  'omni-hook-viral': 'Hook',
  'omni-wall-art': 'Tranh',
  'text-to-product': 'Phần',
  'landing-page': 'Section',
  'omni-auto-resize': 'Thiết kế',
  'packaging-3d': 'Nhãn chai 3D',
  'studio-photography': 'Ảnh Studio',
  'omni-character-design': 'Nhân vật',
  'omni-apparel-design': 'Trang phục',
  'omni-tvc-video': 'Cảnh',
  'omni-document': 'Trang'
};

export const getOmniModeName = (omniMode: string): string => {
  return OMNI_MODE_NAMES[omniMode] || 'Thiết kế';
};

export const getOmniPrefix = (omniMode: string): string => {
  return OMNI_PREFIX_NAMES[omniMode] || 'Phần';
};

export const getOmniBlockStyle = (omniMode: string): { bgClass: string, shadowClass: string } => {
  if (omniMode === 'studio-photography' || omniMode === 'omni-tvc-video') {
    return { bgClass: 'bg-slate-900', shadowClass: 'shadow-2xl' };
  }
  return { bgClass: 'bg-slate-100', shadowClass: 'shadow-xl' };
};

export const parseOmniItems = (prompt: string): string[] => {
  const items: string[] = [];
  const cleanPrompt = prompt.replace(/\*/g, '');
  
  // Dynamically build the prefix pattern from OMNI_PREFIX_NAMES
  const prefixes = new Set(Object.values(OMNI_PREFIX_NAMES));
  // Add common fallback prefixes
  prefixes.add('Section');
  prefixes.add('Page');
  prefixes.add('Phần');
  
  // Escape special regex characters
  const escapedPrefixes = Array.from(prefixes).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const prefixPattern = escapedPrefixes.join('|');
  
  const regexString = `^(?:\\s*#*\\s*-\\s*|\\s*#*\\s*\\d+\\.\\s*|\\s*#+\\s*)?(?:${prefixPattern})\\s*\\d+[\\s:\\-\\.]+(.*?)(?=^(?:\\s*#*\\s*-\\s*|\\s*#*\\s*\\d+\\.\\s*|\\s*#+\\s*)?(?:${prefixPattern})\\s*\\d+[\\s:\\-\\.]+(?:\\s|:|\\-|\\.)|$(?![\\s\\S]))`;
  const itemRegex = new RegExp(regexString, 'gims');
  
  let match;
  while ((match = itemRegex.exec(cleanPrompt)) !== null) {
    if (match[1].trim()) {
      items.push(match[1].trim());
    }
  }
  
  return items.length > 0 ? items : [prompt];
};
