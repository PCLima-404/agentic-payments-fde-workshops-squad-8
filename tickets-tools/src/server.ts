// src/server.ts
// Servidor MCP do módulo tickets-tools.
//
// Registra as 3 tools (listar_catalogo, registrar_intencao, realizar_compra)
// e conecta via StdioServerTransport — padrão MCP para integração com gemini-chat.
//
// Schemas de entrada validados com zod (já declarado no package.json).
// O campo usuario_id e token são injetados pelo gemini-chat/route.ts,
// não são enviados diretamente pelo LLM (card ad-hoc de integração pendente).

// Importações via paths internos CJS do SDK — necessário porque o pacote é publicado
// como ESM-first (type: module) mas mantém distribuição CJS em dist/cjs/.
// Quando o gemini-chat migrar para ESM ou o projeto adotar "type":"module",
// esses imports podem ser revertidos para @modelcontextprotocol/sdk/server/mcp etc.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { McpServer } = require("@modelcontextprotocol/sdk/dist/cjs/server/mcp.js") as typeof import("@modelcontextprotocol/sdk/dist/cjs/server/mcp.js");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/dist/cjs/server/stdio.js") as typeof import("@modelcontextprotocol/sdk/dist/cjs/server/stdio.js");
import { z } from "zod";

import { listarCatalogo, ArgsListarCatalogo } from "./tools/listarCatalogo";
import { registrarIntencao, ArgsRegistrarIntencao } from "./tools/registrarIntencao";
import { realizarCompra, ArgsRealizarCompra } from "./tools/realizarCompra";

// Instancia o servidor MCP com nome e versão identificáveis pelo cliente
const servidor = new McpServer({
  name: "tickets-tools",
  version: "1.0.0",
});

// ─── Tool: listar_catalogo ────────────────────────────────────────────────────
// Retorna o catálogo de eventos disponíveis, com filtro opcional por categoria.
servidor.tool(
  "listar_catalogo",
  "Lista os eventos disponíveis para compra de ingressos. Filtro opcional por categoria.",
  {
    categoria: z
      .string()
      .optional()
      .describe("Categoria do evento (ex: Workshop, Hackathon, Conferência)"),
    usuario_id: z
      .string()
      .describe("ID do usuário autenticado, injetado pelo route.ts"),
  },
  async (args: ArgsListarCatalogo) => {
    const resultado = listarCatalogo(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(resultado),
        },
      ],
    };
  }
);

// ─── Tool: registrar_intencao ─────────────────────────────────────────────────
// Cria uma intenção de compra temporária. O valor é calculado no backend.
// Decrementa vagas no ato do registro (decisão de equipe).
// Expira em 5 minutos.
servidor.tool(
  "registrar_intencao",
  "Registra a intenção de compra de um ingresso para um evento. Retorna a intenção com valor calculado e prazo de expiração de 5 minutos.",
  {
    evento_id: z
      .string()
      .describe("ID do evento retornado por listar_catalogo (ex: evt_001)"),
    quantidade: z
      .number()
      .int()
      .positive()
      .describe("Quantidade de ingressos desejada (inteiro positivo)"),
    usuario_id: z
      .string()
      .describe("ID do usuário autenticado, injetado pelo route.ts"),
  },
  async (args: ArgsRegistrarIntencao) => {
    const resultado = registrarIntencao(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(resultado),
        },
      ],
    };
  }
);

// ─── Tool: realizar_compra ────────────────────────────────────────────────────
// Confirma a compra a partir de uma intenção válida.
// O valor NÃO é argumento — vem da intenção registrada no backend.
// Valida: método, posse, status, expiração e limite de gasto.
servidor.tool(
  "realizar_compra",
  "Confirma a compra de um ingresso a partir de uma intenção registrada. Aceita cartao ou pix. O valor é lido da intenção, nunca enviado pelo usuário.",
  {
    intencao_id: z
      .string()
      .describe(
        "ID da intenção gerado por registrar_intencao (ex: int_a1b2c3)"
      ),
    metodo_pagamento: z
      .enum(["cartao", "pix"])
      .describe("Método de pagamento aceito: cartao ou pix"),
    usuario_id: z
      .string()
      .describe("ID do usuário autenticado, injetado pelo route.ts"),
    token: z
      .string()
      .describe("JWT do usuário, usado para consultar limite em auth/"),
  },
  async (args: ArgsRealizarCompra) => {
    const resultado = await realizarCompra(args);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(resultado),
        },
      ],
    };
  }
);

// ─── Inicialização ────────────────────────────────────────────────────────────
// Conecta o servidor ao transporte stdio (padrão para integração com gemini-chat)
async function iniciar() {
  const transporte = new StdioServerTransport();
  await servidor.connect(transporte);
  console.error("[tickets-tools] Servidor MCP iniciado via stdio.");
}

iniciar().catch((erro) => {
  console.error("[tickets-tools] Erro fatal ao iniciar servidor MCP:", erro);
  process.exit(1);
});
