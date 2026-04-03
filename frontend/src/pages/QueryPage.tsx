import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agentUsed?: string;
}

export default function QueryPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const clearHistory = async () => {
    if (!sessionId) return;
    try {
      await api.clearChat(sessionId);
      setMessages([]);
      setSessionId(undefined);
      toast.success('Chat history cleared');
    } catch (e: any) {
      toast.error('Failed to clear history');
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput('');
    
    setMessages((m) => [...m, { role: 'user', content: q, timestamp: new Date() }]);
    setLoading(true);

    try {
      const resp = await api.chat({ message: q, session_id: sessionId });
      setMessages((m) => [...m, { 
        role: 'assistant', 
        content: resp.response, 
        timestamp: new Date(),
        agentUsed: resp.agent_used
      }]);
      setSessionId(resp.session_id);
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Chat failed';
      toast.error(msg);
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${msg}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="mb-4 flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border border-border/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Epidemiological AI Assistant
          </h2>
          <p className="text-xs text-muted-foreground">Expert clinical guidance across all stored outbreaks</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-destructive gap-2">
            <Trash2 className="h-4 w-4" />
            Clear Session
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 max-w-md">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Start an AI consultation</p>
                <p className="text-sm text-muted-foreground px-8">Our multi-agent system uses RAG to analyze historical data and provide risk assessments.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'Which locations have the highest risk?', 
                  'Summary of cholera cases', 
                  'Compare jimma and Hawassa outbreaks'
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs px-4 py-2 rounded-lg bg-card border border-border hover:bg-muted hover:border-primary/30 transition-all font-medium"
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'glass-card rounded-tl-none border border-border/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.agentUsed && (
                    <div className="pt-2 mt-2 border-t border-border/30 flex items-center gap-1.5 opacity-60 text-[10px] font-mono">
                      <ShieldCheck className="h-3 w-3" />
                      Assisted by: {msg.agentUsed.toUpperCase()} AGENT
                    </div>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 shadow-sm mt-1">
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
            <div className="glass-card rounded-2xl px-5 py-3 text-sm text-muted-foreground animate-pulse border border-border/50">
              Consulting specialized medical agents...
            </div>
          </div>
        )}
      </div>

      <div className="bg-card p-2 rounded-2xl shadow-lg border border-border">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your clinical query (e.g. 'How many malaria cases?')..."
            disabled={loading}
            className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon" className="rounded-xl h-10 w-10">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
