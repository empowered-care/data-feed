import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Zap, MessageSquare, ArrowRight, CheckCircle2, FlaskConical, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

export default function Landing() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.getHealth()
      .then((h) => setHealthOk(h.status === 'ok'))
      .catch(() => setHealthOk(false));
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Nav */}
      <nav className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Aegis <span className="text-primary">Lite</span></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-[10px] uppercase font-bold tracking-widest text-muted-foreground mr-4">
              <span className="w-1.5 h-1.5 rounded-full bg-health animate-pulse" />
        
            </div>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full h-9 w-9">
              {darkMode ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-primary/10 blur-[120px] rounded-full -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
            <Zap className="h-3.5 w-3.5 fill-primary" />
            Advanced Multi-Agent Consensus System
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Detect Outbreaks with 
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">Collective Intelligence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Harnessing a hierarchical swarm of specialized AI agents to analyze, validate, and alert teams to emerging health threats in real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/process">
              <Button size="lg" className="gap-2 px-8 h-12 text-base shadow-xl shadow-primary/20">
                Start Analysis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base glass-card">
                View Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/40 backdrop-blur-sm text-[11px] font-semibold uppercase tracking-wider"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              healthOk === null ? 'bg-muted-foreground animate-pulse' : healthOk ? 'bg-health' : 'bg-risk-high shadow-[0_0_8px_rgba(244,63,94,0.6)]'
            }`}
          />
          {/* {healthOk === null ? 'System Warming Up...' : healthOk ? 'All Agents Online' : 'Core API Disconnected'} */}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-32 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Activity, title: 'Intelligent Extraction', desc: 'Clinical-grade NLP identifies symptoms, locations, and demographics.' },
          { icon: FlaskConical, title: 'Multi-Agent Consensus', desc: 'Independent analysis perspectives merge into a high-confidence risk profile.' },
          { icon: Shield, title: 'Urgent Alerting', desc: 'Instant generation of prevention strategies and urgency justifications.' },
          { icon: MessageSquare, title: 'Expert Consultation', desc: 'Secure sessions with specialized sub-agents for deep data insights.' },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="group glass-card rounded-2xl p-6 space-y-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
          >
            <div className="p-3 bg-primary/10 rounded-xl w-fit group-hover:scale-110 transition-transform duration-300">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
