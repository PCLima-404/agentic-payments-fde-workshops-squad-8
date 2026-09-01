# Planejamento e Engenharia de Produto (Squad 8: Agentic Payments)

![Squad 8 Header](headers/agentic-payments-fde-workshops-mainheader-squad8.webp)

Documento normativo de alinhamentos estratégicos, sessões de discovery, backlog de épicos, quadro Kanban e histórico de decisões arquiteturais da **Squad 8** durante o período de **27 de Agosto a 31 de Agosto de 2026**.

---

## Sumário

1. [Visão Geral e Metodologia de Trabalho](#1-visão-geral-e-metodologia-de-trabalho)
2. [Sessões de Discovery de Produto (27 a 31 de Agosto)](#2-sessões-de-discovery-de-produto-27-a-31-de-agosto)
3. [Estrutura dos 5 Épicos Principais](#3-estrutura-dos-5-épicos-principais)
   * [3.1. Épico 1: MCP (Model Context Protocol)](#31-épico-1-mcp-model-context-protocol)
   * [3.2. Épico 2: AUTH e Limite](#32-épico-2-auth-e-limite)
   * [3.3. Épico 3: Regras de Negócio e Concorrência](#33-épico-3-regras-de-negócio-e-concorrência)
   * [3.4. Épico 4: Agente (API e Loop de Tool Calling)](#34-épico-4-agente-api-e-loop-de-tool-calling)
   * [3.5. Épico 5: Front-end e Experiência do Usuário](#35-épico-5-front-end-e-experiência-do-usuário)
4. [Quadro Kanban e Gestão no FigJam](#4-quadro-kanban-e-gestão-no-figjam)
   * [4.1. Link do Board e Fluxo de Trabalho](#41-link-do-board-e-fluxo-de-trabalho)
   * [4.2. Estrutura de Colunas do Kanban](#42-estrutura-de-colunas-do-kanban)
   * [4.3. Evidências Visuais e Prints do Processo](#43-evidências-visuais-e-prints-do-processo)
5. [Histórico de Decisões Arquiteturais (ADRs no Board)](#5-histórico-de-decisões-arquiteturais-adrs-no-board)
   * [5.1. Decisões Globais da Squad (@time)](#51-decisões-globais-da-squad-time)
   * [5.2. Decisões Técnicas das Tools MCP (@Éverson Filipe)](#52-decisões-técnicas-das-tools-mcp-éverson-filipe)
6. [Backlog Completo de Tarefas por Integrante (100% Mapeado)](#6-backlog-completo-de-tarefas-por-integrante-100-mapeado)
   * [6.1. Tarefas de Pedro César (@Pedro César)](#61-tarefas-de-pedro-césar-pedro-césar)
   * [6.2. Tarefas de Éverson Filipe (@Éverson Filipe Campos Da Silva Moura)](#62-tarefas-de-éverson-filipe-éverson-filipe-campos-da-silva-moura)
   * [6.3. Tarefas de Luis Filipe (@Luis Filipe Mendes Nogueira)](#63-tarefas-de-luis-filipe-luis-filipe-mendes-nogueira)
   * [6.4. Tarefas Transversais (@definir / @adefinir)](#64-tarefas-transversais-definir--adefinir)

---

## 1. Visão Geral e Metodologia de Trabalho

Com o objetivo de reproduzir a rotina real de um time de desenvolvimento backend sênior da UOL / Compass, a Squad 8 adotou:

* **Spec-Driven Development (SDD):** Desenvolvimento guiado por contratos prévios e normativos formalizados em [`docs/contrato-api.md`](./contrato-api.md).
* **Test-Driven e Defensive Development (TDD):** Cobertura com 107 testes unitários e de integração protegendo cálculos monetários, atomicidade, expiração de assentos e prevenção de alucinações.
* **Gitflow Adaptado:** Cada nova funcionalidade desenvolvida em branches específicas originadas da `master/main`, com pull requests revisados e commits semânticos padronizados (`feat:`, `fix:`, `docs:`, `test:`, `upd:`).
* **Comunicação Ativa:** Sinalização prévia no time antes de puxar tarefas no Kanban para evitar sobreposição de escopo.

---

## 2. Sessões de Discovery de Produto (27 a 31 de Agosto)

O processo de discovery dividiu os requisitos do desafio técnico original em marcos incrementais:

* **27 de Agosto (Kickoff, Arquitetura e Stack):**
  * Análise profunda do escopo do desafio Agentic Payments 2026.2.
  * Divisão da arquitetura em 3 módulos: `auth/` (porta 4000), `tickets-tools/` (MCP via Stdio) e `gemini-chat/` (porta 3000).
  * Criação do board colaborativo no FigJam com colunas e histórico de decisões.
* **28 de Agosto (Contrato de API e Padronização de Erros):**
  * Redação do [`docs/contrato-api.md`](./contrato-api.md) e definição dos tipos de retorno `ErroTool`.
  * Definição da camada de isolamento (Shielding Layer) para ocultar credenciais (`usuario_id`, `token`) do modelo LLM.
* **29 de Agosto (Soberania de Negócio, Cálculo e Concorrência):**
  * Decisão de cálculo de `valor_total` restrito ao backend em centavos inteiros (combate a falhas IEEE 754).
  * Implementação da rotina de estorno automático de reservas vencidas (`expirarIntencoesVencidas`).
  * Tratamento de race conditions (TOCTOU e overbooking) nas intenções de compra.
* **30 de Agosto (Orquestração do Agente e Loop Seguro):**
  * Criação do cliente MCP Stdio Singleton, Adapter de schemas e Executor com injeção segura de sessão.
  * Construção do loop multi-turn com limite de segurança (`maxIteracoes = 5`), System Instruction anti-alucinação com 10 antipromptings e endpoint `POST /api/chat`.
* **31 de Agosto (Documentação Técnica, Requisitos e Homologação):**
  * Atualização da documentação técnica no [`README.md`](../README.md), especificação no [`requirements.txt`](../requirements.txt) e consolidação do [`docs/planejamento.md`](./planejamento.md).
  * Validação de 100% dos 107 testes automatizados do monorepo.

---

## 3. Estrutura dos 5 Épicos Principais

As necessidades identificadas no discovery foram organizadas em 5 épicos técnicos:

```
+-----------------------------------------------------------------------------+
|                          MAPA DE ÉPICOS DA SQUAD 8                          |
+-----------------------------------------------------------------------------+
|  [Épico 1: MCP]              -> Transporte Stdio, Schemas e Sanitização     |
|  [Épico 2: AUTH e Limite]     -> Emissão de JWT, Saldo e Débito Atômico      |
|  [Épico 3: Regras de Negócio] -> Cálculo Preciso, Estorno e Anti-TOCTOU      |
|  [Épico 4: Agente (API)]      -> Loop Multi-Turn, Injeção e Anti-Alucinação  |
|  [Épico 5: Front-end]         -> Interface Next.js, Auth e Experiência Chat  |
+-----------------------------------------------------------------------------+
```

### 3.1. Épico 1: MCP (Model Context Protocol)
* **Objetivo:** Estabelecer a comunicação estruturada e padronizada entre o orquestrador conversacional e o servidor de ferramentas via protocolo MCP 1.0.
* **Escopo:**
  * Servidor MCP em `tickets-tools/src/server.ts` expondo `listar_catalogo`, `registrar_intencao` e `realizar_compra`.
  * Cliente MCP Singleton em `gemini-chat/src/mcp/client.ts` com gerenciamento seguro do subprocesso stdio.
  * Adapter de schemas em `gemini-chat/src/mcp/adapter.ts` com sanitização e remoção de campos sensíveis.

### 3.2. Épico 2: AUTH e Limite
* **Objetivo:** Microsserviço independente em Express (porta 4000) para autenticação de clientes e controle transacional de limite de gastos.
* **Escopo:**
  * Rota `POST /login` com emissão de token JWT (RFC 7519).
  * Rota `GET /me` para consulta do perfil e saldo disponível.
  * Rota `PATCH /me/limite` com débito atômico de saldo e retorno `422 LIMITE_INSUFICIENTE`.
  * Middleware de autorização `auth.middleware.ts`.

### 3.3. Épico 3: Regras de Negócio e Concorrência
* **Objetivo:** Garantir a soberania das regras financeiras e de estoque exclusivamente no backend, sem delegar cálculos ou autorizações à IA.
* **Escopo:**
  * Cálculo determinístico via `calcularValorTotal(precoUnitario, quantidade)` com precisão decimal.
  * Estorno idempotente de vagas para intenções expiradas após 5 minutos (`expirarIntencoesVencidas`).
  * Atualização atômica de status para prevenção de overbooking e ataques de concorrência (TOCTOU).
  * Trilha de auditoria estruturada (`audit.ts`) para todas as chamadas de ferramentas.

### 3.4. Épico 4: Agente (API e Loop de Tool Calling)
* **Objetivo:** Orquestrar o diálogo com o Google Gemini, executando ferramentas iterativamente e blindando a aplicação contra alucinações e jailbreaks.
* **Escopo:**
  * Orquestrador `gemini-chat/src/services/geminiAgent.ts` com loop multi-turn e trava de proteção `maxIteracoes = 5`.
  * `SYSTEM_INSTRUCTION_AGENTE` contendo 10 regras invioláveis de conduta e anti-alucinação.
  * Executor seguro `gemini-chat/src/mcp/executor.ts` para injeção mandatória de `usuario_id` e `token` da sessão JWT.
  * Endpoint `POST /api/chat` com validação JWT, suporte a `maxIteracoes` customizado e tratamento global de erros.

### 3.5. Épico 5: Front-end e Experiência do Usuário
* **Objetivo:** Interface web em Next.js 14 para autenticação, controle de sessão e chat conversacional com o agente.
* **Escopo:**
  * Tela de login com persistência de token JWT.
  * Janela de chat (`ChatWindow`) com suporte a histórico contínuo multi-turn.
  * Telas de erro e loading states para feedback visual ao usuário.

---

## 4. Quadro Kanban e Gestão no FigJam

### 4.1. Link do Board e Fluxo de Trabalho

O gerenciamento visual de tarefas e registros da Squad 8 foi centralizado no FigJam:

> **Link do Quadro Kanban no FigJam:**  
> [https://www.figma.com/board/fuvlMSJtHwcVPCh1t2NbxZ/Planejamento-Projeto-Compass-UOL?node-id=0-1&t=SyuwYfN6naNAYsu6-1](https://www.figma.com/board/fuvlMSJtHwcVPCh1t2NbxZ/Planejamento-Projeto-Compass-UOL?node-id=0-1&t=SyuwYfN6naNAYsu6-1)

---

### 4.2. Estrutura de Colunas do Kanban

| Coluna | Finalidade no Fluxo de Engenharia |
| :--- | :--- |
| **Backlog** | Repositório de todas as tarefas derivadas dos 5 épicos de discovery. |
| **To Do** | Tarefas refinadas, priorizadas e prontas para serem puxadas pelos desenvolvedores. |
| **Doing** | Tarefas em desenvolvimento ativo sob branches dedicadas (Gitflow). |
| **Done** | Tarefas concluídas, revisadas, testadas com 100% de sucesso e mescladas. |
| **Histórico de Decisões** | Quadro de decisões arquiteturais básicas e registros de trade-offs consolidados. |

---

### 4.3. Evidências Visuais e Prints do Processo

Abaixo estão os locais reservados para inclusão dos registros visuais das etapas de planejamento e acompanhamento do board:

#### A. Visão Geral do Board de Planejamento (FigJam)
<!-- Adicione aqui o print geral do quadro no FigJam -->
![Visão Geral do Board no FigJam](screenshots/figjam-board-screenshot.png)

#### B. Detalhamento das Colunas do Kanban (Backlog, To Do, Doing e Done)
<!-- Adicione aqui o print detalhando os cards de tarefas nas colunas -->
![Estrutura de Colunas Kanban](screenshots/figjam-kanban-board.png)

#### C. Sessão de Discovery e Mapeamento de Épicos
<!-- Adicione aqui o print das anotações e post-its da sessão de discovery -->
![Discovery e Épicos no Board](screenshots/figjam-discovery-1.png)
![Discovery e Épicos no Board 2](screenshots/figjam-epics-discovery-1.png)

#### D. Quadro de Histórico de Decisões Arquiteturais
<!-- Adicione aqui o print da coluna de decisões arquiteturais do FigJam -->
![Histórico de Decisões no Board](screenshots/figjam-decisions-board-1.png)

---

## 5. Histórico de Decisões Arquiteturais (ADRs no Board)

Decisões técnicas e definições de arquitetura registradas no quadro do FigJam:

### 5.1. Decisões Globais da Squad (`@time`)
* **Stack Técnica e Paradigma:** TypeScript, JavaScript, Node.js.
* **Modelo LLM:** Google Gemini via API na nuvem (chave gerenciada no backend).
* **Transporte MCP:** MCP local via transporte Stdio (`StdioClientTransport`) e chamadas HTTP REST para o microsserviço de autenticação.
* **Convenções de Commits:** Commits semânticos padronizados no padrão Conventional Commits (ex: `fit: xyz...`, `doc: xyz...`, `upd: xyz...`, `test: xyz...`).
* **Qualidade de Código:** Código legível, fortemente tipado e amplamente documentado.
* **Persistência:** SQLite local com modo WAL (Write-Ahead Logging) provisório para desenvolvimento e validação.
* **Evidências de Processo:** Sempre documentar prints do processo e evidências de testes.
* **Sinalização de Tarefas:** Sinalizar o time sempre que pegar uma nova tarefa para evitar repetições e duplicidades.
* **Regras de Branching (GitFlow):** Fluxo Dev -> Stage -> Prod. Cada nova feature sendo uma branch nova originada exclusivamente da branch `MASTER/MAIN` (nunca criar branches a partir de outra branch, apenas da Master).

### 5.2. Decisões Técnicas das Tools MCP (`@Éverson Filipe`)
* **Implementação das Tools MCP:** Implementação completa das ferramentas `listar_catalogo`, `registrar_intencao` e `realizar_compra`.
* **Momento do `decrementarVagas`:** Executado no momento exato do `registrar_intencao`, reservando o assento temporariamente.
* **Como `usuarioId` chega às tools via MCP?:** Criado card ad-hoc para implementar: o Gemini pede `registrar_intencao({ evento_id, quantidade })`; o `route.ts` / `executor.ts` intercepta e monta `registrar_intencao({ evento_id, quantidade, usuario_id })`; o MCP recebe com `usuarioId` já presente.
* **Limite de tempo da intenção (`expira_em`):** Exatamente **5 minutos** a partir da criação da reserva.
* **Retorno quando o evento não tem vagas suficientes:** Retornar o código de erro estruturado `VAGAS_INSUFICIENTES`.
* **Obtenção de Limite do Usuário (`obterLimiteUsuario`):** Realizada via chamada HTTP em `/auth` (`GET /me`).

---

## 6. Backlog Completo de Tarefas por Integrante (100% Mapeado)

Todas as tarefas do quadro Kanban organizadas por responsável:

### 6.1. Tarefas de Pedro César (`@Pedro César`)

| Tarefa                                              | Módulo                  | Entregável / Escopo                                                                                      |
| :----------------------------------------------------| :------------------------| :---------------------------------------------------------------------------------------------------------|
| **Inicializar repositório e estrutura de pastas**   | Geral                   | Criação do repositório, configuração dos 3 módulos e uso de commits semânticos (`fit:`, `doc:`, `upd:`). |
| **Validar posse da intenção (`INTENCAO_INVALIDA`)** | `tickets-tools/`        | Verificação de pertencimento da intenção ao usuário autenticado.                                         |
| **Padronizar contrato de erro das tools**           | `docs/`                 | Criação do formato normativo `ErroTool` em `docs/contrato-api.md`.                                       |
| **Validar limite de gasto (`LIMITE_EXCEDIDO`)**     | `tickets-tools/`        | Consulta ao `auth/` e bloqueio de compras que excedam o limite disponível.                               |
| **Criar tela de login**                             | `gemini-chat/`          | Interface de autenticação de usuários no frontend.                                                       |
| **Implementar login (usuário/senha ou token)**      | `auth/`                 | Rota `POST /login` com geração e validação de token JWT (RFC 7519).                                      |
| **Validar método de pagamento (`METODO_INVALIDO`)** | `tickets-tools/`        | Validação estrita dos métodos aceitos (`cartao` ou `pix`).                                               |
| **Criar tela do chat**                              | `gemini-chat/`          | Interface principal de diálogo com o assistente conversacional.                                          |
| **Bloquear acesso ao chat sem sessão válida**       | `gemini-chat/`          | Proteção de rota e validação do header `Authorization: Bearer <token>`.                                  |
| **Tela para erros**                                 | `gemini-chat/`          | Componente visual para exibição de mensagens de erro amigáveis.                                          |
| **Vincular sessão ao escopo de intenções**          | `auth/`, `gemini-chat/` | Associação segura de `usuario_id` da sessão JWT aos registros criados.                                   |
| **Tela de carregamento**                            | `gemini-chat/`          | Componente visual de loading para requisições assíncronas.                                               |
| **Tratar retorno de erro em linguagem natural**     | `gemini-chat/`          | Implementação do utilitário `tratarErro.ts` para mensagens humanizadas.                                  |

---

### 6.2. Tarefas de Éverson Filipe (`@Éverson Filipe Campos Da Silva Moura`)

| Tarefa                                                                                | Módulo           | Entregável / Escopo                                                                                 |
| :--------------------------------------------------------------------------------------| :-----------------| :----------------------------------------------------------------------------------------------------|
| **Implementar as tools (`listar_catalogo`, `registrar_intencao`, `realizar_compra`)** | `tickets-tools/` | Implementação completa dos schemas e regras de negócio das 3 ferramentas MCP.                       |
| **Implementar MCP client no backend**                                                 | `gemini-chat/`   | Conexão Singleton via `StdioClientTransport` em `client.ts` e Adapter de schemas em `adapter.ts`.   |
| **Implementar loop de tool calling**                                                  | `gemini-chat/`   | Orquestrador `geminiAgent.ts` com loop multi-turn, trava de 5 iterações, retry e antiprompts.       |
| **Aprofundar boilerplate de documentação do `README.md`**                             | Geral            | Card ad-hoc: reescrita estruturada do `README.md` com matriz de testes, diagramas e arquitetura.    |
| **Criar endpoint de débito/atualização de limite no módulo `auth/`**                  | `auth/`          | Rota `PATCH /me/limite` com débito atômico de saldo e resposta `422 LIMITE_INSUFICIENTE`.           |
| **Atualizar `contrato-api.md` e prompt com o novo erro `VAGAS_INSUFICIENTES`**        | `docs/`          | Atualização normativa da documentação de contratos e schemas de erro.                               |
| **Fix de padronização em branches**                                                   | Geral            | Homologação de padrões de nomenclatura de branches e convenções Gitflow.                            |
| **Calcular `valor_total` no backend**                                                 | `tickets-tools/` | Função `calcularValorTotal()` com precisão monetária (combate a falhas IEEE 754 e bypass de preço). |
| **Implementar estorno/devolução de vagas para intenções expiradas**                   | `tickets-tools/` | Função `expirarIntencoesVencidas()` com varredura proativa e idempotente de assentos.               |

---

### 6.3. Tarefas de Luis Filipe (`@Luis Filipe Mendes Nogueira`)

| Tarefa | Módulo | Entregável / Escopo |
| :--- | :--- | :--- |
| **Validar expiração (`INTENCAO_EXPIRADA`)** | `tickets-tools/` | Bloqueio de compras atreladas a reservas que ultrapassaram o tempo limite de 5 minutos. |
| **Interceptar tool calls no `gemini-chat` para injeção de `usuario_id` e `token`** | `gemini-chat/` | Camada de interceptação no orquestrador garantindo injeção de credenciais de sessão. |
| **Criar seed do catálogo de produtos** | `tickets-tools/` | Script de inicialização e carga de eventos de tecnologia no SQLite. |
| **Validar `intencao_id` inexistente (`INTENCAO_INVALIDA`)** | `tickets-tools/` | Bloqueio de tentativas de compra com identificadores forjados ou não cadastrados. |
| **Criar seed de usuários com limite de gasto** | `auth/` | Script de inicialização de usuários com hashes de senha e limites individuais. |
| **Marcar intenção como consumida e atualizar limite restante** | `tickets-tools/` | Atualização do status da intenção para `paga` e consumo definitivo do saldo. |
| **Persistir intenção com dono, status e expiração** | `tickets-tools/` | Modelagem e persistência de intenções de compra com timeout de 5 minutos. |

---

### 6.4. Tarefas Transversais (`@definir` / `@adefinir`)

| Tarefa | Módulo | Entregável / Escopo |
| :--- | :--- | :--- |
| **Validar intenção já consumida (`INTENCAO_JA_PAGA`)** | `tickets-tools/` | Prevenção de compras duplicadas ou reprocessamento de intenções já finalizadas. |
| **Enviar histórico completo a cada turno** | `gemini-chat/` | Propagação stateless do array acumulado de mensagens entre o cliente e o orquestrador do chat. |

---

> Documentação técnica detalhada disponível no [`README.md`](../README.md) e na especificação [`requirements.txt`](../requirements.txt).
