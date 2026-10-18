import type { AISettings, Stage, EvaluationResult, TopicTask } from '../types';
import { KNOWLEDGE_LEVELS } from '../types';

interface GenerateRoadmapParams {
  name: string;
  scope: string;
  knowledgeArea: string;
  knowledgeLevel: number;
  startDate: string;
  endDate: string;
  targetGoals: string;
}

const CLEAN_JSON_REGEX = /```(?:json)?\s*([\s\S]*?)\s*```/i;

function extractCleanJSON(text: string): string {
  const match = text.match(CLEAN_JSON_REGEX);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.trim();
}

/**
 * Call Google Gemini REST API directly with response_mime_type: "application/json"
 * Uses gemini-3.8-flash by default as requested by the Gemini API
 */
async function callGemini(prompt: string, systemInstruction: string, settings: AISettings): Promise<string> {
  const apiKey = settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada. Insira sua chave nas Configurações de IA.');
  }

  // Automatically migrate deprecated model to gemini-3.8-flash
  let model = settings.model || 'gemini-3.8-flash';
  if (model === 'gemini-2.5-flash' || model === 'gemini-1.5-flash') {
    model = 'gemini-3.8-flash';
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: settings.temperature ?? 0.7,
      responseMimeType: 'application/json',
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error?.message || `Erro HTTP ${response.status} na API do Gemini.`;
      
      if (response.status === 400 && message.includes('API_KEY_INVALID')) {
        throw new Error('Chave de API do Gemini inválida. Verifique sua chave nas configurações.');
      }
      if (response.status === 429) {
        throw new Error('Limite de taxa da API excedido (Quota). Tente novamente em alguns instantes.');
      }
      throw new Error(`Falha no Gemini: ${message}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('A API do Gemini retornou uma resposta vazia.');
    }

    return candidateText;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Erro de conexão ao comunicar com o Google Gemini.');
  }
}

/**
 * AI Assistance to Formulate Realistic Quantitative & Qualitative Goals
 * Tailored to the Knowledge Area, Scope, and Prior Knowledge Level (0 to 5)
 */
export async function generateSuggestedGoals(
  scope: string,
  knowledgeArea: string,
  knowledgeLevel: number,
  settings: AISettings
): Promise<string> {
  const levelInfo = KNOWLEDGE_LEVELS.find(l => l.level === knowledgeLevel) || KNOWLEDGE_LEVELS[0];

  if (!settings.apiKey?.trim()) {
    if (settings.useMockFallback) {
      return generateDomainSuggestedGoals(scope, knowledgeArea, knowledgeLevel);
    }
    throw new Error('Configure sua Chave de API do Gemini ou ative o Modo Demonstração nas Configurações.');
  }

  const systemInstruction = `Você é um Mentor Sênior Especialista em ${knowledgeArea} e Engenheiro de Andragogia Focada.
O usuário quer aprender sobre o escopo informado, mas não possui experiência para saber quais metas e marcos são tecnicamente eficazes.
Sua missão:
A partir do escopo, da Área de Conhecimento ("${knowledgeArea}") e do Nível Prévio (${knowledgeLevel}/5):
1. Formular com extrema clareza pelo menos 3 objetivos QUANTITATIVOS realistas (ex.: horas de foco no cronômetro, número de projetos/exercícios/textos construídos, índice de acerto >=90% em avaliações, testes práticos).
2. Formular pelo menos 2 objetivos QUALITATIVOS (ex.: articulação do modelo mental sem jargão, diagnóstico de falhas, capacidade de conversação/análise crítica no domínio).
3. Entregar o texto pronto e estruturado em português, com linguagem profissional e sem floreios vazios.
Responda em formato JSON puro com a chave "goalsText": string.`;

  const prompt = `Área de Conhecimento: ${knowledgeArea}
Escopo de Aprendizado: ${scope}
Nível de Conhecimento Prévio: Nível ${knowledgeLevel} (${levelInfo.title}) - ${levelInfo.description}

Formule ao menos 3 objetivos quantitativos e ao menos 2 objetivos qualitativos específicos e realistas para este tema.`;

  try {
    const rawResult = await callGemini(prompt, systemInstruction, settings);
    const cleanJson = extractCleanJSON(rawResult);
    const parsed = JSON.parse(cleanJson);
    return parsed.goalsText || parsed.targetGoals || cleanJson;
  } catch (err) {
    console.error('Failed to generate suggested goals with Gemini:', err);
    if (settings.useMockFallback) {
      return generateDomainSuggestedGoals(scope, knowledgeArea, knowledgeLevel);
    }
    throw err;
  }
}

/**
 * Domain-specific Mock Goal Generator
 */
function generateDomainSuggestedGoals(scope: string, knowledgeArea: string, knowledgeLevel: number): string {
  const isLanguage = knowledgeArea.includes('Idioma');
  const isBusiness = knowledgeArea.includes('Negócio');

  if (isLanguage) {
    return [
      `🎯 Metas de Aprendizado em Idiomas (Nível ${knowledgeLevel}/5)`,
      '',
      '📊 Objetivos Quantitativos:',
      `1. Acumular no mínimo ${15 + knowledgeLevel * 5} horas de imersão e foco ativo registradas no cronômetro da plataforma.`,
      `2. Reter ativamente e aplicar em frases ao menos ${150 + knowledgeLevel * 100} palavras e estruturas sintáticas essenciais de "${scope.slice(0, 30)}...".`,
      `3. Atingir 90%+ de acerto nos desafios avaliativos de compreensão auditiva, gramática e conversação de cada etapa.`,
      '',
      '💡 Objetivos Qualitativos:',
      `1. Conseguir manter um diálogo espontâneo de 5 minutos sobre situações cotidianas ou temas do escopo sem recorrer à tradução mental.`,
      `2. Compreender a lógica fonética e gramatical nativa (sons, conjugações e entonação) em materiais autênticos (áudios/textos).`
    ].join('\n');
  }

  if (isBusiness) {
    return [
      `🎯 Metas Estratégicas de Negócios (Nível ${knowledgeLevel}/5)`,
      '',
      '📊 Objetivos Quantitativos:',
      `1. Acumular no mínimo ${12 + knowledgeLevel * 4} horas de estudo analítico no cronômetro da plataforma.`,
      `2. Estruturar ao menos 2 análises de caso completas com planilhas, modelos financeiros ou planos de ação executáveis.`,
      `3. Obter pontuação superior a 90% em todos os 5 desafios de validação técnica por etapa.`,
      '',
      '💡 Objetivos Qualitativos:',
      `1. Tomar decisões estratégicas fundamentadas em métricas de risco, retorno e viabilidade econômica para "${scope.slice(0, 30)}...".`,
      `2. Apresentar um pitch de síntese executiva defendendo os trade-offs do modelo sem usar jargões vagos.`
    ].join('\n');
  }

  // Default / Tech
  return [
    `🎯 Metas Calibradas por IA (${knowledgeArea} - Nível ${knowledgeLevel}/5)`,
    '',
    '📊 Objetivos Quantitativos:',
    `1. Registrar no mínimo ${10 + knowledgeLevel * 5} horas de prática deliberada no cronômetro de foco da aplicação.`,
    `2. Desenvolver do zero ao menos ${knowledgeLevel <= 2 ? '2 projetos/provas de conceito funcionais' : '3 soluções completas com testes automatizados e benchmarks'}.`,
    `3. Atingir no mínimo 90% de aproveitamento em todas as baterias de avaliação adaptativa.`,
    '',
    '💡 Objetivos Qualitativos:',
    `1. Explicar o modelo mental de "${scope.slice(0, 35)}..." para outro profissional a partir de primeiros princípios, sem copiar soluções prontas.`,
    `2. Identificar, reproduzir e solucionar com autonomia pelo menos 3 cenários críticos de falha ou casos extremos no domínio.`
  ].join('\n');
}

/**
 * Generate full learning roadmap structured into:
 * Stages -> 5 Topics each -> Subtopics, Research Guide, 5 Questions
 * Strict domain personalization
 */
export async function generateLearningRoadmap(
  params: GenerateRoadmapParams,
  settings: AISettings
): Promise<Stage[]> {
  const levelInfo = KNOWLEDGE_LEVELS.find(l => l.level === params.knowledgeLevel) || KNOWLEDGE_LEVELS[0];

  if (!settings.apiKey?.trim()) {
    if (settings.useMockFallback) {
      return generateDomainRoadmap(params);
    }
    throw new Error('Por favor, informe sua Chave de API do Gemini ou ative o Modo Demonstração nas Configurações de IA.');
  }

  const systemInstruction = `Você é um Arquiteto de Aprendizagem de Elite Especialista em ${params.knowledgeArea} e Andragogia de Alto Desempenho.
Sua missão é criar um roteiro de aprendizado orgânico, hiperestruturado e 100% PERSONALIZADO para o assunto "${params.name}" dentro da área "${params.knowledgeArea}".

DIRETRIZES FUNDAMENTAIS ANTI-PADRONIZAÇÃO:
1. PROIBIDO USAR NOMES GENÉRICOS DE TEMPLATE (como "Análise de Primeiros Princípios e Primitivas", "Taxonomia e Modelagem de Domínio", etc.).
2. TODOS os títulos de Etapas e Tópicos DEVEM SER NOMES TÉCNICOS E CONCRETOS do tema que o aluno deseja aprender.
   - Se for Idioma (ex: Espanhol): Use tópicos como "Fonética e Sons Distintos", "Verbos Ser vs Estar", "Pretéritos Indefinido e Imperfeito", "Expressões Idiomáticas e Diálogos".
   - Se for Tecnologia (ex: Docker): Use "Arquitetura de Namespaces e Cgroups", "Dockerfile Multi-stage", "Redes Bridge e Overlay", "Volumes e Persistência".
   - Se for Finanças: Use "Demonstração do Resultado (DRE)", "Fluxo de Caixa Livre", "Múltiplos EV/EBITDA e P/L".
3. Adapte a profundidade pedagógica estritamente ao Nível de Conhecimento Prévio (${params.knowledgeLevel}/5):
   - Nível 0-1: Fundamentos essenciais, vocabulário primitivo, sem assumir pré-requisitos não explicados.
   - Nível 2-3: Construção prática guiada, superação de tutoriais ingênuos, código/análise do zero.
   - Nível 4-5: Casos extremos, arquitetura de baixo nível, benchmarks, depuração avançada e nuances de escala.

REGRAS ESTRITAS DE FORMATO:
1. Responda ESTRITAMENTE em formato JSON puro.
2. Crie 3 ou 4 Etapas (Stages).
3. CADA Etapa DEVE CONTER EXATAMENTE 5 Tópicos (Topics). Nem mais, nem menos.
4. CADA Tópico deve conter:
   - title: nome específico do tópico no assunto
   - description: síntese do objetivo de estudo
   - subtopics: lista de 3 a 5 subtópicos práticos (title, description)
   - researchGuide: {
       overview: detalhamento técnico específico sobre o que pesquisar,
       keyConcepts: 4 a 6 termos reais do domínio,
       searchQueries: 3 a 5 buscas precisas para documentação oficial,
       reflectionQuestions: 3 perguntas instigantes sobre o tópico,
       recommendedApproaches: 2 a 3 métodos de prática
     }
   - questions: EXATAMENTE 5 desafios avaliativos (3 objetivos com options e 2 argumentativos/práticos). Cada questão com: id, type ('objective'|'argumentative'), question, options (se objective), feedback (critério de resposta ideal).`;

  const prompt = `Área de Conhecimento: ${params.knowledgeArea}
Nome do Projeto: ${params.name}
O que quero aprender (Escopo): ${params.scope}
Nível de Conhecimento Prévio: Nível ${params.knowledgeLevel} (${levelInfo.title}) - ${levelInfo.description}
Metas e Alvos: ${params.targetGoals}
Período: ${params.startDate} até ${params.endDate}

Gere o roteiro em JSON com a chave "stages": Array<{
  id: string,
  order: number,
  title: string,
  description: string,
  topics: Array<{
    id: string,
    title: string,
    description: string,
    subtopics: Array<{ id: string, title: string, description: string }>,
    researchGuide: {
      overview: string,
      keyConcepts: string[],
      searchQueries: string[],
      reflectionQuestions: string[],
      recommendedApproaches: string[]
    },
    questions: Array<{
      id: string,
      type: "objective" | "argumentative",
      question: string,
      options?: string[],
      feedback?: string
    }>
  }>
}>`;

  const rawResult = await callGemini(prompt, systemInstruction, settings);
  const cleanJson = extractCleanJSON(rawResult);

  try {
    const parsed = JSON.parse(cleanJson);
    const stagesData = parsed.stages || parsed;

    if (!Array.isArray(stagesData)) {
      throw new Error('Formato retornado pela IA não contém a lista de etapas esperada.');
    }

    return stagesData.map((stage: any, sIdx: number) => ({
      id: stage.id || `stage-${sIdx + 1}-${Date.now()}`,
      order: stage.order || sIdx + 1,
      title: stage.title || `Etapa ${sIdx + 1}: ${params.name}`,
      description: stage.description || '',
      completed: false,
      topics: (stage.topics || []).slice(0, 5).map((topic: any, tIdx: number) => ({
        id: topic.id || `topic-${sIdx + 1}-${tIdx + 1}-${Date.now()}`,
        title: topic.title || `Tópico ${tIdx + 1}`,
        description: topic.description || '',
        completed: false,
        focusTimeSeconds: 0,
        subtopics: (topic.subtopics || []).map((sub: any, subIdx: number) => ({
          id: sub.id || `sub-${sIdx + 1}-${tIdx + 1}-${subIdx + 1}`,
          title: sub.title || `Subtópico ${subIdx + 1}`,
          description: sub.description || '',
          completed: false,
        })),
        researchGuide: topic.researchGuide || {
          overview: `Pesquise as referências principais e documentação de ${topic.title}.`,
          keyConcepts: [topic.title, 'Princípios', 'Aplicações', 'Prática'],
          searchQueries: [`${topic.title} documentação`, `${topic.title} tutorial aprofundado`],
          reflectionQuestions: ['Qual é a função central deste conceito no projeto?'],
          recommendedApproaches: ['Aplique em um caso prático imediatamente.'],
        },
        questions: (topic.questions || []).slice(0, 5).map((q: any, qIdx: number) => ({
          id: q.id || `q-${sIdx + 1}-${tIdx + 1}-${qIdx + 1}`,
          type: q.type === 'argumentative' ? 'argumentative' : 'objective',
          question: q.question || `Questão ${qIdx + 1}`,
          options: Array.isArray(q.options) && q.options.length > 0 ? q.options : (q.type === 'argumentative' ? undefined : ['Opção A', 'Opção B', 'Opção C', 'Opção D']),
          userAnswer: '',
          feedback: q.feedback || '',
        })),
        evaluationHistory: [],
        draftAnswers: {},
      }))
    }));
  } catch (err) {
    console.error('Failed to parse Gemini roadmap JSON:', err, cleanJson);
    if (settings.useMockFallback) {
      console.warn('Falling back to domain template due to JSON parse error.');
      return generateDomainRoadmap(params);
    }
    throw new Error('A IA não retornou um formato JSON válido. Tente novamente ou verifique as instruções.');
  }
}

/**
 * Adaptive evaluation of 5 challenges based on a strict 90% threshold
 */
export async function evaluateTaskAnswers(
  task: TopicTask,
  answers: Record<string, string>,
  projectScope: string,
  settings: AISettings
): Promise<EvaluationResult> {
  const answeredCount = Object.keys(answers).filter(k => answers[k]?.trim()).length;
  if (answeredCount === 0) {
    throw new Error('Por favor, responda às questões antes de submeter para avaliação.');
  }

  if (!settings.apiKey?.trim()) {
    if (settings.useMockFallback) {
      return generateMockEvaluation(task, answers);
    }
    throw new Error('Chave de API do Gemini ausente. Configure-a para habilitar a correção inteligente.');
  }

  const systemInstruction = `Você é um Avaliador Pedagógico Rigoroso e Mentor Especialista no Domínio.
Critério Crítico: O percentual de aprovação é de no mínimo 90% (score >= 90).
Sua missão:
1. Avaliar com precisão cirúrgica as respostas fornecidas pelo estudante para as 5 questões da tarefa.
2. Calcular o score final ponderado de 0 a 100 baseado na profundidade, correção técnica e clareza.
3. Se score >= 90:
   - passed: true
   - correctiveReport: Relatório corretivo pontual reconhecendo o domínio e apontando com elegância qualquer ajuste fino.
   - reinforcementMaterial: Referências de aprofundamento de alto nível para ir além do básico.
4. Se score < 90:
   - passed: false
   - pedagogicalPerspective: Análise aprofundada de por que as respostas falharam, desconstruindo o erro conceitual do aluno e fornecendo uma nova perspectiva didática/modelo mental para que ele entenda o cerne do assunto.
   - newQuestions: EXATAMENTE 5 novas questões (3 objetivas com options, 2 argumentativas) focadas estritamente nos pontos cegos e erros identificados nas respostas submetidas.
Retorne ESTRITAMENTE em formato JSON puro.`;

  const prompt = `Contexto do Projeto: ${projectScope}
Tarefa Atual: ${task.title}
Descrição da Tarefa: ${task.description}
Conceitos-chave: ${task.researchGuide.keyConcepts.join(', ')}

Questões e Respostas do Aluno:
${task.questions.map((q, idx) => `
Questão ${idx + 1} (${q.type}): ${q.question}
${q.options ? `Opções:\n${q.options.map(o => `- ${o}`).join('\n')}` : ''}
Gabarito/Diretriz esperada: ${q.feedback || 'Domínio técnico fundamentado'}
Resposta do Aluno: ${answers[q.id] || '(Sem resposta)'}
`).join('\n---\n')}

Gere a resposta JSON com o seguinte schema:
{
  "score": number,
  "passed": boolean,
  "correctiveReport": string,
  "reinforcementMaterial": string,
  "pedagogicalPerspective": string,
  "newQuestions": Array<{
    "id": string,
    "type": "objective" | "argumentative",
    "question": string,
    "options": string[],
    "feedback": string
  }>
}`;

  const rawResult = await callGemini(prompt, systemInstruction, settings);
  const cleanJson = extractCleanJSON(rawResult);

  try {
    const result = JSON.parse(cleanJson);
    const score = typeof result.score === 'number' ? Math.min(100, Math.max(0, result.score)) : 80;
    const passed = score >= 90;

    return {
      score,
      passed,
      evaluatedAt: new Date().toISOString(),
      correctiveReport: result.correctiveReport || (passed 
        ? 'Excelente domínio demonstrado. Todos os pontos fundamentais foram articulados com precisão.' 
        : 'As respostas demonstraram esforço, mas contêm lacunas conceituais críticas que impedem a liberação da próxima etapa.'),
      reinforcementMaterial: passed ? (result.reinforcementMaterial || 'Recomendamos a leitura de artigos avançados de arquitetura e casos reais de benchmark.') : undefined,
      pedagogicalPerspective: !passed ? (result.pedagogicalPerspective || 'Identificamos que a compreensão das premissas de execução requer um novo ângulo conceitual.') : undefined,
      newQuestions: (!passed && Array.isArray(result.newQuestions) && result.newQuestions.length > 0)
        ? result.newQuestions.slice(0, 5).map((nq: any, idx: number) => ({
            id: `nq-${Date.now()}-${idx + 1}`,
            type: nq.type === 'argumentative' ? 'argumentative' : 'objective',
            question: nq.question || `Nova Questão de Reforço ${idx + 1}`,
            options: Array.isArray(nq.options) ? nq.options : (nq.type === 'argumentative' ? undefined : ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D']),
            feedback: nq.feedback || '',
          }))
        : undefined,
    };
  } catch (err) {
    console.error('Failed to parse evaluation response:', err, cleanJson);
    if (settings.useMockFallback) {
      return generateMockEvaluation(task, answers);
    }
    throw new Error('Falha ao processar a avaliação da IA. Tente novamente.');
  }
}

/**
 * Domain-Aware Dynamic Roadmap Generator (Used when offline or in demo mode)
 * Produces topic titles specifically tailored to the subject and area
 */
function generateDomainRoadmap(params: GenerateRoadmapParams): Stage[] {
  const isLanguage = params.knowledgeArea.includes('Idioma');
  const isBusiness = params.knowledgeArea.includes('Negócio');
  const subject = params.name.trim();

  let stagesMeta: Array<{ title: string; desc: string; topics: string[] }> = [];

  if (isLanguage) {
    stagesMeta = [
      {
        title: `Fase 1: Fonética, Estrutura e Vocabulário Inicial de ${subject}`,
        desc: `Construção da base de escuta, pronúncia correta e frases básicas essenciais.`,
        topics: [
          `Alfabeto, Fonemas e Sons Específicos em ${subject}`,
          `Artigos, Pronomes e Construção de Frases Simples`,
          `Vocabulário de Sobrevivência e Expressões Cotidianas`,
          `Conjugação no Tempo Presente e Verbos Fundamentais`,
          `Prática de Compreensão Auditiva e Diálogos Iniciais`
        ]
      },
      {
        title: `Fase 2: Expansão Gramatical, Tempos Passados e Diálogos em ${subject}`,
        desc: `Estruturação de narrativas, conexões frasais e consolidação de conversação.`,
        topics: [
          `Tempos Verbais do Passado e Marcadores Temporais`,
          `Preposições, Conectivos e Fluidez de Pensamento`,
          `Vocabulário Situacional (Trabalho, Viagem e Ambientes)`,
          `Perguntas, Negações e Estruturas Argumentativas`,
          `Simulação de Conversação e Produção Textual Guiada`
        ]
      },
      {
        title: `Fase 3: Fluência Situacional, Futuro e Imersão em ${subject}`,
        desc: `Autonomia de fala, compreensão de materiais nativos e expressão de ideias complexas.`,
        topics: [
          `Futuro, Condicional e Expressão de Hipóteses`,
          `Expressões Idiomáticas e Gírias Naturais em ${subject}`,
          `Consumo de Notícias, Podcasts e Conteúdo Nativo`,
          `Debate Crítico e Redação de Textos Argumentativos`,
          `Síntese de Fluência e Apresentação Oral Completa`
        ]
      }
    ];
  } else if (isBusiness) {
    stagesMeta = [
      {
        title: `Fase 1: Diagnóstico de Mercado e Modelagem em ${subject}`,
        desc: `Compreensão do ecossistema, segmentação de clientes e proposta de valor.`,
        topics: [
          `Mapeamento de Dores e Validação de Proposta de Valor`,
          `Análise Competitiva e Posicionamento Estratégico`,
          `Modelos de Receita, Precificação e Unit Economics`,
          `Canais de Aquisição e Estrutura de Go-To-Market`,
          `Construção do Business Model Canvas e Hipóteses Críticas`
        ]
      },
      {
        title: `Fase 2: Viabilidade Financeira e Operações em ${subject}`,
        desc: `Demonstrativos financeiros, fluxo de caixa e estruturação de processos.`,
        topics: [
          `Estruturação de DRE e Projeções Financeiras`,
          `Cálculo de CAC, LTV e Ponto de Equilíbrio (Break-even)`,
          `Mapeamento de Processos Operacionais e Ferramental`,
          `Gestão de Riscos, Compliance e Aspectos Regulatórios`,
          `Métricas de Desempenho e Definição de OKRs`
        ]
      },
      {
        title: `Fase 3: Escala, Governança e Tomada de Decisão em ${subject}`,
        desc: `Alavancas de crescimento, captação e sustentabilidade de longo prazo.`,
        topics: [
          `Estratégias de Retenção e Expansão de Clientes`,
          `Financiamento, Captação e Relação com Investidores`,
          `Governança Corporativa e Gestão de Pessoas`,
          `Otimização de Gargalos e Automação de Processos`,
          `Pitch Executivo e Plano Estratégico Consolidado`
        ]
      }
    ];
  } else {
    // Default / Tech / Sciences
    stagesMeta = [
      {
        title: `Fase 1: Fundamentos Nucleares e Arquitetura de ${subject}`,
        desc: `Compreensão de baixo nível, fluxo de dados e conceitos primitivos de ${params.scope.slice(0, 40)}.`,
        topics: [
          `Fundamentos de Arquitetura e Primitivas em ${subject}`,
          `Configuração de Ambiente e Ferramental Essencial`,
          `Modelagem de Dados e Fluxo de Execução`,
          `Padrões de Projeto e Contratos de Interface em ${subject}`,
          `Primeira Implementação Prática e Validação Mínima`
        ]
      },
      {
        title: `Fase 2: Construção Modular, Tratamento de Falhas e Resiliência em ${subject}`,
        desc: `Implementação robusta, isolamento de componentes e mitigação de erros.`,
        topics: [
          `Isolamento de Componentes e Baixo Acoplamento`,
          `Tratamento de Erros, Exceções e Resiliência`,
          `Testes Automatizados e Validação de Invariantes em ${subject}`,
          `Instrumentação, Métricas e Diagnóstico de Execução`,
          `Refatoração e Boas Práticas Canônicas da Indústria`
        ]
      },
      {
        title: `Fase 3: Otimização de Performance, Casos de Borda e Maestria em ${subject}`,
        desc: `Diagnóstico de gargalos, segurança e consolidação em escala real.`,
        topics: [
          `Profilagem de Desempenho e Eliminação de Gargalos`,
          `Segurança em Profundidade e Validações de Borda`,
          `Automação de Pipelines e Ciclos de Feedback em ${subject}`,
          `Resolução de Problemas Complexos em Produção`,
          `Síntese Integrativa e Construção do Projeto Final`
        ]
      }
    ];
  }

  return stagesMeta.map((sMeta, sIdx) => ({
    id: `stage-${sIdx + 1}`,
    order: sIdx + 1,
    title: sMeta.title,
    description: sMeta.desc,
    completed: false,
    topics: sMeta.topics.map((tTitle, tIdx) => ({
      id: `topic-${sIdx + 1}-${tIdx + 1}`,
      title: tTitle,
      description: `Estudo focado sobre "${tTitle}" aplicado ao escopo do projeto.`,
      completed: false,
      focusTimeSeconds: 0,
      subtopics: [
        {
          id: `sub-${sIdx + 1}-${tIdx + 1}-1`,
          title: `Desconstrução Conceitual de ${tTitle}`,
          description: `Identificar os termos fundamentais e criar um mapa mental de funcionamento.`,
          completed: false,
        },
        {
          id: `sub-${sIdx + 1}-${tIdx + 1}-2`,
          title: `Aplicação Prática e Exercício Guiado`,
          description: `Executar um teste prático autônomo validando o conceito.`,
          completed: false,
        },
        {
          id: `sub-${sIdx + 1}-${tIdx + 1}-3`,
          title: `Diagnóstico de Erros Comuns e Casos de Borda`,
          description: `Entender onde iniciantes costumam errar e como prevenir falhas silenciosas.`,
          completed: false,
        },
        {
          id: `sub-${sIdx + 1}-${tIdx + 1}-4`,
          title: `Síntese e Documentação em Notas Pessoais`,
          description: `Redigir notas concisas para fixação de longo prazo.`,
          completed: false,
        }
      ],
      researchGuide: {
        overview: `Nesta tarefa de "${tTitle}", pesquise a documentação canônica e referências autênticas sobre ${params.scope}. Evite atalhos superficiais e busque entender o porquê de cada regra.`,
        keyConcepts: [tTitle, 'Fundamentos', 'Aplicações Reais', 'Prevenção de Falhas'],
        searchQueries: [
          `"${tTitle}" guia oficial`,
          `${tTitle} melhores práticas`,
          `como dominar ${tTitle}`
        ],
        reflectionQuestions: [
          'Qual é a consequência prática de negligenciar este conceito?',
          'Como este tópico se integra às metas quantitativas e qualitativas definidas?',
          'Se você tivesse que ensinar isso para outra pessoa em 2 minutos, o que destacaria?'
        ],
        recommendedApproaches: [
          'Pratique em sessões de foco ininterrupto usando o cronômetro.',
          'Consulte materiais de referência antes de fóruns informais.'
        ]
      },
      questions: [
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-1`,
          type: 'objective',
          question: `Qual é o princípio fundamental a ser observado ao estudar ${tTitle}?`,
          options: [
            'Compreender as relações de causa e efeito subjacentes antes de memorizar superficialmente.',
            'Decorar respostas aleatórias sem testar a aplicação no mundo real.',
            'Ignorar os conceitos fundamentais para focar apenas em atalhos rápidos.',
            'Estudar sem pausas e sem reflexão crítica sobre o que foi lido.'
          ],
          feedback: 'A compreensão causal e a prática deliberada são o padrão ouro de aprendizado.'
        },
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-2`,
          type: 'objective',
          question: `Como validar que você realmente dominou o tópico "${tTitle}"?`,
          options: [
            'Ser capaz de explicar o conceito do zero e aplicá-lo em um problema sem consultar gabarito.',
            'Apenas ler o texto uma vez sem testar na prática.',
            'Marcar o tópico como concluído sem fazer os exercícios.',
            'Copiar e colar notas de terceiros.'
          ],
          feedback: 'A capacidade de evocação ativa e aplicação prática comprova domínio real.'
        },
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-3`,
          type: 'objective',
          question: `Em caso de dúvida ou erro durante este estudo, qual a melhor estratégia?`,
          options: [
            'Consultar a documentação canônica, isolar o ponto de dúvida e testar uma hipótese.',
            'Desistir imediatamente do projeto de aprendizado.',
            'Pular para a próxima etapa sem entender a causa-raiz.',
            'Culpar o cronômetro de foco.'
          ],
          feedback: 'Diagnóstico metódico e isolamento da causa-raiz garantem retenção profunda.'
        },
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-4`,
          type: 'argumentative',
          question: `Explique sucintamente o que você entendeu sobre "${tTitle}" e dê um exemplo prático de aplicação no contexto do seu projeto.`,
          feedback: 'Avalia a capacidade de abstração, síntese e aplicação contextualizada.'
        },
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-5`,
          type: 'argumentative',
          question: `Quais foram as principais dificuldades conceituais que você superou ao estudar este tópico de forma autônoma?`,
          feedback: 'Demonstra pensamento crítico e autoavaliação metacognitiva.'
        }
      ],
      evaluationHistory: [],
      draftAnswers: {}
    }))
  }));
}

