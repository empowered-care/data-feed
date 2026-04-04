import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent?: string;
  raw?: any;
}

export default function QueryPage() {
  const SUGGESTIONS = [
    "Which locations have the highest risk?",
    "How many cholera cases this week?",
    "Summarize recent outbreak trends",
    "What are the top recommendations?",
  ];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [showRaw, setShowRaw] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };


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
          raw: resp,
        },
      ]);
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Query failed';
      toast.error(msg);
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${msg}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (sessionId) {
      try {
        await api.clearChat(sessionId);
      } catch {}
    }
    setMessages([]);
    setSessionId(undefined);
    toast.success('Chat cleared');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            Neural Assistant
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            Investigate epidemiological data via multi-agent cognitive link
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory} className="gap-2 text-[10px] font-black uppercase tracking-widest hover:text-risk-high transition-colors">
            <Trash2 className="h-4 w-4" /> Reset Uplink
          </Button>
        )}
      </div>

      <div className="flex-1 glass-card rounded-3xl overflow-hidden flex flex-col relative border-border/40 shadow-2xl">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-8 max-w-sm">
                <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner relative group">
                   <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Bot className="h-10 w-10 text-primary relative z-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-tight">Systems Operational</h3>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    All extraction and analysis agents are online. Please specify your investigative objective.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center pt-4">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="px-4 py-2 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 text-xs font-bold transition-all hover:scale-105"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                'flex gap-4 group',
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border/50 transition-transform group-hover:scale-110',
                m.role === 'user' ? 'bg-muted/50 text-muted-foreground' : 'bg-primary text-primary-foreground'
              )}>
                {m.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              
              <div className={cn(
                'max-w-[85%] space-y-2',
                m.role === 'user' ? 'items-end' : 'items-start'
              )}>
                <div className={cn(
                  'p-5 rounded-3xl shadow-sm relative',
                  m.role === 'user' 
                    ? 'bg-muted/30 border border-border/50 rounded-tr-sm' 
                    : 'bg-background border border-border/80 rounded-tl-sm'
                )}>
                  <div className="text-sm font-medium leading-relaxed tracking-tight text-foreground/90 whitespace-pre-wrap">
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    )}
                  </div>
                  
                  {m.role === 'assistant' && (
                    <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between gap-4">
                      {m.agent ? (
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 px-2 py-0.5 bg-primary/5 rounded-full">
                          Cognitive Node: {m.agent}
                        </span>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleCopy(m.content, i)}
                          className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors"
                          title="Copy response"
                        >
                          {copiedIndex === i ? (
                            <><Check className="h-3 w-3 text-green-500" /> <span className="text-green-500">Copied</span></>
                          ) : (
                            <><Copy className="h-3 w-3" /> Copy</>
                          )}
                        </button>
                        {m.raw && (
                          <button 
                            onClick={() => setShowRaw(showRaw === i ? null : i)}
                            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors"
                          >
                            {showRaw === i ? 'Close Data' : 'Trace Signal'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showRaw === i && m.raw && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass-card p-4 rounded-2xl border-primary/20 overflow-hidden"
                    >
                      <pre className="text-[10px] font-mono text-green-500/80 leading-tight">
                        {JSON.stringify(m.raw, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 animate-pulse">
                <Bot className="h-5 w-5" />
              </div>
              <div className="bg-muted/30 border border-border/50 p-5 rounded-3xl rounded-tl-sm flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Analyzing System Memory...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Terminal */}
        <div className="p-6 md:p-8 bg-muted/20 border-t border-border/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="relative flex items-center gap-3"
          >
            <div className="relative flex-1">
               <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Initialize investigative query..."
                disabled={loading}
                className="w-full bg-background border-2 border-border/50 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:opacity-50 transition-all placeholder:text-muted-foreground/30 placeholder:font-normal"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded bg-muted text-[10px] font-black text-muted-foreground/60 border border-border/50">
                    <span className="text-[12px] leading-none">↵</span> ENTER
                 </div>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={loading || !input.trim()} 
              className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:scale-100"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
