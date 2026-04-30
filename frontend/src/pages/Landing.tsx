import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Zap, Users, ArrowRight, CheckCircle2, LogIn,
  Brain, FileSearch, AlertTriangle, BarChart3, Bot, Clock, Cpu,
  Globe, HeartPulse, Microscope, Stethoscope, TrendingUp, Target, TrendingDown,
  ChevronRight, Database, Search, FileText, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';

// --- Sub-components for a more professional feel ---

function AppMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto lg:mx-0">
      {/* Decorative background glow */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 blur-2xl rounded-[2rem] opacity-50 dark:opacity-30" />
      
      {/* Main Window Frame */}
      <div className="relative bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col aspect-[4/3]">
        {/* Window Header */}
        <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-health/40" />
          </div>
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Empowered Care v1.0</div>
          <div className="w-12" /> {/* Spacer */}
        </div>

        {/* Window Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Mockup */}
          <div className="w-16 border-r border-border bg-muted/10 flex flex-col items-center py-4 gap-4">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center"><Search className="h-4 w-4 text-primary" /></div>
            <div className="w-8 h-8 rounded bg-muted/40 flex items-center justify-center"><Database className="h-4 w-4 text-muted-foreground" /></div>
            <div className="w-8 h-8 rounded bg-muted/40 flex items-center justify-center"><Users className="h-4 w-4 text-muted-foreground" /></div>
            <div className="mt-auto w-8 h-8 rounded bg-muted/40 flex items-center justify-center"><Lock className="h-4 w-4 text-muted-foreground" /></div>
          </div>

          {/* Main Dashboard Content Mockup */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex justify-between items-end">
              <div className="space-y-1.5">
                <div className="h-3 w-32 bg-foreground/10 rounded-full" />
                <div className="h-2 w-20 bg-muted-foreground/20 rounded-full" />
              </div>
              <div className="h-8 w-24 bg-primary rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center">
                <div className="w-12 h-1.5 bg-primary-foreground/30 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 rounded-xl border border-border bg-muted/5 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="w-8 h-2 bg-primary/20 rounded-full" />
                  <Activity className="h-3 w-3 text-primary/40" />
                </div>
                <div className="h-5 w-16 bg-foreground/10 rounded-md" />
                <div className="h-1.5 w-full bg-muted/40 rounded-full" />
              </div>
              <div className="h-24 rounded-xl border border-border bg-muted/5 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="w-8 h-2 bg-health/20 rounded-full" />
                  <Target className="h-3 w-3 text-health/40" />
                </div>
                <div className="h-5 w-16 bg-foreground/10 rounded-md" />
                <div className="h-1.5 w-full bg-muted/40 rounded-full" />
              </div>
            </div>

            {/* List Mockup */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50">
                  <div className="w-9 h-9 rounded-lg bg-muted/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 w-3/4 bg-muted-foreground/20 rounded-full" />
                    <div className="h-1.5 w-1/2 bg-muted-foreground/10 rounded-full" />
                  </div>
                  <div className="px-2 py-1 rounded-full bg-health/10 border border-health/20">
                    <div className="w-8 h-1 bg-health/40 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Badge Mockup */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-6 top-1/4 glass-card p-4 rounded-xl shadow-xl space-y-2 max-w-[180px]"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-health animate-pulse" />
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Live Detection</span>
        </div>
        <p className="text-xs font-semibold">New Signal: Amhara Region</p>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <motion.div 
            animate={{ width: ["0%", "100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="h-full bg-primary" 
          />
        </div>
      </motion.div>
    </div>
  );
}

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
  { icon: FileSearch, label: 'Intake & Parsing', desc: 'AI agent digitizes unstructured medical reports with 99% accuracy.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: CheckCircle2, label: 'Epidemiological Validation', desc: 'Real-time cross-referencing with global disease databases.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Brain, label: 'Risk Synthesis', desc: 'Multi-agent consensus identifies outbreak probability and severity.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: AlertTriangle, label: 'Actionable Alerts', desc: 'Immediate notification with localized prevention strategies.', color: 'text-rose-500', bg: 'bg-rose-500/10' },
];

export default function Landing() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const [healthOk, setHealthOk] = useState<boolean | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const agents = useCounter(4, 1500);
  const accuracy = useCounter(99, 2000);
  const latency = useCounter(2, 1000);
  const records = useCounter(1250, 2500);

  useEffect(() => {
    api.getHealth().then(() => setHealthOk(true)).catch(() => setHealthOk(false));
    const timer = setInterval(() => setActiveStep((s) => (s + 1) % 4), 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* --- Header --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Empowered Care
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {['Capabilities', 'Intelligence', 'Infrastructure', 'Stats'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9 rounded-full">
              {darkMode ? <span className="text-sm">☀️</span> : <span className="text-sm">🌙</span>}
            </Button>
            <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="default" className="rounded-full px-6 shadow-md shadow-primary/10">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline" className="rounded-full px-6 group hover:bg-muted">
                  Sign In <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
            className="space-y-10"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest"
              >
                <Activity className="h-3.5 w-3.5" />
                Production Ready Surveillance
              </motion.div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1]">
                Digitize clinical records at <span className="text-primary italic">AI scale.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                A specialized multi-agent system built to transform unstructured medical data into 
                actionable outbreak intelligence within seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                <Button size="lg" className="h-14 px-10 rounded-full text-base font-bold shadow-xl shadow-primary/20 group">
                  Get Started <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="h-14 px-8 rounded-full text-base font-semibold">
                View Documentation
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-border/50 w-fit">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                    <Users className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground font-bold font-mono">200+</span> healthcare professionals using EC
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
          >
            <AppMockup />
          </motion.div>
        </div>

        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/3" />
      </section>

      {/* --- Trusted By / Partners --- */}
      <section className="py-12 border-y border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center text-muted-foreground mb-8">
            Infrastructural Partners & Data Sources
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale contrast-125">
             <div className="flex items-center gap-2"><Globe className="h-5 w-5" /> <span className="font-bold tracking-tighter text-lg">WHO-DHIS2</span></div>
             <div className="flex items-center gap-2"><Shield className="h-5 w-5" /> <span className="font-bold tracking-tighter text-lg">ETH-CDC</span></div>
             <div className="flex items-center gap-2"><Activity className="h-5 w-5" /> <span className="font-bold tracking-tighter text-lg">MINISTRY_OF_HEALTH</span></div>
             <div className="flex items-center gap-2"><Cpu className="h-5 w-5" /> <span className="font-bold tracking-tighter text-lg">HUGGINGFACE</span></div>
          </div>
        </div>
      </section>

      {/* --- Intelligence / Features --- */}
      <section id="capabilities" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Designed for <br />
                <span className="text-primary">Medical Experts.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our platform bridges the gap between field-level manual reporting and 
                centralized digital intelligence.
              </p>
              <div className="pt-6 space-y-4">
                {[
                  'YOLO Layout Detection for clinical forms',
                  'Gemini Vision for handwritten notes',
                  'Multi-model consensus for risk scoring',
                  'HIPAA-compliant data encryption'
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 p-0.5 rounded-full bg-health/20 text-health">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {[
                { icon: Stethoscope, title: 'Record Digitization', desc: 'Transform scans into searchable data with surgical precision.' },
                { icon: Brain, title: 'Probabilistic Diagnosis', desc: 'Identify likely pathogens based on symptom clusters and regional trends.' },
                { icon: Target, title: 'Geospatial Hotspots', desc: 'Map outbreak origins with pinpoint accuracy using temporal data.' },
                { icon: HeartPulse, title: 'Resource Allocation', desc: 'Predict equipment needs before an outbreak escalates.' }
              ].map((f) => (
                <div key={f.title} className="p-8 border border-border/60 bg-card rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                    <f.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Pipeline Visualization --- */}
      <section id="infrastructure" className="py-32 bg-muted/30 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-20">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">The Analysis Pipeline</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Every data point flows through four specialized AI layers to ensure 
              unparalleled accuracy and speed.
            </p>
          </div>

          <div className="relative grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border hidden md:block -translate-y-12" />
            
            {PIPELINE_STEPS.map((step, i) => {
              const isActive = activeStep === i;
              return (
                <div key={step.label} className="relative z-10 space-y-6">
                  <motion.div 
                    animate={isActive ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                    className={`w-16 h-16 mx-auto rounded-2xl border-4 border-background flex items-center justify-center transition-colors shadow-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
                  >
                    <step.icon className="h-7 w-7" />
                  </motion.div>
                  <div className="space-y-2">
                    <h4 className={`font-bold transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed px-4">
                      {step.desc}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div layoutId="pipeline-indicator" className="h-1 w-12 bg-primary mx-auto rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Stats --- */}
      <section id="stats" className="py-32 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-20">
            {[
              { label: 'AI Sub-Agents', value: agents, suffix: '', desc: 'Parallel processing' },
              { label: 'Extraction Accuracy', value: accuracy, suffix: '%', desc: 'Against manual entry' },
              { label: 'System Latency', value: latency, suffix: 's', desc: 'Average end-to-end' },
              { label: 'Records Analyzed', value: records, suffix: '+', desc: 'Across 12 regions' }
            ].map((stat) => (
              <div key={stat.label} className="space-y-3">
                <div className="text-4xl lg:text-5xl font-black font-mono tracking-tighter">
                  {stat.value}{stat.suffix}
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold uppercase tracking-widest text-primary">{stat.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{stat.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Final CTA --- */}
      <section className="py-32 bg-primary text-primary-foreground overflow-hidden relative">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10 relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Empower your response team with <br className="hidden md:block" />
            real-time digital intelligence.
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Scale your outbreak detection capabilities from weeks to seconds. 
            Join the national surveillance network today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              <Button size="lg" variant="secondary" className="h-14 px-10 rounded-full text-base font-bold shadow-2xl">
                Create Organization Account
              </Button>
            </Link>
            <Button size="lg" variant="ghost" className="h-14 px-10 rounded-full text-base font-semibold border border-primary-foreground/20 hover:bg-primary-foreground/10">
              Contact Support
            </Button>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary rounded">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">Empowered Care</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">API Docs</a>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-muted rounded-full">
                <div className={`w-1.5 h-1.5 rounded-full ${healthOk ? 'bg-health' : 'bg-risk-high'} animate-pulse`} />
                {healthOk ? 'Systems Operational' : 'Offline'}
             </div>
             <span className="text-[10px] font-medium text-muted-foreground">© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
