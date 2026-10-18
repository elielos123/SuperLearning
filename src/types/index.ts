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
  knowledgeLevel: number; // 0 to 5
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

export const KNOWLEDGE_LEVELS = [
  {
    level: 0,
    title: 'Nível 0: Nada',
    shortDesc: 'Zero absoluto de conhecimento prévio.',
    description: 'Nunca tive nenhum contato com este assunto. Preciso começar do absoluto zero, com analogias fundamentais e conceitos primitivos.',
  },
  {
    level: 1,
    title: 'Nível 1: Apenas Nominal',
    shortDesc: 'Ouvi falar sobre o tema.',
    description: 'Sei que o termo existe e conheço apenas o nome ou sigla, mas não compreendo sua estrutura interna nem suas aplicações práticas.',
  },
  {
    level: 2,
    title: 'Nível 2: Superficial',
    shortDesc: 'Já li alguma coisa a respeito.',
    description: 'Possuo noções periféricas e leituras esparsas de artigos ou vídeos, mas nunca apliquei nem construí nada de forma autônoma.',
  },
  {
    level: 3,
    title: 'Nível 3: Inicial',
    shortDesc: 'Contato direto e prático com o objeto.',
    description: 'Já experimentei o ferramental ou teoria em tutoriais ou projetos guiados, conhecendo o fluxo básico de ponta a ponta.',
  },
  {
    level: 4,
    title: 'Nível 4: Razoável',
    shortDesc: 'Domínio do nível básico sem ser especialista.',
    description: 'Consigo produzir soluções funcionais da base, porém ainda enfrento dificuldades em casos de borda, decisões arquiteturais profundas e otimização.',
  },
  {
    level: 5,
    title: 'Nível 5: Avançado / Domínio',
    shortDesc: 'Domina o assunto e busca aprofundamento extremo.',
    description: 'Tenho domínio sólido dos conceitos e práticas convencionais; meu objetivo é investigar internals, sistemas de altíssima escala, trade-offs extremos e estado da arte.',
  },
] as const;
