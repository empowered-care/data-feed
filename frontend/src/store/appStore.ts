import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OutbreakReport, AgentPipelineState, AgentStep, AlertMessage } from '@/types';

interface AppState {
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  reports: OutbreakReport[];
  setReports: (reports: OutbreakReport[]) => void;
  addReport: (r: OutbreakReport) => void;
  updateReportStatus: (id: string, status: 'approved' | 'rejected') => void;
  alerts: AlertMessage[];
  addAlert: (a: AlertMessage) => void;
  pipeline: AgentPipelineState;
  setPipelineStep: (step: AgentStep | null) => void;
  completePipelineStep: (step: AgentStep) => void;
  setPipelineProcessing: (v: boolean) => void;
  setPipelineResult: (r: OutbreakReport | null) => void;
  setPipelineError: (e: string | null) => void;
  resetPipeline: () => void;
  notifications: { id: string; message: string; read: boolean }[];
  addNotification: (msg: string) => void;
  markAllRead: () => void;
}

const initialPipeline: AgentPipelineState = {
  currentStep: null,
  completedSteps: [],
  isProcessing: false,
  result: null,
  error: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      apiBaseUrl: 'http://localhost:8000',
      setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
      darkMode: false,
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          document.documentElement.classList.toggle('dark', next);
          return { darkMode: next };
        }),
      reports: [],
      setReports: (reports) => set({ reports }),
      addReport: (r) => set((s) => ({ reports: [r, ...s.reports] })),
      updateReportStatus: (id, status) =>
        set((s) => ({
          reports: s.reports.map((r) => (r.session_id === id ? { ...r, status } : r)),
        })),
      alerts: [],
      addAlert: (a) => set((s) => ({ alerts: [a, ...s.alerts] })),
      pipeline: initialPipeline,
      setPipelineStep: (step) => set((s) => ({ pipeline: { ...s.pipeline, currentStep: step } })),
      completePipelineStep: (step) =>
        set((s) => ({
          pipeline: { ...s.pipeline, completedSteps: [...s.pipeline.completedSteps, step] },
        })),
      setPipelineProcessing: (v) => set((s) => ({ pipeline: { ...s.pipeline, isProcessing: v } })),
      setPipelineResult: (r) => set((s) => ({ pipeline: { ...s.pipeline, result: r } })),
      setPipelineError: (e) => set((s) => ({ pipeline: { ...s.pipeline, error: e } })),
      resetPipeline: () => set({ pipeline: initialPipeline }),
      notifications: [],
      addNotification: (msg) =>
        set((s) => ({
          notifications: [{ id: Date.now().toString(), message: msg, read: false }, ...s.notifications],
        })),
      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: 'empowered-care-store',
      partialize: (s) => ({ apiBaseUrl: s.apiBaseUrl, darkMode: s.darkMode }),
    }
  )
);
