import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Lightbulb, Maximize2, Copy, Check, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent?: string;
  isNew?: boolean;
}

export function FloatingAssistant() {
  const SUGGESTIONS = [
    "Which locations have the highest risk?",
    "How many cholera cases this week?",
    "Summarize recent outbreak trends",
    "What are the top recommendations?",
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Epidemiological Assistant. How can I help you analyze the current outbreak data today?',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };


  // Trigger welcome message on navigation
  useEffect(() => {
    const pageName = location.pathname.split('/').pop() || 'Dashboard';
    const capitalized = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    
    if (messages.length > 1) { // Don't do it on first load
      const welcomeMsg: Message = {
        role: 'assistant',
        content: `I noticed you navigated to the ${capitalized} section. Would you like me to analyze any specific data points here?`,
        timestamp: new Date(),
        isNew: true
      };
      setMessages(prev => [...prev, welcomeMsg]);
      if (!isOpen) setHasNewMessage(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) setHasNewMessage(false);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (overrideInput?: string) => {
    const q = (overrideInput || input).trim();
    if (!q) return;
    
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q, timestamp: new Date() }]);
    setLoading(true);

    try {
      const resp = await api.chat(q, sessionId);
      setSessionId(resp.session_id);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: resp.response,
          timestamp: new Date(),
          agent: resp.agent_used,
        },
      ]);
    } catch (e: any) {
      toast.error('Assistant offline');
      setMessages((m) => [...m, { role: 'assistant', content: 'Connection lost. Please try again.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
            className="w-[350px] sm:w-[400px] h-[500px] glass-card rounded-3xl shadow-2xl flex flex-col overflow-hidden border-primary/20 pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-lg relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
               <div className="flex items-center gap-3 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                   <Bot className="h-6 w-6" />
                 </div>
                 <div>
                   <h3 className="font-bold text-sm tracking-tight leading-none">AI Assistant</h3>
                   <span className="text-[10px] opacity-70 font-medium uppercase tracking-widest">Data Analyst</span>
                 </div>
               </div>
               <div className="flex items-center gap-1 relative z-10">
                 <button 
                   onClick={() => {
                     setIsOpen(false);
                     navigate('/query');
                   }}
                   title="Open Full Screen Chat"
                   className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                 >
                   <Maximize2 className="h-4 w-4" />
                 </button>
                 <button 
                   onClick={() => setIsOpen(false)}
                   className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                 >
                   <X className="h-5 w-5" />
                 </button>
               </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-background/50"
            >
              {messages.length === 1 && (
                <div className="space-y-3 pb-4">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1">
                      <Lightbulb className="h-3 w-3" /> Quick Analytics
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => send(s)}
                          className="text-left p-3 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-[11px] font-bold group flex items-center justify-between"
                        >
                          {s}
                          <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex gap-3",
                  m.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                    m.role === 'user' ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"
                  )}>
                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm",
                    m.role === 'user' 
                      ? "bg-muted/30 border border-border/50 rounded-tr-none" 
                      : "bg-background border border-border/80 rounded-tl-none prose prose-xs dark:prose-invert"
                  )}>
                    {m.role === 'user' ? (
                      <span>{m.content}</span>
                    ) : (
                      <div className="
                        [&_h1]:text-sm [&_h1]:font-black [&_h1]:mb-1 [&_h1]:mt-2
                        [&_h2]:text-sm [&_h2]:font-black [&_h2]:mb-1 [&_h2]:mt-2
                        [&_h3]:text-xs [&_h3]:font-black [&_h3]:mb-1 [&_h3]:mt-2
                        [&_p]:mb-1.5 [&_p]:leading-relaxed
                        [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_ul]:mb-1.5
                        [&_ol]:pl-4 [&_ol]:space-y-0.5 [&_ol]:mb-1.5
                        [&_ul>li]:list-disc [&_ol>li]:list-decimal
                        [&_li]:text-xs [&_li]:leading-relaxed
                        [&_strong]:font-black [&_strong]:text-foreground
                        [&_em]:italic [&_em]:text-foreground/80
                        [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-[10px] [&_code]:font-mono
                        [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                      ">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                    {m.role === 'assistant' && (
                      <div className="mt-2 pt-2 border-t border-border/20 flex items-center justify-between">
                        {m.agent ? (
                          <div className="flex items-center gap-1">
                            <Activity className="h-2.5 w-2.5 text-primary/50" />
                            <span className="text-[8px] font-black uppercase text-muted-foreground">
                              {m.agent === 'location' ? 'Location Specialist' :
                               m.agent === 'infection' ? 'Infection Specialist' :
                               m.agent === 'history' ? 'History Specialist' : 'AI Assistant'}
                            </span>
                          </div>
                        ) : <span />}
                        <button
                          onClick={() => handleCopy(m.content, i)}
                          className="flex items-center gap-1 text-[9px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors"
                        >
                          {copiedIndex === i
                            ? <><Check className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                            : <><Copy className="h-3 w-3" />Copy</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                     <Loader2 className="h-4 w-4 animate-spin" />
                   </div>
                   <div className="bg-background border border-border/80 p-3 rounded-2xl rounded-tl-none">
                     <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                     </div>
                   </div>
                </div>
              )}
            </div>

            {/* Footer Input */}
            <div className="p-4 bg-muted/20 border-t border-border/50">
              <form 
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-center gap-2"
              >
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the assistant..."
                  className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                />
                <Button 
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/20"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layoutId="chat-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all border-2 pointer-events-auto",
          isOpen 
            ? "bg-muted border-border/50 text-muted-foreground" 
            : "bg-primary border-primary/20 text-primary-foreground"
        )}
      >
        {isOpen ? <X className="h-8 w-8" /> : (
          <div className="relative">
            <MessageSquare className="h-8 w-8" />
            <AnimatePresence>
              {hasNewMessage && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-risk-high rounded-full border-2 border-primary flex items-center justify-center"
                >
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.button>
    </div>
  );
}
