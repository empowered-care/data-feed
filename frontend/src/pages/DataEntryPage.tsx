import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Upload, FileText, User, MapPin, Stethoscope,
  ActivitySquare, FlaskConical, Loader2, CheckCircle2, AlertCircle,
  UploadCloud, FileUp, RotateCcw, ChevronDown, ChevronUp, X,
  LogOut, History, Eye, Calendar, Hash, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface VitalSigns {
  blood_pressure: string;
  pulse: string;
  temperature: string;
  respiratory_rate: string;
  oxygen_saturation: string;
  weight: string;
  height: string;
}

interface PatientFormData {
  patient_name: string; sex: string; age: string; city: string;
  subcity: string; woreda: string; mrn: string; occupation: string; date: string;
  chief_complaint: string; history: string; physical_exam: string;
  vital_signs: VitalSigns;
  assessment: string; past_medical_history: string; plan: string;
}

const EMPTY_FORM: PatientFormData = {
  patient_name: '', sex: '', age: '', city: '', subcity: '', woreda: '',
  mrn: '', occupation: '', date: '',
  chief_complaint: '', history: '', physical_exam: '',
  vital_signs: { blood_pressure: '', pulse: '', temperature: '', respiratory_rate: '', oxygen_saturation: '', weight: '', height: '' },
  assessment: '', past_medical_history: '', plan: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 mb-2 border-b border-border/50">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// File Upload Tab
// ─────────────────────────────────────────────────────────────────────────────
function FileUploadTab() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.uploadFile(file);
      setResult({ ok: true, data: res });
      toast.success(`✅ "${file.name}" processed successfully.`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Upload failed.';
      setResult({ ok: false, error: msg });
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const formatBytes = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<UploadCloud className="h-5 w-5" />}
        title="Upload Medical File"
        subtitle="Supported: PDF, CSV, XLS/XLSX, JPG, PNG, TXT — processed through the AI pipeline"
      />

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'relative group cursor-pointer rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300',
          file ? 'border-primary/50 bg-primary/5' : 'border-border/50 hover:border-primary/40 hover:bg-primary/3'
        )}
      >
        <input
          ref={fileRef}
          id="portal-file-input"
          type="file"
          className="hidden"
          accept=".pdf,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.txt,.doc,.docx"
          onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setResult(null); } }}
        />
        <motion.div
          animate={loading ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className={cn(
            'mx-auto mb-5 w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
            file ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
          )}
        >
          <FileUp className="h-9 w-9" />
        </motion.div>
        {file ? (
          <div className="space-y-1">
            <p className="font-bold text-lg text-primary truncate max-w-xs mx-auto">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatBytes(file.size)} · Ready to process</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="font-bold text-xl">Drop file here or click to browse</p>
            <p className="text-sm text-muted-foreground">PDF · CSV · XLS/XLSX · JPG · PNG · TXT</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {['PDF', 'CSV', 'XLS', 'XLSX', 'JPG', 'PNG', 'TXT'].map(fmt => (
          <span key={fmt} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-muted/50 border border-border/50 text-muted-foreground">{fmt}</span>
        ))}
      </div>

      <div className="flex gap-3">
        <Button id="portal-upload-btn" onClick={handleUpload} disabled={!file || loading} className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 gap-2">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><Upload className="h-4 w-4" /> Process File</>}
        </Button>
        {file && (
          <Button variant="outline" onClick={() => { setFile(null); setResult(null); }} className="h-12 w-12 rounded-2xl border-2">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={cn('rounded-2xl border p-5 space-y-3', result.ok ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20')}
          >
            <div className={cn('flex items-center gap-2 font-bold text-sm', result.ok ? 'text-emerald-600' : 'text-red-600')}>
              {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {result.ok ? 'File processed successfully' : 'Processing failed'}
            </div>
            {result.ok && result.data?.alert && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><span className="font-bold text-foreground">Alert: </span>{result.data.alert.title}</p>
                <p><span className="font-bold text-foreground">Risk: </span>{result.data.risk_analysis?.risk_level ?? 'N/A'}</p>
                <p><span className="font-bold text-foreground">Location: </span>{result.data.extracted_data?.location ?? 'N/A'}</p>
              </div>
            )}
            {!result.ok && <p className="text-xs text-red-600/80">{result.error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient Form Tab
// ─────────────────────────────────────────────────────────────────────────────
function PatientFormTab({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState<PatientFormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<{ id: string; saved_at: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const set = (field: keyof PatientFormData, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));
  const setVital = (field: keyof VitalSigns, value: string) =>
    setForm(prev => ({ ...prev, vital_signs: { ...prev.vital_signs, [field]: value } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_name.trim()) { toast.error('Patient name is required.'); return; }
    setLoading(true); setSaved(null);
    try {
      const vitals = Object.fromEntries(Object.entries(form.vital_signs).filter(([, v]) => v.trim() !== ''));
      const payload = { ...form, vital_signs: Object.keys(vitals).length > 0 ? vitals : undefined };
      const cleaned = Object.fromEntries(Object.entries(payload).filter(([k, v]) =>
        k === 'vital_signs' ? v !== undefined : typeof v !== 'string' || v.trim() !== ''
      ));
      const res = await api.savePatientRecord(cleaned as any);
      setSaved({ id: res.id, saved_at: res.saved_at });
      toast.success(`✅ Record saved for ${res.patient_name}${res.mrn ? ` (MRN: ${res.mrn})` : ''}`);
      setForm(EMPTY_FORM);
      setCurrentStep(1);
      onSaved(); // refresh history tab
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save record.');
    } finally { setLoading(false); }
  };

  const iClass = 'h-11 rounded-xl border-border/60 bg-background/50 focus:ring-2 focus:ring-primary/20 transition-all';
  const tClass = 'rounded-xl border-border/60 bg-background/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none';

  const steps = [
    { title: 'Personal Info', icon: <User className="h-4 w-4" /> },
    { title: 'Clinical History', icon: <Stethoscope className="h-4 w-4" /> },
    { title: 'Diagnosis & Plan', icon: <FlaskConical className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-8">
        {steps.map((step, i) => {
          const num = i + 1;
          const isActive = currentStep === num;
          const isDone = currentStep > num;
          return (
            <div key={num} className="flex flex-col items-center gap-2 flex-1 relative">
              {/* Connector Line */}
              {i > 0 && (
                <div className={cn(
                  "absolute right-[50%] top-5 w-full h-0.5 -translate-y-1/2 -z-10 transition-colors duration-300",
                  currentStep >= num ? "bg-primary" : "bg-border"
                )} />
              )}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isActive ? "bg-primary border-primary text-white shadow-lg shadow-primary/30" : 
                isDone ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground"
              )}>
                {isDone ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>{step.title}</span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              {/* Demographics */}
              <div className="space-y-5">
                <SectionHeader icon={<User className="h-5 w-5" />} title="Patient Demographics" subtitle="Identity and demographic details" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-1.5">
                    <Label htmlFor="pf-name" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Patient Name <span className="text-red-500">*</span>
                    </Label>
                    <Input id="pf-name" value={form.patient_name} onChange={e => set('patient_name', e.target.value)} placeholder="Full name" className={iClass} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-sex" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sex</Label>
                    <select id="pf-sex" value={form.sex} onChange={e => set('sex', e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border/60 bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  {[['pf-age', 'age', 'Age', 'e.g. 34 years'], ['pf-mrn', 'mrn', 'MRN', 'Medical Record Number'],
                    ['pf-occupation', 'occupation', 'Occupation', 'e.g. Farmer']].map(([id, field, label, ph]) => (
                    <div key={id} className="space-y-1.5">
                      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
                      <Input id={id} value={form[field as keyof PatientFormData] as string}
                        onChange={e => set(field as keyof PatientFormData, e.target.value)} placeholder={ph} className={iClass} />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-date" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date of Visit</Label>
                    <Input id="pf-date" type="date" value={form.date} onChange={e => set('date', e.target.value)} className={iClass} />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-5">
                <SectionHeader icon={<MapPin className="h-5 w-5" />} title="Location" subtitle="Residential area information" />
                <div className="grid sm:grid-cols-3 gap-4">
                  {[['pf-city','city','City','e.g. Addis Ababa'], ['pf-subcity','subcity','Subcity','e.g. Bole'], ['pf-woreda','woreda','Woreda','e.g. Woreda 03']].map(([id, field, label, ph]) => (
                    <div key={id} className="space-y-1.5">
                      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
                      <Input id={id} value={form[field as keyof PatientFormData] as string}
                        onChange={e => set(field as keyof PatientFormData, e.target.value)} placeholder={ph} className={iClass} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              {/* Clinical */}
              <div className="space-y-5">
                <SectionHeader icon={<Stethoscope className="h-5 w-5" />} title="Clinical History" subtitle="Complaint and detailed history" />
                <div className="space-y-1.5">
                  <Label htmlFor="pf-cc" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Chief Complaint</Label>
                  <Input id="pf-cc" value={form.chief_complaint} onChange={e => set('chief_complaint', e.target.value)} placeholder="Primary reason for visit" className={iClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-history" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">History of Presenting Illness</Label>
                  <Textarea id="pf-history" value={form.history} onChange={e => set('history', e.target.value)} rows={6}
                    placeholder="Onset, duration, progression, associated symptoms..." className={tClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pf-exam" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Physical Examination Findings</Label>
                  <Textarea id="pf-exam" value={form.physical_exam} onChange={e => set('physical_exam', e.target.value)} rows={6}
                    placeholder="General appearance, vitals, systems review, positive findings..." className={tClass} />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              {/* Vital Signs (Fixed inside step 3) */}
              <div className="space-y-5">
                <SectionHeader icon={<ActivitySquare className="h-5 w-5" />} title="Vital Signs" subtitle="Current measurements" />
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-2xl border border-border/50">
                  {([
                    ['blood_pressure', 'BP', '120/80 mmHg'],
                    ['pulse', 'Pulse', '72 bpm'],
                    ['temperature', 'Temp', '36.6 °C'],
                    ['respiratory_rate', 'Resp.', '18 /min'],
                    ['oxygen_saturation', 'O₂ Sat.', '98%'],
                    ['weight', 'Weight', '70 kg'],
                    ['height', 'Height', '175 cm'],
                  ] as const).map(([field, label, ph]) => (
                    <div key={field} className="space-y-1.5">
                      <Label htmlFor={`pf-vital-${field}`} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
                      <Input id={`pf-vital-${field}`} value={form.vital_signs[field]} onChange={e => setVital(field, e.target.value)} placeholder={ph} className={iClass} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment + PMH + Plan */}
              <div className="space-y-5">
                <SectionHeader icon={<FlaskConical className="h-5 w-5" />} title="Assessment & Management Plan" subtitle="Diagnosis and treatment" />
                {[
                  ['pf-assessment', 'assessment', 'Assessment / Diagnosis', 'Working diagnosis, differentials...', 4],
                  ['pf-pmh', 'past_medical_history', 'Past Medical History', 'Previous conditions, surgeries, allergies...', 4],
                  ['pf-plan', 'plan', 'Plan', 'Treatment, investigations, referrals, follow-up...', 4],
                ].map(([id, field, label, ph, rows]) => (
                  <div key={id as string} className="space-y-1.5">
                    <Label htmlFor={id as string} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label as string}</Label>
                    <Textarea id={id as string} value={form[field as keyof PatientFormData] as string}
                      onChange={e => set(field as keyof PatientFormData, e.target.value)}
                      rows={rows as number} placeholder={ph as string} className={tClass} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={() => setCurrentStep(s => s - 1)} className="h-12 rounded-2xl gap-2 font-bold group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => { setForm(EMPTY_FORM); setSaved(null); setCurrentStep(1); }}
              className="h-12 rounded-2xl text-muted-foreground hover:text-red-500 font-bold gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>

          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button type="button" onClick={() => setCurrentStep(s => s + 1)} className="h-12 rounded-2xl w-40 font-bold gap-2 shadow-lg shadow-primary/20 group">
                Next <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button id="portal-save-record-btn" type="submit" disabled={loading || !form.patient_name.trim()}
                className="h-12 rounded-2xl px-8 font-bold shadow-lg shadow-primary/20 gap-2">
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</> : <><ClipboardList className="h-5 w-5" /> Submit Record</>}
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {saved && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Record saved successfully</p>
                <p className="text-xs text-muted-foreground mt-1">ID: <span className="font-mono">{saved.id}</span> · {new Date(saved.saved_at).toLocaleString()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My Records Tab
// ─────────────────────────────────────────────────────────────────────────────
function MyRecordsTab({ refreshKey }: { refreshKey: number }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getPatientRecords()
      .then(res => setRecords(res.records))
      .catch(() => toast.error('Failed to load records.'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading your records...
    </div>
  );

  if (records.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <History className="h-12 w-12 opacity-20" />
      <p className="font-semibold">No records saved yet</p>
      <p className="text-sm">Records you enter will appear here.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{records.length} record{records.length !== 1 ? 's' : ''} saved by you</p>
      {records.map(r => (
        <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/50 overflow-hidden bg-card/40">
          <button type="button" onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{r.patient_name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {r.mrn && <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" />{r.mrn}</span>}
                  {r.date && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{r.date}</span>}
                  {r.city && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <span className="text-[10px] text-muted-foreground hidden sm:block">{new Date(r.saved_at).toLocaleString()}</span>
              {expanded === r.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </div>
          </button>

          <AnimatePresence>
            {expanded === r.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border/50">
                <div className="p-5 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {[
                    ['Sex', r.sex], ['Age', r.age], ['Occupation', r.occupation],
                    ['City', r.city], ['Subcity', r.subcity], ['Woreda', r.woreda],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k as string}><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{k as string}: </span><span>{v as string}</span></div>
                  ))}
                  {r.chief_complaint && <div className="sm:col-span-2"><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Chief Complaint: </span><span>{r.chief_complaint}</span></div>}
                  {r.assessment && <div className="sm:col-span-2"><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Assessment: </span><span>{r.assessment}</span></div>}
                  {r.plan && <div className="sm:col-span-2"><span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Plan: </span><span>{r.plan}</span></div>}
                  {r.vital_signs && Object.keys(r.vital_signs).length > 0 && (
                    <div className="sm:col-span-2 pt-2 border-t border-border/30">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Vital Signs</p>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(r.vital_signs).map(([k, v]) => (
                          <span key={k} className="text-xs px-2 py-1 rounded-lg bg-muted/50 border border-border/50">
                            <span className="font-bold">{k.replace(/_/g,' ')}: </span>{v as string}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function DataEntryPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/3">
      {/* Portal Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">Patient Data Entry Portal</h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Empowered Care</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 max-w-[160px] truncate">
                {user?.full_name || user?.email}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground text-xs font-bold gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Medical Data Entry</h2>
            <p className="text-muted-foreground mt-1">
              Manually fill the patient form, upload a file, or review records you've previously entered.
            </p>
          </div>

          <Tabs defaultValue="form" className="space-y-6">
            <TabsList className="grid grid-cols-3 h-auto p-1.5 bg-muted/30 border border-border/50 rounded-2xl w-full max-w-lg">
              <TabsTrigger value="form" className="gap-1.5 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                <FileText className="h-4 w-4" /> Patient Form
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1.5 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                <Upload className="h-4 w-4" /> File Upload
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
                <History className="h-4 w-4" /> My Records
              </TabsTrigger>
            </TabsList>

            <div className="bg-card border border-border/50 rounded-3xl shadow-xl p-8">
              <TabsContent value="form" className="mt-0">
                <PatientFormTab onSaved={() => setRecordsRefreshKey(k => k + 1)} />
              </TabsContent>
              <TabsContent value="upload" className="mt-0">
                <FileUploadTab />
              </TabsContent>
              <TabsContent value="history" className="mt-0">
                <MyRecordsTab refreshKey={recordsRefreshKey} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
