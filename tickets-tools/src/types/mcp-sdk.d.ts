// src/types/mcp-sdk.d.ts
// Declarações de módulo para compatibilidade entre os paths CJS internos do SDK MCP
// e os tipos disponíveis nos arquivos ESM (.d.ts).
//
// Necessário porque o SDK @modelcontextprotocol/sdk v1.x é publicado com type: "module"
// e os tipos .d.ts estão em dist/esm/, mas os binários CJS estão em dist/cjs/.
// O TypeScript não resolve automaticamente os tipos para paths dist/cjs/ em modo CommonJS.
//
// Esta declaração pode ser removida se o projeto migrar para "type": "module".

declare module "@modelcontextprotocol/sdk/dist/cjs/server/mcp.js" {
  export { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/dist/esm/server/mcp.js";
}

declare module "@modelcontextprotocol/sdk/dist/cjs/server/stdio.js" {
  export { StdioServerTransport } from "@modelcontextprotocol/sdk/dist/esm/server/stdio.js";
}
