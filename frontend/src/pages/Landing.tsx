import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Shield, Activity, Zap, Users, ArrowRight, CheckCircle2, LogIn,
  Brain, FileSearch, AlertTriangle, BarChart3, Bot, Clock, Cpu,
  Globe, HeartPulse, Microscope, Stethoscope, TrendingUp, Target, TrendingDown,
  FileText, Database, Search, Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';

// Animated counter hook
function useCounter(end: number, duration: number = 2000, trigger: boolean = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, trigger]);
  return count;
}

const PIPELINE_STEPS = [
  { icon: FileSearch, label: 'Extraction', desc: 'Parsing symptoms & metadata', color: 'text-blue-500', bg: 'bg-blue-500' },
  { icon: CheckCircle2, label: 'Validation', desc: 'Cross-referencing DBs', color: 'text-emerald-500', bg: 'bg-emerald-500' },
  { icon: Brain, label: 'Analysis', desc: 'Multi-model risk assessment', color: 'text-amber-500', bg: 'bg-amber-500' },
  { icon: AlertTriangle, label: 'Alerting', desc: 'Actionable response generation', color: 'text-rose-500', bg: 'bg-rose-500' },
];

export default function Landing() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const agents = useCounter(4, 1500, statsInView);
  const accuracy = useCounter(99, 2000, statsInView);
  const speed = useCounter(2, 1000, statsInView);
  const regions = useCounter(120, 2500, statsInView);

  useEffect(() => {
    api.getHealth().then(() => setHealthOk(true)).catch(() => setHealthOk(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep((s) => (s + 1) % 4), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background bg-opacity-80 backdrop-blur-md border-b border-border border-opacity-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary rounded-lg shadow-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Empowered Care
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Impact', 'How it Works'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-xl">
              {darkMode ? '☀️' : '🌙'}
            </Button>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm" className="rounded-xl px-5 gap-2">
                  Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" className="rounded-xl px-5">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(#808080 1px, transparent 1px), linear-gradient(90deg, #808080 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              style={{ opacity: heroOpacity, scale: heroScale }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500 bg-opacity-10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] border border-primary border-opacity-20">
                  <Zap className="h-3.5 w-3.5" />
                  Multi-Agent AI Surveillance System
                </div>

                <h1 className="text-6xl md:text-7xl xl:text-8xl font-black tracking-tight leading-[0.85] text-balance">
                  Empowered <br />
                  <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                    Care
                  </span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-xl leading-relaxed text-balance">
                  Real-time disease outbreak detection powered by a collaborative
                  <span className="text-foreground font-medium"> multi-agent AI system</span> that
                  extracts, validates, and assesses risk in seconds.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button size="lg" className="rounded-2xl px-8 h-14 text-base font-bold shadow-2xl shadow-primary-30 group">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login">
                    <Button size="lg" className="rounded-2xl px-8 h-14 text-base font-bold shadow-2xl shadow-primary-30 group">
                      Get Started Now
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="rounded-2xl px-8 h-14 text-base font-semibold border-2">
                    See How It Works
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Online
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
                  4 Specialized Agents
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
                  Support All Regions
                </span>
              </div>
            </motion.div>

            {/* Right Side Visual - SaaS Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block relative"
            >
              {/* Main dashboard card */}
              <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-4 h-10 border-b border-border bg-muted">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-auto text-[11px] text-muted-foreground font-medium">Empowered Care — Live Dashboard</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Stat row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Records', value: '48,201', sub: 'Verified across system', color: 'text-primary' },
                      { label: 'Risk Alerts', value: '23', sub: '2 critical', color: 'text-rose-500' },
                      { label: 'Accuracy', value: '99.1%', sub: 'Up 0.3%', color: 'text-emerald-500' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-border bg-background p-3 space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{s.label}</p>
                        <p className={`text-xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bar chart */}
                  <div className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold">Outbreak Detection Timeline</p>
                      <span className="text-[10px] bg-emerald-500 bg-opacity-10 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-500 border-opacity-20">● Live</span>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {[30,50,38,68,42,78,55,88,48,72,62,90].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 rounded-t-sm bg-blue-500 bg-opacity-20 relative"
                          style={{ height: `${h}%` }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.6 + i * 0.04, duration: 0.4, ease: 'easeOut' }}
                        >
                          <div className="absolute bottom-0 inset-x-0 h-2 bg-primary bg-opacity-60 rounded-t-sm" />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Agent pipeline */}
                  <div className="rounded-xl border border-border bg-background p-4 space-y-2.5">
                    <p className="text-xs font-semibold">Agent Pipeline</p>
                    {[
                      { name: 'Data Extraction Agent', status: 'Processing', dotClass: 'bg-primary animate-pulse' },
                      { name: 'Validation Agent', status: 'Verified', dotClass: 'bg-emerald-500' },
                      { name: 'Risk Analysis Agent', status: 'Processing', dotClass: 'bg-primary animate-pulse' },
                      { name: 'Alert Generation Agent', status: 'Standby', dotClass: 'bg-muted-foreground bg-opacity-30' },
                    ].map((a) => (
                      <div key={a.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${a.dotClass}`} />
                          <span className="text-[11px] text-muted-foreground">{a.name}</span>
                        </div>
                        <span className={`text-[10px] font-semibold ${
                          a.status === 'Verified' ? 'text-emerald-500' :
                          a.status === 'Processing' ? 'text-primary' : 'text-muted-foreground'
                        }`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating chips */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-5 -left-6 flex items-center gap-2.5 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-xl"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500 bg-opacity-10 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">Alert Validated</p>
                  <p className="text-[10px] text-muted-foreground">Cholera · Tigray Region</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
                className="absolute -top-5 -right-6 flex items-center gap-2.5 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-xl"
              >
                <Brain className="h-3.5 w-3.5 text-primary" />
                <div>
                  <p className="text-xs font-bold leading-tight">99.1% Confidence</p>
                  <p className="text-[10px] text-muted-foreground">Multi-agent consensus</p>
                </div>
              </motion.div>

            </motion.div>
          </div>
        </div>
      </section>



      {/* ─── Stats Section ─── */}
      <section id="stats" ref={statsRef} className="relative py-20 border-y border-border bg-card bg-opacity-30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Stat 1 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }} className="text-center space-y-2 p-6 rounded-3xl hover:bg-card hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-border">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500 bg-opacity-10 flex items-center justify-center mb-3">
                <Bot className="h-6 w-6 text-primary" strokeWidth={2} />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">{agents}</p>
              <p className="text-sm font-semibold">AI Agents</p>
              <p className="text-xs text-muted-foreground">Working in parallel</p>
            </motion.div>
            {/* Stat 2 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-center space-y-2 p-6 rounded-3xl hover:bg-card hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-border">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500 bg-opacity-10 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-primary" strokeWidth={2} />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">{speed}<span className="text-primary">s</span></p>
              <p className="text-sm font-semibold">Avg Response</p>
              <p className="text-xs text-muted-foreground">End-to-end analysis</p>
            </motion.div>
            {/* Stat 3 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center space-y-2 p-6 rounded-3xl hover:bg-card hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-border">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500 bg-opacity-10 flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-primary" strokeWidth={2} />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">{accuracy}<span className="text-primary">%</span></p>
              <p className="text-sm font-semibold">Accuracy</p>
              <p className="text-xs text-muted-foreground">Validated results</p>
            </motion.div>
            {/* Stat 4 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-center space-y-2 p-6 rounded-3xl hover:bg-card hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 transition-all duration-300 border border-transparent hover:border-border">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500 bg-opacity-10 flex items-center justify-center mb-3">
                <Globe className="h-6 w-6 text-primary" strokeWidth={2} />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">All</p>
              <p className="text-sm font-semibold">Regions</p>
              <p className="text-xs text-muted-foreground">Support All Regions</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Smarter <span className="text-primary">Intelligence</span><br />
              Beyond Automation.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[240px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-6 lg:col-span-6 row-span-2 bg-card border border-border rounded-[2rem] p-8 flex flex-col justify-between group hover:border-primary transition-colors"
            >
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold">Document Digitization</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Transform legacy paper records into high-fidelity structured data. Our Vision-AI handles handwritten notes, diverse layouts, and clinical terminology with expert-level precision.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500 bg-opacity-10 border border-primary border-opacity-10 text-[10px] font-bold uppercase tracking-widest text-primary">OCR Engine</span>
                <span className="px-3 py-1 rounded-full bg-blue-500 bg-opacity-10 border border-primary border-opacity-10 text-[10px] font-bold uppercase tracking-widest text-primary">Vision Transformer</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-3 lg:col-span-3 row-span-1 bg-card border border-border rounded-[2rem] p-6 flex flex-col justify-between group hover:border-primary transition-colors"
            >
              <div className="p-3 bg-emerald-500 bg-opacity-10 rounded-xl w-fit">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-bold text-lg">Multi-Agent Risk</h3>
              <p className="text-sm text-muted-foreground">Collaborative consensus across 4 specialized models.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-3 lg:col-span-3 row-span-1 bg-card border border-border rounded-[2rem] p-6 flex flex-col justify-between group hover:border-primary transition-colors"
            >
              <div className="p-3 bg-blue-500 bg-opacity-10 rounded-xl w-fit">
                <Microscope className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-bold text-lg">Pathogen ID</h3>
              <p className="text-sm text-muted-foreground">Automated identification based on clinical profiles.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-6 lg:col-span-6 row-span-1 bg-card border border-border rounded-[2rem] p-8 flex items-center justify-between group hover:border-primary transition-colors"
            >
              <div className="space-y-2 max-w-[60%]">
                <h3 className="text-2xl font-bold">Real-time Alerting</h3>
                <p className="text-sm text-muted-foreground">Instant SMS & Email escalation to woreda health officers.</p>
              </div>
              <div className="h-full flex items-center">
                 <Zap className="h-16 w-16 text-primary text-opacity-20 group-hover:text-opacity-40 transition-opacity" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Real-World Impact Section ─── */}
      <section id="impact" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 bg-opacity-10 text-accent text-[10px] font-bold uppercase tracking-[0.2em] border border-accent border-opacity-20">
                Performance
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Measurable <span className="text-accent">Impact.</span></h2>
            </div>
            <p className="text-muted-foreground max-w-md text-balance">
              Our network is designed for clinical precision and rapid response, significantly reducing the gap between detection and action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: <Zap className="h-5 w-5 text-blue-500" strokeWidth={2.5} />, title: 'Detection speed', value: '<24h', desc: 'Signal to alert vs weeks legacy' },
              { icon: <Target className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />, title: 'Alert accuracy', value: '70%+', desc: 'Confirmed by health officers' },
              { icon: <Users className="h-5 w-5 text-primary" strokeWidth={2.5} />, title: 'Adoption', value: 'Woreda+', desc: 'Active SMS reporting nodes' },
              { icon: <TrendingDown className="h-5 w-5 text-rose-500" strokeWidth={2.5} />, title: 'False Positives', value: '-40%', desc: 'Reduction via feedback loops' },
              { icon: <Globe className="h-5 w-5 text-amber-500" strokeWidth={2.5} />, title: 'Coverage', value: 'Nationwide', desc: 'Active facilities in Ethiopia' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between hover:border-primary transition-all group"
              >
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-2xl w-fit group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-3xl font-black tracking-tighter">{f.value}</p>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{f.title}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-6 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-32 bg-card bg-opacity-30 border-y border-border overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-16 items-center">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-4xl font-black tracking-tight">The Neural <span className="text-primary">Pipeline</span></h2>
              <p className="text-muted-foreground leading-relaxed">
                Our architecture follows a strictly linear, four-stage verification process ensuring zero-latency intelligence.
              </p>
              <div className="space-y-4">
                 {PIPELINE_STEPS.map((step, i) => {
                   const StepIconSide = step.icon;
                   return (
                     <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${activeStep === i ? 'opacity-100' : 'opacity-40'}`}>
                       <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                         <StepIconSide className={`h-4 w-4 ${step.color}`} strokeWidth={2.5} />
                       </div>
                       <span className="text-sm font-bold">{step.label}</span>
                     </div>
                   );
                 })}
              </div>
            </div>

            <div className="lg:col-span-2 relative">
               <div className="flex flex-col md:flex-row gap-4 relative">
                  {PIPELINE_STEPS.map((step, i) => {
                    const isActive = activeStep === i;
                    const StepIcon = step.icon;
                    return (
                      <motion.div
                        key={step.label}
                        className={`flex-1 bg-card border rounded-2xl p-6 relative transition-all duration-700 ${
                          isActive ? 'border-primary shadow-lg -translate-y-2' : 'border-border'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4">
                          <StepIcon className={`h-5 w-5 ${step.color}`} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-bold mb-2">{step.label}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{step.desc}</p>
                        
                        {isActive && (
                          <motion.div
                            layoutId="pipeline-active-indicator"
                            className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full"
                          />
                        )}
                      </motion.div>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-32 overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-card border border-border border-opacity-20 rounded-[3rem] p-12 md:p-20 text-center space-y-10"
          >
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-black tracking-tight">Ready to <span className="text-primary">Evolve?</span></h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join the most advanced disease surveillance network in East Africa.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                <Button size="lg" className="rounded-2xl px-12 h-16 text-lg font-bold group shadow-2xl shadow-primary shadow-opacity-30">
                  {isAuthenticated ? 'Open Dashboard' : 'Get Started Now'}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl shadow-lg">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl tracking-tight">Empowered Care</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Revolutionizing public health through collaborative AI agents. We provide the intelligence layer for Ethiopia's modern disease surveillance infrastructure.
              </p>
              <div className="flex gap-4">
                {[Globe, Database, Network].map((IconComp, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer">
                    <IconComp className="h-5 w-5" strokeWidth={2} />
                  </div>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Platform</h4>
              <ul className="space-y-4">
                {['Early Warning', 'Agent Insights', 'Risk Maps', 'Case Registry'].map((link) => (
                  <li key={link}>
                    <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">{link}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Company</h4>
              <ul className="space-y-4">
                {['About Us', 'Methodology', 'Ethical AI', 'Partners'].map((link) => (
                  <li key={link}>
                    <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">{link}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Support</h4>
              <ul className="space-y-4">
                {['Documentation', 'API Status', 'Support Center', 'Contact'].map((link) => (
                  <li key={link}>
                    <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">{link}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Status Column */}
            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Live Stats</h4>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-2xl border border-border">
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground mb-1">Regional Coverage</p>
                  <p className="text-lg font-black">All Regions</p>
                </div>
                <div className="p-4 bg-muted rounded-2xl border border-border">
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground mb-1">System Health</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-bold">Optimal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © 2026 Empowered Care. Empowering public health with clinical-grade intelligence.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
              <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
              <div className="px-3 py-1 bg-muted rounded-lg text-[10px] font-black uppercase tracking-widest border border-border">
                V1.0.4-PROD
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
