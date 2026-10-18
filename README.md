# SuperLearning 🧭
> **Aplicativo de Aprendizado Pessoal Orgânico, Processos Hiperpersonalizáveis e Inteligência Adaptativa**

Desenvolvido com foco rigoroso em **Deep Work (Trabalho Profundo)**, eliminação de sobrecarga cognitiva e validação por maestria ($\ge 90\%$).

---

## ⚡ Stack Tecnológica & Arquitetura

- **Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/) + TypeScript
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) (Design System minimalista, tema escuro de alto contraste, tipografia Inter & JetBrains Mono)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Inteligência Artificial:** Integração nativa com a API REST do [Google Gemini](https://aistudio.google.com/) (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-2.0-flash`) com chave configurada no navegador.
- **Persistência de Dados:** 100% Client-side (`localStorage`), com exportação (download de arquivo `.json`) e importação instantânea.
- **Deploy:** Otimizado para hospedagem estática/SPA na [Vercel](https://vercel.com/) via `vercel.json`.

---

## 🎯 Principais Funcionalidades

### 1. Página Inicial Minimalista
- Layout centrado e livre de distrações.
- Três botões com alta hierarquia visual:
  1. **Criar Projetos:** Wizard passo a passo sequencial.
  2. **Acessar Projetos:** Painel unificado de projetos ativos, concluídos e métricas de foco.
  3. **Configurações de IA:** Modal para inserir a chave do Gemini e ajustar parâmetros.

### 2. Wizard de Criação de Projetos
1. **Nome do Projeto**
2. **O que quero aprender** (Escopo técnico detalhado)
3. **Data de Início e Data Final** (Seletores de cronograma)
4. **Alvos a serem atingidos** (Metas quantitativas ou qualitativas)

### 3. Geração de Roteiro por IA em Hierarquia Estrita
- **Etapas (Tarefas principais)**
- Cada Etapa gera rigorosamente **5 Tópicos (Subtarefas)**
- Cada Tópico gera **Subtópicos** acionáveis, **Guia de Pesquisa Autônoma** e **5 Desafios de Avaliação**.

### 4. Visualização Restrita Anti-Sobrecarga Cognitiva
- Ao abrir um projeto, o sistema exibe **apenas a próxima tarefa pendente**, bloqueando visualmente as demais para evitar paralisia de escolha.
- O roteiro completo de todas as etapas e tópicos é desbloqueado integralmente assim que o usuário conclui uma tarefa com maestria ($\ge 90\%$).

### 5. Página de Execução da Tarefa (Modo Foco e Aprendizado)
- **Guia de Pesquisa Gerada por IA:** Esboço técnico de estudo, conceitos-chave, consultas de busca recomendadas com cópia em 1 clique e perguntas de reflexão.
- **Cronômetro de Foco Deliberado:**
  - Botões de *Iniciar Foco* e *Pausar / Parar*.
  - Sinais sonoros sutis sintetizados via Web Audio API.
  - O tempo decorrido é computado em tempo real e salvo no banco de dados local do projeto ao pausar ou concluir.
  - **Modo Zen:** Visualização em tela cheia sem distrações.
- **Módulo de Avaliação (5 Desafios/Questões):**
  - Questões objetivas e argumentativas.
  - `Guardar e não responder`: Salva rascunho localmente no navegador.
  - `Guardar e responder`: Submete as respostas para análise adaptativa da IA.

### 6. Lógica de Validação Adaptativa (Feedback Loop da IA)
- **Critério de Aprovação:** Mínimo de **90% de acerto**.
  - **Cenário 1 ($\ge 90\%$):** Libera imediatamente a próxima tarefa, exibe relatório corretivo e fornece material de reforço específico para pequenas falhas.
  - **Cenário 2 ($< 90\%$):** Bloqueia a progressão, reconstrói o modelo mental com uma nova perspectiva pedagógica e gera automaticamente 5 novas questões adaptativas focadas nos erros demonstrados.

### 7. Exportação e Importação de Backup
- Backup completo de todos os projetos em arquivo `.json`.
- Restauração instantânea com validação de integridade.

---

## 🚀 Executando Localmente

1. Clone o repositório ou acesse a pasta do projeto:
   ```bash
   cd SuperLearning
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse no navegador:
   `http://localhost:5173`

---

## 🌐 Deploy na Vercel

### Opção 1: Via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Opção 2: Via GitHub + Painel Vercel
1. Crie um repositório no GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: SuperLearning initial release"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/superlearning.git
   git push -u origin main
   ```
2. Acesse [vercel.com](https://vercel.com), clique em **"Add New Project"** e importe o repositório.
3. As configurações serão detectadas automaticamente pelo arquivo `vercel.json` (`outputDirectory: "dist"`).
4. Clique em **Deploy**.

---

## 🔑 Configuração da Chave do Google Gemini

1. Obtenha sua chave gratuita no [Google AI Studio](https://aistudio.google.com/app/apikey).
2. No aplicativo, clique em **Configurações de IA**.
3. Cole sua chave e clique em **Salvar Configurações**.
4. *(Opcional)* Se você não tiver uma chave no momento, o aplicativo dispõe do **Modo Demonstração**, gerando roteiros e avaliações inteligentes usando templates heurísticos integrados.
