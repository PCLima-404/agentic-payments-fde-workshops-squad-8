<!--
  README.md — agentic-payments-fde-workshops | Squad 8
  Branch: documentation/boilerplate-update
  Contexto: Projeto de finalizacao de estagio — UOL / Agentic Payments

  INSTRUCOES DE PREENCHIMENTO
  ============================
  - Campos marcados com "PREENCHER:" devem ser substituidos pelo conteudo real.
  - Nao remova os comentarios das secoes que ainda nao foram preenchidas;
    eles servem de guia para toda a equipe.
  - Ao concluir o preenchimento de uma secao, remova apenas o bloco de comentario
    instrucional correspondente, mantendo o conteudo adicionado.
  - Siga as convencoes de escrita ja estabelecidas no projeto.
-->

<!-- =========================================================
     BADGES — Indicadores de status e metadados do repositorio
     ========================================================= -->

<!-- PREENCHER: substitua os valores das badges conforme o estado real do projeto.
     Para gerar novas badges, acesse: https://shields.io -->

![Status do projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=flat-square)
![Node.js](https://img.shields.io/badge/runtime-Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/linguagem-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/LLM-Gemini-4285F4?style=flat-square&logo=google&logoColor=white)
![MCP](https://img.shields.io/badge/protocolo-MCP-8B5CF6?style=flat-square)
![Licenca](https://img.shields.io/badge/licen%C3%A7a-privado-red?style=flat-square)

<!-- PREENCHER: adicione a badge de cobertura de testes quando disponivel.
     Exemplo: ![Cobertura](https://img.shields.io/badge/cobertura-XX%25-brightgreen?style=flat-square) -->

---

# agentic-payments-fde-workshops — Squad 8

<!-- PREENCHER: escreva aqui um paragrafo de introducao definitivo ao projeto,
     descrevendo o problema resolvido, o publico-alvo e a proposta de valor.
     Referencia atual: chatbot de compra de ingressos via Gemini + MCP. -->

> O mercado carece de agentes autônomos capazes de listar, gravar intenções e realizar
> compras complexas, e ainda retomar um feedback em linguagem natural.
> Este projeto busca resolver esta lacuna através de um sistema conversacional de compra de ingressos,
> permitindo que o conceito de pagamentos agênticos seja explorado em cenário real.
> O projeto usa LLMs pré-treinadas, MCP e tool-calling para realizar a compra de ingressos.
> <br><br> Para acompanhamento do progresso interno, e divisão de tarefa, utilizamos um quadro Kanbam no Figma. Dividido em épicos e com registro das principais decisões tomadas.
> <br> <ul><li> ACESSE EM: <a href="https://www.figma.com/board/fuvlMSJtHwcVPCh1t2NbxZ/Planejamento-Projeto-Compass-UOL?node-id=0-1&t=SyuwYfN6naNAYsu6-1">https://www.figma.com/board/fuvlMSJtHwcVPCh1t2NbxZ/Planejamento-Projeto-Compass-UOL?node-id=0-1&t=SyuwYfN6naNAYsu6-1</a> </li></ul> 

---

## Sumario

- [Visao Geral](#visao-geral)
- [Arquitetura](#arquitetura)
  - [Fluxo de Interacao](#fluxo-de-interacao)
- [Tecnologias e Metodologias](#tecnologias-e-metodologias)
  - [Stack Tecnica](#stack-tecnica)
  - [Protocolos e Padroes](#protocolos-e-padroes)
  - [Metodologias de Desenvolvimento](#metodologias-de-desenvolvimento)
- [Modulos](#modulos)
  - [auth](#auth)
  - [tickets-tools](#tickets-tools)
  - [gemini-chat](#gemini-chat)
- [Contrato de API](#contrato-de-api)
- [Instalacao e Execucao](#instalacao-e-execucao)
  - [Pre-requisitos](#pre-requisitos)
  - [Variaveis de Ambiente](#variaveis-de-ambiente)
  - [Executando Localmente](#executando-localmente)
- [Testes](#testes)
- [Screenshots e Demonstracoes](#screenshots-e-demonstracoes)
- [Regras de Repositorio](#regras-de-repositorio)
  - [Estrategia de Branches](#estrategia-de-branches)
- [Atribuicoes e Backlog](#atribuicoes-e-backlog)
  - [Commits por Contribuidor](#commits-por-contribuidor)
  - [Tarefas Concluidas do Backlog](#tarefas-concluidas-do-backlog)
  - [Epicos do Kanban](#epicos-do-kanban)
- [Anexos e Referencias](#anexos-e-referencias)

---

## Visao Geral

<!-- PREENCHER: descreva com precisao o escopo funcional completo do projeto.
     Inclua: o problema de negocio endereçado, o usuario-alvo, as restricoes tecnicas
     e a justificativa para as escolhas de arquitetura (Gemini + MCP).
     Evite linguagem vaga; seja especifico sobre o que o sistema faz e o que esta fora de escopo. -->

| Atributo                | Valor                                                                                                                                                                                |
| -------------------------| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Contexto**            | Projeto de finalizacao — UOL / Agentic Payments                                                                                                                                      |
| **Squad**               | Squad 8                                                                                                                                                                              |
| **Branch de entrega**   | `main`                                                                                                                                                                               |
| **Convenções**          | <br> - Convenção de commits: uso de commits semânticos <br> - Convenção de branches: main(master), staging, development, features (branches criadas com base nas tarefas do kanban). |
| **Paradigma principal** | LLM Pré-treinado com tool-calling, leitura de contexto e capacidade de conversação em linguagem natural com base em dados financeiros e não financeiros.                             |
| **Protocolo de tools**  | MCP (Model Context Protocol)                                                                                                                                                         |
| **LLM utilizado**       | <!-- PREENCHER: ex: gemini-2.5-flash -->                                                                                                                                             |
| **Equipe**              | - Pedro César Padre de Lima; <br> - Éverson Filipe Campos da Silva Moura; <br> - Luis Filipe Mendes Nogueira.                                                                        |

---

## Arquitetura

### Fluxo de Interacao

<!-- PREENCHER: descreva o fluxo completo de uma interacao tipica do usuario,
     do login ao recebimento da confirmacao de compra. Utilize uma lista numerada.
     Referencia preliminar:
       1. Usuario faz login (auth/)
       2. Consulta catalogo via listar_catalogo
       3. Registra intencao via registrar_intencao
       4. Confirma compra via realizar_compra
       5. Erros tratados e explicados pelo agente
-->

1. **Usuário faz login** <br>
<ul>
  <li>1.1. Chat só renderiza com sessão válida (login/senha ou token)</li>
  <li>1.2. Backend carrega o limite_de_gasto do usuário — nunca do frontend, nunca do prompt</li>
  <li>1.3. Sessão define o escopo de posse das intenções futuras</li>
  <li>1.4. Histórico da conversa é inicializado e vinculado ao user_id</li>
  <li>1.5. Histórico da conversa é inicializado e vinculado ao user_id — Req. 5</li>
</ul>
<br>
2. <strong>"O que vocês têm à venda?"</strong> → listar_catalogo <br>
<ul>
  <li>2.1. Agente descobre as tools via MCP (não hardcode no prompt)</li>
  <li>2.2. Arg opcional categoria; sem filtro, retorna o catálogo completo</li>
  <li>2.3. Retorno: produtos[] com id, nome, preco, moeda, estoque</li>
  <li>2.4. Preço é propriedade do backend — daqui em diante o modelo só manipula id</li>
  <li>2.5. Turno fecha com mensagem + tool call + tool result no histórico</li>
</ul>
<br>
3. <strong>"Quero o item 3."</strong> → registrar_intencao <br>
<ul>
  <li>3.1. Args: produto_id (deve existir no catálogo) + quantidade (int > 0)</li>
  <li>3.2. Nenhum dinheiro se move e nenhum limite é debitado nesta etapa</li>
  <li>3.3. valor_total é calculado no backend (preco × quantidade) — cliente não envia valor</li>
  <li>3.4. Backend gera e persiste intencao_id, com dono, status: "pendente" e expira_em (ISO 8601)</li>
  <li>3.5. Essa persistência é o que torna as validações do passo 4 possíveis</li>
</ul>
<br>
4. <strong>"Pode pagar no pix."</strong> → realizar_compra <br>
<ul>
  <li>4.1. Args: somente intencao_id + metodo_pagamento — valor nunca é argumento</li>
  <li>4.2. Método aceito: cartao ou pix; qualquer outro → METODO_INVALIDO — Req. 3</li>
  <li>4.3. Cadeia de validação no backend, antes de mover dinheiro — Req. 1.1:</li>
  <ul>
    <li>4.3.1. não existe / inventado pelo modelo → INTENCAO_INVALIDA</li>
    <li>4.3.2. dono ≠ usuário logado → INTENCAO_INVALIDA</li>
    <li>4.3.3. já consumida → INTENCAO_JA_PAGA</li>
    <li>4.3.4. fora do prazo → INTENCAO_EXPIRADA</li>
    <li>4.3.5. valor_total > limite restante → LIMITE_EXCEDIDO</li>
  </ul>
  <li>4.4. Sucesso: aprovado + transacao_id + limite_restante atualizado + data ISO</li>
  <li>4.5. Intenção é marcada como consumida no mesmo commit (garante idempotência)</li>
</ul>
<br>
5. <strong>Se estourar o limite → erro tratado e explicado</strong> <br>
<ul>
  <li>5.1. Tool retorna objeto estruturado: status: "recusado" + erro + mensagem — Req. 4</li>
  <li>5.2. Agente traduz mensagem em linguagem natural; não simula aprovação</li>
  <li>5.3. Nada é debitado; a intenção permanece não-paga e expira naturalmente</li>
  <li>5.4. O modelo não é a barreira: mesmo sob "ignore o limite", o backend recusa (Extras — jailbreak)</li>
  <li>5.5. Mesmo trilho de tratamento atende aos outros 4 códigos de erro</li>
</ul>

---

## Tecnologias e Metodologias

### Stack Tecnica

<!-- PREENCHER: liste todas as dependencias principais de cada modulo, com versoes exatas,
     apos o congelamento das versoes no projeto. -->

| Tecnologia         | Modulo(s)          | Versao             | Finalidade                                   |
| --------------------| --------------------| --------------------| ----------------------------------------------|
| Node.js            | Todos              | <!-- PREENCHER --> | Runtime de execucao                          |
| TypeScript         | Todos              | <!-- PREENCHER --> | Tipagem estatica                             |
| Gemini API         | gemini-chat        | <!-- PREENCHER --> | Modelo de linguagem e function calling       |
| MCP SDK            | tickets-tools      | <!-- PREENCHER --> | Servidor de tools via Model Context Protocol |
| JWT                | auth               | <!-- PREENCHER --> | Autenticacao e autorizacao                   |
| <!-- PREENCHER --> | <!-- PREENCHER --> | <!-- PREENCHER --> | <!-- PREENCHER -->                           |

### Protocolos e Padrões

- **Model Context Protocol (MCP)**
  Protocolo aberto para exposicao de ferramentas a modelos de linguagem.
  Referencia: https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro

- **Gemini LLM**
  Modelo de linguagem de grande escala desenvolvido pelo Google.
  Referencia: https://aistudio.google.com/

- **Gemini Function Calling**
  Mecanismo do Gemini para invocacao estruturada de ferramentas externas.
  Referencia: https://ai.google.dev/gemini-api/docs/function-calling?hl=pt-br

- **JWT (JSON Web Token)**
  Padrao RFC 7519 para transmissao segura de informacoes entre partes.
  Referencia: [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)

- <!-- PREENCHER: adicione outros protocolos ou padroes relevantes -->

### Metodologias de Desenvolvimento

<!-- PREENCHER: descreva as metodologias adotadas pela equipe. -->

- **Kanban**
  Gestão visual de fluxo de trabalho via quadro no Figma.
  Referencia: [Kanban Guide](https://kanban.university/kanban-guide/) <!-- PREENCHER: adicione o link do board Figma do squad -->

- **Conventional Commits**
  Convenção de mensagens de commit para legibilidade e rastreabilidade.
  Referencia: [conventionalcommits.org](https://www.conventionalcommits.org/en/v1.0.0/)

- **Estratégia de Branches**
  Git-Flow adaptado com prod, stage, dev e branches de features.
  Referencia: [Git-Flow](https://engsoftmoderna.info/artigos/gitflow.html)

---

## Modulos

| Modulo            | Pasta            | Responsavel        | README individual                                            |
|-------------------|------------------|--------------------|--------------------------------------------------------------|
| Autenticacao      | `auth/`          | <!-- PREENCHER --> | [auth/README.md](./auth/README.md)                           |
| Servidor de Tools | `tickets-tools/` | <!-- PREENCHER --> | [tickets-tools/README.md](./tickets-tools/README.md)         |
| Frontend e Agente | `gemini-chat/`   | <!-- PREENCHER --> | [gemini-chat/README.md](./gemini-chat/README.md)             |

### auth

<!-- PREENCHER: breve descricao do modulo de autenticacao, destacando
     responsabilidades criticas (emissao de JWT, validacao de limite de gasto).
     Consulte auth/README.md para base de conteudo. -->

### tickets-tools

<!-- PREENCHER: breve descricao do servidor MCP e das tres tools expostas
     (listar_catalogo, registrar_intencao, realizar_compra).
     Mencione as regras de negocio criticas e o log auditavel.
     Consulte tickets-tools/README.md para base de conteudo. -->

### gemini-chat

<!-- PREENCHER: breve descricao do frontend e do agente conversacional,
     destacando a integracao Gemini + MCP e o adaptador de functionDeclarations.
     Consulte gemini-chat/README.md para base de conteudo. -->

---

## Contrato de API

O contrato completo de tipos e codigos de erro esta em [`docs/contrato-api.md`](./docs/contrato-api.md).

<!-- PREENCHER: inclua aqui um resumo executivo dos objetos principais
     (Evento, Intencao, Transacao, ErroTool) com links diretos para as secoes
     relevantes do contrato. -->

### Decisoes em Aberto

<!-- PREENCHER: mova os itens abaixo para "Decisoes Tomadas" conforme forem resolvidos
     em alinhamento de equipe. Referencia: docs/contrato-api.md -->

- [ ] Momento de decremento de vagas: `registrar_intencao` ou `realizar_compra`?
- [ ] Formato do token de sessao emitido por `auth/` e validacao nos demais modulos
- [ ] Tempo de expiracao padrao de uma intencao

---

## Instalacao e Execucao

### Pre-requisitos

<!-- PREENCHER: liste as dependencias de sistema necessarias, com versoes minimas. -->

| Dependencia        | Versao minima      | Link                                           |
|--------------------|--------------------|------------------------------------------------|
| Node.js            | <!-- PREENCHER --> | https://nodejs.org                             |
| npm                | <!-- PREENCHER --> | https://www.npmjs.com                          |
| Chave Gemini API   | N/A                | https://ai.google.dev/gemini-api/docs/api-key  |
| <!-- PREENCHER --> | <!-- PREENCHER --> | <!-- PREENCHER -->                             |

### Variaveis de Ambiente

<!-- PREENCHER: liste todas as variaveis de ambiente necessarias, modulo a modulo.
     Nunca inclua valores reais neste arquivo. Referencie os arquivos .env.example. -->

Cada modulo possui seu proprio arquivo de exemplo:

- `auth/.env.example`
- `tickets-tools/.env.example`
- `gemini-chat/.env.local.example`

> **Atencao:** A chave da Gemini API deve ser configurada exclusivamente no backend
> (`gemini-chat/src/app/api/chat/route.ts`). Nunca exponha a chave no cliente.

### Executando Localmente

```bash
# 1. Modulo de autenticacao
cd auth && npm install && npm run dev

# 2. Servidor de tools (MCP)
cd tickets-tools && npm install && npm run dev

# 3. Frontend e agente conversacional
cd gemini-chat && npm install && npm run dev
```

<!-- PREENCHER: adicione informacoes sobre portas padrao de cada modulo,
     possiveis conflitos de porta e ordem obrigatoria de inicializacao. -->

---

## Testes

<!-- PREENCHER: descreva a estrategia de testes adotada, ferramentas utilizadas
     e criterios de aceite minimos para cada modulo. -->

```bash
# Executa a suite de testes do servidor de tools
cd tickets-tools && npm test
```

| Tipo de teste              | Modulo        | Arquivo de referencia               |
|----------------------------|---------------|-------------------------------------|
| Casos de erro obrigatorios | tickets-tools | `tests/`                            |
| Resistencia a jailbreak    | tickets-tools | `tests/jailbreak.test.ts`           |
| <!-- PREENCHER -->         | <!-- PREENCHER --> | <!-- PREENCHER -->             |

<!-- PREENCHER: adicione badge de cobertura e/ou link para relatorio de testes quando disponivel. -->

---

## Screenshots e Demonstracoes

<!-- INSTRUCOES PARA PREENCHIMENTO DESTA SECAO
     ==========================================
     - Adicione os arquivos de imagem em docs/screenshots/
     - Use o formato de nomenclatura: docs/screenshots/<nome-descritivo>.<extensao>
     - Toda imagem DEVE ter legenda descritiva imediatamente abaixo
     - Para fluxos longos, organize em subsecoes por etapa
     - Resolucao recomendada: minimo 1280x800 pixels
     - Formatos aceitos: PNG (estatico), GIF ou WEBP (animacoes)
     - A legenda deve identificar: o estado da UI, o dado relevante exibido e o contexto do fluxo
-->

### Fluxo de Autenticacao

<!-- PREENCHER: insira screenshot da tela de login com credenciais validas.
     Formato esperado:

![Descricao da imagem](./docs/screenshots/nome-do-arquivo.png)
*Legenda: Tela de login — formulario preenchido, resposta 200 com token JWT retornado.*

     Adicione tambem, se disponivel, screenshot do estado de erro de credenciais invalidas. -->

### Consulta ao Catalogo de Eventos

<!-- PREENCHER: insira screenshot ou GIF da interacao do usuario solicitando
     o catalogo de eventos e a resposta do agente via listar_catalogo.
     A legenda deve descrever o prompt utilizado e o resultado exibido na interface. -->

### Registro de Intencao de Compra

<!-- PREENCHER: insira screenshot da chamada registrar_intencao no chat,
     exibindo a resposta estruturada do agente com os dados da intencao gerada.
     A legenda deve incluir: evento selecionado, quantidade e status retornado. -->

### Confirmacao de Compra

<!-- PREENCHER: insira screenshot da chamada realizar_compra com sucesso,
     exibindo transacaoId, valor, metodo de pagamento e limiteRestante.
     A legenda deve identificar o metodo de pagamento utilizado no exemplo. -->

### Tratamento de Erros pelo Agente

<!-- PREENCHER: insira screenshot de ao menos um cenario de erro tratado,
     por exemplo LIMITE_EXCEDIDO ou INTENCAO_EXPIRADA, com a explicacao do agente.
     A legenda deve identificar o codigo de erro demonstrado. -->

<!-- PREENCHER: adicione subsecoes para demais fluxos relevantes.
     Sugestoes: logout, evento esgotado, tentativa de jailbreak bloqueada. -->

---

## Regras de Repositorio

### Estrategia de Branches

<!-- PREENCHER: documente a estrategia de branches definida no Kanban/Figma do squad.
     Inclua: descricao de cada branch, regras de merge e protecoes ativas no repositorio. -->

| Branch                       | Finalidade                                             |
| ------------------------------| --------------------------------------------------------|
| `main`                       | Versão estável em produção;                            |
| `prod`                       | Versão estável em produção;                            |
| `stage`                      | Versão de observação e testes de usabilidade;          |
| `dev`                        | Versão de desenvolvimento e testes iniciais;           |
| `feature/*`                  | Features em desenvolvimento;                           |
| `<exemplo>outros<exemplo>/*` | Outras atualizações (documentação, boilerplates, etc.) |

---

## Atribuicoes e Backlog

### Commits por Contribuidor

<!-- NOTA: os dados abaixo refletem o historico de commits no momento desta documentacao.
     Atualize esta tabela ao final de cada sprint ou antes da entrega final.

     Para obter os dados atualizados, execute:
       git shortlog -sn --all
-->

| Contribuidor                         | Commits |
| --------------------------------------| ---------|
| Pedro Cesar P. Lima / PCLima         | 4       |
| Éverson Filipe Campos da Silva Moura | 1       |
| Luis Filipe Mendes Nogueira          |         |

<!-- PREENCHER: adicione os demais membros do squad conforme contribuirem via commits. -->

### Tarefas Concluidas do Backlog

<!-- PREENCHER: liste aqui as tarefas do Kanban (Figma) concluidas,
     com referencia ao epico correspondente e ao PR ou commit que as implementou.
     Mantenha esta tabela atualizada conforme o progresso do projeto. -->

| Tarefa                                                                                                                     | Data de conclusão |
| ----------------------------------------------------------------------------------------------------------------------------| -------------------|
| @time - Definir stack (linguagem e paradigma), modelo LLM (Ollama local vs. API na nuvem) e transporte MCP (stdio ou HTTP) | 27/08/2026        |
| @Pedro César  - Inicializar repositório e estrutura de pastas                                                              | 27/08/2026        |
| @Pedro César  - Padronizar contrato de erro das tools                                                                      | 27/08/2026        |
|                                                                                                                            |                   |

### Epicos do Kanban

<!-- PREENCHER: liste os epicos definidos no board Figma do squad,
     com status atual e descricao sintetica.
     Link do board: PREENCHER -->

| Epico                     | Descricao                                                                                                 |
| ---------------------------| -----------------------------------------------------------------------------------------------------------|
| **1 - MCP**               | Definição da camada de MCP e padronizacao do contrato de erro das tools                                   |
| **2 - AUTH E LIMITE**     | Implementação de login, autenticação e sessão                                                             |
| **3 - REGRAS DE NEGÓCIO** | Implementação das regras de negócio do sistema de ingressos, e demais funcionalidades de valor ao negócio |
| **4 - AGENTE (API)**      | Implementação do LLM e suas capacidades                                                                   |
| **5 - FRONT-END**         | Interfaces de interação usuário x agente                                                                  |

---

## Anexos e Referencias

### Referencias Externas

| Referencia                    | URL                                                    | Descricao                                          |
| -------------------------------| --------------------------------------------------------| ----------------------------------------------------|
| Gemini API — Function Calling | https://ai.google.dev/gemini-api/docs/function-calling | Documentacao oficial de function calling do Gemini |
| Model Context Protocol        | https://modelcontextprotocol.io                        | Especificacao do protocolo MCP                     |
| Conventional Commits          | https://www.conventionalcommits.org/pt-br/v1.0.0/      | Convencao de mensagens de commit                   |
| RFC 7519 — JSON Web Token     | https://datatracker.ietf.org/doc/html/rfc7519          | Especificacao do padrao JWT                        |
| shields.io                    | https://shields.io                                     | Geracao de badges para README                      |

---

<!-- META: informacoes de controle desta documentacao -->
<!-- PREENCHER: atualize a data e o responsavel antes de cada entrega -->

> Documentacao atualizada em: 27/08/2026 <br>
> Responsavel pela revisao: Éverson Filipe Campos da Silva Moura