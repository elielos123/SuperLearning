import React, { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { FocusStopwatch } from './FocusStopwatch';
import { ResearchGuideView } from './ResearchGuideView';
import { EvaluationModule } from './EvaluationModule';
import { 
  ArrowLeft, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  ChevronRight
} from 'lucide-react';

export const TaskExecution: React.FC = () => {
  const { 
    selectedTask, 
    activeProject, 
    selectedStageId, 
    goBack, 
    formatDuration,
    selectTask,
    nextPendingTask
  } = useLearning();

  const [activeTab, setActiveTab] = useState<'guide' | 'evaluation'>('guide');

  if (!activeProject || !selectedTask) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 space-y-4">
        <p>Nenhuma tarefa selecionada para execução.</p>
        <button
          onClick={goBack}
          className="text-xs text-emerald-400 hover:underline cursor-pointer"
        >
          Voltar para o projeto
        </button>
      </div>
    );
  }

  const currentStage = activeProject.stages.find(s => s.id === selectedStageId);

  const handleAdvanceToNext = () => {
    if (nextPendingTask) {
      selectTask(nextPendingTask.stage.id, nextPendingTask.topic.id);
      setActiveTab('guide');
    } else {
      goBack();
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300 space-y-8">
      
      {/* Top Breadcrumb & Task Header */}
      <div className="space-y-3 border-b border-neutral-900 pb-5">
        
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <button 
            onClick={goBack} 
            className="hover:text-neutral-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{activeProject.name}</span>
          </button>
          <ChevronRight className="w-3 h-3 text-neutral-700" />
          <span className="text-neutral-400 truncate max-w-xs">{currentStage?.title || 'Etapa'}</span>
          <ChevronRight className="w-3 h-3 text-neutral-700" />
          <span className="text-emerald-400 font-medium">Modo Foco</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight m-0">
              {selectedTask.title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed max-w-3xl">
              {selectedTask.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedTask.completed ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-xs font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Tarefa Concluída
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-neutral-900 text-neutral-300 border border-neutral-800 text-xs font-mono flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                Tempo: {formatDuration(selectedTask.focusTimeSeconds || 0)}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 1. FOCUS STOPWATCH MODULE */}
      <FocusStopwatch taskTitle={selectedTask.title} />

      {/* TAB NAVIGATION: Guia de Pesquisa vs Módulo de Avaliação */}
      <div className="space-y-6">
        
        <div className="flex items-center border-b border-neutral-800">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-emerald-400 text-white font-medium bg-neutral-900/30'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>1. Guia de Pesquisa Autônoma</span>
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'evaluation'
                ? 'border-emerald-400 text-white font-medium bg-neutral-900/30'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>2. Módulo de Avaliação (5 Desafios)</span>
            {selectedTask.lastEvaluation && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                selectedTask.lastEvaluation.passed ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
              }`}>
                {selectedTask.lastEvaluation.score}%
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'guide' ? (
          <div className="space-y-6">
            <ResearchGuideView 
              guide={selectedTask.researchGuide} 
              subtopics={selectedTask.subtopics} 
            />

            {/* Quick advance to evaluation banner */}
            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-neutral-400 font-light">
                Finalizou seu estudo autônomo e quer testar seu domínio com a IA?
              </span>
              <button
                onClick={() => setActiveTab('evaluation')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <span>Ir para os 5 Desafios de Avaliação →</span>
              </button>
            </div>
          </div>
        ) : (
          <EvaluationModule 
            task={selectedTask} 
            onAdvanceToNextTask={handleAdvanceToNext} 
          />
        )}

      </div>

    </div>
  );
};
