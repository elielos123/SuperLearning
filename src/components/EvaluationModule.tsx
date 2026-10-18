import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { TopicTask, EvaluationResult } from '../types';
import { useLearning } from '../context/LearningContext';
import { 
  Sparkles, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  BookOpen, 
  Award,
  ArrowRight
} from 'lucide-react';

interface EvaluationModuleProps {
  task: TopicTask;
  onAdvanceToNextTask?: () => void;
}

export const EvaluationModule: React.FC<EvaluationModuleProps> = ({ task, onAdvanceToNextTask }) => {
  const { 
    saveDraftAnswers, 
    submitEvaluation, 
    isEvaluating, 
    errorMessage, 
    clearError,
  } = useLearning();

  // Initialize answers from draftAnswers or existing questions' user answers
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    task.questions.forEach(q => {
      initial[q.id] = task.draftAnswers[q.id] || q.userAnswer || '';
    });
    return initial;
  });

  const [lastEval, setLastEval] = useState<EvaluationResult | undefined>(task.lastEvaluation);

  // Sync if task changes
  useEffect(() => {
    const nextAnswers: Record<string, string> = {};
    task.questions.forEach(q => {
      nextAnswers[q.id] = task.draftAnswers[q.id] || q.userAnswer || '';
    });
    setAnswers(nextAnswers);
    setLastEval(task.lastEvaluation);
  }, [task]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Guardar e não responder: saves partial answers locally
  const handleSaveDraft = () => {
    clearError();
    saveDraftAnswers(answers);
  };

  // Guardar e responder: triggers adaptive AI evaluation
  const handleSubmitAndEvaluate = async () => {
    clearError();
    try {
      const result = await submitEvaluation(answers);
      setLastEval(result);

      if (result.passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#ffffff']
        });
      }
    } catch {
      // Handled in context
    }
  };

  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-4">
        <div>
          <h3 className="text-lg font-medium text-white tracking-tight m-0 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Módulo de Avaliação por Maestria
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            5 Desafios objetivos e argumentativos. Critério de progressão: mínimo de <strong>90% de acerto</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-neutral-400">
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
            {answeredCount}/5 Respondidas
          </span>
          {task.completed && (
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tarefa Concluída
            </span>
          )}
        </div>
      </div>

      {/* EVALUATION FEEDBACK CARD (Cenário 1 or Cenário 2) */}
      {lastEval && (
        <div className={`p-6 rounded-2xl border transition-all duration-300 space-y-5 ${
          lastEval.passed 
            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xl shadow-emerald-950/20'
            : 'bg-amber-950/20 border-amber-500/40 shadow-xl shadow-amber-950/20'
        }`}>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-base ${
                lastEval.passed 
                  ? 'bg-emerald-400 text-neutral-950 shadow-md shadow-emerald-400/20' 
                  : 'bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20'
              }`}>
                {lastEval.score}%
              </div>

              <div>
                <h4 className="text-base font-medium text-white tracking-tight m-0 flex items-center gap-2">
                  {lastEval.passed ? (
                    <>
                      <span>Maestria Atingida (≥ 90%)</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </>
                  ) : (
                    <>
                      <span>Critério Não Atingido (&lt; 90%)</span>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </>
                  )}
                </h4>
                <span className="text-xs font-mono text-neutral-400">
                  {lastEval.passed 
                    ? 'Próxima tarefa desbloqueada imediatamente no roteiro.' 
                    : 'Progressão bloqueada temporariamente para consolidação cognitiva.'}
                </span>
              </div>
            </div>

            {lastEval.passed && onAdvanceToNextTask && (
              <button
                onClick={onAdvanceToNextTask}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs transition-all cursor-pointer shadow-md"
              >
                <span>Avançar para Próxima Tarefa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Corrective Report */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-1.5">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
              Relatório Corretivo da IA:
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-line">
              {lastEval.correctiveReport}
            </p>
          </div>

          {/* SCENARIO 1: Reinforcement Material */}
          {lastEval.passed && lastEval.reinforcementMaterial && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Material de Reforço Focado em Falhas Menores:
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-line">
                {lastEval.reinforcementMaterial}
              </p>
            </div>
          )}

          {/* SCENARIO 2: Pedagogical Perspective & Adaptation */}
          {!lastEval.passed && lastEval.pedagogicalPerspective && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 space-y-2">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Nova Perspectiva Pedagógica da IA:
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-line">
                {lastEval.pedagogicalPerspective}
              </p>
              <div className="text-[11px] font-mono text-amber-300/80 pt-1">
                ↳ Foram formuladas 5 novas questões adaptativas abaixo focadas especificamente nos erros demonstrados.
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5 QUESTIONS LIST */}
      <div className="space-y-6">
        {task.questions.map((q, idx) => {
          const isObjective = q.type === 'objective' && q.options && q.options.length > 0;
          const currentVal = answers[q.id] || '';

          return (
            <div 
              key={q.id}
              className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-4 hover:border-neutral-700 transition-colors"
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-800 border border-neutral-700 text-xs font-mono font-medium text-neutral-300 flex items-center justify-center">
                    0{idx + 1}
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-850">
                    {q.type === 'objective' ? 'Objetiva' : 'Argumentativa / Prática'}
                  </span>
                </div>
              </div>

              {/* Question text */}
              <p className="text-sm font-medium text-white leading-relaxed">
                {q.question}
              </p>

              {/* Objective Options */}
              {isObjective ? (
                <div className="space-y-2 pt-1">
                  {q.options?.map((option, optIdx) => {
                    const isSelected = currentVal === option;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleAnswerChange(q.id, option)}
                        className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500/80 text-white font-medium shadow-sm'
                            : 'bg-neutral-950/60 border-neutral-850 hover:border-neutral-750 text-neutral-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center text-[10px] ${
                          isSelected ? 'border-emerald-400 bg-emerald-400 text-neutral-950 font-bold' : 'border-neutral-700'
                        }`}>
                          {isSelected ? '✓' : String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Argumentative Textarea */
                <div className="pt-1">
                  <textarea
                    rows={4}
                    value={currentVal}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Articule sua resposta com clareza, embasamento técnico e raciocínio crítico..."
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 text-xs leading-relaxed transition-all resize-none"
                  />
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two Mandatory Submission Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-850">
        
        {/* Button 1: Guardar e não responder */}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isEvaluating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-neutral-400" />
          <span>Guardar e não responder</span>
        </button>

        {/* Button 2: Guardar e responder */}
        <button
          type="button"
          onClick={handleSubmitAndEvaluate}
          disabled={isEvaluating || answeredCount === 0}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs uppercase tracking-wide transition-all shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isEvaluating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
              <span>Avaliando Respostas (IA)...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Guardar e responder</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
};
