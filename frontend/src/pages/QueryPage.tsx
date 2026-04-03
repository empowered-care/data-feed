import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent?: string;
  raw?: any;
}

const SUGGESTIONS = [
  'Which locations have the highest risk?',
  'How many cholera cases this week?',
  'Summarize recent outbreak trends',
  'What are the top recommendations?',
];

export default function QueryPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [showRaw, setShowRaw] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      // Use the real /outbreak/chat endpoint with session memory
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
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Chat with the multi-agent system about outbreak data
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} className="gap-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Ask anything about outbreak data</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  The multi-agent AI system will analyze your question and provide insights from processed reports.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs px-3.5 py-2 rounded-full border border-border hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="max-w-[80%] space-y-1">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'glass-card rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.agent && (
                  <p className="text-[10px] text-muted-foreground px-1">
                    via <span className="font-medium">{msg.agent}</span>
                  </p>
                )}
                {msg.raw && (
                  <div className="px-1">
                    <button
                      onClick={() => setShowRaw(showRaw === i ? null : i)}
                      className="text-[10px] text-primary hover:underline font-mono"
                    >
                      {showRaw === i ? 'Hide details' : 'Show raw metadata'}
                    </button>
                    {showRaw === i && (
                      <pre className="mt-1.5 p-2.5 bg-black/80 text-green-400 rounded-lg overflow-auto max-h-40 scrollbar-thin text-[10px]">
                        {JSON.stringify(msg.raw, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            </div>
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground">
              <span className="animate-pulse">Analyzing with AI agents...</span>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about outbreaks, risk levels, trends..."
          disabled={loading}
          className="flex-1 h-11"
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-11 w-11">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
