import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Project, AISettings, ActiveScreen, TopicTask, Stage, EvaluationResult } from '../types';
import {
  getStoredProjects,
  saveStoredProjects,
  getStoredAISettings,
  saveStoredAISettings,
  getActiveProjectId,
  saveActiveProjectId,
  exportBackupJSON,
  importBackupJSON,
} from '../services/storage';
import { generateLearningRoadmap, evaluateTaskAnswers, generateSuggestedGoals } from '../services/gemini';
import { sounds } from '../services/audio';

interface CreateProjectPayload {
  name: string;
  scope: string;
  knowledgeLevel: number;
  startDate: string;
  endDate: string;
  targetGoals: string;
}

interface LearningContextType {
  projects: Project[];
  activeProject: Project | null;
  activeScreen: ActiveScreen;
  aiSettings: AISettings;
  selectedStageId: string | null;
  selectedTopicId: string | null;
  selectedTask: TopicTask | null;
  isGeneratingRoadmap: boolean;
  isEvaluating: boolean;
  isGeneratingGoals: boolean;
  toastMessage: string | null;
  errorMessage: string | null;

  // Navigation & Screen management
  setScreen: (screen: ActiveScreen) => void;
  selectProject: (projectId: string) => void;
  selectTask: (stageId: string, topicId: string) => void;
  goBack: () => void;
  clearToast: () => void;
  clearError: () => void;
  showToast: (msg: string) => void;

  // Project Actions
  createProject: (payload: CreateProjectPayload) => Promise<void>;
  suggestGoals: (scope: string, knowledgeLevel: number) => Promise<string>;
  deleteProject: (id: string) => void;
  updateAISettings: (newSettings: Partial<AISettings>) => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;

  // Task & Focus Actions
  recordFocusTime: (seconds: number) => void;
  saveDraftAnswers: (answers: Record<string, string>) => void;
  submitEvaluation: (answers: Record<string, string>) => Promise<EvaluationResult>;
  toggleSubtopicCompletion: (subtopicId: string) => void;
  unlockFullProjectView: () => void;

  // Helper selectors
  nextPendingTask: { stage: Stage; topic: TopicTask } | null;
  calculateProgress: (project: Project) => number;
  formatDuration: (seconds: number) => string;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export const LearningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [aiSettings, setAISettings] = useState<AISettings>(getStoredAISettings);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    setProjects(loadedProjects);

