export interface AISettings {
  apiKey: string;
  model: string;
  temperature: number;
  useMockFallback: boolean;
}

export type QuestionType = 'objective' | 'argumentative';

export interface QuestionChallenge {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for objective
  userAnswer?: string;
  score?: number; // 0 to 100
  feedback?: string;
}

export interface EvaluationResult {
  score: number; // 0 to 100
  passed: boolean; // score >= 90
  evaluatedAt: string;
  correctiveReport: string;
  reinforcementMaterial?: string;
  pedagogicalPerspective?: string;
  newQuestions?: QuestionChallenge[];
}

export interface SubTopic {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface ResearchGuide {
  overview: string;
  keyConcepts: string[];
  searchQueries: string[];
  reflectionQuestions: string[];
  recommendedApproaches?: string[];
}

export interface TopicTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  focusTimeSeconds: number;
  subtopics: SubTopic[];
  researchGuide: ResearchGuide;
  questions: QuestionChallenge[];
  lastEvaluation?: EvaluationResult;
  evaluationHistory: EvaluationResult[];
  draftAnswers: Record<string, string>;
}

export interface Stage {
  id: string;
  order: number;
  title: string;
  description: string;
  completed: boolean;
  topics: TopicTask[]; // strictly 5 topics per stage
}

export interface Project {
  id: string;
  name: string;
  learningScope: string;
  startDate: string;
  endDate: string;
  targetGoals: string;
  createdAt: string;
  updatedAt: string;
  totalFocusTimeSeconds: number;
  stages: Stage[];
  status: 'active' | 'completed';
  fullViewUnlocked: boolean;
}

export interface ProjectBackupData {
  version: string;
  exportedAt: string;
  projects: Project[];
  activeProjectId?: string | null;
  aiSettings?: AISettings;
}

export type ActiveScreen = 
  | 'home'
  | 'wizard'
  | 'project-list'
  | 'project-detail'
  | 'task-execution'
  | 'ai-settings';
