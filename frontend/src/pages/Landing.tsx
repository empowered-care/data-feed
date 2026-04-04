import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield, Activity, Zap, Users, ArrowRight, CheckCircle2, LogIn,
  Brain, FileSearch, AlertTriangle, BarChart3, Bot, Clock, Cpu,
  Globe, HeartPulse, Microscope, Stethoscope, TrendingUp, Target, TrendingDown,
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

// Floating particle component
function FloatingParticle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-primary/20 blur-sm"
      style={{ left: x, top: y, width: size, height: size }}
      animate={{
        y: [-20, 20, -20],
        x: [-10, 10, -10],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 6 + Math.random() * 4,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

const PIPELINE_STEPS = [
  { icon: FileSearch, label: 'Data Extraction', desc: 'NLP agent parses symptoms, locations & case data', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: CheckCircle2, label: 'Validation', desc: 'Cross-references with epidemiological databases', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: Brain, label: 'Risk Analysis', desc: 'Multi-model consensus on threat severity', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: AlertTriangle, label: 'Alert Generation', desc: 'Actionable alerts with prevention strategies', color: 'text-rose-500', bg: 'bg-rose-500/10' },
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

  const agents = useCounter(4, 1500);
  const accuracy = useCounter(99, 2000);
  const speed = useCounter(2, 1000);
  const regions = useCounter(120, 2500);

  useEffect(() => {
    api.getHealth().then(() => setHealthOk(true)).catch(() => setHealthOk(false));
  }, []);

  // Animate pipeline preview
  useEffect(() => {
    const timer = setInterval(() => setActiveStep((s) => (s + 1) % 4), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary rounded-lg shadow-lg shadow-primary/20">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Empowered Care</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1">
              {['Features', 'How it Works', 'Stats'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s/g, '-')}`}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8">
              {darkMode ? <span className="text-sm">☀️</span> : <span className="text-sm">🌙</span>}
            </Button>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
                  Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" className="gap-2 shadow-lg shadow-primary/20">
                  <LogIn className="h-3.5 w-3.5" /> Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section ref={heroRef} className="relative min-h-[100vh] flex items-center justify-center pt-16 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
          {/* Floating particles */}
          <FloatingParticle delay={0} x="15%" y="20%" size={8} />
          <FloatingParticle delay={1} x="80%" y="15%" size={6} />
          <FloatingParticle delay={2} x="70%" y="60%" size={10} />
          <FloatingParticle delay={0.5} x="25%" y="70%" size={7} />
          <FloatingParticle delay={1.5} x="90%" y="40%" size={5} />
          <FloatingParticle delay={3} x="10%" y="50%" size={9} />
          <FloatingParticle delay={2.5} x="50%" y="80%" size={6} />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(var(--primary-rgb, 37 99 235), 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--primary-rgb, 37 99 235), 0.5) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20 backdrop-blur-sm"
            >
              <Zap className="h-4 w-4" />
              Multi-Agent AI Surveillance System
            </motion.div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.9]">
              <span className="block">Empowered</span>
              <span className="block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Care
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Real-time disease outbreak detection powered by a collaborative
              <span className="text-foreground font-medium"> multi-agent AI system</span> that
              extracts, validates, and assesses risk in seconds.
            </p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            >
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">
                    <Button size="lg" className="gap-2 px-8 h-12 text-base font-semibold shadow-xl shadow-primary/25 group">
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/process">
                    <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base">
                      Process a Report
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button size="lg" className="gap-2 px-8 h-12 text-base font-semibold shadow-xl shadow-primary/25 group">
                      Get Started Free
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base">
                      See How It Works
                    </Button>
                  </a>
                </>
              )}
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-4 pt-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm text-sm">
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthOk === null ? 'bg-muted-foreground animate-pulse' : healthOk ? 'bg-health animate-pulse' : 'bg-risk-high'
                  }`}
                />
                {healthOk === null ? 'Connecting...' : healthOk ? 'All Systems Operational' : 'API Offline'}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
            />
          </div>
        </motion.div>
      </section>

      {/* ─── Stats Section ─── */}
      <section id="stats" className="relative py-20 border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: agents, suffix: '', label: 'AI Agents', icon: Bot, desc: 'Working in parallel' },
              { value: speed, suffix: 's', label: 'Avg Response', icon: Clock, desc: 'End-to-end analysis' },
              { value: accuracy, suffix: '%', label: 'Accuracy', icon: TrendingUp, desc: 'Validated results' },
              { value: regions, suffix: '+', label: 'Regions', icon: Globe, desc: 'Ethiopian coverage' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-2"
              >
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
                  {stat.value}<span className="text-primary">{stat.suffix}</span>
                </p>
                <p className="text-sm font-semibold">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Cpu className="h-3.5 w-3.5" /> Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Everything you need for<br />
              <span className="text-primary">outbreak surveillance</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From raw field reports to actionable intelligence — our autonomous agents handle the entire pipeline.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Stethoscope, title: 'Medical Record Digitization', desc: 'Upload handwritten or scanned medical records. YOLO layout detection + Gemini Vision extracts structured data automatically.', tag: 'Document AI' },
              { icon: Activity, title: 'Real-time Data Extraction', desc: 'NLP agents parse symptoms, affected populations, locations, and temporal data from unstructured outbreak reports.', tag: 'AI Agent' },
              { icon: Microscope, title: 'Disease Identification', desc: 'Cross-references extracted data against known disease profiles to identify the most probable pathogen.', tag: 'Analysis' },
              { icon: BarChart3, title: 'Risk Scoring & Consensus', desc: 'Multiple AI models independently assess threat level. A consensus mechanism ensures reliable risk classification.', tag: 'Multi-Agent' },
              { icon: HeartPulse, title: 'Automated Alerts', desc: 'Generates actionable alerts with prevention strategies, transmission analysis, and urgency assessment.', tag: 'Response' },
              { icon: Users, title: 'Human-in-the-Loop', desc: 'High-risk alerts are flagged for expert validation. Admins approve or reject before escalation.', tag: 'Governance' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6 space-y-4 group hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Real-World Impact Section ─── */}
      <section id="impact" className="py-20 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <TrendingUp className="h-3.5 w-3.5" /> Performance Metrics
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Real-world <span className="text-primary">Impact</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Measuring our success by the speed and accuracy of our response network.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: 'Detection speed', desc: 'Signal → alert in <24h (vs weeks today)', tag: 'Speed' },
              { icon: Target, title: 'Alert accuracy', desc: '>70% confirmed by officers', tag: 'Precision' },
              { icon: Users, title: 'Adoption', desc: 'Active SMS reporters per woreda per week', tag: 'Network' },
              { icon: TrendingDown, title: 'False positive rate', desc: 'Decreasing over time via feedback learning', tag: 'Learning' },
              { icon: Globe, title: 'Coverage', desc: '% of health facilities with active digital reporting', tag: 'Reach' },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6 space-y-4 group hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works (Pipeline) ─── */}
      <section id="how-it-works" className="py-24 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" /> Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              How the <span className="text-primary">AI agents</span> work together
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Four specialized agents process every report in parallel, then reach consensus on the final risk assessment.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4">
            {PIPELINE_STEPS.map((step, i) => {
              const isActive = activeStep === i;
              const isCompleted = activeStep > i;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl p-6 border-2 transition-all duration-500 ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]'
                      : isCompleted
                      ? 'border-health/30 bg-health/5'
                      : 'border-border bg-card'
                  }`}
                >
                  {/* Step number */}
                  <div className={`absolute -top-3 left-5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-health text-health-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? '✓' : `0${i + 1}`}
                  </div>

                  {/* Connector line */}
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border z-10">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: isCompleted ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}

                  <div className={`p-2.5 rounded-xl ${step.bg} w-fit mt-2 mb-3`}>
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>
                  <h3 className="font-bold mb-1">{step.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>

                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2.8, ease: 'linear' }}
                      className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6bTAtNHYySDI0di0yaDEyem0wLTR2Mkgydi0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

            <div className="relative z-10 p-10 sm:p-16 text-center text-white space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Ready to detect outbreaks faster?
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto">
                Join the AI-powered surveillance network. Process your first outbreak report in under 2 seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link to={isAuthenticated ? '/dashboard' : '/login'}>
                  <Button size="lg" variant="secondary" className="gap-2 px-8 h-12 text-base font-semibold group shadow-xl">
                    {isAuthenticated ? 'Open Dashboard' : 'Get Started Now'}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-primary rounded-md">
              <Shield className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Empowered Care</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © 2026 Empowered Care. AI-Powered Disease Surveillance Platform.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-health animate-pulse" />
            v1.0.0
          </div>
        </div>
      </footer>
    </div>
  );
}
