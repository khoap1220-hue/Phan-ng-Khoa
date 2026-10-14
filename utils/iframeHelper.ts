
import { OmniState } from '../types';

export const generateIframeHtml = (state: OmniState, isInternal: boolean = true, currentDevice: string = 'desktop'): string => {
  const content = state.blocks.map(b => {
    if (!isInternal) return b.html;
    return `
      <div data-block-id="${b.id}" data-block-type="${b.type}" class="elementor-section-wrap ${state.selectedBlockId === b.id ? 'active' : ''}">
        <div class="elementor-handle-bar">
          <div class="handle-item move-up" title="Lên"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m18 15-6-6-6 6"/></svg></div>
          <div class="handle-item move-down" title="Xuống"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m6 9 6 6 6-6"/></svg></div>
          <div class="handle-item refine-section" title="AI Tinh chỉnh"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m21.64 3.64l-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/></svg></div>
          <div class="handle-item magic-enhance-section" title="✨ Magic Enhance (Tự động nâng cấp UI & Ảnh)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></div>
          <div class="handle-item drag-handle" title="Kéo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg></div>
          <div class="handle-item delete-section" title="Xóa"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg></div>
        </div>

        <div class="elementor-content-inner">
          ${b.html}
        </div>

        <div class="elementor-resize-handle" title="Kéo chỉnh chiều cao">
           <div class="resize-dot"></div>
        </div>
      </div>
    `;
  }).join('\n');

  const responsiveStyles = state.blocks.map(b => {
    if (!b.heights) return '';
    let css = '';
    const selector = `[data-block-id="${b.id}"] .elementor-content-inner > *`;
    if (b.heights.desktop) css += `${selector} { height: ${b.heights.desktop}px !important; min-height: ${b.heights.desktop}px !important; overflow: hidden; display: block; }`;
    if (b.heights.tablet) css += `@media (max-width: 1024px) { ${selector} { height: ${b.heights.tablet}px !important; min-height: ${b.heights.tablet}px !important; } }`;
    if (b.heights.mobile) css += `@media (max-width: 640px) { ${selector} { height: ${b.heights.mobile}px !important; min-height: ${b.heights.mobile}px !important; } }`;
    return css;
  }).join('\n');

  const scripts = isInternal ? `
    <script>
      (function() {
        function sendToParent(data) { window.parent.postMessage(data, '*'); }
        
        document.querySelectorAll('.elementor-section-wrap').forEach(section => {
          const id = section.getAttribute('data-block-id');
          const blockType = section.getAttribute('data-block-type');
          const innerContainer = section.querySelector('.elementor-content-inner');
          const resizeHandle = section.querySelector('.elementor-resize-handle');
          
          section.querySelector('.move-up').onclick = (e) => { e.stopPropagation(); sendToParent({ type: 'MOVE_BLOCK', blockId: id, direction: 'up' }); };
          section.querySelector('.move-down').onclick = (e) => { e.stopPropagation(); sendToParent({ type: 'MOVE_BLOCK', blockId: id, direction: 'down' }); };
          section.querySelector('.refine-section').onclick = (e) => { 
            e.stopPropagation(); 
            const instruction = prompt('Nhập yêu cầu tinh chỉnh cho Section này (ví dụ: "Thay đổi màu nền sang xanh dương", "Thêm nút CTA mới"):');
            if (instruction) sendToParent({ type: 'REFINE_BLOCK', blockId: id, instruction }); 
          };
          section.querySelector('.magic-enhance-section').onclick = (e) => {
            e.stopPropagation();
            if (confirm('✨ Magic Enhance sẽ tự động phân tích, sắp xếp lại bố cục và vẽ lại toàn bộ hình ảnh với độ phân giải cao. Quá trình này có thể mất vài phút. Bạn có muốn tiếp tục?')) {
              sendToParent({ type: 'MAGIC_ENHANCE_BLOCK', blockId: id });
            }
          };
          section.querySelector('.delete-section').onclick = (e) => { e.stopPropagation(); sendToParent({ type: 'DELETE_BLOCK', blockId: id }); };
          section.onclick = () => sendToParent({ type: 'SELECT_BLOCK', blockId: id });

          // Resize Logic
          let isResizing = false;
          let startY, startHeight, target;
          resizeHandle.onmousedown = (e) => {
            isResizing = true;
            startY = e.clientY;
            target = innerContainer.firstElementChild || innerContainer;
            startHeight = target.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            section.classList.add('resizing');
            e.preventDefault(); e.stopPropagation();
          };
          window.addEventListener('mousemove', (e) => {
            if (!isResizing || !target) return;
            const newHeight = Math.max(40, startHeight + (e.clientY - startY));
            target.style.height = newHeight + 'px';
            target.style.minHeight = newHeight + 'px';
            target.style.overflow = 'hidden';
            target.style.display = 'block';
          });
          window.addEventListener('mouseup', () => {
            if (isResizing) {
              isResizing = false;
              document.body.style.cursor = 'default';
              const h = target.offsetHeight;
              const dev = document.body.getAttribute('data-device') || 'desktop';
              sendToParent({ type: 'UPDATE_BLOCK_HEIGHT', blockId: id, height: h, device: dev });
              sendToParent({ type: 'UPDATE_BLOCK_HTML', blockId: id, newHtml: innerContainer.innerHTML });
              target = null;
            }
          });

          // Editable Content
          const enableLiveEdit = ${state.features.enableLiveEdit};
          section.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button').forEach(el => {
            if (el.innerText.trim()) {
              if (enableLiveEdit) {
                el.contentEditable = "true";
                el.onblur = () => sendToParent({ type: 'UPDATE_BLOCK_HTML', blockId: id, newHtml: innerContainer.innerHTML });
              } else {
                el.contentEditable = "false";
              }
              el.onfocus = () => sendToParent({ type: 'ELEMENT_FOCUSED', blockId: id, tagName: el.tagName, text: el.innerText.substring(0, 50) });
            }
          });

          // Image Interactivity
          section.querySelectorAll('img').forEach((img, idx) => {
            if (!img.hasAttribute('loading')) {
              img.setAttribute('loading', 'lazy');
            }
            img.classList.add('ai-image-target');
            
            const toolbar = document.createElement('div');
            toolbar.className = 'ai-image-toolbar';
            toolbar.innerHTML = \`
              <button class="img-btn ai-btn" title="AI Tạo ảnh mới"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></button>
              <button class="img-btn upload-btn" title="Tải ảnh lên"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></button>
              \${blockType === 'omni-tvc-video' ? '<button class="img-btn video-btn" title="Render Video"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg></button><button class="img-btn video-extend-btn" title="Render Nối Cảnh Trước"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>' : ''}
            \`;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'ai-image-wrapper';
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
            wrapper.appendChild(toolbar);

            const videoBtn = toolbar.querySelector('.video-btn');
            const videoExtendBtn = toolbar.querySelector('.video-extend-btn');
            
            const handleVideoRender = (e, isExtend) => {
              e.stopPropagation();
              const prompt = img.getAttribute('data-ai-prompt') || img.alt || 'A professional high quality video';
              let finalPrompt = prompt;
              let imageSrc = img.src;
              let lastImageSrc = undefined;

              if (isExtend) {
                const allSections = document.querySelectorAll('.elementor-section-wrap');
                const currentIndex = Array.from(allSections).findIndex(sec => sec.getAttribute('data-block-id') === id);
                if (currentIndex > 0) {
                  const prevSection = allSections[currentIndex - 1];
                  const prevImg = prevSection.querySelector('img');
                  const prevPrompt = prevImg ? (prevImg.getAttribute('data-ai-prompt') || prevImg.alt) : '';
                  finalPrompt = prevPrompt ? "Cinematic camera transition. The camera smoothly pans, moves and morphs from the first scene: [" + prevPrompt + "] into the final scene: [" + prompt + "]. Seamless visual transition." : prompt;
                  imageSrc = prevImg ? prevImg.src : img.src;
                  lastImageSrc = prevImg ? img.src : undefined;
                }
              }

              const voiceover = window.prompt('Nhập nội dung lồng tiếng (Để trống để AI tự tạo từ nội dung tạo hình, nhập "0" để tắt):');
              
              img.classList.add('is-generating');
              sendToParent({ 
                type: 'RENDER_VIDEO', 
                blockId: id, 
                imgIndex: idx, 
                prompt: finalPrompt, 
                imageSrc: imageSrc,
                lastImageSrc: lastImageSrc,
                voiceover: voiceover,
                originalPrompt: prompt
              });
            };

            if (videoBtn) {
              videoBtn.onclick = (e) => handleVideoRender(e, false);
            }

            if (videoExtendBtn) {
              const allSections = document.querySelectorAll('.elementor-section-wrap');
              const currentIndex = Array.from(allSections).findIndex(sec => sec.getAttribute('data-block-id') === id);
              if (currentIndex <= 0) {
                videoExtendBtn.style.display = 'none';
              } else {
                videoExtendBtn.onclick = (e) => handleVideoRender(e, true);
              }
            }

            toolbar.querySelector('.ai-btn').onclick = (e) => {
              e.stopPropagation(); 
              const prompt = img.getAttribute('data-ai-prompt') || img.alt || 'A professional high quality image';
              img.classList.add('is-generating');
              sendToParent({ type: 'REGENERATE_IMAGE', blockId: id, imgIndex: idx, prompt: prompt });
            };
            toolbar.querySelector('.upload-btn').onclick = (e) => {
              e.stopPropagation(); sendToParent({ type: 'UPLOAD_IMAGE', blockId: id, imgIndex: idx });
            };
            img.ondblclick = (e) => {
              e.stopPropagation(); 
              const prompt = img.getAttribute('data-ai-prompt') || img.alt || 'A professional high quality image';
              img.classList.add('is-generating');
              sendToParent({ type: 'REGENERATE_IMAGE', blockId: id, imgIndex: idx, prompt: prompt });
            };
            img.onclick = (e) => { 
              e.stopPropagation(); 
              sendToParent({ type: 'SELECT_BLOCK', blockId: id }); 
              sendToParent({ type: 'ELEMENT_FOCUSED', blockId: id, tagName: 'IMG', text: img.alt || 'Image element' });
            };
          });
        });
        document.getElementById('canvas-add-btn').onclick = () => sendToParent({ type: 'ADD_SECTION_PROMPT' });
      })();
    </script>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=${state.fontFamily.replace(' ', '+')}:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root { 
          --accent: ${state.accentColor}; 
          --radius: ${state.borderRadius}; 
          --spacing: ${state.spacingScale};
          --shadow-opacity: ${state.shadowIntensity};
        }
        body { font-family: '${state.fontFamily}', sans-serif; margin: 0; padding: 0; background: #fff; overflow-x: hidden; }
        
        /* Global Sync Styles */
        .elementor-content-inner { 
          padding-top: calc(2rem * var(--spacing));
          padding-bottom: calc(2rem * var(--spacing));
        }
        
        button, a.btn, .button, input, select, textarea, .card, .rounded-theme { 
          border-radius: var(--radius) !important; 
        }

        /* Shadow Syncing with Tailwind overlap */
        .shadow-theme, [class*="shadow-"] {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, var(--shadow-opacity)), 0 4px 6px -2px rgba(0, 0, 0, var(--shadow-opacity)) !important;
        }

        /* Accent Color Syncing */
        .bg-accent, .bg-indigo-600, .bg-blue-600 { background-color: var(--accent) !important; }
        .text-accent, .text-indigo-600, .text-blue-600 { color: var(--accent) !important; }
        .border-accent, .border-indigo-600, .border-blue-600 { border-color: var(--accent) !important; }

        .elementor-section-wrap { position: relative; }
        .elementor-section-wrap:hover { outline: 2px solid var(--accent); outline-offset: -2px; }
        .elementor-section-wrap.active { outline: 3px solid var(--accent); outline-offset: -3px; z-index: 10; }
        .elementor-handle-bar { position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%); background: var(--accent); color: white; display: none; gap: 2px; padding: 4px 8px; border-radius: 6px; z-index: 100; cursor: grab; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .elementor-section-wrap:hover > .elementor-handle-bar, .elementor-section-wrap.active > .elementor-handle-bar { display: flex; }
        .handle-item { cursor: pointer; padding: 5px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .handle-item:hover { background: rgba(255,255,255,0.2); }
        .elementor-resize-handle { position: absolute; bottom: -8px; left: 0; right: 0; height: 16px; cursor: ns-resize; display: none; align-items: center; justify-content: center; z-index: 100; }
        .elementor-section-wrap:hover .elementor-resize-handle, .elementor-section-wrap.active .elementor-resize-handle { display: flex; }
        .resize-dot { width: 60px; height: 6px; background: var(--accent); border-radius: 3px; opacity: 0.9; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.4); }
        .ai-image-wrapper { position: relative; display: inline-block; max-width: 100%; line-height: 0; }
        .ai-image-target { transition: all 0.3s ease; cursor: pointer; }
        .ai-image-target.is-generating { filter: blur(8px) brightness(0.5) grayscale(0.5); pointer-events: none; }
        .ai-image-toolbar { position: absolute; top: 10px; right: 10px; display: none; gap: 6px; z-index: 50; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 5px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 16px rgba(0,0,0,0.4); }
        .ai-image-wrapper:hover .ai-image-toolbar { display: flex; }
        .img-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: transparent; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .img-btn:hover { background: var(--accent); transform: scale(1.1); }
        #canvas-add-btn { background: var(--accent); color: white; border: none; padding: 14px 28px; font-weight: 900; border-radius: 99px; cursor: pointer; display: block; margin: 40px auto; }
        ${responsiveStyles}
        ${state.globalCss}
      </style>
    </head>
    <body data-device="${currentDevice}">
      ${content}
      <div class="py-20 flex justify-center bg-slate-50 border-t border-dashed border-slate-200"><button id="canvas-add-btn">+ THÊM SECTION MỚI</button></div>
      ${scripts}
    </body>
    </html>
  `;
};
