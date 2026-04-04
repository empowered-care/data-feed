import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw, CheckCircle2, XCircle, Upload, FileText, Loader2, AlertTriangle, Zap, Shield, Droplets, Thermometer, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentPipeline } from '@/components/AgentPipeline';
import { RiskBadge } from '@/components/RiskBadge';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { AgentStep, OutbreakReport } from '@/types';

const STEPS: AgentStep[] = ['extractor', 'validator', 'risk_analyzer', 'alert_generator'];

export default function ProcessReport() {
  const [input, setInput] = useState('Fever, vomiting, 4 people affected in Jimma zone. Started 2 days ago near local water source.');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pipeline, setPipelineStep, completePipelineStep, setPipelineProcessing, setPipelineResult, setPipelineResults, setPipelineError, resetPipeline, addReport, addReports, addNotification } = useAppStore();

  const processText = async () => {
    if (!input.trim()) return;
    resetPipeline();
    setPipelineProcessing(true);

    try {
      const apiPromise = api.processReport(input);

      for (const step of STEPS) {
        setPipelineStep(step);
        await new Promise((r) => setTimeout(r, 100)); // Slightly longer for dramatic effect
        completePipelineStep(step);
      }

      const results = await apiPromise;
      if (results && results.length > 0) {
        setPipelineResult(results[0]);
        setPipelineResults(results);
        addReports(results);
        addNotification(`New intelligence ingested: ${results.length} records`);
      }
      toast.success('Cognitive extraction complete');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Uplink failed';
      setPipelineError(msg);
      toast.error(msg);
    } finally {
      setPipelineProcessing(false);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;
    resetPipeline();
    setPipelineProcessing(true);

    try {
      const apiPromise = api.uploadFile(selectedFile);

      for (const step of STEPS) {
        setPipelineStep(step);
        await new Promise((r) => setTimeout(r, 100));
        completePipelineStep(step);
      }

      const results = await apiPromise;
      if (results && results.length > 0) {
        setPipelineResult(results[0]);
        setPipelineResults(results);
        addReports(results);
        addNotification(`Archive ingested: ${results.length} records`);
      }
      toast.success('Visual extraction complete');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Inversion failed';
      setPipelineError(msg);
      toast.error(msg);
    } finally {
      setPipelineProcessing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleApproval = async (approved: boolean) => {
    if (!pipeline.result) return;
    const status = approved ? 'approved' : 'rejected';
    try {
      await api.approveReport(pipeline.result.session_id, approved);
      updateReportStatus(pipeline.result.session_id, status);
    } catch {}
    toast.success(approved ? 'Report Verified' : 'Report Rejected');
    setPipelineResult({ ...pipeline.result, status, human_validation_required: false });
  };

  const result = pipeline.result;

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Intelligence Intake
          </h2>
          <p className="text-muted-foreground font-medium mt-1">
            Initialize multi-agent extraction from raw signal or archived files
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card rounded-[2rem] overflow-hidden border-border/40 shadow-2xl">
            <Tabs defaultValue="text" className="w-full">
              <div className="px-8 pt-8">
                <TabsList className="grid grid-cols-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50 h-auto">
                  <TabsTrigger 
                    value="text" 
                    className="gap-2 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]"
                  >
                    <FileText className="h-4 w-4" /> Signal Stream
                  </TabsTrigger>
                  <TabsTrigger 
                    value="file" 
                    className="gap-2 py-3 rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm font-black uppercase tracking-widest text-[10px]"
                  >
                    <Upload className="h-4 w-4" /> Binary Archive
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8">
                <TabsContent value="text" className="space-y-6 mt-0">
                  <div className="relative group">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Input raw transmission data (symptoms, location, metrics)..."
                      rows={6}
                      className="resize-none bg-muted/20 border-2 border-border/50 rounded-2xl p-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30 placeholder:font-normal"
                    />
                    <div className="absolute right-4 bottom-4 opacity-20 group-hover:opacity-100 transition-opacity">
                      <FileText className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      onClick={processText} 
                      disabled={pipeline.isProcessing || !input.trim()} 
                      className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20 flex-1 gap-3 uppercase tracking-widest text-xs"
                    >
                      {pipeline.isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      Initialize Cognitive Scan
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { resetPipeline(); setInput(''); }}
                      className="h-14 w-14 rounded-2xl border-2 hover:bg-muted/50 transition-all"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-6 mt-0">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-border/60 rounded-[2rem] p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all relative overflow-hidden"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.csv,.jpg,.jpeg,.png,.txt"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    
                    <div className="relative z-10">
                      <div className="h-20 w-20 bg-muted/50 text-muted-foreground rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                        <Upload className="h-10 w-10" />
                      </div>
                      
                      {selectedFile ? (
                        <div className="space-y-2">
                          <p className="font-black text-xl tracking-tight text-primary">{selectedFile.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            Ready for spectral analysis
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-black text-xl tracking-tight italic">Drag signal carrier here</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                            PDF, CSV, JPEG, PNG, TXT supported
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={processFile} 
                    disabled={pipeline.isProcessing || !selectedFile} 
                    className="h-14 w-full rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black shadow-xl shadow-primary/20 gap-3 uppercase tracking-widest text-xs"
                  >
                    {pipeline.isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                    Begin Archive Inversion
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        <div className="lg:col-span-5">
           <div className="sticky top-28 space-y-6">
              <AgentPipeline 
                currentStep={pipeline.currentStep}
                completedSteps={pipeline.completedSteps}
                isProcessing={pipeline.isProcessing}
              />

              {pipeline.pipelineResults.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                   {pipeline.pipelineResults.map((r, i) => (
                     <button
                        key={r.session_id}
                        onClick={() => setPipelineResult(r)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 shrink-0 transition-all",
                          pipeline.result?.session_id === r.session_id
                            ? "bg-primary border-primary text-white shadow-lg"
                            : "bg-background border-border/50 text-muted-foreground hover:border-primary/30"
                        )}
                     >
                       Location {i + 1}: {r.extracted_data.location}
                     </button>
                   ))}
                </div>
              )}
              
              <AnimatePresence>
                {result && !pipeline.isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="glass-card rounded-[2rem] p-8 border-primary/20 shadow-2xl bg-gradient-to-br from-background to-primary/5"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                         Scan Result
                       </span>
                       <RiskBadge level={result.risk_analysis?.risk_level} />
                    </div>

                    <div className="space-y-6">
                       <div>
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Target Location</p>
                         <h4 className="text-2xl font-black tracking-tighter text-foreground">{result.extracted_data?.location}</h4>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Case Volume</p>
                             <p className="text-xl font-black">{result.extracted_data?.cases || 0}</p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Disease Match</p>
                             <p className="text-sm font-black truncate uppercase">{result.risk_analysis?.possible_disease || 'Unidentified'}</p>
                          </div>
                       </div>

                       {result.context_research && (
                         <div className="space-y-3 pt-2">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Environmental Intelligence</p>
                           <div className="grid grid-cols-3 gap-2">
                              <div className="p-3 bg-muted/20 rounded-xl border border-border/40 flex flex-col items-center text-center">
                                <Shield className={cn("h-4 w-4 mb-1", result.context_research.conflict_zone ? "text-risk-high" : "text-health")} />
                                <p className="text-[8px] font-bold uppercase text-muted-foreground">Security</p>
                                <p className="text-[10px] font-black truncate w-full">{result.context_research.conflict_zone ? 'Conflict' : 'Stable'}</p>
                              </div>
                              <div className="p-3 bg-muted/20 rounded-xl border border-border/40 flex flex-col items-center text-center">
                                <Droplets className="h-4 w-4 mb-1 text-primary" />
                                <p className="text-[8px] font-bold uppercase text-muted-foreground">Water</p>
                                <p className="text-[10px] font-black truncate w-full">{result.context_research.water_quality || 'Unknown'}</p>
                              </div>
                              <div className="p-3 bg-muted/20 rounded-xl border border-border/40 flex flex-col items-center text-center">
                                <Thermometer className="h-4 w-4 mb-1 text-orange-500" />
                                <p className="text-[8px] font-bold uppercase text-muted-foreground">Temp</p>
                                <p className="text-[10px] font-black truncate w-full">{result.context_research.temperature || 'N/A'}</p>
                              </div>
                           </div>
                           <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                              <p className="text-[10px] font-bold text-primary uppercase tracking-tight flex items-center gap-1.5 mb-1">
                                <Info className="h-3 w-3" /> Recent Context
                              </p>
                              <p className="text-[11px] font-medium leading-relaxed italic text-muted-foreground">
                                {result.context_research.security_status}
                              </p>
                           </div>
                         </div>
                       )}

                       {result.human_validation_required ? (
                         <div className="pt-4 space-y-3">
                           <div className="p-4 bg-risk-high/5 border border-risk-high/20 rounded-2xl">
                             <p className="text-[10px] font-black text-risk-high uppercase tracking-widest mb-2 flex items-center gap-2">
                               <AlertTriangle className="h-3 w-3" /> Manual Override Required
                             </p>
                             <p className="text-xs font-medium text-risk-high/80 leading-relaxed italic">
                               Neural interpretation requires human synchronization for high-severity confirmation.
                             </p>
                           </div>
                           <div className="flex gap-2">
                             <Button onClick={() => handleApproval(true)} className="flex-1 bg-health hover:bg-health/90 text-white font-black rounded-xl text-[10px] uppercase tracking-widest h-12 shadow-lg shadow-health/20">
                               Confirm Scan
                             </Button>
                             <Button variant="outline" onClick={() => handleApproval(false)} className="flex-1 border-2 font-black rounded-xl text-[10px] uppercase tracking-widest h-12 hover:bg-risk-high hover:text-white hover:border-risk-high transition-all">
                               Invalidate
                             </Button>
                           </div>
                         </div>
                       ) : (
                         <div className="pt-4">
                           <div className={cn(
                             "p-4 rounded-2xl border flex items-center gap-3",
                             result.status === 'approved' ? "bg-health/5 border-health/20 text-health" : "bg-muted border-border text-muted-foreground"
                           )}>
                             {result.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verification {result.status || 'Pending'}</span>
                           </div>
                         </div>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </div>
  );
}
