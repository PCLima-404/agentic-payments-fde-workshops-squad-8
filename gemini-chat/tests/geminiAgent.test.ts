// gemini-chat/tests/geminiAgent.test.ts
// Testes unitários para o Orquestrador do Loop de Tool Calling (geminiAgent.ts).

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  executarLoopAgente,
  normalizarHistorico,
  SYSTEM_INSTRUCTION_AGENTE,
} from "../src/services/geminiAgent";
import { UsuarioSessao } from "../src/mcp/executor";
import * as clientModule from "../src/mcp/client";
import * as executorModule from "../src/mcp/executor";
import { GoogleGenerativeAI } from "@google/generative-ai";

describe("Orquestrador do Loop de Tool Calling (gemini-chat/src/services/geminiAgent.ts)", () => {
  const sessaoMock: UsuarioSessao = {
    id: "usr_pedro_001",
    username: "pedro",
  };
  const tokenJwtMock = "jwt_mock_token_123";

  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock padrão do MCP Client listando as 3 ferramentas
    vi.spyOn(clientModule, "listarToolsDisponiveis").mockResolvedValue([
      {
        name: "listar_catalogo",
        description: "Lista os eventos disponíveis",
        inputSchema: {
          type: "object",
          properties: { categoria: { type: "string" }, usuario_id: { type: "string" } },
        },
      },
      {
        name: "registrar_intencao",
        description: "Registra intenção de compra",
        inputSchema: {
          type: "object",
          properties: {
            evento_id: { type: "string" },
            quantidade: { type: "integer" },
            usuario_id: { type: "string" },
          },
          required: ["evento_id", "quantidade"],
        },
      },
      {
        name: "realizar_compra",
        description: "Realiza a compra",
        inputSchema: {
          type: "object",
          properties: {
            intencao_id: { type: "string" },
            metodo_pagamento: { type: "string", enum: ["cartao", "pix"] },
            usuario_id: { type: "string" },
            token: { type: "string" },
          },
          required: ["intencao_id", "metodo_pagamento"],
        },
      },
    ]);
  });

  describe("Normalização de Histórico (normalizarHistorico)", () => {
    it("deve converter mensagens simples { role, content } para a estrutura Content do Gemini", () => {
      const entrada = [
        { role: "user", content: "Olá, quais workshops vocês têm?" },
        { role: "assistant", content: "Olá! Vou consultar para você." },
      ];

      const resultado = normalizarHistorico(entrada);

      expect(resultado).toEqual([
        { role: "user", parts: [{ text: "Olá, quais workshops vocês têm?" }] },
        { role: "model", parts: [{ text: "Olá! Vou consultar para você." }] },
      ]);
    });

    it("deve preservar mensagens que já possuem parts", () => {
      const entrada = [
        { role: "user", parts: [{ text: "Mensagem pronta" }] },
      ];

      const resultado = normalizarHistorico(entrada);
      expect(resultado).toEqual(entrada);
    });
  });

  describe("Execução do Loop de Tool Calling", () => {
    it("deve processar resposta direta de texto sem invocar tools (0 tool calls)", async () => {
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          functionCalls: () => undefined,
          text: () => "Olá! Sou o assistente de ingressos da UOL. Como posso te ajudar?",
        },
      });

      const mockModel = { generateContent: mockGenerateContent };
      const mockGenAI = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      } as unknown as GoogleGenerativeAI;

      const resultado = await executarLoopAgente(
        [{ role: "user", content: "Olá!" }],
        sessaoMock,
        tokenJwtMock,
        5,
        mockGenAI
      );

      expect(resultado.iteracoes).toBe(1);
      expect(resultado.resposta).toBe(
        "Olá! Sou o assistente de ingressos da UOL. Como posso te ajudar?"
      );
      expect(resultado.historico.length).toBe(2);
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it("deve executar tool call (listar_catalogo) e devolver resposta final no turno seguinte", async () => {
      const spyExecutor = vi
        .spyOn(executorModule, "executarToolComSessao")
        .mockResolvedValue({
          produtos: [
            { id: "evt_001", nome: "Workshop de Agentes IA", preco: 120, estoque: 25 },
          ],
        });

      // Turno 1: Gemini pede tool call listar_catalogo
      // Turno 2: Gemini recebe o catálogo e devolve o texto final
      const mockGenerateContent = vi
        .fn()
        .mockResolvedValueOnce({
          response: {
            functionCalls: () => [
              { name: "listar_catalogo", args: { categoria: "Workshop" } },
            ],
            text: () => "",
          },
        })
        .mockResolvedValueOnce({
          response: {
            functionCalls: () => undefined,
            text: () => "Temos o Workshop de Agentes IA por R$ 120,00 com 25 vagas disponíveis!",
          },
        });

      const mockModel = { generateContent: mockGenerateContent };
      const mockGenAI = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      } as unknown as GoogleGenerativeAI;

      const resultado = await executarLoopAgente(
        [{ role: "user", content: "Quero ver os workshops." }],
        sessaoMock,
        tokenJwtMock,
        5,
        mockGenAI
      );

      expect(resultado.iteracoes).toBe(2);
      expect(resultado.resposta).toBe(
        "Temos o Workshop de Agentes IA por R$ 120,00 com 25 vagas disponíveis!"
      );
      expect(spyExecutor).toHaveBeenCalledWith(
        "listar_catalogo",
        { categoria: "Workshop" },
        sessaoMock,
        tokenJwtMock
      );
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);

      // Valida que o histórico contém os 4 turnos: user -> model (call) -> function (response) -> model (texto)
      expect(resultado.historico.length).toBe(4);
      expect(resultado.historico[0].role).toBe("user");
      expect(resultado.historico[1].role).toBe("model");
      expect(resultado.historico[2].role).toBe("function");
      expect(resultado.historico[3].role).toBe("model");
    });

    it("deve lidar com erros de negócio retornados pelas tools (status: recusado)", async () => {
      vi.spyOn(executorModule, "executarToolComSessao").mockResolvedValue({
        status: "recusado",
        erro: "LIMITE_EXCEDIDO",
        mensagem: "Você tentou gastar R$500, mas seu limite disponível é R$240.",
      });

      const mockGenerateContent = vi
        .fn()
        .mockResolvedValueOnce({
          response: {
            functionCalls: () => [
              { name: "realizar_compra", args: { intencao_id: "int_123", metodo_pagamento: "pix" } },
            ],
            text: () => "",
          },
        })
        .mockResolvedValueOnce({
          response: {
            functionCalls: () => undefined,
            text: () => "A sua compra não pôde ser concluída porque o valor excede seu limite disponível de R$ 240,00.",
          },
        });

      const mockModel = { generateContent: mockGenerateContent };
      const mockGenAI = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      } as unknown as GoogleGenerativeAI;

      const resultado = await executarLoopAgente(
        [{ role: "user", content: "Pode confirmar o pagamento no pix." }],
        sessaoMock,
        tokenJwtMock,
        5,
        mockGenAI
      );

      expect(resultado.iteracoes).toBe(2);
      expect(resultado.resposta).toContain("limite disponível");
    });

    it("deve interromper o loop com segurança caso o limite de iterações seja atingido (prevenção de loop infinito)", async () => {
      vi.spyOn(executorModule, "executarToolComSessao").mockResolvedValue({
        produtos: [],
      });

      // Simula um modelo em loop infinito que sempre retorna functionCall sem texto
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          functionCalls: () => [{ name: "listar_catalogo", args: {} }],
          text: () => "",
        },
      });

      const mockModel = { generateContent: mockGenerateContent };
      const mockGenAI = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      } as unknown as GoogleGenerativeAI;

      const limiteMaximo = 3;
      const resultado = await executarLoopAgente(
        [{ role: "user", content: "Teste loop" }],
        sessaoMock,
        tokenJwtMock,
        limiteMaximo,
        mockGenAI
      );

      expect(resultado.iteracoes).toBe(limiteMaximo);
      expect(mockGenerateContent).toHaveBeenCalledTimes(limiteMaximo);
      expect(resultado.resposta).toContain("Não foi possível concluir");
    });

    it("deve rejeitar a execução se a sessão do usuário for inválida", async () => {
      await expect(
        executarLoopAgente(
          [{ role: "user", content: "Olá" }],
          { id: "" } as UsuarioSessao,
          tokenJwtMock
        )
      ).rejects.toThrow(/Sessão inválida/);
    });
  });
});
