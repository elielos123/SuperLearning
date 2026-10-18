import React, { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { KNOWLEDGE_LEVELS, KNOWLEDGE_AREAS } from '../types';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Target, 
  BookOpen, 
  FileText, 
  Loader2, 
  Info,
  GraduationCap,
  Wand2,
  CheckCircle2,
  LayoutGrid
} from 'lucide-react';

const AREA_ICONS: Record<string, string> = {
  'Tecnologia & Programação': '💻',
  'Idiomas & Linguística': '🌐',
  'Negócios, Finanças & Empreendedorismo': '📊',
  'Ciências Exatas & Engenharia': '⚙️',
  'Saúde, Biologia & Medicina': '🧬',
  'Humanidades, Filosofia & Ciências Sociais': '📚',
  'Artes, Design & Criação': '🎨',
  'Concursos & Certificações Profissionais': '🏆',
  'Outra Área de Conhecimento': '🔍',
};

export const ProjectWizard: React.FC = () => {
  const { 
    createProject, 
    suggestGoals,
    isGeneratingRoadmap, 
    isGeneratingGoals,
    setScreen, 
    errorMessage, 
    aiSettings 
  } = useLearning();

  const TOTAL_STEPS = 6;
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [knowledgeArea, setKnowledgeArea] = useState<string>('');
  const [knowledgeLevel, setKnowledgeLevel] = useState<number>(0);
  
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextMonth);
  const [targetGoals, setTargetGoals] = useState('');

  const [validationError, setValidationError] = useState<string | null>(null);

  const canProceedStep1 = name.trim().length >= 3;
  const canProceedStep2 = scope.trim().length >= 10;
  const canProceedStep3 = knowledgeArea.trim().length > 0;
  const canProceedStep4 = knowledgeLevel >= 0 && knowledgeLevel <= 5;
  const canProceedStep5 = startDate && endDate && startDate <= endDate;
  const canProceedStep6 = targetGoals.trim().length >= 5;

  const handleNext = () => {
    setValidationError(null);
    if (currentStep === 1 && !canProceedStep1) {
      setValidationError('Por favor, informe um nome com pelo menos 3 caracteres.');
      return;
    }
    if (currentStep === 2 && !canProceedStep2) {
      setValidationError('Descreva o escopo com mais detalhes (mínimo 10 caracteres) para a IA calibrar o roteiro.');
      return;
    }
    if (currentStep === 3 && !canProceedStep3) {
      setValidationError('Selecione a área de conhecimento do projeto para que a IA possa personalizar o roteiro.');
      return;
    }
    if (currentStep === 4 && !canProceedStep4) {
      setValidationError('Selecione seu nível de conhecimento prévio (0 a 5).');
      return;
    }
    if (currentStep === 5 && !canProceedStep5) {
      setValidationError('A data final deve ser igual ou posterior à data de início.');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setValidationError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleAIAssistGoals = async () => {
    setValidationError(null);
    try {
      const generated = await suggestGoals(scope, knowledgeArea, knowledgeLevel);
      setTargetGoals(generated);
    } catch {
      // Handled in context
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!canProceedStep6) {
      setValidationError('Por favor, defina os alvos do projeto (ou utilize o botão "Ajuda da IA para formulação de objetivos").');
      return;
    }

    try {
      await createProject({
        name,
        scope,
        knowledgeArea,
        knowledgeLevel,
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
    { number: 3, label: 'Área' },
    { number: 4, label: 'Nível' },
    { number: 5, label: 'Datas' },
    { number: 6, label: 'Alvos' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-5">
          <div>
            <h2 className="text-xl font-medium text-white tracking-tight m-0">
              Novo Projeto de Aprendizado
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Etapa {currentStep} de {TOTAL_STEPS} • Estruturação guiada por inteligência adaptativa
            </p>
          </div>
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${TOTAL_STEPS}, 1fr)` }}>
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
                <span className={`text-[10px] sm:text-[11px] font-mono transition-colors truncate ${
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
                A IA utilizará heurísticas pedagógicas de alta fidelidade calibradas para o seu nível prévio. Você pode conectar sua chave de API nas Configurações a qualquer momento.
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
                  Construindo Roteiro Calibrado — {knowledgeArea} (Nível {knowledgeLevel}/5)
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  A IA está estruturando etapas estratégicas, 5 tópicos por etapa, guias autônomos e 5 desafios avaliativos rigorosamente ajustados ao seu domínio e nível de partida.
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-400/80 animate-pulse">
                Processando modelo mental & andragogia em {knowledgeArea}...
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
                    'Espanhol Conversacional',
                    'Deep Learning & LLMs',
                    'Algoritmos Concorrentes em Go',
                    'Finanças Pessoais & Investimentos',
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
                  Descreva com detalhes o que você quer dominar: conceitos, problemas a resolver, nível de profundidade desejado. Quanto mais específico, mais personalizado será o roteiro.
                </p>
              </div>

              <textarea
                autoFocus
                rows={6}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="Descreva detalhadamente o que você precisa dominar. Ex: Quero aprender a arquitetar bancos de dados distribuídos com consenso Paxos/Raft, particionamento consistente e resiliência a partições de rede com foco em métricas de baixa latência."
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 text-sm leading-relaxed transition-all resize-none"
              />
              <p className="text-[11px] text-neutral-600 font-mono">{scope.length} caracteres · Mínimo: 10</p>
            </div>
          )}

          {/* STEP 3: Área de Conhecimento */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                  3. Área de Conhecimento
                </label>
                <p className="text-xs text-neutral-400 font-light">
                  Selecione o domínio principal do projeto. A IA usará esta categoria para construir tópicos com vocabulário e metodologia específicos da área.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {KNOWLEDGE_AREAS.map((area) => {
                  const isSelected = knowledgeArea === area;
                  const icon = AREA_ICONS[area] || '🔍';
                  return (
                    <div
                      key={area}
                      onClick={() => setKnowledgeArea(area)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500/70 shadow-md shadow-amber-950/20'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/40'
                      }`}
                    >
                      <span className="text-xl shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium leading-tight block truncate ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                          {area}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Nível de Conhecimento Prévio (0 a 5) */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                  4. Nível de Conhecimento Prévio (0 a 5)
                </label>
                <p className="text-xs text-neutral-400 font-light">
                  Seja sincero com seu ponto de partida. A IA calibrará o vocabulário, a profundidade das etapas e os objetivos especificamente para este nível dentro de <span className="text-amber-400 font-medium">{knowledgeArea}</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {KNOWLEDGE_LEVELS.map((lvl) => {
                  const isSelected = knowledgeLevel === lvl.level;
                  return (
                    <div
                      key={lvl.level}
                      onClick={() => setKnowledgeLevel(lvl.level)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-950/20'
                          : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-emerald-400 text-neutral-950' 
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                      }`}>
                        {lvl.level}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                            {lvl.title}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-500">
                            — {lvl.shortDesc}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                          {lvl.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Data de Início e Data Final */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  5. Cronograma (Datas)
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

              {/* Summary card */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">Resumo do Projeto</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-neutral-500">Projeto: </span>
                    <span className="text-neutral-200">{name}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Área: </span>
                    <span className="text-amber-400">{knowledgeArea.split(',')[0]}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Nível: </span>
                    <span className="text-emerald-400">{knowledgeLevel}/5</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Prazo: </span>
                    <span className="text-neutral-200">
                      {startDate && endDate
                        ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} dias`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Alvos e Metas (Com Botão de Ajuda da IA) */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    6. Alvos e Objetivos (≥ 3 Quantitativos e ≥ 2 Qualitativos)
                  </label>
                  <p className="text-xs text-neutral-500 font-light">
                    Não sabe exatamente como mensurar? A IA pode formular objetivos realistas para você com base no escopo, área <span className="text-amber-400">({knowledgeArea.split(',')[0]})</span> e nível ({knowledgeLevel}/5).
                  </p>
                </div>

                {/* BOTÃO CRÍTICO: Ajuda da IA para formulação de objetivos */}
                <button
                  type="button"
                  onClick={handleAIAssistGoals}
                  disabled={isGeneratingGoals}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-500/40 text-xs font-medium transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                  title="A IA analisa seu escopo, área de conhecimento e nível para propor objetivos técnicos realistas"
                >
                  {isGeneratingGoals ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Formulando Objetivos...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ajuda da IA para formulação de objetivos</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                autoFocus
                rows={7}
                value={targetGoals}
                onChange={(e) => setTargetGoals(e.target.value)}
                placeholder="Clique no botão acima 'Ajuda da IA para formulação de objetivos' para gerar automaticamente metas quantitativas e qualitativas, ou digite suas próprias metas aqui..."
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 text-xs leading-relaxed transition-all resize-none font-mono"
              />

              <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                <span>Premissa: A IA estrutura as métricas para você não precisar adivinhar o que é relevante.</span>
                {targetGoals && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Objetivos Definidos
                  </span>
                )}
              </div>
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

            {currentStep < TOTAL_STEPS ? (
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
                disabled={isGeneratingRoadmap || !canProceedStep6}
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
