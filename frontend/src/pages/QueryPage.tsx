import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, MessageSquare, Copy, Check, Activity } from 'lucide-react';
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
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">AI Epidemiological Assistant</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> Surveillance Query Interface
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ask about outbreaks, trends, risk levels, or regional summaries</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory}
            className="gap-2 text-xs font-bold rounded-xl border-border/50 hover:border-red-500/50 hover:text-red-500">
            <Trash2 className="h-3.5 w-3.5" /> Clear Chat
          </Button>
        )}
      </div>

      <div className="flex-1 bg-background/70 border border-border/40 rounded-2xl overflow-hidden flex flex-col shadow-sm">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full py-20">
              <div className="text-center space-y-6 max-w-md">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black">Ready to Assist</h3>
                  <p className="text-sm text-muted-foreground">
                    Ask me about outbreak trends, risk zones, case counts, or regional summaries.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="px-4 py-2 rounded-xl border border-border/50 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 text-xs font-bold transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('flex gap-3 group', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border',
                m.role === 'user'
                  ? 'bg-muted border-border/50 text-muted-foreground'
                  : 'bg-primary border-primary/20 text-primary-foreground'
              )}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              
              <div className={cn(
                'max-w-[88%] space-y-1',
                m.role === 'user' ? 'items-end' : 'items-start'
              )}>
                <div className={cn(
                  'px-5 py-4 rounded-2xl shadow-sm',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-background border border-border/50 rounded-tl-sm'
                )}>
                  {m.role === 'user' ? (
                    <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                  ) : (
                    <div className="text-sm leading-relaxed text-foreground/90 space-y-2
                      [&_h1]:text-xl [&_h1]:font-black [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-foreground
                      [&_h2]:text-lg [&_h2]:font-black [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-foreground
                      [&_h3]:text-base [&_h3]:font-black [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-foreground
                      [&_p]:mb-2 [&_p]:leading-relaxed
                      [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:mb-2
                      [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:mb-2
                      [&_li]:text-sm [&_li]:leading-relaxed
                      [&_ul>li]:list-disc [&_ol>li]:list-decimal
                      [&_strong]:font-black [&_strong]:text-foreground
                      [&_em]:italic [&_em]:text-foreground/80
                      [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                      [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                      [&_hr]:border-border/40 [&_hr]:my-3">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}

                  {m.role === 'assistant' && (
                    <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between gap-4">
                      {m.agent ? (
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3 w-3 text-primary/50" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                            {m.agent === 'location' ? 'Location Specialist' :
                             m.agent === 'infection' ? 'Infection Specialist' :
                             m.agent === 'history' ? 'History Specialist' : 'General Assistant'}
                          </span>
                        </div>
                      ) : <span />}
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleCopy(m.content, i)}
                          className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">
                          {copiedIndex === i
                            ? <><Check className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                            : <><Copy className="h-3 w-3" />Copy</>}
                        </button>
                        {m.raw && (
                          <button onClick={() => setShowRaw(showRaw === i ? null : i)}
                            className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">
                            {showRaw === i ? 'Hide Data' : 'Raw Data'}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-background border border-border/50 px-5 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Analyzing surveillance data...</span>
                <span className="flex gap-0.5">
                  {[0,1,2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-primary/50 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-muted/10 border-t border-border/40">
          <form onSubmit={e => { e.preventDefault(); send(); }}
            className="flex items-center gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about outbreaks, trends, locations, risk zones..."
              disabled={loading}
              className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 transition-all placeholder:text-muted-foreground/50"
            />
            <Button type="submit" disabled={loading || !input.trim()}
              className="h-11 px-5 rounded-xl font-bold gap-2 shadow-sm shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">Press Enter or click Send · Responses use live surveillance data</p>
        </div>
      </div>
    </div>
  );
}
