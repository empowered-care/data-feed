import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import type { AgentStep } from '@/types';

const steps: { key: AgentStep; label: string; description: string }[] = [
  { key: 'extractor', label: 'Data Extractor', description: 'Extracting entities from report...' },
  { key: 'validator', label: 'Validator Agent', description: 'Validating data accuracy...' },
  { key: 'risk_analyzer', label: 'Risk Analyzer', description: 'Assessing outbreak risk level...' },
  { key: 'alert_generator', label: 'Alert Generator', description: 'Generating alerts & recommendations...' },
];

interface Props {
  currentStep?: AgentStep | null;
  completedSteps?: AgentStep[];
  isProcessing?: boolean;
}

export function AgentPipeline({ 
  currentStep = null, 
  completedSteps = [], 
  isProcessing = false 
}: Props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        AI Agent Pipeline
      </h3>
      <div className="space-y-2">
        {steps.map((step, i) => {
          const done = completedSteps.includes(step.key);
          const active = currentStep === step.key;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                active
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : done
                  ? 'border-health/30 bg-health/5'
                  : 'border-border bg-card'
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-health shrink-0" />
              ) : active ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${active ? 'text-primary' : done ? 'text-health' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                {active && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground"
                  >
                    {step.description}
                  </motion.p>
                )}
              </div>
              {done && <span className="text-xs text-health font-medium">Done</span>}
            </motion.div>
          );
        })}
      </div>
      {isProcessing && (
        <p className="text-xs text-center text-muted-foreground animate-pulse">
          Analyzing with 4 AI Agents...
        </p>
      )}
    </div>
  );
}
