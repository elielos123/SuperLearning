import React, { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Target, 
  BookOpen, 
  FileText,
  Loader2,
  Info
} from 'lucide-react';

export const ProjectWizard: React.FC = () => {
  const { createProject, isGeneratingRoadmap, setScreen, errorMessage, aiSettings } = useLearning();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextMonth);
  const [targetGoals, setTargetGoals] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  const canProceedStep1 = name.trim().length >= 3;
  const canProceedStep2 = scope.trim().length >= 10;
  const canProceedStep3 = startDate && endDate && startDate <= endDate;
  const canProceedStep4 = targetGoals.trim().length >= 5;

  const handleNext = () => {
    setValidationError(null);
    if (currentStep === 1 && !canProceedStep1) {
      setValidationError('Por favor, informe um nome com pelo menos 3 caracteres.');
      return;
    }
    if (currentStep === 2 && !canProceedStep2) {
      setValidationError('Descreva o escopo com mais detalhes (mínimo 10 caracteres) para a IA gerar um roteiro consistente.');
      return;
    }
    if (currentStep === 3 && !canProceedStep3) {
      setValidationError('A data final deve ser igual ou posterior à data de início.');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setValidationError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!canProceedStep4) {
      setValidationError('Por favor, descreva seus alvos ou metas principais.');
      return;
    }

    try {
      await createProject({
        name,
        scope,
        startDate,
        endDate,
        targetGoals,
      });
    } catch {
      // Error handled in context
    }
  };

  const steps = [
    { number: 1, label: 'Nome' },
    { number: 2, label: 'Escopo' },
    { number: 3, label: 'Cronograma' },
    { number: 4, label: 'Alvos' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 animate-in fade-in duration-300">
      <div className="w-full max-w-xl mx-auto space-y-8">
        
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
          <div>
            <h2 className="text-xl font-medium text-white tracking-tight m-0">
              Novo Projeto de Aprendizado
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Etapa {currentStep} de 4 • Estruturação guiada por inteligência adaptativa
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step) => {
            const isDone = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            return (
              <div key={step.number} className="flex flex-col gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isDone 
                      ? 'bg-emerald-400' 
                      : isCurrent 
                      ? 'bg-white' 
                      : 'bg-neutral-800'
                  }`}
                />
                <span className={`text-[11px] font-mono transition-colors ${
                  isCurrent ? 'text-white font-medium' : 'text-neutral-500'
                }`}>
                  0{step.number}. {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {(validationError || errorMessage) && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-900/60 text-red-200 text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>{validationError || errorMessage}</span>
          </div>
        )}

        {/* Informative Gemini API status hint */}
        {!aiSettings.apiKey && (
          <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-neutral-200 font-medium">Modo Demonstração Ativo:</span>
              <p className="text-neutral-400">
                Como nenhuma chave de API do Gemini foi inserida, o sistema usará um gerador pedagógico estruturado de alta fidelidade para você testar imediatamente. Você pode conectar sua chave a qualquer momento nas Configurações de IA.
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 sm:p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          
          {/* Loading Overlay */}
          {isGeneratingRoadmap && (
            <div className="absolute inset-0 bg-neutral-950/90 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4 backdrop-blur-md">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-medium text-white">
                  Construindo Roteiro de Alta Densidade
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  A IA está decompondo seu escopo em Etapas estratégicas, cada uma contendo rigorosamente 5 Tópicos, guias de pesquisa autônoma e 5 desafios avaliativos.
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-400/80 animate-pulse">
                Processando modelo mental & andragogia...
              </div>
            </div>
          )}

          {/* STEP 1: Nome do Projeto */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  1. Nome do Projeto
                </label>
                <p className="text-xs text-neutral-500">
                  Defina um título conciso e memorável para esta jornada.
                </p>
              </div>

              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Arquitetura de Sistemas Distribuídos"
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (canProceedStep1) handleNext();
                  }
                }}
              />

              {/* Quick suggestion tags */}
              <div className="pt-2">
                <span className="text-[11px] text-neutral-500 block mb-1.5">Exemplos rápidos:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Design System & Microfrontends',
                    'Deep Learning & LLM Fine-tuning',
                    'Algoritmos Concorrentes em Go',
                    'Next.js 15 & Server Actions'
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setName(sugg)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: O que quero aprender */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                  2. O que quero aprender (Escopo)
                </label>
                <p className="text-xs text-neutral-500">
                  Descreva conceitos, tecnologias, problemas que deseja solucionar e o nível de profundidade desejado.
                </p>
              </div>

              <textarea
                autoFocus
                rows={5}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Descreva detalhadamente o que você precisa dominar. Ex: Quero aprender a arquitetar bancos de dados distribuídos com consenso Paxos/Raft, particionamento consistente e resiliência a partições de rede com foco em métricas de baixa latência."
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 text-sm leading-relaxed transition-all resize-none"
              />
            </div>
          )}

          {/* STEP 3: Data de Início e Data Final */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  3. Cronograma (Datas)
                </label>
                <p className="text-xs text-neutral-500">
                  Estabeleça o horizonte temporal para criar senso de urgência e cadência orgânica.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">Data de Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500/70 text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500/70 text-sm transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Alvos a serem atingidos */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  4. Alvos e Metas (Quantitativos ou Qualitativos)
                </label>
                <p className="text-xs text-neutral-500">
                  Como você saberá que domina o assunto? Defina critérios de sucesso tangíveis.
                </p>
              </div>

              <textarea
                autoFocus
                rows={4}
                value={targetGoals}
                onChange={(e) => setTargetGoals(e.target.value)}
                placeholder="Ex.: 1) Criar um benchmark reprodutível em produção. 2) Atingir 90%+ em todos os desafios teóricos e argumentativos. 3) Acumular no mínimo 20 horas de foco deliberado sem distrações."
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 text-sm leading-relaxed transition-all resize-none"
              />
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-neutral-850">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isGeneratingRoadmap}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3.5 py-2 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 text-xs font-medium text-neutral-950 px-5 py-2.5 rounded-lg bg-white hover:bg-neutral-100 transition-all cursor-pointer shadow-md"
              >
                Próximo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isGeneratingRoadmap || !canProceedStep4}
                className="inline-flex items-center gap-2 text-xs font-medium text-neutral-950 px-5 py-2.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-md shadow-emerald-950 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gerar Roteiro por IA
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
