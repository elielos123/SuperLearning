import React, { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { 
  Clock, 
  Lock, 
  ArrowRight, 
  Target, 
  Layers, 
  Eye, 
  EyeOff, 
  Play, 
  Sparkles
} from 'lucide-react';

export const ProjectDetail: React.FC = () => {
  const { 
    activeProject, 
    selectTask, 
    nextPendingTask, 
    calculateProgress, 
    formatDuration,
    unlockFullProjectView
  } = useLearning();

  const [forceShowAll, setForceShowAll] = useState(false);

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-neutral-400">
        Nenhum projeto selecionado.
      </div>
    );
  }

  const progress = calculateProgress(activeProject);
  const isFullViewAllowed = activeProject.fullViewUnlocked;
  const isViewingSingleTask = !isFullViewAllowed && !forceShowAll;

  // Next topic to execute
  const currentTask = nextPendingTask?.topic;
  const currentStage = nextPendingTask?.stage;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300 space-y-8">
      
      {/* Project Overview Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                activeProject.status === 'completed'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
              }`}>
                {activeProject.status === 'completed' ? 'Projeto Concluído' : 'Projeto Ativo'}
              </span>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800">
                Nível Prévio: {activeProject.knowledgeLevel ?? 0}/5
              </span>

              {isViewingSingleTask && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Foco Restrito Ativo
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight m-0">
              {activeProject.name}
            </h1>

            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              {activeProject.learningScope}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 min-w-[180px]">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Tempo Foco Total</span>
              <span className="text-base font-mono text-emerald-400 font-medium flex items-center sm:justify-end gap-1.5 mt-0.5">
                <Clock className="w-4 h-4" />
                {formatDuration(activeProject.totalFocusTimeSeconds || 0)}
              </span>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-mono text-neutral-500 block">Cronograma</span>
              <span className="text-xs font-mono text-neutral-400 mt-0.5 block">
                {activeProject.startDate} → {activeProject.endDate}
              </span>
            </div>
          </div>
        </div>

        {/* Goals / Targets if present */}
        {activeProject.targetGoals && (
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-850 text-xs space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              Alvos e Critérios de Sucesso
            </span>
            <p className="text-neutral-300 font-light leading-relaxed">
              {activeProject.targetGoals}
            </p>
          </div>
        )}

        {/* Global Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-neutral-850">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">Progresso Geral de Domínio</span>
            <span className="text-white font-medium">{progress}% Concluído</span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden">
            <div 
              className="h-full bg-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-emerald-400/20"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION: RESTRICTED NEXT PENDING TASK (Deep Work Single-Tasking Mode) */}
      {currentTask && currentStage && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Próxima Tarefa Imediata
              </span>
              <h2 className="text-lg font-medium text-white tracking-tight m-0">
                Foco Deliberado: {currentTask.title}
              </h2>
            </div>

            {/* Toggle Full Roadmap (only if already unlocked by completing a task) */}
            {isFullViewAllowed && (
              <button
                onClick={() => setForceShowAll(prev => !prev)}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 transition-all cursor-pointer"
              >
                {forceShowAll ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ocultar Demais Etapas</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Mapa Completo</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Primary Action Card for Current Task */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border-2 border-emerald-500/30 hover:border-emerald-500/60 shadow-2xl space-y-6 transition-all group">
            
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {currentStage.title}
                  </span>
                  <span>•</span>
                  <span>Tarefa 1 de 5</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-normal text-white group-hover:text-emerald-300 transition-colors">
                  {currentTask.title}
                </h3>

                <p className="text-sm text-neutral-300 leading-relaxed font-light max-w-3xl">
                  {currentTask.description}
                </p>
              </div>

              {/* Focus Time on this Task */}
              <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 shrink-0 text-right">
                <span className="text-[10px] font-mono uppercase text-neutral-500 block">Tempo nesta tarefa</span>
                <span className="text-sm font-mono text-emerald-400 font-medium">
                  {formatDuration(currentTask.focusTimeSeconds || 0)}
                </span>
              </div>
            </div>

            {/* Subtopics Checklist Preview */}
            {currentTask.subtopics && currentTask.subtopics.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-850">
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                  Subtópicos e Ações Recomendadas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentTask.subtopics.map(sub => (
                    <div 
                      key={sub.id}
                      className="p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-850 text-xs text-neutral-300 flex items-start gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-medium text-neutral-200">{sub.title}</div>
                        <div className="text-[11px] text-neutral-400 font-light mt-0.5">{sub.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Large Enter Focus Action Button */}
            <div className="pt-2">
              <button
                onClick={() => selectTask(currentStage.id, currentTask.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50 active:scale-[0.99] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Entrar em Modo Foco & Aprendizado</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COGNITIVE LOAD REDUCTION BANNER (If tasks are restricted) */}
      {isViewingSingleTask && (
        <div className="p-6 rounded-2xl bg-neutral-900/30 border border-dashed border-neutral-800 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-white">
                Visualização Restrita Anti-Sobrecarga Cognitiva
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                As demais etapas e tarefas estão intencionalmente bloqueadas para proteger seu estado de fluxo profundo e evitar sobrecarga de informação. A visualização completa de todo o projeto será desbloqueada integralmente assim que você concluir a tarefa acima com <strong>maestria ($\ge$ 90% de acerto)</strong>.
              </p>
            </div>
          </div>

          {/* Locked Preview placeholders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 opacity-40 select-none pointer-events-none filter blur-[1px]">
            {activeProject.stages.slice(1).map((stg, idx) => (
              <div key={stg.id} className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                  <span>Etapa 0{idx + 2}</span>
                  <Lock className="w-3 h-3 text-neutral-600" />
                </div>
                <div className="text-sm font-medium text-neutral-300 line-clamp-1">{stg.title}</div>
                <div className="text-[11px] text-neutral-500">5 tarefas aguardando liberação</div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={() => unlockFullProjectView()}
              className="text-[11px] text-neutral-500 hover:text-neutral-300 underline font-mono transition-colors cursor-pointer"
            >
              (Desbloquear visualização integral antecipadamente)
            </button>
          </div>
        </div>
      )}

      {/* UNLOCKED FULL ROADMAP VIEW (Shown when fullViewUnlocked is true or user toggled view) */}
      {(!isViewingSingleTask || forceShowAll) && (
        <div className="space-y-6 pt-4 border-t border-neutral-900 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-white tracking-tight m-0 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Roteiro Completo do Projeto
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Todas as etapas e tópicos desbloqueados para consulta e revisão.
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              {activeProject.stages.length} Etapas • {activeProject.stages.length * 5} Tarefas
            </span>
          </div>

          <div className="space-y-6">
            {activeProject.stages.map((stage, stageIdx) => (
              <div 
                key={stage.id} 
                className="p-5 sm:p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-4"
              >
                {/* Stage Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-850 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                      Etapa 0{stageIdx + 1}
                    </span>
                    <h4 className="text-base font-medium text-white tracking-tight">
                      {stage.title}
                    </h4>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border self-start ${
                    stage.completed 
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' 
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}>
                    {stage.completed ? 'Etapa Concluída' : 'Em Andamento'}
                  </span>
                </div>

                {/* 5 Topics list inside stage */}
                <div className="grid grid-cols-1 gap-2.5">
                  {stage.topics.map((topic, topicIdx) => {
                    const isCurrent = currentTask?.id === topic.id;
                    return (
                      <div
                        key={topic.id}
                        onClick={() => selectTask(stage.id, topic.id)}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          topic.completed
                            ? 'bg-neutral-950/60 border-neutral-850 hover:border-neutral-700'
                            : isCurrent
                            ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/80'
                            : 'bg-neutral-950/40 border-neutral-850/60 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-mono ${
                            topic.completed 
                              ? 'bg-emerald-400 text-neutral-950 font-bold' 
                              : isCurrent 
                              ? 'border-2 border-emerald-400 text-emerald-400' 
                              : 'border border-neutral-700 text-neutral-500'
                          }`}>
                            {topic.completed ? '✓' : `${topicIdx + 1}`}
                          </div>

                          <div>
                            <div className={`text-sm font-medium ${
                              topic.completed ? 'text-neutral-300' : isCurrent ? 'text-white' : 'text-neutral-400'
                            }`}>
                              {topic.title}
                            </div>
                            <div className="text-[11px] text-neutral-500 line-clamp-1 font-light">
                              {topic.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {topic.focusTimeSeconds > 0 && (
                            <span className="text-[11px] font-mono text-neutral-400 hidden sm:inline">
                              {formatDuration(topic.focusTimeSeconds)}
                            </span>
                          )}

                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            topic.completed 
                              ? 'bg-emerald-950/80 text-emerald-300' 
                              : isCurrent 
                              ? 'bg-emerald-400 text-neutral-950 font-medium' 
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {topic.completed ? 'Concluído' : isCurrent ? 'Executar' : 'Revisar'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
