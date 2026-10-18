import type { AISettings, Stage, EvaluationResult, TopicTask } from '../types';

interface GenerateRoadmapParams {
  name: string;
  scope: string;
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
 */
async function callGemini(prompt: string, systemInstruction: string, settings: AISettings): Promise<string> {
  const apiKey = settings.apiKey?.trim();

  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada. Insira sua chave nas Configurações de IA.');
  }

  const model = settings.model || 'gemini-2.5-flash';
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
 * Generate full learning roadmap structured into:
 * Stages -> 5 Topics each -> Subtopics, Research Guide, 5 Questions
 */
export async function generateLearningRoadmap(
  params: GenerateRoadmapParams,
  settings: AISettings
): Promise<Stage[]> {
  // If no API key is provided and mock fallback is active, generate realistic pedagogical roadmap
  if (!settings.apiKey?.trim()) {
    if (settings.useMockFallback) {
      return generateMockRoadmap(params);
    }
    throw new Error('Por favor, informe sua Chave de API do Gemini ou ative o Modo Demonstração nas Configurações de IA.');
  }

  const systemInstruction = `Você é um Arquiteto de Aprendizagem e Engenheiro de Software Sênior Especialista em Andragogia e Deep Work.
Sua missão é projetar um roteiro de aprendizado orgânico, hiperestruturado e cirúrgico.
Regras estritas de saída:
1. Responda ESTRITAMENTE em formato JSON puro.
2. A hierarquia DEVE ter 3 ou 4 Etapas (Stages).
3. CADA Etapa DEVE CONTER EXATAMENTE 5 Tópicos (Topics). Nem mais, nem menos.
4. CADA Tópico deve conter:
   - title: string
   - description: síntese do objetivo
   - subtopics: lista de 3 a 5 subtópicos práticos (title, description)
   - researchGuide: {
       overview: detalhamento do que pesquisar de forma autônoma,
       keyConcepts: 4 a 6 conceitos-chave,
       searchQueries: 3 a 5 termos de busca cirúrgicos para Google/Docs/Arxiv,
       reflectionQuestions: 3 perguntas instigantes para guiar o estudo,
       recommendedApproaches: 2 a 3 práticas recomendadas
     }
   - questions: EXATAMENTE 5 desafios avaliativos (3 objetivos com options e 2 argumentativos/práticos). Cada questão com: id, type ('objective'|'argumentative'), question, options (se objective), feedback (critério de resposta ideal).`;

  const prompt = `Crie o roteiro de aprendizado para o seguinte projeto:
Nome: ${params.name}
O que quero aprender: ${params.scope}
Metas e Alvos: ${params.targetGoals}
Período: ${params.startDate} até ${params.endDate}

Estruture em JSON com a chave "stages": Array<{
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
      title: stage.title || `Etapa ${sIdx + 1}`,
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
          overview: 'Pesquise a documentação técnica oficial e estude a arquitetura conceitual deste tópico.',
          keyConcepts: ['Fundamentos', 'Implementação', 'Casos de Borda', 'Melhores Práticas'],
          searchQueries: [`${topic.title} deep dive`, `${topic.title} architecture best practices`],
          reflectionQuestions: ['Como esse conceito se conecta ao objetivo final do projeto?'],
          recommendedApproaches: ['Construa uma prova de conceito rápida e teste em código.'],
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
      console.warn('Falling back to local template due to JSON parse error.');
      return generateMockRoadmap(params);
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

  // If no API key or mock fallback
  if (!settings.apiKey?.trim()) {
    if (settings.useMockFallback) {
      return generateMockEvaluation(task, answers);
    }
    throw new Error('Chave de API do Gemini ausente. Configure-a para habilitar a correção inteligente.');
  }

  const systemInstruction = `Você é um Avaliador Pedagógico Rigoroso e Mentor Técnico Sênior.
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
  "score": number, // 0 a 100
  "passed": boolean, // true se score >= 90, false caso contrário
  "correctiveReport": string,
  "reinforcementMaterial": string, // presente se passed == true
  "pedagogicalPerspective": string, // presente se passed == false
  "newQuestions": Array<{ // presente se passed == false (exatamente 5 questões)
    "id": string,
    "type": "objective" | "argumentative",
    "question": string,
    "options": string[], // se objective
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
 * Built-in High-Fidelity Pedagogical Mock Generator
 */
function generateMockRoadmap(params: GenerateRoadmapParams): Stage[] {
  const stageTemplates = [
    {
      title: 'Fundamentos Arquiteturais e Mentalidade',
      desc: 'Compreensão de baixo nível, conceitos primitivos e modelagem de pensamento.',
      topicPrefixes: [
        'Análise de Primeiros Princípios e Primitivas',
        'Taxonomia e Modelagem de Domínio',
        'Padrões Estruturais e Fluxos de Dados',
        'Configuração de Ambiente e Ferramental de Alta Frequência',
        'Anti-patterns Comuns e Heurísticas de Falha'
      ]
    },
    {
      title: 'Execução Prática e Construção Modular',
      desc: 'Implementação guiada, criação de provas de conceito e composição de sistemas.',
      topicPrefixes: [
        'Prototipagem Rápida e Validação de Hipóteses',
        'Isolamento de Componentes e Acoplamento Mínimo',
        'Estratégias de Tratamento de Erros e Resiliência',
        'Instrumentação, Logs e Métricas de Execução',
        'Refatoração Cirúrgica e Otimização Inicial'
      ]
    },
    {
      title: 'Aprofundamento, Resolução de Gargalos e Maestria',
      desc: 'Casos extremos, performance de ponta e consolidação orgânica do conhecimento.',
      topicPrefixes: [
        'Profilagem de Desempenho e Diagnóstico de Fricção',
        'Segurança em Profundidade e Validações de Borda',
        'Automação de Pipelines e Ciclos de Feedback Rápido',
        'Resolução de Problemas Críticos em Cenários Complexos',
        'Síntese Integrativa e Construção do Projeto Final'
      ]
    }
  ];

  return stageTemplates.map((sTemplate, sIdx) => ({
    id: `stage-${sIdx + 1}`,
    order: sIdx + 1,
    title: sTemplate.title,
    description: sTemplate.desc,
    completed: false,
    topics: sTemplate.topicPrefixes.map((topicTitle, tIdx) => ({
      id: `topic-${sIdx + 1}-${tIdx + 1}`,
      title: `${topicTitle}: ${params.name}`,
      description: `Estudo focado e prático sobre ${topicTitle.toLowerCase()} aplicado a ${params.scope}.`,
      completed: false,
      focusTimeSeconds: 0,
      subtopics: [
        {
          id: `sub-${sIdx + 1}-${tIdx + 1}-1`,
          title: `Desconstrução de Termos Fundamentais`,
          description: `Identificar as 3 principais terminologias e diagramar o fluxo mental.`,
          completed: false,
        },
        {
          id: `sub-${sIdx + 1}-${tIdx + 1}-2`,
          title: `Prática Deliberada em Código/Documentação`,
          description: `Escrever um exemplo prático demonstrando o funcionamento mínimo.`,
          completed: false,
        },
        {
          id: `sub-${sIdx + 1}-${tIdx + 1}-3`,
          title: `Teste de Casos de Borda e Falhas Controladas`,
          description: `Induzir deliberadamente uma quebra para entender as mensagens de erro e causas-raiz.`,
          completed: false,
        },
        {
          id: `sub-${sIdx + 1}-${tIdx + 1}-4`,
          title: `Documentação Pessoal e Resumo em 3 Linhas`,
          description: `Sintetizar o aprendizado em notas sucintas para revisão futura.`,
          completed: false,
        }
      ],
      researchGuide: {
        overview: `Nesta tarefa, seu objetivo autônomo é dominar os princípios de "${topicTitle}" sem atalhos cognitivos. Pesquise a documentação canônica, explore especificações técnicas e crie analogias mentais sólidas.`,
        keyConcepts: [
          'Invariantes de Sistema',
          'Alocação e Custo Cognitivo',
          'Trade-offs de Arquitetura',
          'Isolamento e Modulação'
        ],
        searchQueries: [
          `"${topicTitle}" in depth explanation`,
          `${params.name} ${topicTitle} best practices github`,
          `how to design ${topicTitle} architecture`
        ],
        reflectionQuestions: [
          'Qual é o trade-off principal desta abordagem em relação a soluções mais ingênuas?',
          'Se esse componente falhar em produção, qual é o impacto cascata?',
          'Como você explicaria esse conceito para um colega sem usar jargões técnicos?'
        ],
        recommendedApproaches: [
          'Abra um arquivo em branco e escreva a implementação do zero antes de usar bibliotecas.',
          'Consulte a especificação técnica oficial antes de fóruns informais.'
        ]
      },
      questions: [
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-1`,
          type: 'objective',
          question: `Qual é a premissa central para garantir robustez ao trabalhar com ${topicTitle.toLowerCase()}?`,
          options: [
            'Minimizar estados mutáveis e manter dependências explícitas e isoladas.',
            'Centralizar todas as variáveis globais para facilitar o acesso indiscriminado.',
            'Ignorar validações de entrada para priorizar apenas a velocidade de compilação.',
            'Acoplar a lógica de negócio diretamente à camada de apresentação sem abstração.'
          ],
          feedback: 'A opção correta prioriza imutabilidade, contratos explícitos e baixo acoplamento.'
        },
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-2`,
          type: 'objective',
          question: `Em caso de degradação de performance ou sobrecarga neste tópico, qual heurística deve ser aplicada primeiro?`,
          options: [
            'Medir com ferramentas de profiling para identificar o gargalo real antes de qualquer suposição.',
            'Reescrever o código inteiro sem instrumentação prévia.',
            'Aumentar aleatoriamente o tempo limite de espera (timeouts).',
            'Desabilitar os testes automatizados para liberar memória.'
          ],
          feedback: 'Diagnóstico orientado a métricas (profiling) é o padrão ouro de engenharia.'
        },
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-3`,
          type: 'objective',
          question: `Como a metodologia de "Deep Work" (Trabalho Profundo) se integra a esta etapa de aprendizado?`,
          options: [
            'Sessões focadas sem distrações intercaladas com reflexão ativa produzem retenção neural de longo prazo.',
            'Multitarefa agressiva com notificações ligadas aumenta a velocidade de leitura.',
            'Copiar e colar soluções sem ler gera aprendizado orgânico.',
            'Estudar sem pausas por 12 horas consecutivas sem testar na prática.'
          ],
          feedback: 'O foco deliberado e a prática espaçada sustentam o aprendizado orgânico.'
        },
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-4`,
          type: 'argumentative',
          question: `Explique sucintamente como você aplicou os conceitos de ${topicTitle} na prática e quais foram os principais desafios técnicos encontrados.`,
          feedback: 'A resposta deve articular o processo de investigação, a prova de conceito realizada e as decisões tomadas.'
        },
        {
          id: `q-${sIdx + 1}-${tIdx + 1}-5`,
          type: 'argumentative',
          question: `Quais foram as 2 principais fontes consultadas durante seu estudo e qual insight foi mais transformador para sua compreensão?`,
          feedback: 'Demonstra rigor na escolha das fontes e capacidade de abstração do insight principal.'
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
- Artigo Técnico: "Designing Resilient Interfaces and Low-Coupling Systems"
- Desafio de Maestria: Experimente estressar essa implementação simulando latência e perda de pacotes para validar seu modelo mental.`
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
1. Antes de executar qualquer ação, defina claramente quais premissas NUNCA podem ser violadas (invariantes).
2. Isole as variáveis externas para que seu foco se mantenha estritamente no núcleo do problema.
3. Revise o Guia de Pesquisa e observe as perguntas de reflexão antes de tentar novamente.`,
      newQuestions: [
        {
          id: `nq-${Date.now()}-1`,
          type: 'objective',
          question: `[Reforço Adaptativo] Ao reconsiderar ${task.title}, qual é o erro mais perigoso ao assumir premissas sem validação?`,
          options: [
            'Propagação silenciosa de estado corrompido que só explode em fases posteriores.',
            'O editor de código exibir um aviso de indentação estética.',
            'O tempo de compilação diminuir temporariamente.',
            'O consumo de café do desenvolvedor aumentar.'
          ],
          feedback: 'Erros silenciosos e acúmulo de débito conceitual são a causa-raiz de falhas em cascata.'
        },
        {
          id: `nq-${Date.now()}-2`,
          type: 'objective',
          question: `[Reforço Adaptativo] Qual é a diferença fundamental entre memorizar sintaxe e internalizar o modelo mental deste tópico?`,
          options: [
            'O modelo mental permite resolver problemas inéditos deduzindo a solução a partir de primeiros princípios.',
            'Memorizar sintaxe é superior porque elimina a necessidade de pensar criticamente.',
            'Não há diferença real, ambos dependem de repetição mecânica sem reflexão.',
            'Modelos mentais só são úteis para teorias puras sem aplicação prática.'
          ],
          feedback: 'Primeiros princípios conferem autonomia cognitiva.'
        },
        {
          id: `nq-${Date.now()}-3`,
          type: 'objective',
          question: `[Reforço Adaptativo] Para atingir o critério de 90% nesta etapa, qual atitude técnica deve ser adotada?`,
          options: [
            'Explicar com clareza a relação de causa e efeito entre os conceitos estudados e a implementação.',
            'Escrever respostas monossilábicas para economizar tempo.',
            'Ignorar os conceitos-chave descritos no Guia de Pesquisa.',
            'Desistir ao primeiro sinal de dúvida.'
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
          question: `[Reforço Adaptativo] Dê um exemplo concreto de uma falha que aconteceria se você implementasse esse conceito de forma incorreta.`,
          feedback: 'A capacidade de prever falhas demonstra compreensão profunda do domínio.'
        }
      ]
    };
  }
}
