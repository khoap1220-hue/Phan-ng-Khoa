import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from '../services/geminiService';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const SystemChatbot: React.FC = () => {
  const appLogic = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Chào bạn! Tôi là chuyên gia tư vấn thiết kế và trợ lý hệ thống của Omni-Builder Pro. Bạn muốn xây dựng trang web như thế nào? Hãy cho tôi biết ý tưởng, tôi sẽ tư vấn phương án tốt nhất trước khi chúng ta tiến hành áp dụng nhé!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const appLogicRef = useRef(appLogic);

  useEffect(() => {
    appLogicRef.current = appLogic;
  }, [appLogic]);

  useEffect(() => {
    const initChat = async () => {
      try {
        console.log("Initializing System Chatbot...");
        const session = await geminiService.startSystemChatSession(async (action, args) => {
          console.log("Chatbot Action:", action, args);
          const currentLogic = appLogicRef.current;
          try {
            switch (action) {
              case 'addBlock':
                const newBlock = await geminiService.generateSingleBlock(args.prompt, args.tone || 'professional', currentLogic.internalHtml);
                currentLogic.setState(prev => ({
                  ...prev,
                  blocks: [...prev.blocks, newBlock]
                }));
                
                // Generate images for the new block
                const parser = new DOMParser();
                const doc = parser.parseFromString(newBlock.html, 'text/html');
                const imgs = Array.from(doc.querySelectorAll('img'));
                for (let idx = 0; idx < imgs.length; idx++) {
                  const img = imgs[idx];
                  const prompt = img.getAttribute('data-ai-prompt');
                  if (prompt) {
                    // Fire and forget image generation
                    currentLogic.handleRegenerateImage(newBlock.id, idx, prompt, currentLogic.imageResolution).catch(console.error);
                  }
                }
                
                return `Successfully added a new block based on prompt: "${args.prompt}"`;
              
              case 'removeBlock':
                const index = args.index;
                let removed = false;
                currentLogic.setState(prev => {
                  if (index >= 0 && index < prev.blocks.length) {
                    const newBlocks = [...prev.blocks];
                    newBlocks.splice(index, 1);
                    removed = true;
                    return { ...prev, blocks: newBlocks };
                  }
                  return prev;
                });
                if (removed) return `Successfully removed block at index ${index}`;
                return `Failed to remove block. Index ${index} is out of bounds.`;
                
              case 'updateGlobalCss':
                currentLogic.setState(prev => ({
                  ...prev,
                  globalCss: args.css
                }));
                return `Successfully updated global CSS.`;
                
              case 'changeTone':
                return `Successfully changed design tone to ${args.tone}. Note: This will apply to newly generated blocks.`;
                
              case 'readWebsiteContent':
                return JSON.stringify({
                  globalCss: currentLogic.state.globalCss,
                  systemLogs: currentLogic.state.logs.map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`),
                  blocks: currentLogic.state.blocks.map((b, i) => ({
                    index: i,
                    type: b.type,
                    name: b.name,
                    htmlSnippet: b.html
                  }))
                });
                
              default:
                return `Unknown action: ${action}`;
            }
          } catch (err: any) {
            console.error("Action error:", err);
            return `Error executing ${action}: ${err.message}`;
          }
        });
        chatSessionRef.current = session;
        console.log("System Chatbot initialized successfully.");
      } catch (error) {
        console.error("Failed to initialize System Chatbot:", error);
        setMessages(prev => [...prev, { 
          id: 'error-init', 
          role: 'assistant', 
          content: '⚠️ Không thể khởi tạo hệ thống AI. Vui lòng kiểm tra API Key trong phần Cài đặt.' 
        }]);
      }
    };
    
    initChat();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!chatSessionRef.current) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: "⚠️ Hệ thống AI chưa sẵn sàng. Vui lòng thử lại sau giây lát hoặc kiểm tra API Key trong phần Cài đặt." 
      }]);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      // Build context string from recent logs to make the AI aware of what just happened
      const recentLogs = appLogic.state.logs.slice(0, 5).map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`).join('\n');
      
      // Determine current workflow step
      let workflowSteps = [];
      if (appLogic.state.blocks.length === 0) {
        workflowSteps.push("Khởi tạo dự án mới (Chưa có block nào)");
      } else {
        if (appLogic.viewMode === 'edit') {
          workflowSteps.push("Đang chỉnh sửa mã nguồn HTML/CSS chi tiết");
        } else {
          workflowSteps.push("Đang xem trước trang web (Preview Mode)");
        }
        
        if (appLogic.state.selectedBlockId) {
          workflowSteps.push(`Đang chọn và thao tác trên block ID: ${appLogic.state.selectedBlockId}`);
        }
        
        if (appLogic.omniMode !== 'none') {
          workflowSteps.push(`Đang sử dụng công cụ AI chuyên sâu: ${appLogic.omniMode}`);
        }
        
        if (appLogic.isAddingModule) {
          workflowSteps.push("Đang trong quá trình thêm Module/Block mới");
        }
      }

      const workflowStep = workflowSteps.join(', ');

      const contextAwareMessage = `[System Context - Recent Activities:\n${recentLogs || 'No recent activities'}]\n[Current Workflow Step: ${workflowStep}]\n\nUser Message: ${userMsg}`;

      const responseText = await chatSessionRef.current.sendMessage(contextAwareMessage);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: responseText || "Xin lỗi, tôi không nhận được phản hồi từ hệ thống AI. Vui lòng thử lại." 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Xin lỗi, đã có lỗi xảy ra khi kết nối với AI." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold leading-tight">System Assistant</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-indigo-200 uppercase tracking-wider">Memory Sync Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-gray-200 text-gray-600'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-gray-200 rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs text-gray-500">Đang xử lý...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Nhập lệnh điều khiển..."
                  className="flex-1 px-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm transition-all outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
