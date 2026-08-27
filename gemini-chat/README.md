# gemini-chat

Frontend + agente conversacional (Gemini API + MCP client). Responsável: **Pessoa 3**.

## Responsabilidades
- Tela de login (consome `auth/`)
- Chat: envia histórico completo da conversa a cada turno, incluindo tool calls e resultados
- Integração com a API do Gemini (function calling) via `src/app/api/chat/route.ts`
- Adaptador que converte as tools do MCP (`tickets-tools/`) para o formato de `functionDeclarations` do Gemini (`src/mcp/adapter.ts`)

## Rodando localmente
```bash
npm install
npm run dev
```

## Variáveis de ambiente
Ver `.env.local.example`. **A chave do Gemini fica só no backend (route.ts), nunca exposta no client.**

## Modelo utilizado
Definir aqui a versão exata do Gemini usada (ex: `gemini-2.5-flash`).
