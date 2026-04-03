import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw, CheckCircle2, XCircle, Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const { pipeline, setPipelineStep, completePipelineStep, setPipelineProcessing, setPipelineResult, setPipelineError, resetPipeline, addReport, addNotification } = useAppStore();

  const processText = async () => {
    if (!input.trim()) return;
    resetPipeline();
    setPipelineProcessing(true);

    try {
      const apiPromise = api.processReport(input);

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
      const msg = e instanceof Error ? e.message : 'Processing failed';
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
        await new Promise((r) => setTimeout(r, 50));
        completePipelineStep(step);
      }

      const result = await apiPromise;
      setPipelineResult(result);
      addReport(result);
      addNotification(`File processed: ${selectedFile.name}`);
      toast.success('File processed successfully');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'File processing failed';
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
    try {
      await api.approveReport(pipeline.result.session_id, approved);
    } catch {}
    toast.success(approved ? 'Report approved' : 'Report rejected');
    setPipelineResult({ ...pipeline.result, status: approved ? 'approved' : 'rejected', human_validation_required: false });
  };

  const result = pipeline.result;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Process Outbreak Report</h2>
        <p className="text-sm text-muted-foreground">Submit a raw report or upload a file for multi-agent AI analysis</p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="text" className="gap-2">
              <FileText className="h-4 w-4" /> Text Report
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-2">
              <Upload className="h-4 w-4" /> File Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or type a raw outbreak report (symptoms, location, case counts, etc.)..."
              rows={5}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={processText} disabled={pipeline.isProcessing || !input.trim()} className="gap-2">
                {pipeline.isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Process with AI Agents
              </Button>
              <Button variant="outline" onClick={() => { resetPipeline(); setInput(''); }}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.jpg,.jpeg,.png,.txt"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Drop a file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supports PDF, CSV, JPG, PNG, TXT</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={processFile} disabled={pipeline.isProcessing || !selectedFile} className="gap-2">
                {pipeline.isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload & Process
              </Button>
              <Button variant="outline" onClick={() => { resetPipeline(); setSelectedFile(null); }}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
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

      {pipeline.error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-5 border-2 border-risk-high/30 bg-risk-high/5"
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-risk-high" />
            <p className="font-semibold text-risk-high">Processing Failed</p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{pipeline.error}</p>
        </motion.div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Extracted Data */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Extracted Data</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['Location', result.extracted_data.location],
                  ['Cases', result.extracted_data.cases],
                  ['Date', result.extracted_data.date || 'N/A'],
                  ['Symptoms', result.extracted_data.symptoms.join(', ') || 'None detected'],
                ].map(([k, v]) => (
                  <div key={k as string} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{k}</p>
                    <p className="font-medium text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Validation</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  {result.validation.valid ? <CheckCircle2 className="h-4 w-4 text-health" /> : <XCircle className="h-4 w-4 text-risk-high" />}
                  <span className="text-sm font-medium">{result.validation.valid ? 'Valid' : 'Invalid'}</span>
                </div>
                <div className="h-2.5 flex-1 bg-muted rounded-full overflow-hidden max-w-xs">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${result.validation.confidence * 100}%` }} />
                </div>
                <span className="text-sm font-semibold tabular-nums">{(result.validation.confidence * 100).toFixed(0)}%</span>
              </div>
              {result.validation.issues.length > 0 && (
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                  {result.validation.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              )}
            </div>

            {/* Risk Analysis */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Risk Analysis</h3>
                <RiskBadge level={result.risk_analysis.risk_level} />
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    result.risk_analysis.risk_level === 'HIGH' ? 'bg-risk-high' :
                    result.risk_analysis.risk_level === 'MEDIUM' ? 'bg-risk-medium' : 'bg-risk-low'
                  }`}
                  style={{ width: result.risk_analysis.confidence }}
                />
              </div>
              <p className="text-sm"><span className="text-muted-foreground">Possible disease:</span> <span className="font-medium">{result.risk_analysis.possible_disease}</span></p>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Reasoning & Recommendations:</p>
                <p className="text-sm text-muted-foreground italic mb-2">{result.risk_analysis.reason}</p>
                {result.alert.recommendations.length > 0 && (
                  <ul className="text-sm space-y-1.5">
                    {result.alert.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-health shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Alert Banner */}
            <div className={`rounded-xl p-5 border-2 space-y-2 ${
              result.risk_analysis.risk_level === 'HIGH' ? 'border-risk-high/30 bg-risk-high/5' :
              result.risk_analysis.risk_level === 'MEDIUM' ? 'border-risk-medium/30 bg-risk-medium/5' : 'border-risk-low/30 bg-risk-low/5'
            }`}>
              <h3 className="font-bold">{result.alert.title}</h3>
              <p className="text-sm text-muted-foreground">{result.alert.message}</p>
            </div>

            {/* Human Validation */}
            {result.human_validation_required && result.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4 border-2 border-risk-medium/40"
              >
                <div className="flex-1">
                  <p className="font-semibold">⚠️ Human Validation Required</p>
                  <p className="text-sm text-muted-foreground">This report requires expert review before further action.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApproval(true)} className="gap-2 bg-health hover:bg-health/90 text-health-foreground">
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => handleApproval(false)} className="gap-2">
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
