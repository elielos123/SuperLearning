import React, { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { 
  FolderPlus, 
  Clock, 
  Trash2, 
  ArrowRight, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export const ProjectList: React.FC = () => {
  const { projects, selectProject, setScreen, deleteProject, calculateProgress, formatDuration } = useLearning();

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredProjects = projects.filter(p => {
    if (filter === 'active') return p.status === 'active';
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-300 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-light text-white tracking-tight m-0">
              Projetos de <span className="font-semibold text-emerald-400">Aprendizado</span>
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
              {projects.length}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Painel unificado de projetos ativos, cronômetros acumulados e progresso orgânico.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Filter Pill */}
          <div className="flex items-center p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filter === 'all' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Todos ({projects.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filter === 'active' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filter === 'completed' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Concluídos
            </button>
          </div>

          <button
            onClick={() => setScreen('wizard')}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Novo Projeto</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/30 border border-neutral-850 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium text-white">Nenhum projeto encontrado</h3>
            <p className="text-xs text-neutral-400">
              {filter === 'all' 
                ? 'Comece criando seu primeiro projeto guiado por inteligência adaptativa.'
                : 'Não há projetos correspondentes ao filtro selecionado.'}
            </p>
          </div>
          {filter === 'all' && (
            <button
              onClick={() => setScreen('wizard')}
              className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-neutral-950 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Criar Primeiro Projeto
            </button>
          )}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((project) => {
          const progress = calculateProgress(project);
          const isCompleted = project.status === 'completed' || progress === 100;
          
          let totalTopics = 0;
          let completedTopics = 0;
          project.stages.forEach(stg => {
            stg.topics.forEach(tpc => {
              totalTopics++;
              if (tpc.completed) completedTopics++;
            });
          });

          return (
            <div
              key={project.id}
              className="group relative rounded-2xl bg-neutral-900/40 hover:bg-neutral-900/70 border border-neutral-800/80 hover:border-neutral-700 p-6 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-xl space-y-5"
            >
              
              {/* Header inside card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isCompleted 
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' 
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}>
                      {isCompleted ? 'Concluído' : 'Em Andamento'}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-950 text-neutral-400 border border-neutral-850">
                      Nível {project.knowledgeLevel ?? 0}/5
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Deseja realmente remover o projeto "${project.name}"?`)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="text-neutral-600 hover:text-red-400 p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Excluir Projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 
                  onClick={() => selectProject(project.id)}
                  className="text-lg font-medium text-white group-hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1"
                >
                  {project.name}
                </h3>

                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-light">
                  {project.learningScope}
                </p>
              </div>

              {/* Progress and Focus Time Stats */}
              <div className="space-y-3 pt-2 border-t border-neutral-850">
                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Progresso Concluído</span>
                    <span className="text-white font-medium">{progress}% ({completedTopics}/{totalTopics} tarefas)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-950 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Metadata row */}
                <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-mono">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Foco: {formatDuration(project.totalFocusTimeSeconds || 0)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    <span>{project.startDate} → {project.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => selectProject(project.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-medium transition-all cursor-pointer"
              >
                <span>Acessar Projeto</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
};
