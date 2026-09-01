# gemini-chat (Frontend e Agente Conversacional)

![Squad 8 Header](../docs/headers/agentic-payments-fde-workshops-mainheader-squad8.webp)

Módulo responsável pela interface visual do usuário (Next.js 14) e pela orquestração do loop conversacional de Tool Calling integrado à API do Google Gemini e ao protocolo Model Context Protocol (MCP 1.0).

> **Fonte da Verdade:** Para a documentação arquitetural completa, contratos normativos e matriz de testes do ecossistema, consulte o [`README.md`](../README.md) raiz do repositório.

---

## 1. Responsabilidades do Módulo

* **Interface de Usuário (Next.js 14 / React 18):**
  * Tela de autenticação e cadastro (`LoginForm.tsx`) com persistência do JWT no estado local.
  * Chat conversacional (`ChatWindow.tsx`) com renderização rica em Markdown (`react-markdown`, `remark-gfm`).
  * Painel lateral de pedidos em tempo real (`OrderPanel.tsx`) refletindo os estados Pendente, Aprovado e Recusado.
  * Sincronização automática do saldo disponível ("Você pode gastar") via `GET /me`.
* **Orquestração da Rota de Chat (`src/app/api/chat/route.ts`):**
  * Validação de Bearer Token JWT e extração de identidade do usuário (`usuario_id`).
  * Tratamento defensivo de payloads e retorno estruturado (`resposta`, `historico`, `iteracoes`).
* **Loop de Tool Calling Multi-Turn (`src/services/geminiAgent.ts`):**
  * Integração com o Google Gemini (modelo padrão: `gemini-3.5-flash-lite`).
  * System Instruction com 10 regras rígidas de conduta e anti-alucinação.
  * Trava de segurança contra loops infinitos (`maxIteracoes = 5`).
  * Mecanismo de retry automático com backoff exponencial contra instabilidades temporárias de rede (503/429).
* **Camada de Integração MCP (`src/mcp/`):**
  * `client.ts`: Cliente Singleton via transporte Stdio gerenciando o subprocesso do `tickets-tools`.
  * `adapter.ts`: Conversor de JSONSchema para `FunctionDeclaration` do Gemini com Shielding Layer (remoção de credenciais de sessão do alcance da IA).
  * `executor.ts`: Injeção mandatória e transparente de `usuario_id` e `token` antes do despacho ao servidor MCP.

---

## 2. Variáveis de Ambiente

Crie o arquivo `.env.local` dentro de `gemini-chat/`:

```env
GEMINI_API_KEY=sua_chave_do_google_ai_studio
GEMINI_MODEL=gemini-3.5-flash-lite
NEXT_PUBLIC_AUTH_URL=http://localhost:4000
AUTH_SERVICE_URL=http://localhost:4000
```

> **Segurança:** A variável `GEMINI_API_KEY` é consumida exclusivamente no backend (`route.ts`). Nunca exponha esta chave no lado cliente.

---

## 3. Execução Local

```bash
# 1. Instalação das dependências
npm install

# 2. Inicialização do servidor em modo desenvolvimento
npm run dev
```

* A aplicação estará acessível em **`http://localhost:3000`**.

---

## 4. Testes Automatizados

A suíte de testes unitários e de integração cobre validações de rotas, adaptação de schemas, executor seguro e o loop do agente:

```bash
npm test
```

* **Total:** 55 testes automatizados com 100% de aprovação no Vitest.
