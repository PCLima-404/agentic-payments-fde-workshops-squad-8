# agentic-payments-fde-workshops — Ingressos de Eventos

Chatbot que conversa com um LLM (Gemini) e executa a compra de ingressos para eventos do campus através de ferramentas expostas via MCP.

## Módulos

| Pasta | Descrição |
|---|---|---
| `auth/` | API de autenticação (login/JWT) 
| `tickets-tools/` | Servidor MCP com as 3 tools (catálogo, intenção, compra) 
| `gemini-chat/`  | Frontend + agente (Gemini API + MCP client) 

## Modelo utilizado
- **LLM:** Gemini (definir versão exata aqui, ex: `gemini-2.5-flash`)

## Como rodar

1. `cd auth && npm install && npm run dev`
2. `cd tickets-tools && npm install && npm run dev`
3. `cd gemini-chat && npm install && npm run dev`

Cada módulo tem seu próprio `README.md` com instruções detalhadas e variáveis de ambiente.

## Fluxo esperado
1. Usuário faz login (`auth/`)
2. "O que tem disponível?" → agente chama `listar_catalogo`
3. "Quero um ingresso para o evento X" → agente chama `registrar_intencao`
4. "Pode pagar no pix" → agente chama `realizar_compra`
5. Se estourar o limite → erro tratado e explicado pelo agente

## Screenshots (entrega obrigatória)
Ver `docs/screenshots/`.
