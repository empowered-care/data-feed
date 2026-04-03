import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  raw?: any;
}

export default function QueryPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState<number | null>(null);

  const send = async () => {
    if (!input.trim()) return;
    const q = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q, timestamp: new Date() }]);
    setLoading(true);

    try {
      const resp = await api.query(q);
      setMessages((m) => [...m, { role: 'assistant', content: resp.response, timestamp: new Date(), raw: resp }]);
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Query failed';
      toast.error(msg);
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${msg}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl">
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Query Outbreak Data</h2>
        <p className="text-sm text-muted-foreground">Ask questions about outbreaks in natural language</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground">Ask anything about outbreak data</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Which locations have the highest risk?', 'How many cholera cases this week?', 'What are the top recommendations?'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
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
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'glass-card'
                }`}
              >
                <div className="space-y-2">
                  <div>{msg.content}</div>
                  {msg.raw && (
                    <div className="mt-2 text-[10px]">
                      <button 
                        onClick={() => setShowRaw(showRaw === i ? null : i)}
                        className="text-primary hover:underline font-mono"
                      >
                        {showRaw === i ? 'Hide details' : 'Show raw metadata'}
                      </button>
                      {showRaw === i && (
                        <pre className="mt-2 p-2 bg-black/80 text-green-400 rounded overflow-auto max-h-40 scrollbar-thin">
                          {JSON.stringify(msg.raw, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
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
            <div className="glass-card rounded-xl px-4 py-3 text-sm text-muted-foreground animate-pulse">
              Analyzing with AI agents...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex gap-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about outbreaks..."
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
