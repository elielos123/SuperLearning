import React, { useState } from 'react';
import { LearningProvider, useLearning } from './context/LearningContext';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { ProjectWizard } from './components/ProjectWizard';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { TaskExecution } from './components/TaskExecution';
import { AISettingsModal } from './components/AISettingsModal';
import { BackupModal } from './components/BackupModal';
import { CheckCircle2, Compass } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeScreen, toastMessage, clearToast } = useLearning();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 selection:bg-neutral-800 selection:text-white font-sans">
      
      {/* Global Header */}
      <Header 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Screen Router */}
      <main className="flex-1 flex flex-col">
        {activeScreen === 'home' && (
          <Home onOpenSettings={() => setIsSettingsOpen(true)} />
        )}
        {activeScreen === 'wizard' && <ProjectWizard />}
        {activeScreen === 'project-list' && <ProjectList />}
        {activeScreen === 'project-detail' && <ProjectDetail />}
        {activeScreen === 'task-execution' && <TaskExecution />}
      </main>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-from-bottom-3 duration-300">
          <div 
            onClick={clearToast}
            className="px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-medium shadow-2xl flex items-center gap-2.5 cursor-pointer max-w-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <AISettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <BackupModal 
        isOpen={isBackupOpen} 
        onClose={() => setIsBackupOpen(false)} 
      />

      {/* Minimalist Deep Work Footer */}
      <footer className="w-full border-t border-neutral-900 py-6 text-center text-xs text-neutral-600 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-neutral-500">
            <Compass className="w-3.5 h-3.5 text-emerald-500" />
            <span>SuperLearning • Foco Orgânico & Aprendizagem Baseada em Etapas</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-500">
            <span>Client-side Storage (100% Privado)</span>
            <span>•</span>
            <span>Google Gemini AI</span>
            <span>•</span>
            <span className="text-neutral-400">Deploy pronto na Vercel</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <LearningProvider>
      <AppContent />
    </LearningProvider>
  );
}
