import type { Project, AISettings, ProjectBackupData } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'superlearning_projects',
  SETTINGS: 'superlearning_ai_settings',
  ACTIVE_PROJECT: 'superlearning_active_project_id',
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  apiKey: '',
  model: 'gemini-3.8-flash',
  temperature: 0.7,
  useMockFallback: true,
};

export const getStoredAISettings = (): AISettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw);
    
    // Automatically migrate deprecated models to gemini-3.8-flash
    let model = parsed.model || 'gemini-3.8-flash';
    if (model === 'gemini-2.5-flash' || model === 'gemini-1.5-flash' || !model) {
      model = 'gemini-3.8-flash';
    }

    return { 
      ...DEFAULT_AI_SETTINGS, 
      ...parsed,
      model,
    };
  } catch (err) {
    console.error('Failed to load AI settings from localStorage:', err);
    return DEFAULT_AI_SETTINGS;
  }
};

export const saveStoredAISettings = (settings: AISettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save AI settings to localStorage:', err);
  }
};

export const getStoredProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch (err) {
    console.error('Failed to load projects from localStorage:', err);
    return [];
  }
};

export const saveStoredProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage:', err);
  }
};

export const getActiveProjectId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT);
};

export const saveActiveProjectId = (id: string | null): void => {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT);
  }
};

/**
 * Generates and triggers browser download of backup JSON
 */
export const exportBackupJSON = (projects: Project[], settings?: AISettings): void => {
  const backup: ProjectBackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    projects,
    activeProjectId: getActiveProjectId(),
    aiSettings: settings ? { ...settings, apiKey: settings.apiKey ? settings.apiKey : '' } : undefined,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `superlearning_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Validates and imports JSON file into storage
 */
export const importBackupJSON = async (file: File): Promise<{ projects: Project[]; settings?: AISettings }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as ProjectBackupData;
        
        if (!parsed || !Array.isArray(parsed.projects)) {
          throw new Error('Formato inválido de arquivo de backup.');
        }

        resolve({
          projects: parsed.projects,
          settings: parsed.aiSettings,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Falha ao processar arquivo JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsText(file);
  });
};