/**
 * Intelligent Mock Evaluator
 */
function generateMockEvaluation(task: TopicTask, answers: Record<string, string>): EvaluationResult {
  const answeredKeys = Object.keys(answers).filter(k => answers[k]?.trim());
  const answeredLength = answeredKeys.reduce((acc, k) => acc + (answers[k]?.trim().length || 0), 0);
  
  const hasFullAnswers = answeredKeys.length >= 5;
  const isDetailed = answeredLength > 120;

  let score = 0;
  if (!hasFullAnswers) {
    score = Math.round(50 + (answeredKeys.length / 5) * 30);
  } else if (isDetailed) {
    score = 92 + Math.floor(Math.random() * 6);
  } else {
    score = 78 + Math.floor(Math.random() * 8);
  }

  const passed = score >= 90;

  if (passed) {
    return {
      score,
      passed: true,
      evaluatedAt: new Date().toISOString(),
      correctiveReport: `Excelente desempenho (${score}% de aproveitamento). Suas respostas demonstraram profunda absorção conceitual e capacidade analítica em "${task.title}". As questões conceituais foram respondidas com rigor, e a argumentação prática evidenciou execução deliberada. Um pequeno ponto de refinamento: certifique-se de sempre formalizar os invariantes de borda em diagramas.`,
      reinforcementMaterial: `Material de Reforço Recomendado:
- Estudo Complementar: Casos avançados de aplicação em produção e resolução de ambiguidades.
- Desafio de Maestria: Teste seus conhecimentos explicando esse mesmo conceito para alguém em nível inferior.`
    };
  } else {
    return {
      score,
      passed: false,
      evaluatedAt: new Date().toISOString(),
      correctiveReport: `Aproveitamento obtido: ${score}%. O critério mínimo de maestria é de 90%. A progressão permanecerá temporariamente bloqueada para assegurar que você não acumule dívida cognitiva para as etapas seguintes.`,
      pedagogicalPerspective: `Nova Perspectiva Pedagógica:
Identificamos que sua resposta tratou "${task.title}" principalmente como uma sequência mecânica de passos, sem internalizar o modelo mental subjacente.
Pense neste conceito não como uma regra a ser memorizada, mas como um "contrato de comunicação":
1. Antes de executar qualquer ação, defina claramente quais premissas NUNCA podem ser violadas.
2. Isole as variáveis externas para que seu foco se mantenha estritamente no núcleo do problema.
3. Revise o Guia de Pesquisa e observe as perguntas de reflexão antes de tentar novamente.`,
      newQuestions: [
        {
          id: `nq-${Date.now()}-1`,
          type: 'objective',
          question: `[Reforço Adaptativo] Ao reconsiderar ${task.title}, qual é o erro mais perigoso ao assumir premissas sem validação?`,
          options: [
            'Propagação silenciosa de falhas conceituais que inviabilizam etapas posteriores.',
            'O tempo de leitura diminuir.',
            'O editor exibir uma mensagem de sugestão estética.',
            'O ambiente rodar perfeitamente sem problemas.'
          ],
          feedback: 'Erros conceituais silenciosos são a causa-raiz de bloqueios futuros.'
        },
        {
          id: `nq-${Date.now()}-2`,
          type: 'objective',
          question: `[Reforço Adaptativo] Qual é a diferença fundamental entre memorizar termos e internalizar o modelo mental deste tópico?`,
          options: [
            'O modelo mental permite resolver problemas inéditos deduzindo a solução a partir de primeiros princípios.',
            'Memorizar termos é superior porque elimina a necessidade de pensar criticamente.',
            'Não há diferença real entre memorização e entendimento profundo.',
            'Modelos mentais não têm utilidade prática.'
          ],
          feedback: 'Primeiros princípios conferem autonomia cognitiva real.'
        },
        {
          id: `nq-${Date.now()}-3`,
          type: 'objective',
          question: `[Reforço Adaptativo] Para atingir o critério de 90% nesta etapa, qual atitude deve ser adotada?`,
          options: [
            'Explicar com clareza a relação de causa e efeito entre os conceitos estudados e a aplicação real.',
            'Escrever respostas vagas para economizar tempo.',
            'Ignorar os conceitos-chave do Guia de Pesquisa.',
            'Desistir ao primeiro obstáculo.'
          ],
          feedback: 'Articulação de causa e efeito comprova domínio real.'
        },
        {
          id: `nq-${Date.now()}-4`,
          type: 'argumentative',
          question: `[Reforço Adaptativo] À luz da nova perspectiva pedagógica, reescreva em suas próprias palavras qual é a função primordial de "${task.title}".`,
          feedback: 'Avalia se o novo modelo mental foi absorvido com profundidade.'
        },
        {
          id: `nq-${Date.now()}-5`,
          type: 'argumentative',
          question: `[Reforço Adaptativo] Dê um exemplo concreto de uma falha ou mal-entendido que aconteceria se você aplicasse esse conceito de forma incorreta.`,
          feedback: 'A capacidade de prever falhas demonstra compreensão profunda do domínio.'
        }
      ]
    };
  }
}
