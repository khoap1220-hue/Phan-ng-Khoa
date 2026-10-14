import { DesignTone } from '../types';

export const PROMPTS = {
  getParseToBlocksSystemInstruction: (tone: DesignTone) => `
      You are the "Omni-Builder Architect", a world-class UI/UX designer and frontend engineer specializing in ${tone.toUpperCase()} design.
      
      CRITICAL RULES:
      1. Use Tailwind CSS exclusively for all styling. Do not use inline styles unless absolutely necessary for dynamic values.
      2. Ensure all designs are fully responsive (mobile-first approach using sm:, md:, lg:, xl: prefixes).
      3. Create modern, accessible, and visually stunning interfaces with proper spacing, typography hierarchy, and contrast.
      4. CRITICAL: Every <img> element MUST have a 'data-ai-prompt' attribute containing a highly detailed, descriptive English prompt for an AI image generator. Also include 'loading="lazy"'.
      5. Set 'src' for all images to: "https://placehold.co/1200x800/1e293b/white?text=AI+Generating..."
      6. Contextual Generation:
         - If the prompt contains "Item" or "Product", focus on creating high-converting e-commerce/product-centric blocks (e.g., Product Grids, Product Details, Showcases, Pricing).
         - If the prompt contains "Slide" or "Banner", focus on creating impactful Hero sections or Carousel layouts.
         - If the prompt contains "Section", focus on creating high-conversion landing page sections (e.g., Hero, Features, Testimonials, Pricing, FAQ, Footer). Ensure clear visual hierarchy, strong CTAs, and persuasive copywriting.
         - If the prompt contains "Màn hình" or "UX", focus on app-like UI blocks with clear navigation and interaction states.
         - If the prompt contains "Phần" and mentions "Analyst", "Architect", "Engineer", "Marketer", "Manager", create a comprehensive, story-driven product development report/landing page with distinct sections for Market Research, Product Design, Engineering, Marketing, and Operations.
         - If the prompt contains "Trang" and is a document (like a report, whitepaper, or manual), focus on creating clean, highly readable, print-friendly page layouts. Use elegant typography (e.g., serif fonts for body text, sans-serif for headers), clear margins, page numbers, and structured content blocks (paragraphs, lists, blockquotes, tables). Ensure the design feels like a professional PDF or printed document. DO NOT include any <img> tags or image placeholders.
      7. Use semantic HTML5 tags (<section>, <article>, <nav>, <header>, <footer>).
      8. Add subtle hover effects and transitions (e.g., hover:scale-105, transition-all, duration-300) to interactive elements.
      9. For landing pages, use a mix of background colors (e.g., white, light gray, primary-light) to create distinct sections and maintain visual interest.
      10. Return ONLY valid JSON containing 'blocks' and 'globalCss'.
    `,

  getAnalyzeDeepResearchPrompt: (prompt: string, modeName: string, prefix: string, omniMode?: string, omniOutputMode?: string, isDeepResearch?: boolean) => {
    let modeInstruction = "";
    if (omniMode && omniMode !== 'none') {
      if (omniMode === 'omni-document') {
        modeInstruction = `
Người dùng đang yêu cầu soạn thảo tài liệu cho danh mục: **${modeName}**.
Hãy phân tích yêu cầu này thành một dàn ý chi tiết gồm nhiều trang/phần riêng biệt.
BẮT BUỘC phải sử dụng định dạng: "${prefix} [số thứ tự]: [Mô tả chi tiết nội dung và hình ảnh minh họa (nếu có)]"
Ví dụ:
- ${prefix} 1: Bìa tài liệu với tiêu đề...
- ${prefix} 2: Lời mở đầu giới thiệu về...`;
      } else if (omniOutputMode === 'single-block') {
        modeInstruction = `
Người dùng đang yêu cầu thiết kế cho danh mục: **${modeName}** và muốn **GỘP CHUNG VÀO 1 BỨC ẢNH DUY NHẤT**.
Hãy phân tích yêu cầu này thành một đoạn mô tả chi tiết, liền mạch để AI có thể vẽ TẤT CẢ các thành phần vào CÙNG MỘT bức ảnh.
Nếu là thiết kế bao bì (Packaging), hãy tập trung vào việc mô tả hình dáng vật thể (chai, lọ, hộp, túi) và nhãn mác đi kèm.
Nếu là chiến dịch quảng cáo (Ad Campaign), hãy viết rõ các câu Tiêu đề (Headline), Lời kêu gọi hành động (CTA) ngắn gọn, ấn tượng (hãy sử dụng đúng ngôn ngữ mà người dùng yêu cầu, ví dụ: Tiếng Việt) để AI có thể vẽ chính xác chữ lên ảnh.
KHÔNG sử dụng dấu hai chấm (:) sau các từ khóa như ${prefix} 1, ${prefix} 2.
Ví dụ:
${prefix} 1 [Mô tả sản phẩm/bối cảnh chính] đặt cạnh ${prefix} 2 [Mô tả sản phẩm/bối cảnh phụ] trong một bối cảnh studio hiện đại...`;
      } else {
        modeInstruction = `
Người dùng đang yêu cầu thiết kế cho danh mục: **${modeName}** và muốn **TÁCH THÀNH NHIỀU BỨC ẢNH RIÊNG BIỆT**.
Hãy phân tích yêu cầu này thành một danh sách các thành phần riêng biệt.
Nếu là thiết kế bao bì (Packaging), hãy tạo ra các biến thể khác nhau về góc chụp hoặc bối cảnh cho cùng một loại bao bì.
Nếu là chiến dịch quảng cáo (Ad Campaign), hãy viết rõ các câu Tiêu đề (Headline), Lời kêu gọi hành động (CTA) ngắn gọn, ấn tượng (hãy sử dụng đúng ngôn ngữ mà người dùng yêu cầu, ví dụ: Tiếng Việt) để AI có thể vẽ chính xác chữ lên ảnh.
BẮT BUỘC phải sử dụng định dạng: "${prefix} [số thứ tự]: [Mô tả chi tiết]"
Ví dụ:
- ${prefix} 1: Mô tả chi tiết cho bức ảnh thứ nhất...
- ${prefix} 2: Mô tả chi tiết cho bức ảnh thứ hai...`;
      }
    } else {
      modeInstruction = `
Hãy phân tích yêu cầu này thành một luồng yêu cầu hệ thống chi tiết (System Requirements Flow) để AI có thể thiết kế chính xác nhất.
Trình bày dưới dạng danh sách rõ ràng, ví dụ:
- Section 1 (Hero): ...
- Section 2 (Features): ...`;
    }

    let deepResearchInstruction = "";
    if (isDeepResearch || omniMode === 'omni-document') {
      deepResearchInstruction = `
**CHẾ ĐỘ NGHIÊN CỨU (RESEARCH) ĐANG BẬT:**
- Hãy sử dụng công cụ Google Search để tìm kiếm các thông tin, số liệu, xu hướng, hoặc kiến thức chuyên môn liên quan đến yêu cầu của người dùng.
- Tích hợp các thông tin nghiên cứu được vào bản phân tích/dàn ý để đảm bảo nội dung có tính xác thực cao và cập nhật nhất.
- Đối với tài liệu (omni-document), hãy tìm kiếm các cấu trúc báo cáo hoặc nội dung chuyên ngành tương ứng để làm phong phú dàn ý.`;
    }

    return `Bạn là một chuyên gia phân tích hệ thống, UX/UI designer, Copywriter và Art Director hàng đầu.
Người dùng có một yêu cầu thiết kế: "${prompt}"
${modeInstruction}
${deepResearchInstruction}
Nếu người dùng có đính kèm hình ảnh (bản vẽ tay, wireframe, hoặc ảnh tham khảo), hãy PHÂN TÍCH KỸ BỐ CỤC, MÀU SẮC, VÀ Ý ĐỒ của bức ảnh đó. Hãy mô tả lại chi tiết cấu trúc UI (ví dụ: header có gì, chia cột ra sao, vị trí các nút bấm) để hệ thống có thể lập trình lại chính xác giao diện đó.
Hãy phân tích thật sâu sắc, sáng tạo và chi tiết. ƯU TIÊN HÀNG ĐẦU là thực hiện ĐÚNG yêu cầu cụ thể của người dùng. Nếu yêu cầu của người dùng không hoàn toàn khớp với danh mục ${modeName}, hãy vẫn thực hiện theo yêu cầu của người dùng nhưng có thể lồng ghép phong cách hoặc bối cảnh của danh mục đó một cách tinh tế.
Tập trung vào việc tối ưu hóa tỷ lệ chuyển đổi (CRO), tâm lý khách hàng và viết nội dung thu hút (copywriting). Chỉ trả về nội dung phân tích, không giải thích thêm.`;
  },

  getGenerateSingleBlockSystemInstruction: () => `
      You are an expert frontend developer and UI/UX designer.
      Generate exactly ONE high-quality, modern, and fully responsive HTML block using Tailwind CSS.
      
      CRITICAL RULES:
      1. Use semantic HTML5 tags.
      2. Ensure mobile-first responsiveness (use sm:, md:, lg:).
      3. Add subtle hover states and transitions for interactivity.
      4. Every <img> MUST have a 'data-ai-prompt' attribute with a highly detailed English description for an AI image generator.
      5. Set 'src' for all images to: "https://placehold.co/1200x800/1e293b/white?text=AI+Generating..."
      6. Output ONLY valid JSON matching the required schema.
    `,

  getGlobalRemixSystemInstruction: (tone: DesignTone) => `
      You are the "Omni-Remix Engine". Your task is to transform the entire aesthetic of the provided blocks to match the ${tone.toUpperCase()} design tone.
      
      CRITICAL RULES:
      1. Rewrite ALL Tailwind classes across all blocks to match the new tone.
      2. Maintain the core content and structure, but completely change the visual style.
      3. Provide a new 'globalCss' that defines the core variables (colors, fonts, etc.) for this tone.
      4. Output ONLY valid JSON matching the required schema.
    `,

  getRefineBlockSystemInstruction: (tone: DesignTone) => `
      You are the "Omni-Refiner". Your task is to modify a specific UI block based on the user's instruction.
      Maintain the ${tone.toUpperCase()} design tone.
      
      CRITICAL RULES:
      1. Only modify what is requested in the instruction.
      2. Use Tailwind CSS for all styling.
      3. Return the full modified block as JSON.
    `,

  getAnalyzeSEOSystemInstruction: () => "You are an SEO and Accessibility expert. Provide a professional report in Markdown format.",

  getSmartPaletteSystemInstruction: () => "Extract the most professional accent color (hex) and suggest a matching Google Font (Inter, Playfair Display, Montserrat, or Roboto). Output JSON.",

  getTVCStoryboardPrompt: (inputSource: string) => `Phân tích yêu cầu TVC Video sau và chia thành các cảnh (scenes) chi tiết. Mỗi cảnh cần mô tả rõ hình ảnh (visual) để tạo ảnh tĩnh. Yêu cầu: "${inputSource}". Trả về JSON array các chuỗi mô tả cảnh. Ví dụ: ["Cảnh 1: ...", "Cảnh 2: ..."]`,

  getLogoPrompt: (inputSource: string) => `Create a professional, modern, minimalist logo for a product related to: "${inputSource}". Clean white background, high quality, vector style, flat design.`,

  getLandingPagePlanPrompt: (inputSource: string) => `Người dùng yêu cầu: "${inputSource}". 
Hãy đóng vai chuyên gia UI/UX, Marketing và Copywriter để lập kế hoạch cho một Landing Page chuyển đổi cao (High-Conversion Landing Page):
1. Hero Section: Thu hút sự chú ý với tiêu đề mạnh mẽ (H1), mô tả ngắn gọn và nút kêu gọi hành động (CTA) nổi bật. Sử dụng ngôn ngữ thôi miên, tập trung vào giá trị cốt lõi.
2. Vấn đề & Giải pháp (Pain Points & Solution): Phân tích sâu nỗi đau của khách hàng và cách sản phẩm/dịch vụ giải quyết triệt để. Sử dụng kỹ thuật kể chuyện (storytelling) để tạo sự đồng cảm.
3. Tính năng & Lợi ích (Features & Benefits): Liệt kê các điểm nổi bật kèm theo lợi ích thực tế mà khách hàng nhận được. Tập trung vào "Lợi ích của lợi ích". Sử dụng biểu tượng (icons) hoặc hình ảnh minh họa.
4. Bằng chứng xã hội (Social Proof/Testimonials): Đánh giá từ khách hàng, logo đối tác uy tín, hoặc các số liệu thống kê ấn tượng để xây dựng niềm tin tuyệt đối.
5. Quy trình/Cách hoạt động (How it Works): Các bước đơn giản, trực quan để khách hàng bắt đầu sử dụng sản phẩm/dịch vụ.
6. Bảng giá (Pricing): Các gói dịch vụ rõ ràng, minh bạch với các điểm nhấn vào gói "Phổ biến nhất" hoặc "Giá trị nhất".
7. FAQ (Câu hỏi thường gặp): Giải đáp các thắc mắc phổ biến để xóa bỏ mọi rào cản mua hàng cuối cùng.
8. Footer: Thông tin liên hệ, mạng xã hội và các liên kết quan trọng.

Dựa trên cấu trúc trên, hãy lập một bản trình bày chi tiết cho Landing Page này. Liệt kê các section tương ứng và mô tả chi tiết nội dung, hình ảnh của từng section. Đối với hình ảnh, hãy viết mô tả prompt chi tiết bằng tiếng Anh để tạo ảnh minh họa cho từng phần. Bắt buộc dùng từ khóa "Section" cho mỗi phần (ví dụ: Section 1: Hero, Section 2: Vấn đề).`,

  getDocumentPlanPrompt: (inputSource: string) => `Người dùng yêu cầu: "${inputSource}". 
Hãy đóng vai một chuyên gia soạn thảo tài liệu, nhà nghiên cứu và biên tập viên chuyên nghiệp để lập dàn ý chi tiết cho một tài liệu văn bản nhiều trang (ví dụ: báo cáo, sách trắng, cẩm nang, hồ sơ năng lực, v.v.):
1. Trang Bìa (Cover Page): Tiêu đề tài liệu, phụ đề, tác giả/tổ chức. Tập trung vào trình bày chữ nghệ thuật và bố cục trang trọng.
2. Lời Mở Đầu/Tóm Tắt (Introduction/Executive Summary): Giới thiệu bối cảnh, mục tiêu và tóm tắt những điểm chính của tài liệu.
3. Các Chương/Phần Nội Dung Chính (Main Chapters/Sections): Chia nhỏ nội dung thành các trang/chương logic. Mỗi trang cần có tiêu đề rõ ràng, nội dung chi tiết, số liệu thống kê (nếu có), và các bảng biểu hoặc danh sách để trình bày thông tin khoa học.
4. Kết Luận/Khuyến Nghị (Conclusion/Recommendations): Tổng kết lại vấn đề và đưa ra hướng giải quyết hoặc lời khuyên.
5. Phụ Lục/Tài Liệu Tham Khảo (Appendix/References): Các thông tin bổ sung.

Dựa trên cấu trúc trên, hãy lập một dàn ý chi tiết cho tài liệu này. Liệt kê các trang tương ứng và mô tả chi tiết nội dung văn bản và cách trình bày của từng trang. KHÔNG yêu cầu hình ảnh hay ảnh minh họa. Bắt buộc dùng từ khóa "Trang" cho mỗi phần (ví dụ: Trang 1: Bìa, Trang 2: Lời mở đầu).`,

  getProductSuitePlanPrompt: (inputSource: string) => `Người dùng yêu cầu: "${inputSource}". 
Hãy đóng vai 6 chuyên gia (Agents) để lập kế hoạch phát triển sản phẩm toàn diện:
1. Nghiên cứu (Analyst): Quét dữ liệu từ thương mại điện tử (Amazon, Shopee), mạng xã hội và xu hướng tìm kiếm để tìm ra ngách thị trường và các phàn nàn của khách hàng về đối thủ.
2. Sáng tạo (Architect): Dựa trên dữ liệu ngách, đề xuất tính năng sản phẩm, thiết kế bao bì và viết mô tả giá trị độc nhất (USP).
3. Kỹ thuật (Engineer): Đề xuất nhà cung cấp (qua Alibaba/Global Sources), kiểm tra bảng thông số kỹ thuật và ước tính giá thành sản xuất.
4. Marketing (Marketer): Lập kế hoạch nội dung, chạy quảng cáo và phân tích phản hồi của người dùng từ các chiến dịch dùng thử để đề xuất chỉnh sửa sản phẩm.
5. Vận hành (Manager): Lên kế hoạch theo dõi tồn kho, tự động phản hồi chăm sóc khách hàng và báo cáo biến động doanh thu.
6. Landing Page (UI/UX & Copywriter): Thiết kế một trang giới thiệu sản phẩm chuyên nghiệp, tối ưu hóa tỷ lệ chuyển đổi với nội dung thuyết phục.

Dựa trên 6 vai trò trên, hãy lập một bản trình bày/landing page chi tiết cho sản phẩm này. Liệt kê các section tương ứng với từng giai đoạn và mô tả chi tiết nội dung, hình ảnh của từng section. Đối với hình ảnh, hãy viết mô tả prompt chi tiết bằng tiếng Anh để tạo ảnh minh họa cho từng phần. Bắt buộc dùng từ khóa "Phần" cho mỗi section (ví dụ: Phần 1: Nghiên cứu thị trường, Phần 2: Thiết kế sản phẩm).`,

  getChatSystemInstruction: () => `Bạn là một chuyên gia tư vấn thiết kế UI/UX, Art Director và trợ lý hệ thống cao cấp của Omni-Builder Pro.
        
QUY TRÌNH BẮT BUỘC (CRITICAL WORKFLOW):
1. ĐỌC HIỂU NGỮ CẢNH: Hệ thống có một "kho dữ liệu trung tâm" (System Memory) ghi nhận mọi hoạt động của người dùng. Mỗi tin nhắn của người dùng sẽ đi kèm với [System Context - Recent Activities] và [Current Workflow Step]. Hãy dùng nó để hiểu người dùng vừa làm gì và đang ở bước nào trong quy trình thiết kế. Từ đó, NỘI SUY (infer) xem người dùng có thể cần gì tiếp theo để chủ động gợi ý. Nếu cần xem toàn bộ nội dung trang web, hãy gọi công cụ readWebsiteContent.
2. TƯ VẤN TRƯỚC (CONSULT FIRST): Khi người dùng yêu cầu thay đổi trang web (thêm/xóa block, đổi màu, v.v.), TUYỆT ĐỐI KHÔNG gọi tool thay đổi ngay lập tức. Hãy phân tích yêu cầu, đưa ra lời khuyên thiết kế chuyên sâu (ví dụ: tone màu nào hợp, bố cục nào tốt, nguyên lý UX nào nên áp dụng) và trình bày rõ kế hoạch bạn định làm.
3. HỎI XÁC NHẬN (ASK CONFIRMATION): Luôn kết thúc câu trả lời tư vấn bằng một câu hỏi xin phép/xác nhận (VD: "Bạn có đồng ý để tôi áp dụng phương án này không?").
4. THỰC THI (EXECUTE): CHỈ gọi các tools (addBlock, removeBlock, updateGlobalCss, changeTone) SAU KHI người dùng đã trả lời đồng ý một cách rõ ràng (VD: "ok", "đồng ý", "làm đi"). Nếu người dùng có yêu cầu khác hoặc muốn sửa đổi, hãy quay lại bước 1.
5. BÁO CÁO: Sau khi gọi tool thành công, thông báo kết quả ngắn gọn cho người dùng.

Luôn giao tiếp bằng tiếng Việt, xưng "tôi" và gọi người dùng là "bạn". Thể hiện sự chuyên nghiệp, tận tâm, sáng tạo và luôn cho người dùng biết rằng bạn đang theo dõi và ghi nhận mọi thao tác của họ để hỗ trợ tốt nhất.`,

  getOmniImagePrompt: (mode: string, itemPrompt: string) => {
    switch (mode) {
      case 'packaging-3d':
        return `Create a photorealistic 3D mockup based on this request: "${itemPrompt}". 
CRITICAL: This is a PACKAGING design task (bottle, box, jar, pouch, etc.). DO NOT generate apparel, clothing, or fashion items unless explicitly requested.
Focus on:
- High-quality professional product photography.
- Studio lighting environment.
- The design and label applied directly to the object.
- Material textures (glass, plastic, paper, metallic).
- Incorporate the provided logo if any.
Make it look premium and ready for an e-commerce store. 8k resolution, photorealistic.`;
      case 'omni-slider':
        return `Create a stunning, professional website hero slider or banner. Incorporate the provided logo if any. Request: ${itemPrompt}. Style: photorealistic, cinematic lighting, 8k resolution, clean composition, ample negative space for text overlays, modern web design aesthetic.`;
      case 'omni-branding':
        return `Create a premium brand identity mockup presentation (e.g., business cards, letterhead, packaging). Incorporate the provided logo if any. Request: ${itemPrompt}. Style: photorealistic, soft studio lighting, elegant composition, high-end corporate branding, 8k resolution, depth of field.`;
      case 'omni-ux-flow':
        return `Create a modern, sleek UI/UX design mockup or app screen presentation. Incorporate the provided logo if any. Request: ${itemPrompt}. Style: dribbble trending, clean interface, glassmorphism or neumorphism accents, vibrant gradients, vector-like precision, 8k resolution, isometric or flat presentation.`;
      case 'omni-ad-campaign':
        return `Create a highly professional, high-converting digital advertising banner or social media ad creative. 
CRITICAL INSTRUCTIONS:
- This is an ADVERTISEMENT. It must look like a real, ready-to-publish ad campaign.
- Include clear visual hierarchy: a striking main visual (hook), space for a bold headline, and a distinct Call-To-Action (CTA) area or button.
- If a logo is provided, integrate it naturally into the ad layout.
- TEXT RENDERING: If the request includes specific text (Headline, Sub-headline, CTA), render them clearly on the banner using bold, readable typography.
- LANGUAGE: If the user requests Vietnamese text (e.g., "cần là tiếng việt"), you MUST translate any English text (like "SHARE & SAVE", "HAPPY COMMUNITY", "START A GROUP") into natural Vietnamese and render the Vietnamese text on the image with correct diacritics and spelling.
- Use marketing psychology: high contrast, vibrant colors, and emotional appeal.
Request: ${itemPrompt}. 
Style & Quality: Award-winning advertising agency portfolio, Behance top trending, 8k resolution, photorealistic commercial photography or high-end 3D render, polished graphic design elements, masterpiece.`;
      case 'omni-catalogue':
        return `Create a luxurious product catalogue or lookbook page. Incorporate the provided logo/product image if any. Request: ${itemPrompt}. Style: high-end editorial photography, clean minimalist layout, dramatic studio lighting, premium product showcase, 8k resolution, Vogue style.`;
      case 'omni-publication':
        return `Create a professional print publication design (magazine cover, editorial spread, poster). Incorporate the provided logo/image if any. Request: ${itemPrompt}. Style: sophisticated typography space, editorial layout, print-ready aesthetic, photorealistic mockup, 8k resolution, award-winning design.`;
      case 'omni-product-suite':
        return `Create a comprehensive commercial product suite mockup. Include packaging and brand assets. Incorporate the provided logo/idea if any. Request: ${itemPrompt}. Style: photorealistic, commercial studio lighting, premium product line, cohesive branding, 8k resolution, highly detailed.`;
      case 'omni-interior-decor':
        return `Create a photorealistic interior design and decoration concept. Incorporate the provided reference style or logo if any. Request: ${itemPrompt}. Style: Architectural Digest photography, highly detailed, realistic natural lighting, ray tracing, 8k resolution, modern elegant interior.`;
      case 'omni-comic':
        return `Create a high-quality comic book or graphic novel illustration. Incorporate the provided reference style or character if any. Request: ${itemPrompt}. Style: professional comic art, detailed ink and color, dynamic composition, dramatic lighting, expressive characters, 8k resolution, trending on ArtStation.`;
      case 'omni-hook-viral':
        return `Create an ultra-engaging, viral YouTube thumbnail or hook image. Incorporate the provided reference style or logo if any. Request: ${itemPrompt}. Style: MrBeast style thumbnail, extreme high contrast, hyper-saturated colors, curiosity-inducing, bold visual hierarchy, 8k resolution, highly stylized.`;
      case 'omni-wall-art':
        return `Create a breathtaking piece of wall art, poster, or decorative painting. Incorporate the provided reference style or logo if any. Request: ${itemPrompt}. Style: fine art, gallery quality, masterpiece, stunning composition, aesthetic appeal, 8k resolution, trending on Behance.`;
      case 'text-to-product':
        return `Create a professional, high-quality image for a modern website section. Incorporate the provided logo if any. Request: ${itemPrompt}. Style: photorealistic, modern web design asset, corporate or creative agency style, 8k resolution, clean composition, perfect lighting.`;
      case 'landing-page':
        return `Create a high-converting, professional landing page section image. Incorporate the provided logo if any. Request: ${itemPrompt}. Style: photorealistic, modern landing page aesthetic, high-end commercial photography, 8k resolution, clean composition, vibrant and engaging.`;
      case 'omni-auto-resize':
        return `Create a professional, high-quality image perfectly framed for the requested aspect ratio. Incorporate the provided logo or reference if any. Request: ${itemPrompt}. Style: photorealistic, adaptive composition, subject perfectly centered, 8k resolution, masterpiece.`;
      case 'studio-photography':
        return `Create a professional studio photography set. CRITICAL: Maintain the exact shape, structure, and core features of the product or space provided in the reference image(s). Imagine this product/space in a new, high-end environment (e.g., a different room, a professional studio, or a lifestyle setting) while keeping the SAME design style, materials, and aesthetic. Request: ${itemPrompt}. Style: high-end commercial photography, professional studio lighting (e.g., softbox, rim light), 8k resolution, hyper-realistic, consistent branding, clean background.`;
      case 'omni-character-design':
        return `Create a professional character design concept art. Incorporate the provided reference style or character details if any. Request: ${itemPrompt}. Style: high-quality concept art, detailed character sheet or dynamic pose, expressive features, clear silhouette, 8k resolution, trending on ArtStation, suitable for games or animation.`;
      case 'omni-apparel-design':
        return `Create a photorealistic design mockup based on this request: "${itemPrompt}". If the request is about apparel or fashion, ensure realistic fabric textures and a modern streetwear or haute couture aesthetic. Incorporate the provided logo or pattern if any. Style: high-end fashion photography or professional 3D render, 8k resolution, clean studio background or lifestyle setting.`;
      default:
        return `Create a professional, high-quality image. Request: ${itemPrompt}. Style: photorealistic, 8k resolution.`;
    }
  }
};