    const savedActiveId = getActiveProjectId();
    if (savedActiveId && loadedProjects.some(p => p.id === savedActiveId)) {
      setActiveProjectId(savedActiveId);
    }
  }, []);

  // Save projects on update
  useEffect(() => {
    if (projects.length > 0) {
      saveStoredProjects(projects);
    }
  }, [projects]);

  // Save settings on update
  useEffect(() => {
    saveStoredAISettings(aiSettings);
  }, [aiSettings]);

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);
  const clearToast = () => setToastMessage(null);
  const clearError = () => setErrorMessage(null);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  // Find next pending task (first task that is not completed in sequential order)
  const nextPendingTask = useMemo(() => {
    if (!activeProject) return null;
    for (const stage of activeProject.stages) {
      for (const topic of stage.topics) {
        if (!topic.completed) {
          return { stage, topic };
        }
      }
    }
    return null;
  }, [activeProject]);

  // Selected task resolution
  const selectedTask = useMemo(() => {
    if (!activeProject || !selectedStageId || !selectedTopicId) return null;
    const stage = activeProject.stages.find(s => s.id === selectedStageId);
    if (!stage) return null;
    return stage.topics.find(t => t.id === selectedTopicId) || null;
  }, [activeProject, selectedStageId, selectedTopicId]);

  const calculateProgress = (project: Project): number => {
    let totalTopics = 0;
    let completedTopics = 0;

    project.stages.forEach(stage => {
      stage.topics.forEach(topic => {
        totalTopics++;
        if (topic.completed) completedTopics++;
      });
    });

    if (totalTopics === 0) return 0;
    return Math.round((completedTopics / totalTopics) * 100);
  };

  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${seconds}s`;
  };

  const setScreen = (screen: ActiveScreen) => {
    setErrorMessage(null);
    setActiveScreen(screen);
  };

  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    setActiveProjectId(projectId);
    saveActiveProjectId(projectId);

    // Auto-select the next pending task
    let foundNext: { stage: Stage; topic: TopicTask } | null = null;
    for (const stage of project.stages) {
      for (const topic of stage.topics) {
        if (!topic.completed) {
          foundNext = { stage, topic };
          break;
        }
      }
      if (foundNext) break;
    }

    if (foundNext) {
      setSelectedStageId(foundNext.stage.id);
      setSelectedTopicId(foundNext.topic.id);
    } else if (project.stages.length > 0 && project.stages[0].topics.length > 0) {
      setSelectedStageId(project.stages[0].id);
      setSelectedTopicId(project.stages[0].topics[0].id);
    }

    setScreen('project-detail');
  };

  const selectTask = (stageId: string, topicId: string) => {
    setSelectedStageId(stageId);
    setSelectedTopicId(topicId);
    setScreen('task-execution');
  };

  const goBack = () => {
    if (activeScreen === 'task-execution') {
      setScreen('project-detail');
    } else if (activeScreen === 'project-detail') {
      setScreen('project-list');
    } else {
      setScreen('home');
    }
  };

  const updateAISettings = (newSettings: Partial<AISettings>) => {
    setAISettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveStoredAISettings(updated);
      return updated;
    });
    showToast('Configurações de IA salvas com sucesso.');
  };

  const suggestGoals = async (scope: string, knowledgeLevel: number): Promise<string> => {
    setIsGeneratingGoals(true);
    setErrorMessage(null);
    try {
      const goals = await generateSuggestedGoals(scope, knowledgeLevel, aiSettings);
      showToast('Objetivos estruturados pela IA com sucesso!');
      return goals;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao sugerir objetivos por IA.';
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsGeneratingGoals(false);
    }
  };

  const createProject = async (payload: CreateProjectPayload) => {
    setIsGeneratingRoadmap(true);
    setErrorMessage(null);

    try {
      const stages = await generateLearningRoadmap(payload, aiSettings);

      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: payload.name.trim(),
        learningScope: payload.scope.trim(),
        knowledgeLevel: payload.knowledgeLevel ?? 0,
        startDate: payload.startDate,
        endDate: payload.endDate,
        targetGoals: payload.targetGoals.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalFocusTimeSeconds: 0,
        stages,
        status: 'active',
        fullViewUnlocked: false,
      };

      const updated = [newProject, ...projects];
      setProjects(updated);
      saveStoredProjects(updated);
      setActiveProjectId(newProject.id);
      saveActiveProjectId(newProject.id);

      if (stages.length > 0 && stages[0].topics.length > 0) {
        setSelectedStageId(stages[0].id);
        setSelectedTopicId(stages[0].topics[0].id);
      }

      showToast('Projeto criado com sucesso! Roteiro adaptativo pronto.');
      setScreen('project-detail');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar roteiro com IA.';
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveStoredProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(null);
      saveActiveProjectId(null);
      setScreen('project-list');
    }
    showToast('Projeto removido.');
  };

  const recordFocusTime = (seconds: number) => {
    if (seconds <= 0 || !activeProjectId || !selectedStageId || !selectedTopicId) return;

    setProjects(prevProjects => {
      const next = prevProjects.map(proj => {
        if (proj.id !== activeProjectId) return proj;

        const updatedStages = proj.stages.map(stg => {
          if (stg.id !== selectedStageId) return stg;

          const updatedTopics = stg.topics.map(tpc => {
            if (tpc.id !== selectedTopicId) return tpc;
            return {
              ...tpc,
              focusTimeSeconds: (tpc.focusTimeSeconds || 0) + seconds,
            };
          });

          return { ...stg, topics: updatedTopics };
        });

        return {
          ...proj,
          updatedAt: new Date().toISOString(),
          totalFocusTimeSeconds: (proj.totalFocusTimeSeconds || 0) + seconds,
          stages: updatedStages,
        };
      });

      saveStoredProjects(next);
      return next;
    });
  };

  const saveDraftAnswers = (answers: Record<string, string>) => {
    if (!activeProjectId || !selectedStageId || !selectedTopicId) return;

    setProjects(prevProjects => {
      const next = prevProjects.map(proj => {
        if (proj.id !== activeProjectId) return proj;

        const updatedStages = proj.stages.map(stg => {
          if (stg.id !== selectedStageId) return stg;

          const updatedTopics = stg.topics.map(tpc => {
            if (tpc.id !== selectedTopicId) return tpc;
            return {
              ...tpc,
              draftAnswers: { ...tpc.draftAnswers, ...answers },
            };
          });

          return { ...stg, topics: updatedTopics };
        });

        return { ...proj, stages: updatedStages };
      });

      saveStoredProjects(next);
      return next;
    });

    showToast('Respostas parciais salvas no armazenamento local.');
  };

  const submitEvaluation = async (answers: Record<string, string>): Promise<EvaluationResult> => {
    if (!activeProject || !selectedTask) {
      throw new Error('Nenhuma tarefa ativa selecionada.');
    }

    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const evaluation = await evaluateTaskAnswers(
        selectedTask,
        answers,
        activeProject.learningScope,
        aiSettings
      );

      // Apply updates to the active project state
      setProjects(prevProjects => {
        const next = prevProjects.map(proj => {
          if (proj.id !== activeProjectId) return proj;

          let shouldUnlockFullView = proj.fullViewUnlocked;
          const updatedStages = proj.stages.map(stg => {
            if (stg.id !== selectedStageId) return stg;

            const updatedTopics = stg.topics.map(tpc => {
              if (tpc.id !== selectedTopicId) return tpc;

              const isPassed = evaluation.passed;
              if (isPassed) {
                shouldUnlockFullView = true;
              }

              // Update questions if failed and new questions are returned
              const currentQuestions = (evaluation.newQuestions && !isPassed)
                ? evaluation.newQuestions
                : tpc.questions.map(q => ({
                    ...q,
                    userAnswer: answers[q.id] || q.userAnswer,
                  }));

              return {
                ...tpc,
                completed: isPassed ? true : tpc.completed,
                completedAt: isPassed ? new Date().toISOString() : tpc.completedAt,
                questions: currentQuestions,
                lastEvaluation: evaluation,
                evaluationHistory: [evaluation, ...(tpc.evaluationHistory || [])],
                draftAnswers: isPassed ? {} : answers,
              };
            });

            // Check if all topics in stage are completed
            const stageCompleted = updatedTopics.every(t => t.completed);

            return {
              ...stg,
              completed: stageCompleted,
              topics: updatedTopics,
            };
          });

          // Check if entire project is completed
          const allCompleted = updatedStages.every(s => s.completed);

          return {
            ...proj,
            updatedAt: new Date().toISOString(),
            status: allCompleted ? 'completed' : proj.status,
            fullViewUnlocked: shouldUnlockFullView,
            stages: updatedStages,
          };
        });

        saveStoredProjects(next);
        return next;
      });

      if (evaluation.passed) {
        sounds.playMasterySuccess();
        showToast('Parabéns! Maestria atingida (>= 90%). Próxima etapa liberada!');
      } else {
        sounds.playNeedsImprovement();
        showToast(`Nota: ${evaluation.score}%. É necessário atingir 90% para avançar. Analise a nova perspectiva.`);
      }

      return evaluation;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na avaliação da IA.';
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleSubtopicCompletion = (subtopicId: string) => {
    if (!activeProjectId || !selectedStageId || !selectedTopicId) return;

    setProjects(prevProjects => {
      const next = prevProjects.map(proj => {
        if (proj.id !== activeProjectId) return proj;

        const updatedStages = proj.stages.map(stg => {
          if (stg.id !== selectedStageId) return stg;

          const updatedTopics = stg.topics.map(tpc => {
            if (tpc.id !== selectedTopicId) return tpc;

            const updatedSubtopics = tpc.subtopics.map(sub => {
              if (sub.id !== subtopicId) return sub;
              return { ...sub, completed: !sub.completed };
            });

            return { ...tpc, subtopics: updatedSubtopics };
          });

          return { ...stg, topics: updatedTopics };
        });

        return { ...proj, stages: updatedStages };
      });

      saveStoredProjects(next);
      return next;
    });
  };

  const unlockFullProjectView = () => {
    if (!activeProjectId) return;
    setProjects(prevProjects => {
      const next = prevProjects.map(proj => {
        if (proj.id === activeProjectId) {
          return { ...proj, fullViewUnlocked: true };
        }
        return proj;
      });
      saveStoredProjects(next);
      return next;
    });
    showToast('Visualização integral do projeto liberada.');
  };

  const exportData = () => {
    exportBackupJSON(projects, aiSettings);
    showToast('Backup JSON exportado com sucesso.');
  };

  const importData = async (file: File) => {
    try {
      const backup = await importBackupJSON(file);
      setProjects(backup.projects);
      saveStoredProjects(backup.projects);

      if (backup.settings) {
        setAISettings(backup.settings);
        saveStoredAISettings(backup.settings);
      }

      showToast(`Backup restaurado! ${backup.projects.length} projeto(s) carregados.`);
      setScreen('project-list');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao importar backup.';
      setErrorMessage(msg);
    }
  };

  return (
    <LearningContext.Provider
      value={{
        projects,
        activeProject,
        activeScreen,
        aiSettings,
        selectedStageId,
        selectedTopicId,
        selectedTask,
        isGeneratingRoadmap,
        isEvaluating,
        isGeneratingGoals,
        toastMessage,
        errorMessage,
        setScreen,
        selectProject,
        selectTask,
        goBack,
        clearToast,
        clearError,
        showToast,
        createProject,
        suggestGoals,
        deleteProject,
        updateAISettings,
        exportData,
        importData,
        recordFocusTime,
        saveDraftAnswers,
        submitEvaluation,
        toggleSubtopicCompletion,
        unlockFullProjectView,
        nextPendingTask,
        calculateProgress,
        formatDuration,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = (): LearningContextType => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};
