import React, { useState } from 'react';
import type { ResearchGuide, SubTopic } from '../types';
import { useLearning } from '../context/LearningContext';
import { 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  CheckCircle2, 
  Circle,
  Lightbulb,
  BookOpen
} from 'lucide-react';

interface ResearchGuideViewProps {
  guide: ResearchGuide;
  subtopics: SubTopic[];
}

export const ResearchGuideView: React.FC<ResearchGuideViewProps> = ({ guide, subtopics }) => {
  const { toggleSubtopicCompletion, showToast } = useLearning();
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const handleCopy = (query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(query);
    showToast('Termo de pesquisa copiado para a área de transferência.');
    setTimeout(() => setCopiedQuery(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview & Technical Outline */}
      <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-200 m-0">
            Esboço Técnico & Diretrizes de Investigação
          </h3>
        </div>

        <p className="text-sm text-neutral-300 font-light leading-relaxed whitespace-pre-line">
          {guide.overview}
        </p>

        {/* Key Concepts Chips */}
        {guide.keyConcepts && guide.keyConcepts.length > 0 && (
          <div className="pt-2 space-y-2 border-t border-neutral-850">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
              Conceitos-Chave para Absorção:
            </span>
            <div className="flex flex-wrap gap-2">
              {guide.keyConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-xs font-mono text-emerald-300"
                >
                  #{concept}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subtopics Actionable Checklist */}
      {subtopics && subtopics.length > 0 && (
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-200 m-0 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Subtarefas de Estudo & Validação Prática
            </h3>
            <span className="text-xs font-mono text-neutral-500">
              {subtopics.filter(s => s.completed).length}/{subtopics.length} completas
            </span>
          </div>

          <div className="space-y-2">
            {subtopics.map((sub) => (
              <div
                key={sub.id}
                onClick={() => toggleSubtopicCompletion(sub.id)}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                  sub.completed
                    ? 'bg-neutral-950/80 border-neutral-850 text-neutral-500'
                    : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-200'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-neutral-500 hover:text-emerald-400 transition-colors"
                >
                  {sub.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-600" />
                  )}
                </button>

                <div className="space-y-0.5">
                  <div className={`text-xs font-medium ${sub.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                    {sub.title}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-light leading-relaxed">
                    {sub.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Targeted Search Queries for Google / Technical Docs */}
      {guide.searchQueries && guide.searchQueries.length > 0 && (
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-200 m-0 flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-400" />
              Consultas Cirúrgicas Recomendadas
            </h3>
            <p className="text-xs text-neutral-500 font-light">
              Use estes termos exatos para encontrar papers, especificações canônicas e implementações no GitHub.
            </p>
          </div>

          <div className="space-y-2">
            {guide.searchQueries.map((query, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 flex items-center justify-between gap-3 group hover:border-neutral-700 transition-colors"
              >
                <div className="text-xs font-mono text-neutral-300 truncate max-w-lg">
                  {query}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(query)}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    title="Copiar termo"
                  >
                    {copiedQuery === query ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    title="Buscar no Google em nova aba"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reflection Questions */}
      {guide.reflectionQuestions && guide.reflectionQuestions.length > 0 && (
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-200 m-0 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Perguntas para Reflexão Crítica
            </h3>
            <p className="text-xs text-neutral-500 font-light">
              Antes de responder aos 5 desafios de avaliação, certifique-se de que consegue responder mentalmente a estas indagações:
            </p>
          </div>

          <div className="space-y-2">
            {guide.reflectionQuestions.map((question, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-850 text-xs text-neutral-300 font-light flex items-start gap-2.5"
              >
                <span className="text-amber-400/80 font-mono font-medium shrink-0">
                  0{idx + 1}.
                </span>
                <span className="leading-relaxed">{question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
