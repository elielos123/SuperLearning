import React from 'react';
import { useLearning } from '../context/LearningContext';
import { 
  PlusCircle, 
  Layers, 
  Sparkles, 
  Compass, 
  ShieldCheck
} from 'lucide-react';

interface HomeProps {
  onOpenSettings: () => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenSettings }) => {
  const { setScreen, projects, formatDuration, aiSettings } = useLearning();

  const totalFocusTime = projects.reduce((acc, p) => acc + (p.totalFocusTimeSeconds || 0), 0);
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 animate-in fade-in duration-500">
      
      {/* Central Minimalist Container */}
      <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center space-y-10">
        
        {/* Subtle Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-400 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Foco Orgânico • Aprendizado em Etapas</span>
        </div>

        {/* Brand / Logo */}
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-xl shadow-black/40 text-emerald-400 group hover:scale-105 transition-all">
            <Compass className="w-8 h-8 text-emerald-400 stroke-[1.75]" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white m-0">
            Super<span className="font-semibold text-emerald-400">Learning</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-md mx-auto leading-relaxed font-light">
            Desenvolva domínio técnico sem ruído cognitivo. Roteiros estruturados por IA, foco deliberado em tarefa única e validação por maestria.
          </p>
        </div>

        {/* Three Primary/Secondary Action Buttons with High Visual Hierarchy */}
        <div className="w-full max-w-md flex flex-col gap-3.5 pt-2">
          
          {/* Action 1: Criar Projetos (Primary) */}
          <button
            onClick={() => setScreen('wizard')}
            className="w-full group relative flex items-center justify-between px-6 py-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 font-medium text-sm transition-all shadow-lg hover:shadow-xl shadow-white/5 active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-9 h-9 rounded-lg bg-neutral-950 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-neutral-950 text-sm tracking-tight">Criar Projetos</div>
                <div className="text-xs text-neutral-600 font-normal">Construa um novo roteiro guiado por IA</div>
              </div>
            </div>
            <span className="text-neutral-400 group-hover:text-neutral-900 transition-colors text-xs font-mono">
              Novo →
            </span>
          </button>

          {/* Action 2: Acessar Projetos (Secondary) */}
          <button
            onClick={() => setScreen('project-list')}
            className="w-full group flex items-center justify-between px-6 py-4 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-100 border border-neutral-800 hover:border-neutral-700 font-medium text-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-neutral-300 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="font-medium text-white text-sm tracking-tight flex items-center gap-2">
                  Acessar Projetos
                  {projects.length > 0 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {projects.length}
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-400 font-normal">Painel de projetos ativos e concluídos</div>
              </div>
            </div>
            <span className="text-neutral-500 group-hover:text-neutral-300 transition-colors text-xs font-mono">
              Abrir →
            </span>
          </button>

          {/* Action 3: Configurações de IA (Tertiary / Utility) */}
          <button
            onClick={onOpenSettings}
            className="w-full group flex items-center justify-between px-6 py-3.5 rounded-xl bg-neutral-950/60 hover:bg-neutral-900 text-neutral-300 border border-neutral-850 hover:border-neutral-700 text-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-amber-400 transition-colors">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="font-medium text-neutral-200 text-sm tracking-tight flex items-center gap-1.5">
                  Configurações de IA
                  {aiSettings.apiKey ? (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Conectada
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      (Modo Demo ativo)
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500 font-normal">Modelo Gemini e chave de API local</div>
              </div>
            </div>
            <span className="text-neutral-500 group-hover:text-neutral-300 transition-colors text-xs font-mono">
              Ajustar →
            </span>
          </button>

        </div>

        {/* Minimalist Metrics Summary if there are projects */}
        {projects.length > 0 && (
          <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-4 border-t border-neutral-900">
            <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-900 text-center">
              <div className="text-xs text-neutral-500 font-mono">Ativos</div>
              <div className="text-lg font-light text-neutral-200 mt-0.5">{activeProjects}</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-900 text-center">
              <div className="text-xs text-neutral-500 font-mono">Concluídos</div>
              <div className="text-lg font-light text-emerald-400 mt-0.5">{completedProjects}</div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-900 text-center">
              <div className="text-xs text-neutral-500 font-mono">Tempo Foco</div>
              <div className="text-lg font-light text-neutral-200 mt-0.5">{formatDuration(totalFocusTime)}</div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
