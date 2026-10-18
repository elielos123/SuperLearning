import React from 'react';
import { useLearning } from '../context/LearningContext';
import { 
  Sparkles, 
  ArrowLeft, 
  DownloadCloud, 
  Clock,
  Compass
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenBackup }) => {
  const { activeScreen, goBack, activeProject, formatDuration } = useLearning();

  const isHome = activeScreen === 'home';

  return (
    <header className="w-full border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Brand or Back Button */}
        <div className="flex items-center gap-3">
          {!isHome ? (
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1.5 text-xs tracking-wider uppercase font-medium text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-all cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          ) : null}

          <div 
            onClick={() => window.location.hash = ''} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-200 group-hover:border-neutral-700 group-hover:text-white transition-all shadow-sm">
              <Compass className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-semibold tracking-tight text-neutral-100 flex items-center gap-1.5">
                SuperLearning
                <span className="text-[10px] font-normal tracking-wide px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  Organic
                </span>
              </span>
              <span className="text-[11px] text-neutral-500 font-normal hidden sm:inline">
                Deep Work & Inteligência Adaptativa
              </span>
            </div>
          </div>
        </div>

        {/* Center: Active Project Indicator if inside a project */}
        {activeProject && !isHome && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-full bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[200px] font-medium">{activeProject.name}</span>
            <span className="text-neutral-600">|</span>
            <span className="flex items-center gap-1 text-neutral-400">
              <Clock className="w-3 h-3 text-neutral-500" />
              {formatDuration(activeProject.totalFocusTimeSeconds || 0)}
            </span>
          </div>
        )}

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBackup}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 px-2.5 py-1.5 rounded-md hover:bg-neutral-900 border border-neutral-800/60 hover:border-neutral-700 transition-all cursor-pointer"
            title="Importar / Exportar Backup JSON"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer shadow-sm"
            title="Configurações de IA do Gemini"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Configurações IA</span>
          </button>
        </div>

      </div>
    </header>
  );
};
