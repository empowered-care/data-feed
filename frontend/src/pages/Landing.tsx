import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Zap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';

export default function Landing() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const [healthOk, setHealthOk] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then(() => setHealthOk(true)).catch(() => setHealthOk(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Aegis Lite</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-ethiopian-green" />
              <span className="w-1.5 h-1.5 rounded-full bg-ethiopian-gold" />
              <span className="w-1.5 h-1.5 rounded-full bg-ethiopian-red" />
              <span className="ml-1 text-muted-foreground">HSIL Hackathon 2026 • Addis Ababa</span>
            </div>
            <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
              {darkMode ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            Multi-Agent AI System
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Aegis Lite
            <br />
            <span className="text-primary">Outbreak Detection</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered multi-agent disease outbreak detection for high-value health systems.
            Built for the Harvard Health Systems Innovation Lab Hackathon 2026.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 px-8">
                Try Demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/process">
              <Button size="lg" variant="outline" className="gap-2 px-8">
                Process a Report
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              healthOk === null ? 'bg-muted-foreground animate-pulse' : healthOk ? 'bg-health' : 'bg-risk-high'
            }`}
          />
          {healthOk === null ? 'Checking system...' : healthOk ? 'System Online' : 'API Offline (using mock data)'}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Activity, title: 'Data Extraction', desc: 'NLP agent extracts symptoms, locations, and case counts.' },
          { icon: CheckCircle2, title: 'Validation', desc: 'Cross-references data with epidemiological standards.' },
          { icon: Shield, title: 'Risk Analysis', desc: 'Calculates risk scores and identifies possible diseases.' },
          { icon: Users, title: 'Human-in-Loop', desc: 'High-risk alerts require human expert validation.' },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="glass-card rounded-xl p-5 space-y-3"
          >
            <div className="p-2 bg-primary/10 rounded-lg w-fit">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
