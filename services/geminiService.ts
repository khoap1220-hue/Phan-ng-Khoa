
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Block, DesignTone } from "../types";
import { PROMPTS } from "../constants/prompts";
import { getOmniModeName, getOmniPrefix, parseOmniItems } from "../utils/omniParser";

const TEXT_MODEL = 'gemini-3-flash-preview';
const DEFAULT_IMAGE_MODEL = 'gemini-2.5-flash-image';
const PRO_IMAGE_MODEL = 'gemini-3.1-flash-image-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export class GeminiService {
  private getAI() {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key is missing. Please set it in the environment or select it via settings.");
    }
    // Khởi tạo instance mới mỗi lần gọi để đảm bảo lấy đúng API Key mới nhất từ môi trường
    return new GoogleGenAI({ apiKey: apiKey || "" });
  }

  public parseJsonSafely(text: string, fallback: any): any {
    if (!text) return fallback;
    
    let cleanText = text.trim();
    // Remove markdown code blocks if present
    cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '').trim();
    }

    try {
      return JSON.parse(cleanText);
    } catch (e) {
      console.warn("Failed to parse JSON directly, attempting to fix...", e);
      
      // Find the first { or [
      const firstBrace = cleanText.indexOf('{');
      const firstBracket = cleanText.indexOf('[');
      let startIndex = -1;
      
      if (firstBrace !== -1 && firstBracket !== -1) {
        startIndex = Math.min(firstBrace, firstBracket);
      } else if (firstBrace !== -1) {
        startIndex = firstBrace;
      } else if (firstBracket !== -1) {
        startIndex = firstBracket;
      }

      if (startIndex !== -1) {
        let extracted = cleanText.substring(startIndex);
        
        // Try to parse the extracted part directly (in case there was just text before it)
        try {
          // Find the last } or ]
          const lastBrace = extracted.lastIndexOf('}');
          const lastBracket = extracted.lastIndexOf(']');
          let endIndex = -1;
          
          if (lastBrace !== -1 && lastBracket !== -1) {
            endIndex = Math.max(lastBrace, lastBracket);
          } else if (lastBrace !== -1) {
            endIndex = lastBrace;
          } else if (lastBracket !== -1) {
            endIndex = lastBracket;
          }
          
          if (endIndex !== -1) {
             const exactMatch = extracted.substring(0, endIndex + 1);
             try {
               return JSON.parse(exactMatch);
             } catch (e2) {
               console.warn("Failed to parse extracted JSON.", e2);
             }
          }
        } catch (e2) {}

        // Auto-fix truncated JSON
        let fixed = extracted;
        if (fixed.match(/"[^"]*$/)) {
           fixed += '"';
        }
        
        try {
          return JSON.parse(fixed + '}');
        } catch (e3) {
          try {
             return JSON.parse(fixed + ']}');
          } catch (e4) {
             try {
                return JSON.parse(fixed + '}]}');
             } catch (e5) {
                try {
                   return JSON.parse(fixed + ']');
                } catch (e6) {
                   try {
                      return JSON.parse(fixed + '}]');
                   } catch (e7) {
                      console.error("Could not auto-fix JSON.");
                   }
                }
             }
          }
        }
      }
      
      return fallback;
    }
  }

  private async handlePotentialKeyError(error: any): Promise<boolean> {
    console.error("Gemini API Error:", error);
    const errStr = JSON.stringify(error).toLowerCase() + (error?.message || '').toLowerCase();
    
    // @ts-ignore
    if (!window.aistudio) return false;

    // Tránh lặp vô hạn nếu người dùng không chọn key hoặc key vẫn lỗi
    const lastKeyErrorTime = (window as any)._lastKeyErrorTime || 0;
    const now = Date.now();
    if (now - lastKeyErrorTime < 5000) {
      console.warn("Key error loop detected, throwing error instead of opening selector.");
      throw error;
    }
    (window as any)._lastKeyErrorTime = now;

    if (errStr.includes("spending cap") || errStr.includes("resource_exhausted") || error?.status === 429) {
      console.warn("API Key của bạn đã hết hạn mức sử dụng (Spending Cap Exceeded). Vui lòng chọn API Key khác.");
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return true;
    } else if (error?.message?.includes("Requested entity was not found.") || 
        error?.message?.includes("API_KEY_INVALID") ||
        error?.message?.includes("billing") ||
        error?.message?.includes("PERMISSION_DENIED") ||
        error?.status === 403) {
      console.warn("Cần chọn API Key (Paid Project) để sử dụng tính năng này.");
      // @ts-ignore
      await window.aistudio.openSelectKey();
      return true;
    } else if (error?.status === 499 || error?.message?.includes('cancelled') || error?.message?.includes('499')) {
       console.warn("Request was cancelled (499). This might be due to a timeout or client disconnect.");
    }
    throw error;
  }

  public async generateContentWithFallback(request: any, retries = 5, delayMs = 2000): Promise<any> {
    let currentModel = request.model;
    let attempt = 0;
    let keyRetries = 0;
    const maxKeyRetries = 3;

    while (attempt < retries) {
      try {
        const ai = this.getAI();
        return await ai.models.generateContent({ ...request, model: currentModel });
      } catch (error: any) {
        const errStr = JSON.stringify(error).toLowerCase() + (error?.message || '').toLowerCase();
        
        // Immediately throw if it's a spending cap or key error
        if (errStr.includes('spending cap') || errStr.includes('resource_exhausted') || error?.status === 403 || errStr.includes('403') || errStr.includes('permission_denied')) {
          if (keyRetries < maxKeyRetries) {
            keyRetries++;
            const retried = await this.handlePotentialKeyError(error);
            if (retried) continue;
          }
          throw error;
        }

        const is503 = error?.status === 503 || error?.status === 500 || error?.status === 429 || error?.status === 499 || error?.code === 499 || errStr.includes('503') || errStr.includes('500') || errStr.includes('internal error') || errStr.includes('429') || errStr.includes('499') || errStr.includes('overloaded') || errStr.includes('high demand') || errStr.includes('quota') || errStr.includes('cancelled') || errStr.includes('unavailable');
        const is400 = error?.status === 400 || errStr.includes('400') || errStr.includes('bad request') || errStr.includes('invalid');
        
        if (is503) {
          console.warn(`[Global Fallback Interceptor] Model ${currentModel} failed with 503/500/429/499. Attempting fallback...`);
          
          let fallbackModel = currentModel;
          if (currentModel === 'gemini-3.1-pro-preview' || currentModel === 'gemini-3-pro-preview') {
            fallbackModel = 'gemini-3-flash-preview';
          } else if (currentModel === 'gemini-3.1-flash-image-preview' || currentModel === 'gemini-3-pro-image-preview') {
            fallbackModel = 'gemini-2.5-flash-image';
          }

          if (fallbackModel !== currentModel) {
            console.log(`[Global Fallback Interceptor] Switching to fallback model: ${fallbackModel}`);
            currentModel = fallbackModel;
            if (fallbackModel === 'gemini-2.5-flash-image' && request.config?.imageConfig) {
              delete request.config.imageConfig.imageSize;
            }
            // Retry immediately with fallback model
            continue;
          }
        } else if (is400) {
          console.error(`[Global Fallback Interceptor] Model ${currentModel} failed with 400 Bad Request. Throwing immediately...`, error);
          throw error;
        }

        // If no fallback or not a fallback-able error, wait and retry
        attempt++;
        if (attempt >= retries) {
           throw error;
        }
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        console.log(`[Global Fallback Interceptor] Waiting ${waitTime}ms before retry ${attempt}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    throw new Error("Max retries reached");
  }

  private extractBlocksFromPartialJson(text: string): Block[] {
    const blocks: Block[] = [];
    const blocksMatch = text.match(/"blocks"\s*:\s*\[/);
    if (!blocksMatch) return blocks;
    
    const startIndex = blocksMatch.index! + blocksMatch[0].length;
    let currentText = text.substring(startIndex);
    
    let depth = 0;
    let inString = false;
    let escape = false;
    let objStart = -1;
    
    for (let i = 0; i < currentText.length; i++) {
      const char = currentText[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          if (depth === 0) objStart = i;
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && objStart !== -1) {
            const objText = currentText.substring(objStart, i + 1);
            try {
              const parsed = this.parseJsonSafely(objText, null);
              if (parsed) blocks.push(parsed);
            } catch (e) {
              // Ignore invalid object
            }
            objStart = -1;
          }
        } else if (char === ']') {
          if (depth === 0) break;
        }
      }
    }
    return blocks;
  }

  async *parseToBlocksStream(prompt: string, tone: DesignTone = 'professional', existingHtml?: string, thinkingLevel: 'default' | 'low' | 'high' = 'default'): AsyncGenerator<{ blocks: Block[], globalCss: string, isDone: boolean }, void, unknown> {
    const ai = this.getAI();
    
    const systemInstruction = PROMPTS.getParseToBlocksSystemInstruction(tone);

    try {
      const config: any = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  name: { type: Type.STRING },
                  html: { type: Type.STRING }
                },
                required: ["id", "type", "name", "html"]
              }
            },
            globalCss: { type: Type.STRING }
          },
          required: ["blocks", "globalCss"]
        }
      };

      if (thinkingLevel === 'low') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (thinkingLevel === 'high') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      let responseStream;
      let currentModel = TEXT_MODEL;
      let attempt = 0;
      let retries = 5;
      
      while (attempt < retries) {
        try {
          const ai = this.getAI();
          responseStream = await ai.models.generateContentStream({
            model: currentModel,
            contents: `Project Context: ${prompt}\n\nExisting Code: ${existingHtml || 'None'}`,
            config
          });
          break;
        } catch (error: any) {
          const errStr = JSON.stringify(error).toLowerCase() + (error?.message || '').toLowerCase();
          
          if (errStr.includes('spending cap') || errStr.includes('resource_exhausted')) {
            const retried = await this.handlePotentialKeyError(error);
            if (retried) continue;
            throw error;
          }

          const is503 = error?.status === 503 || error?.status === 500 || error?.status === 429 || error?.status === 499 || error?.code === 499 || errStr.includes('503') || errStr.includes('500') || errStr.includes('internal error') || errStr.includes('429') || errStr.includes('499') || errStr.includes('overloaded') || errStr.includes('high demand') || errStr.includes('quota') || errStr.includes('cancelled') || errStr.includes('unavailable');
          const is403 = error?.status === 403 || errStr.includes('403') || errStr.includes('permission_denied');
          
          if (is503 || is403) {
            let fallbackModel = currentModel;
            if (currentModel === 'gemini-3.1-pro-preview' || currentModel === 'gemini-3-pro-preview') {
              fallbackModel = 'gemini-3-flash-preview';
            }
            if (fallbackModel !== currentModel) {
              currentModel = fallbackModel;
              continue;
            } else {
              if (is403) {
                 const retried = await this.handlePotentialKeyError(error);
                 if (retried) continue;
                 throw error;
              }
              attempt++;
              if (attempt >= retries) {
                 const retried = await this.handlePotentialKeyError(error);
                 if (retried) continue;
                 throw error;
              }
              await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
            }
          } else {
            const retried = await this.handlePotentialKeyError(error);
            if (retried) continue;
            throw error;
          }
        }
      }

      if (!responseStream) throw new Error("Failed to get response stream");

      let fullText = "";
      let lastBlocks: Block[] = [];
      let lastGlobalCss = "";
      
      for await (const chunk of responseStream) {
        fullText += chunk.text;
        lastBlocks = this.extractBlocksFromPartialJson(fullText);
        // Try to extract globalCss if it's available at the end
        const cssMatch = fullText.match(/"globalCss"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (cssMatch) {
          try {
            lastGlobalCss = JSON.parse(`"${cssMatch[1]}"`);
          } catch (e) {}
        }
        yield { blocks: lastBlocks, globalCss: lastGlobalCss, isDone: false };
      }

      const finalResult = this.parseJsonSafely(fullText, { blocks: lastBlocks, globalCss: lastGlobalCss });
      yield { blocks: finalResult.blocks || lastBlocks, globalCss: finalResult.globalCss || lastGlobalCss, isDone: true };
    } catch (e) {
      await this.handlePotentialKeyError(e);
      yield { blocks: [], globalCss: "", isDone: true };
    }
  }

  async parseToBlocks(prompt: string, tone: DesignTone = 'professional', existingHtml?: string, thinkingLevel: 'default' | 'low' | 'high' = 'default'): Promise<{ blocks: Block[], globalCss: string }> {
    const ai = this.getAI();
    
    const systemInstruction = PROMPTS.getParseToBlocksSystemInstruction(tone);

    try {
      const config: any = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            blocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  name: { type: Type.STRING },
                  html: { type: Type.STRING }
                },
                required: ["id", "type", "name", "html"]
              }
            },
            globalCss: { type: Type.STRING }
          },
          required: ["blocks", "globalCss"]
        }
      };

      if (thinkingLevel === 'low') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (thinkingLevel === 'high') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const response = await this.generateContentWithFallback({
        model: TEXT_MODEL,
        contents: `Project Context: ${prompt}\n\nExisting Code: ${existingHtml || 'None'}`,
        config
      });

      const text = response.text || "";
      const finalResult = this.parseJsonSafely(text, null);
      if (finalResult && finalResult.blocks) {
        return { blocks: finalResult.blocks, globalCss: finalResult.globalCss || "" };
      } else {
        // Fallback to extraction if parsing completely failed
        const extractedBlocks = this.extractBlocksFromPartialJson(text);
        return { blocks: extractedBlocks, globalCss: "" };
      }
    } catch (e) {
      throw e;
    }
  }

  async analyzeDeepResearch(prompt: string, thinkingLevel: 'default' | 'low' | 'high', referenceImages?: string[], omniMode?: string, omniOutputMode?: string, isDeepResearch?: boolean): Promise<string> {
    let modeName = "Thiết kế";
    let prefix = "Section";
    if (omniMode && omniMode !== 'none') {
      modeName = getOmniModeName(omniMode);
      prefix = getOmniPrefix(omniMode);
    }

    const analysisPrompt = PROMPTS.getAnalyzeDeepResearchPrompt(prompt, modeName, prefix, omniMode, omniOutputMode, isDeepResearch);

    const parts: any[] = [{ text: analysisPrompt }];
    
    if (referenceImages && referenceImages.length > 0) {
      for (const img of referenceImages) {
        const match = img.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }
      parts.push({ text: "Hãy xem xét các hình ảnh tham chiếu trên để hiểu rõ hơn về phong cách, màu sắc, bố cục và ý tưởng thiết kế mà người dùng mong muốn." });
    }

    const config: any = {
      systemInstruction: "You are an expert UX/UI system analyst and CRO specialist.",
    };

    if (isDeepResearch || omniMode === 'text-to-product' || omniMode === 'landing-page' || omniMode === 'omni-document') {
      config.tools = [{ googleSearch: {} }];
      config.toolConfig = { includeServerSideToolInvocations: true };
    }

    if (thinkingLevel === 'low') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    } else if (thinkingLevel === 'high') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const modelToUse = isDeepResearch ? 'gemini-3.1-pro-preview' : (thinkingLevel !== 'default' ? 'gemini-3.1-pro-preview' : TEXT_MODEL);

    try {
      const response = await this.generateContentWithFallback({
        model: modelToUse,
        contents: { parts },
        config
      });
      return response.text || prompt;
    } catch (e: any) {
      const errStr = JSON.stringify(e).toLowerCase() + (e?.message || '').toLowerCase();
      if (errStr.includes('spending cap') || errStr.includes('resource_exhausted')) {
        throw e;
      }

      if (e?.status === 499 || e?.message?.includes('cancelled') || e?.message?.includes('499')) {
         console.warn("Deep research cancelled (499). Returning original prompt.");
      } else {
         console.error("Deep research failed", e);
      }
      return prompt;
    }
  }

  async generateText(prompt: string): Promise<string> {
    const ai = this.getAI();
    try {
      const response = await this.generateContentWithFallback({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || '';
    } catch (e) {
      console.error("Text generation failed", e);
      return '';
    }
  }

  async generateAiImage(prompt: string, aspectRatio: string = "16:9", imageResolution: '1K' | '2K' | '4K' = '1K', referenceImage?: string, imageType: 'ui-refinement' | 'mockup' | 'logo-restoration' | 'standard' = 'ui-refinement'): Promise<string> {
    const ai = this.getAI();
    // Sử dụng Flash Image cho khởi tạo nhanh, Pro Image cho yêu cầu chất lượng cao
    const model = imageResolution !== '1K' ? PRO_IMAGE_MODEL : DEFAULT_IMAGE_MODEL;
    
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio as any
      }
    };
    
    if (model === PRO_IMAGE_MODEL) {
      config.imageConfig.imageSize = imageResolution;
    }

    const parts: any[] = [];
    if (referenceImage) {
      const match = referenceImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
      
      if (imageType === 'mockup') {
        parts.push({ text: `You are an expert brand designer and 3D artist. I have provided the brand's core visual/logo as a reference image. 
Target Scene Description: ${prompt}

CRITICAL INSTRUCTION: Create a highly professional, photorealistic scene or mockup based on the description. Use the provided reference image ONLY as a source of inspiration for the brand's colors, typography style, and logo shapes. DO NOT use it as the structural baseline for the scene. Integrate the brand identity naturally into the objects in the scene.
Style & Quality: Behance top trending, premium aesthetics, 8k resolution, photorealistic, cinematic studio lighting, depth of field, ultra-detailed.` });
      } else if (imageType === 'logo-restoration') {
        parts.push({ text: `You are an expert graphic designer and brand restorer. I have provided an original photo of an old/faded signage or logo.
Target Design Description: ${prompt}

CRITICAL INSTRUCTION: Your task is to EXTRACT and RESTORE the logo from the reference image. DO NOT recreate the entire scene, background, or storefront. Create a clean, flat, high-resolution, modern vector-style logo based on the core elements of the reference image. Strictly follow the Target Design Description for colors and style.
Style & Quality: Flat vector style, clean white or solid background, minimalist, highly polished, professional logo design, 8k resolution.` });
      } else {
        parts.push({ text: `You are an expert digital artist and UI/UX designer. Transform this reference image into a highly polished, professional, and modern masterpiece.
      
Target Design Description: ${prompt}

Style & Quality: High-end, premium aesthetics, 8k resolution, photorealistic or high-quality vector style, clean composition, cinematic lighting, award-winning design.

CRITICAL INSTRUCTION: Use the reference image as a baseline for the overall structure. HOWEVER, you MUST strictly follow the "Target Design Description" above. If the description specifies changes to the layout, theme, icons, or banners, YOU MUST APPLY THOSE CHANGES. Upgrade the overall visual quality with premium materials (like glassmorphism, 3D textures, or sleek flat design), modern colors, and high-fidelity graphics. Make it look like a finished, top-tier product.` });
      }
    } else {
      parts.push({ text: `${prompt}. Style: professional photography, cinematic lighting, highly detailed, 8k resolution, masterpiece, clean composition, award-winning.` });
    }

    try {
      const response = await this.generateContentWithFallback({
        model: model,
        contents: {
          parts: parts
        },
        config
      });

      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content || !Array.isArray(candidate.content.parts)) {
        throw new Error("Model failed to generate image candidate or returned invalid content");
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data returned from model");
    } catch (e) {
      throw e;
    }
  }

  async generateVideo(prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', resolution: '720p' | '1080p' = '720p', image?: { data: string, mimeType: string }, lastImage?: { data: string, mimeType: string }): Promise<string> {
    const ai = this.getAI();
    try {
      let config: any = {
        numberOfVideos: 1,
        resolution,
        aspectRatio
      };

      if (lastImage) {
        config.lastFrame = {
          imageBytes: lastImage.data,
          mimeType: lastImage.mimeType
        };
      }
      
      let req: any = {
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt + ". Absolutely NO text, NO subtitles, NO watermarks, NO typography in the video. If the input image contains any text or subtitles, remove them completely and replace with natural background.",
        config
      };

      if (image) {
        req.image = {
          imageBytes: image.data,
          mimeType: image.mimeType
        };
      }

      let operation = await ai.models.generateVideos(req);
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }
      
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("No video generated");
      
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      
      // Fetch the video with API key
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey || '',
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch video");
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      throw e;
    }
  }

  async startSystemChatSession(
    onAction: (action: string, args: any) => Promise<string>
  ) {
    const ai = this.getAI();
    
    const tools = [{
      functionDeclarations: [
        {
          name: "addBlock",
          description: "Adds a new UI block/section to the website.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING, description: "Detailed description of the block to add (e.g., 'A hero section with a dark background and a call to action button')." },
              tone: { type: Type.STRING, description: "Design tone (e.g., 'professional', 'minimalist', 'cyberpunk', 'playful', 'brutalist')." }
            },
            required: ["prompt", "tone"]
          }
        },
        {
          name: "removeBlock",
          description: "Removes a block from the website by its index (0-based).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              index: { type: Type.NUMBER, description: "The index of the block to remove." }
            },
            required: ["index"]
          }
        },
        {
          name: "updateGlobalCss",
          description: "Updates the global CSS variables for the website (e.g., colors, fonts).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              css: { type: Type.STRING, description: "The CSS string to apply globally." }
            },
            required: ["css"]
          }
        },
        {
          name: "changeTone",
          description: "Changes the overall design tone of the website.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING, description: "The new design tone ('professional', 'minimalist', 'cyberpunk', 'playful', 'brutalist')." }
            },
            required: ["tone"]
          }
        },
        {
          name: "readWebsiteContent",
          description: "Reads the current content, structure, and recent activity logs of the website. Use this to understand the user's recent actions and the current state of the app.",
          parameters: {
            type: Type.OBJECT,
            properties: {}
          }
        }
      ]
    }];

    const chat = ai.chats.create({
      model: TEXT_MODEL,
      config: {
        systemInstruction: PROMPTS.getChatSystemInstruction(),
        tools: tools,
        temperature: 0.2
      }
    });

    return {
      sendMessage: async (message: string) => {
        try {
          let response = await chat.sendMessage({ message });
          
          // Handle function calls if any
          if (response.functionCalls && response.functionCalls.length > 0) {
            const functionResponses = [];
            
            for (const call of response.functionCalls) {
              try {
                const result = await onAction(call.name, call.args);
                functionResponses.push({
                  functionResponse: {
                    id: call.id,
                    name: call.name,
                    response: { result }
                  }
                });
              } catch (err: any) {
                functionResponses.push({
                  functionResponse: {
                    id: call.id,
                    name: call.name,
                    response: { error: err.message }
                  }
                });
              }
            }
            
            // Send the function execution results back to the model
            response = await chat.sendMessage({ message: functionResponses as any });
          }
          
          return response.text;
        } catch (e) {
          await this.handlePotentialKeyError(e);
          return "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.";
        }
      }
    };
  }
  async analyzeAndRefineDesign(image: string, additionalPrompt?: string): Promise<any> {
    const ai = this.getAI();
    let prompt = `You are a world-class UI/UX Design Critic and Architect.
Analyze the provided image (which is a rough sketch or a poor design).
1. Identify the user's core intent and functional requirements.
2. Critique the visual styling (colors, textures, lighting, material).
3. Suggest a sophisticated color palette (at least 4 Hex codes) and typography.
4. Provide a detailed English prompt for an AI image generator to completely upgrade the visual fidelity of this design. 

CRITICAL INSTRUCTIONS FOR IMAGE PROMPT:
- By default, keep the structural layout and camera angle similar to the original, focusing on upgrading the visual fidelity (materials, lighting, colors).
- HOWEVER, if the user provides "ADDITIONAL REQUIREMENTS" (e.g., changing a theme, replacing an icon, removing/adding a banner), you MUST prioritize their requests. Allow the imagePrompt to explicitly describe these structural or content changes.
- Focus on describing the UPGRADED VISUAL STYLE: premium materials (e.g., frosted glass, brushed metal), cinematic lighting, vibrant modern colors, high-resolution 3D or sleek 2D rendering, and photorealistic details.`;

    if (additionalPrompt) {
      prompt += `\n\nUSER'S ADDITIONAL REQUIREMENTS: "${additionalPrompt}"\n-> You MUST incorporate these specific changes (even if they alter the layout, icons, or banners) into your analysis, refinement plan, and especially the final imagePrompt.`;
    }

    prompt += `\n\nReturn the response in JSON format:
{
  "intent": "A brief summary of what the user is trying to achieve.",
  "analysis": "A detailed critique of the current visual style and why it needs improvement.",
  "refinementPlan": "A step-by-step plan for upgrading the visuals and applying any user-requested changes.",
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "typography": "Suggested font pairings.",
  "imagePrompt": "A highly descriptive prompt focusing on the visual style, materials, colors, and any specific changes requested by the user. Describe it as a finished, premium product."
}`;

    const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image format");

    try {
      const response = await this.generateContentWithFallback({
        model: TEXT_MODEL,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              analysis: { type: Type.STRING },
              refinementPlan: { type: Type.STRING },
              palette: { type: Type.ARRAY, items: { type: Type.STRING } },
              typography: { type: Type.STRING },
              imagePrompt: { type: Type.STRING }
            },
            required: ["intent", "analysis", "refinementPlan", "palette", "typography", "imagePrompt"]
          }
        }
      });

      return this.parseJsonSafely(response.text, null);
    } catch (e) {
      console.error("Design analysis failed", e);
      throw e;
    }
  }

  async analyzeHeritageSignage(image: string): Promise<any> {
    const ai = this.getAI();
    const prompt = `You are an expert Brand Heritage Restorer, Graphic Designer, and Typography Specialist.
Analyze the provided image of an old, potentially faded or damaged storefront signage.
IMPORTANT: If the image has a dark, semi-transparent overlay with a clear "spotlight" area, you MUST focus your analysis, logo restoration, and color extraction ONLY on the clear, highlighted area. Ignore the darkened parts.

1. Logo Restoration: Describe the core elements of the logo/signage to create a clean, modern, high-resolution vector-style version. Provide a detailed image generation prompt. (If there is a dark spotlight overlay, explicitly instruct the image generator to ignore the dark areas and only restore the highlighted logo on a clean white background).
2. Color Restoration: Analyze the faded colors and deduce the original, vibrant brand colors. Provide 3-4 colors with HEX, CMYK, and closest Pantone matches.
3. Typography Digitization: Analyze the fonts used (even if hand-drawn). Identify the style, characteristics, and suggest 2-3 modern, available Google Fonts or commercial fonts that closely match.
4. Brand Book Summary: Provide a short summary of the brand's visual identity based on this signage.
5. Online Brand Book Dashboards: Generate content for 4 specific dashboards. For each dashboard's 'imagePrompt', write an EXTREMELY detailed, photorealistic, award-winning Behance-style prompt for an AI image generator (e.g., "Photorealistic 3D mockup of premium business cards on a dark marble table, cinematic lighting, depth of field, 8k, highly detailed").
   - Brand Identity Portfolio: Branding Kit (Logo, colors, fonts), Mockup ideas (business cards, shirts, signs), and Applications (website, email signature).
   - Brand Presentation: The rationale behind the design choices and the visual strategy.
   - Brand Guidelines: Rules for logo usage, spacing, and examples.
   - Brand Asset Management: A list of digital assets and storage strategy.

Return the response in JSON format:
{
  "logoPrompt": "Detailed prompt to generate a clean, flat, vector-style logo on a white background based on the signage.",
  "colors": [
    { "hex": "#...", "cmyk": "C:0 M:100 Y:100 K:0", "pantone": "Pantone 485 C", "name": "Primary Red" }
  ],
  "typography": {
    "analysis": "Description of the original font style...",
    "suggestions": ["Font Name 1", "Font Name 2"]
  },
  "brandSummary": "A brief summary of the brand identity.",
  "dashboards": {
    "portfolio": {
      "brandingKit": "Summary of logo, colors, and fonts.",
      "mockupPrompts": ["Prompt for business card mockup", "Prompt for signage mockup", "Prompt for apparel mockup"],
      "applications": "Description of digital applications.",
      "imagePrompt": "A professional 3D mockup display of the brand identity including business cards, a smartphone showing a website, and a branded tote bag, all featuring the restored logo and colors."
    },
    "presentation": {
      "rationale": "Explanation of design choices based on heritage.",
      "visualStrategy": "How to position the brand visually.",
      "imagePrompt": "An elegant, minimalist brand presentation slide showing the logo evolution from old signage to new vector, with annotations and a moodboard."
    },
    "guidelines": {
      "rules": "Core rules for using the brand elements.",
      "usageExamples": "Visual examples of correct usage.",
      "imagePrompt": "A technical brand guideline page showing logo clear space, minimum size, and color palette specifications with grid lines."
    },
    "assetManagement": {
      "assetList": ["Logo Vector", "Color Palette PDF", "Font Files", "Mockup Templates"],
      "storageStrategy": "How to organize these assets online.",
      "imagePrompt": "A clean, modern digital asset management interface (DAM) showing folders and file previews for the brand's logos, fonts, and images."
    }
  }
}`;

    const match = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image format");

    try {
      const response = await this.generateContentWithFallback({
        model: TEXT_MODEL,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              logoPrompt: { type: Type.STRING },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hex: { type: Type.STRING },
                    cmyk: { type: Type.STRING },
                    pantone: { type: Type.STRING },
                    name: { type: Type.STRING }
                  },
                  required: ["hex", "cmyk", "pantone", "name"]
                }
              },
              typography: {
                type: Type.OBJECT,
                properties: {
                  analysis: { type: Type.STRING },
                  suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["analysis", "suggestions"]
              },
              brandSummary: { type: Type.STRING },
              dashboards: {
                type: Type.OBJECT,
                properties: {
                  portfolio: {
                    type: Type.OBJECT,
                    properties: {
                      brandingKit: { type: Type.STRING },
                      mockupPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
                      applications: { type: Type.STRING },
                      imagePrompt: { type: Type.STRING }
                    },
                    required: ["brandingKit", "mockupPrompts", "applications", "imagePrompt"]
                  },
                  presentation: {
                    type: Type.OBJECT,
                    properties: {
                      rationale: { type: Type.STRING },
                      visualStrategy: { type: Type.STRING },
                      imagePrompt: { type: Type.STRING }
                    },
                    required: ["rationale", "visualStrategy", "imagePrompt"]
                  },
                  guidelines: {
                    type: Type.OBJECT,
                    properties: {
                      rules: { type: Type.STRING },
                      usageExamples: { type: Type.STRING },
                      imagePrompt: { type: Type.STRING }
                    },
                    required: ["rules", "usageExamples", "imagePrompt"]
                  },
                  assetManagement: {
                    type: Type.OBJECT,
                    properties: {
                      assetList: { type: Type.ARRAY, items: { type: Type.STRING } },
                      storageStrategy: { type: Type.STRING },
                      imagePrompt: { type: Type.STRING }
                    },
                    required: ["assetList", "storageStrategy", "imagePrompt"]
                  }
                },
                required: ["portfolio", "presentation", "guidelines", "assetManagement"]
              }
            },
            required: ["logoPrompt", "colors", "typography", "brandSummary", "dashboards"]
          }
        }
      });

      return this.parseJsonSafely(response.text, null);
    } catch (e) {
      console.error("Heritage analysis failed", e);
      throw e;
    }
  }

  async generateSingleBlock(prompt: string, tone: DesignTone, context: string, thinkingLevel: 'default' | 'low' | 'high' = 'default'): Promise<Block> {
    const ai = this.getAI();
    const systemInstruction = PROMPTS.getGenerateSingleBlockSystemInstruction();

    try {
      const config: any = {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING },
            name: { type: Type.STRING },
            html: { type: Type.STRING }
          },
          required: ["id", "type", "name", "html"]
        }
      };

      if (thinkingLevel === 'low') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (thinkingLevel === 'high') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const response = await this.generateContentWithFallback({
        model: TEXT_MODEL,
        contents: `Context: ${context}\nRequest: ${prompt}`,
        config
      });

      const result = this.parseJsonSafely(response.text, null);
      if (result && result.html) {
        return result;
      }
      
      // Fallback if parsing fails
      return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'error',
        name: 'Error Block',
        html: `<div class="p-8 text-center text-red-500 bg-red-50 border border-red-200 rounded-lg">Failed to generate block. Please try again.</div>`
      };
    } catch (e) {
      throw e;
    }
  }
  async generateSpeech(text: string): Promise<ArrayBuffer> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [{ parts: [{ text: `Say cheerfully and professionally: ${text}` }] }],
        config: {
          // @ts-ignore
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data returned");

      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (e) {
      throw e;
    }
  }

  async globalRemix(blocks: Block[], tone: DesignTone): Promise<{ blocks: Block[], globalCss: string }> {
    const ai = this.getAI();
    const systemInstruction = PROMPTS.getGlobalRemixSystemInstruction(tone);

    try {
      const response = await this.generateContentWithFallback({
        model: TEXT_MODEL,
        contents: `Blocks: ${JSON.stringify(blocks)}\nTarget Tone: ${tone}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              blocks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    name: { type: Type.STRING },
                    html: { type: Type.STRING }
                  },
                  required: ["id", "type", "name", "html"]
                }
              },
              globalCss: { type: Type.STRING }
            },
            required: ["blocks", "globalCss"]
          }
        }
      });

      return this.parseJsonSafely(response.text, { blocks, globalCss: "" });
    } catch (e) {
      throw e;
    }
  }

  async refineBlock(block: Block, instruction: string, tone: DesignTone): Promise<Block> {
    const ai = this.getAI();
    const systemInstruction = PROMPTS.getRefineBlockSystemInstruction(tone);

    try {
      const response = await this.generateContentWithFallback({
        model: TEXT_MODEL,
        contents: `Block: ${JSON.stringify(block)}\nInstruction: ${instruction}\nTone: ${tone}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING },
              name: { type: Type.STRING },
              html: { type: Type.STRING }
            },
            required: ["id", "type", "name", "html"]
          }
        }
      });

      return this.parseJsonSafely(response.text, block);
    } catch (e) {
      throw e;
    }
  }

  async analyzeSEO(blocks: Block[]): Promise<string> {
    const ai = this.getAI();
    const content = blocks.map(b => b.html).join(' ');
    try {
      const response = await this.generateContentWithFallback({
        model: TEXT_MODEL,
        contents: `Analyze this landing page for SEO and accessibility. Provide a concise report with actionable tips. Content: ${content}`,
        config: {
          systemInstruction: PROMPTS.getAnalyzeSEOSystemInstruction()
        }
      });
      return response.text || "Could not analyze SEO.";
    } catch (e) {
      throw e;
    }
  }

  async *generateOmniImagesStream(prompt: string, mode: string, userAspectRatio: string, logoBase64?: string, mimeType?: string, imageResolution: '1K' | '2K' | '4K' = '1K', omniOutputMode: 'single-block' | 'multi-block' = 'multi-block', referenceImages?: string[]): AsyncGenerator<string, void, unknown> {
    const ai = this.getAI();
    
    let items: string[] = [];
    
    if (omniOutputMode === 'single-block') {
      // Nếu gộp chung 1 section, gửi toàn bộ prompt như 1 yêu cầu duy nhất để AI vẽ chung vào 1 bức ảnh
      items = [prompt];
    } else {
      items = parseOmniItems(prompt);

      // Giới hạn tối đa 4 items để tránh quá tải API và làm chậm hệ thống
      items = items.slice(0, 4);
    }

    let generatedCount = 0;
    
    // Khởi tạo tất cả các request song song để tối ưu hiệu suất
    const imagePromises = items.map(async (itemPrompt) => {
      const parts: any[] = [];
      if (logoBase64 && mimeType) {
        const base64Data = logoBase64.includes(',') ? logoBase64.split(',')[1] : logoBase64;
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }
      
      if (referenceImages && referenceImages.length > 0) {
        for (const img of referenceImages) {
          const match = img.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2]
              }
            });
          }
        }
      }
      
      let modePrompt = PROMPTS.getOmniImagePrompt(mode, itemPrompt);
      let finalAspectRatio = userAspectRatio || "16:9";
      
      parts.push({ text: modePrompt });

      let attempt = 0;
      let success = false;
      let currentParts = [...parts];
      let finalImageUrl = "";

      while (attempt < 2 && !success) {
        try {
          const response = await this.generateContentWithFallback({
            model: PRO_IMAGE_MODEL,
            contents: { parts: currentParts },
            config: {
              imageConfig: {
                aspectRatio: finalAspectRatio,
                imageSize: imageResolution
              }
            }
          });

          const candidate = response.candidates?.[0];
          if (!candidate || !candidate.content || !Array.isArray(candidate.content.parts)) {
            throw new Error("Model failed to generate image candidate or returned invalid content");
          }

          let foundImage = false;
          let returnedText = "";
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              finalImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              foundImage = true;
              break;
            } else if (part.text) {
              returnedText += part.text + " ";
            }
          }
          if (!foundImage) {
            console.error("Model returned text instead of image:", returnedText);
            throw new Error("No image data returned for item: " + itemPrompt + (returnedText ? `\nModel response: ${returnedText}` : ""));
          }
          success = true;
        } catch (e: any) {
          console.error(`Error generating image for item (Attempt ${attempt + 1}):`, e);
          const errStr = JSON.stringify(e).toLowerCase() + (e?.message || '').toLowerCase();
          if (errStr.includes('spending cap') || errStr.includes('resource_exhausted')) {
            throw e;
          }
          
          if (attempt === 0) {
            console.log("Retrying with a rewritten, safer English prompt...");
            try {
              const rewriteResponse = await this.generateContentWithFallback({
                model: 'gemini-3-flash-preview',
                contents: `Rewrite the following image generation prompt into English. Optimize it for an AI image generator. Ensure it strictly complies with AI safety guidelines (e.g., no explicit content, no specific real people, safe for work). Focus purely on the visual description and remove any potentially sensitive terms. Return ONLY the rewritten English prompt, nothing else.\n\nOriginal prompt: ${modePrompt}`
              });
              if (rewriteResponse.text) {
                const rewrittenPrompt = rewriteResponse.text.trim();
                console.log("Rewritten prompt:", rewrittenPrompt);
                // Replace the last part (which is the text prompt) with the rewritten one
                currentParts = [...parts];
                currentParts[currentParts.length - 1] = { text: rewrittenPrompt };
              }
            } catch (rewriteErr) {
              console.warn("Failed to rewrite prompt", rewriteErr);
            }
          }
        }
        attempt++;
      }
      
      if (!success) {
        throw new Error(`Failed to generate image for prompt: ${itemPrompt}`);
      }
      
      return finalImageUrl;
    });

    // Yield kết quả theo thứ tự khi các promise hoàn thành
    for (const p of imagePromises) {
      try {
        const imageUrl = await p;
        if (imageUrl) {
          yield imageUrl;
          generatedCount++;
        }
      } catch (e) {
        console.error("Failed to yield image from promise:", e);
      }
    }
    
    if (generatedCount === 0) {
       throw new Error("Failed to generate any images.");
    }
  }
}

export const geminiService = new GeminiService();
