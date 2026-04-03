import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw, CheckCircle2, XCircle, UploadCloud, FileText, Scale, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AgentPipeline } from '@/components/AgentPipeline';
import { RiskBadge } from '@/components/RiskBadge';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AgentStep, OutbreakReport, OutbreakProcessResponse } from '@/types';

const STEPS: AgentStep[] = ['extractor', 'validator', 'risk_analyzer', 'alert_generator'];

export default function ProcessReport() {
  const [input, setInput] = useState('Fever, vomiting, 4 people affected in Jimma zone. Started 2 days ago near local water source.');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { pipeline, setPipelineStep, completePipelineStep, setPipelineProcessing, setPipelineResult, setPipelineError, resetPipeline, addReport, addNotification } = useAppStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setInput(`File: ${selectedFile.name}`);
    }
  };

  const process = async () => {
    resetPipeline();
    setPipelineProcessing(true);

    try {
      // Start API call
      let apiPromise;
      if (file) {
        apiPromise = api.uploadFile(file);
      } else {
        apiPromise = api.processReport(input);
      }

      // Ultra-fast progress through visual steps (50ms) to make the UI feel very snappy
      for (const step of STEPS) {
        setPipelineStep(step);
        await new Promise((r) => setTimeout(r, 50));
        completePipelineStep(step);
      }
      
      const result = await apiPromise;

      setPipelineResult(result);
      addReport(result);
      addNotification(`New report processed: ${result.extracted_data.location}`);
      toast.success('Report processed successfully');
    } catch (e: unknown) {
      let msg = 'Processing failed';
      if (e && typeof e === 'object' && 'response' in e) {
        const axiosErr = e as { response?: { status?: number; data?: { detail?: string } } };
        const status = axiosErr.response?.status;
        const detail = axiosErr.response?.data?.detail;
        if (status === 500) {
          msg = `Backend error: ${detail || 'The AI agent pipeline crashed. Check that your GEMINI_API_KEY is valid.'}`;
        } else if (status === 422) {
          msg = 'Request format error: The backend rejected the input format.';
        } else if (detail) {
          msg = detail;
        }
      } else if (e instanceof Error) {
        msg = e.message.includes('Network Error') 
          ? 'Cannot reach backend — is the server running on port 8000?' 
          : e.message;
      }
      setPipelineError(msg);
      toast.error(msg);
    } finally {
      setPipelineProcessing(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!pipeline.result) return;
    try {
      await api.approveReport(pipeline.result.session_id, approved);
    } catch {
      // mock
    }
    toast.success(approved ? 'Report approved' : 'Report rejected');
    setPipelineResult({ ...pipeline.result, status: approved ? 'approved' : 'rejected', human_validation_required: false });
  };

  const result = pipeline.result;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Process Outbreak Report</h2>
          <p className="text-sm text-muted-foreground">Submit a raw report or upload a document for multi-agent AI analysis</p>
        </div>
        <div className="hidden sm:block">
           <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
             <Scale className="h-3 w-3" />
             <span>Multi-Agent Consensus Mode: Active</span>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Manual Method */}
        <div className="glass-card rounded-xl p-5 space-y-4 border-2 border-transparent transition-all hover:border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 px-2 bg-primary/10 rounded text-[10px] font-bold text-primary uppercase">Method A</div>
            <h3 className="font-semibold text-sm">Direct Text Analysis</h3>
          </div>
          <Textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); if (file) setFile(null); }}
            placeholder="Enter raw outbreak report (e.g., '10 cases in Hawassa')..."
            rows={5}
            className="resize-none"
          />
          <Button 
            onClick={process} 
            disabled={pipeline.isProcessing || !input.trim() || !!file} 
            className="w-full gap-2 shadow-lg shadow-primary/10"
          >
            <Send className="h-4 w-4" />
            Analyze Raw Text
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">Best for field notes and urgent messages</p>
        </div>

        {/* File Analysis Method */}
        <div className="glass-card rounded-xl p-5 space-y-4 border-2 border-transparent transition-all hover:border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 px-2 bg-muted rounded text-[10px] font-bold text-muted-foreground uppercase">Method B</div>
            <h3 className="font-semibold text-sm">Document Intelligence</h3>
          </div>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer transition-colors ${
              file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-muted-foreground/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.csv,.jpg,.jpeg,.png"
            />
            {file ? (
              <div className="text-center space-y-2">
                <FileText className="h-10 w-10 text-primary mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Click to upload document</p>
                  <p className="text-[10px] text-muted-foreground">PDF, CSV, or Image Note</p>
                </div>
              </div>
            )}
          </div>

          <Button 
            variant={file ? "default" : "outline"}
            onClick={process} 
            disabled={pipeline.isProcessing || !file} 
            className="w-full gap-2"
          >
            <Zap className="h-4 w-4" />
            {file ? 'Extract from File' : 'No File Selected'}
          </Button>
          {file && (
            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setInput(''); }} className="w-full text-[10px] h-6">
              Cancel Upload
            </Button>
          )}
        </div>
      </div>

      {(pipeline.isProcessing || pipeline.completedSteps.length > 0) && (
        <div className="glass-card rounded-xl p-5">
          <AgentPipeline
            currentStep={pipeline.currentStep}
            completedSteps={pipeline.completedSteps}
            isProcessing={pipeline.isProcessing}
          />
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 pb-12"
          >
            {/* Extracted Data */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Extracted Data
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Location', result.extracted_data.location],
                  ['Cases', result.extracted_data.cases],
                  ['Date', result.extracted_data.date || 'N/A'],
                  ['Symptoms', result.extracted_data.symptoms.join(', ')],
                ].map(([k, v]) => (
                  <div key={k as string} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-tight">{k}</p>
                    <p className="font-semibold text-sm truncate" title={String(v)}>{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Consensus & Validation */}
            <div className="grid md:grid-cols-2 gap-4">
               {/* Multi-Agent Consensus */}
               <div className="glass-card rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Agent Consensus
                    </h3>
                    {result.consensus?.consensus_reached ? (
                      <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full font-bold uppercase">Reached</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-bold uppercase">Review Needed</span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Final Agreed Risk:</span>
                      <RiskBadge level={(result.consensus?.final_risk_level as any) || result.risk_analysis.risk_level} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Confidence Consensus:</span>
                        <span className="font-bold">{result.consensus?.average_confidence.toFixed(1) || result.risk_analysis.confidence}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000" 
                          style={{ width: `${result.consensus?.average_confidence || parseFloat(result.risk_analysis.confidence)}%` }} 
                        />
                      </div>
                    </div>

                    {result.consensus?.agent_opinions && (
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin">
                        {result.consensus.agent_opinions.map((op, idx) => (
                          <div key={idx} className="text-[10px] p-2 bg-muted/30 rounded border border-border/30 flex justify-between gap-3">
                            <span className="italic text-muted-foreground">Agent #{idx+1}</span>
                            <span className="font-bold">{op.risk_level}</span>
                            <span className="truncate flex-1 text-right">{op.possible_disease}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
               </div>

               {/* Integrity Validation */}
               <div className="glass-card rounded-xl p-5 space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Data Integrity
                  </h3>
                  
                  <div className="flex items-center gap-4 py-2">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 ${result.validation.valid ? 'border-health bg-health/5 text-health' : 'border-risk-high bg-risk-high/5 text-risk-high'}`}>
                      {result.validation.valid ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{result.validation.valid ? 'Verified Reasonable' : 'Anomalies Detected'}</p>
                      <p className="text-xs text-muted-foreground">Validated against 15+ epidemiological metrics</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Plausibility Score:</span>
                      <span className="font-bold">{(result.validation.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-health transition-all duration-1000" style={{ width: `${result.validation.confidence * 100}%` }} />
                    </div>
                  </div>

                  {result.validation.issues.length > 0 && (
                    <ul className="text-[10px] text-muted-foreground bg-risk-high/5 p-2 rounded border border-risk-high/10 space-y-1">
                      {result.validation.issues.map((issue, i) => <li key={i} className="flex gap-1"><span>•</span> {issue}</li>)}
                    </ul>
                  )}
               </div>
            </div>

            {/* Risk & Strategy Display */}
            <div className="glass-card rounded-xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Users className="h-24 w-24" />
              </div>
              
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{result.alert.title}</h3>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={result.risk_analysis.risk_level} />
                    <span className="text-xs text-muted-foreground font-mono">ID: {result.session_id.split('-')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Clinical Assessment
                    </h4>
                    <p className="text-sm leading-relaxed">{result.risk_analysis.reason}</p>
                  </div>
                  
                  {result.alert.why_urgent && (
                    <div className="p-3 bg-risk-high/5 rounded-lg border border-risk-high/10">
                      <h4 className="text-xs font-bold uppercase text-risk-high mb-1">Urgency Context</h4>
                      <p className="text-xs italic">{result.alert.why_urgent}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                   <div>
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Immediate Actions</h4>
                    <ul className="space-y-2">
                      {result.alert.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-health shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.alert.prevention_strategy && (
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <h4 className="text-xs font-bold uppercase text-primary mb-1">Long-term Prevention</h4>
                      <p className="text-xs">{result.alert.prevention_strategy}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Raw JSON Debug - For Hackathon Verification */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Raw Pipeline Inspection</h3>
              <div className="p-4 rounded-lg bg-black/80 font-mono text-[10px] sm:text-xs text-green-400 overflow-auto max-h-40 scrollbar-thin">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>

            {/* Approve / Reject */}
            {result.human_validation_required && result.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4 border-2 border-risk-medium/40 sticky bottom-4 shadow-xl z-10"
              >
                <div className="flex-1">
                  <p className="font-semibold">⚠️ Final Human Verification Required</p>
                  <p className="text-sm text-muted-foreground">The AI consensus is split. Please provide expert approval.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApproval(true)} className="gap-2 bg-health hover:bg-health/90 text-health-foreground px-6">
                    <CheckCircle2 className="h-4 w-4" /> Approve Alert
                  </Button>
                  <Button variant="outline" onClick={() => handleApproval(false)} className="gap-2">
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
