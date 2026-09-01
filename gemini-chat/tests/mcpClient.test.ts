// gemini-chat/tests/mcpClient.test.ts
// Testes unitários e de integração para o cliente MCP do gemini-chat.

import { describe, it, expect, afterEach, beforeEach } from "vitest";
import {
  obterMcpClient,
  listarToolsDisponiveis,
  chamarToolMcp,
  fecharMcpClient,
  resolverCaminhoServidorMcp,
} from "../src/mcp/client";
import path from "path";

describe("MCP Client (gemini-chat/src/mcp/client.ts)", () => {
  beforeEach(async () => {
    await fecharMcpClient();
  });

  afterEach(async () => {
    await fecharMcpClient();
  });

  describe("Resolução de Caminho do Servidor MCP", () => {
    it("deve respeitar a variável de ambiente MCP_SERVER_PATH quando definida", () => {
      const caminhoMock = "C:/mock/caminho/server.js";
      process.env.MCP_SERVER_PATH = caminhoMock;

      const resultado = resolverCaminhoServidorMcp();
      expect(resultado).toBe(path.resolve(caminhoMock));

      delete process.env.MCP_SERVER_PATH;
    });

    it("deve retornar um caminho válido apontando para server.js por padrão", () => {
      delete process.env.MCP_SERVER_PATH;
      const resultado = resolverCaminhoServidorMcp();
      expect(resultado).toMatch(/server\.js$/);
    });
  });

  describe("Conexão e Descoberta de Ferramentas (Stdio Transport)", () => {
    it("deve instanciar o cliente Singleton e listar as 3 tools do tickets-tools", async () => {
      const tools = await listarToolsDisponiveis();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThanOrEqual(3);

      const nomesTools = tools.map((t) => t.name);
      expect(nomesTools).toContain("listar_catalogo");
      expect(nomesTools).toContain("registrar_intencao");
      expect(nomesTools).toContain("realizar_compra");
    });

    it("deve retornar a mesma instância ao chamar obterMcpClient múltiplas vezes (Singleton)", async () => {
      const client1 = await obterMcpClient();
      const client2 = await obterMcpClient();

      expect(client1).toBe(client2);
    });
  });

  describe("Execução de Chamadas de Ferramentas (callTool)", () => {
    it("deve executar listar_catalogo com sucesso e retornar o catálogo em JSON", async () => {
      const resultado = (await chamarToolMcp("listar_catalogo", {
        usuario_id: "usr_teste_001",
      })) as { produtos: Array<{ id: string; nome: string; preco: number }> };

      expect(resultado).toHaveProperty("produtos");
      expect(Array.isArray(resultado.produtos)).toBe(true);
      expect(resultado.produtos.length).toBeGreaterThan(0);

      const primeiro = resultado.produtos[0];
      expect(primeiro).toHaveProperty("id");
      expect(primeiro).toHaveProperty("nome");
      expect(primeiro).toHaveProperty("preco");
    });

    it("deve executar registrar_intencao e retornar objeto com valor total calculado", async () => {
      const resultado = (await chamarToolMcp("registrar_intencao", {
        evento_id: "evt_001",
        quantidade: 1,
        usuario_id: "usr_teste_001",
      })) as { intencaoId?: string; status?: string; valorTotal?: number };

      expect(resultado).toHaveProperty("intencaoId");
      expect(resultado.status).toBe("pendente");
      expect(resultado.valorTotal).toBe(120);
    });

    it("deve propagar erro quando a tool executada não existe", async () => {
      await expect(
        chamarToolMcp("tool_inexistente_123", { usuario_id: "usr_001" })
      ).rejects.toThrow();
    });
  });

  describe("Encerramento Limpo (fecharMcpClient)", () => {
    it("deve fechar a conexão sem lançar exceções", async () => {
      await obterMcpClient();
      await expect(fecharMcpClient()).resolves.not.toThrow();
    });
  });
});
