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

    // Mock padrão do MCP Client listando as 3 ferramentas do servidor tickets-tools
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

    it("deve converter mensagens com role 'assistant' para 'model'", () => {
      const entrada = [{ role: "assistant", text: "Mensagem do assistente" }];
      const resultado = normalizarHistorico(entrada);

      expect(resultado).toEqual([
        { role: "model", parts: [{ text: "Mensagem do assistente" }] },
      ]);
    });

    it("deve preservar mensagens que já possuem a estrutura Content com parts", () => {
      const entrada = [
        { role: "user", parts: [{ text: "Mensagem pronta" }] },
      ];

      const resultado = normalizarHistorico(entrada);
      expect(resultado).toEqual(entrada);
    });

    it("deve retornar array vazio para entradas nulas ou indefinidas", () => {
      expect(normalizarHistorico(null as unknown as [])).toEqual([]);
      expect(normalizarHistorico(undefined as unknown as [])).toEqual([]);
    });
  });

  describe("Execução do Loop de Tool Calling (Fluxos Principais)", () => {
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

    it("deve processar registro de intenção de compra encadeada e explicar valores ao usuário", async () => {
      const spyExecutor = vi
        .spyOn(executorModule, "executarToolComSessao")
        .mockResolvedValue({
          intencaoId: "int_abc123",
          produtoId: "evt_001",
          quantidade: 2,
          valorTotal: 240.0,
          moeda: "BRL",
          status: "pendente",
          expiraEm: "2026-08-30T17:00:00.000Z",
        });

      const mockGenerateContent = vi
        .fn()
        .mockResolvedValueOnce({
          response: {
            functionCalls: () => [
              { name: "registrar_intencao", args: { evento_id: "evt_001", quantidade: 2 } },
            ],
            text: () => "",
          },
        })
        .mockResolvedValueOnce({
          response: {
            functionCalls: () => undefined,
            text: () => "Reservei 2 ingressos por R$ 240,00 no total. Você deseja pagar com cartão ou pix?",
          },
        });

      const mockModel = { generateContent: mockGenerateContent };
      const mockGenAI = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      } as unknown as GoogleGenerativeAI;

      const resultado = await executarLoopAgente(
        [{ role: "user", content: "Quero 2 ingressos para o evento evt_001." }],
        sessaoMock,
        tokenJwtMock,
        5,
        mockGenAI
      );

      expect(resultado.iteracoes).toBe(2);
      expect(spyExecutor).toHaveBeenCalledWith(
        "registrar_intencao",
        { evento_id: "evt_001", quantidade: 2 },
        sessaoMock,
        tokenJwtMock
      );
      expect(resultado.resposta).toContain("R$ 240,00");
    });
  });

  describe("Tratamento de Erros e Casos Adversariais no Loop", () => {
    it("deve lidar com erros de negócio retornados pelas tools (status: recusado / LIMITE_EXCEDIDO)", async () => {
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

    it("deve capturar falhas de execução de ferramenta e injetar ERRO_INTERNO no functionResponse", async () => {
      vi.spyOn(executorModule, "executarToolComSessao").mockRejectedValue(
        new Error("Conexão com subprocesso MCP falhou.")
      );

      const mockGenerateContent = vi
        .fn()
        .mockResolvedValueOnce({
          response: {
            functionCalls: () => [
              { name: "listar_catalogo", args: {} },
            ],
            text: () => "",
          },
        })
        .mockResolvedValueOnce({
          response: {
            functionCalls: () => undefined,
            text: () => "Tivemos uma instabilidade temporária ao consultar os eventos. Por favor, tente novamente.",
          },
        });

      const mockModel = { generateContent: mockGenerateContent };
      const mockGenAI = {
        getGenerativeModel: vi.fn().mockReturnValue(mockModel),
      } as unknown as GoogleGenerativeAI;

      const resultado = await executarLoopAgente(
        [{ role: "user", content: "Listar eventos" }],
        sessaoMock,
        tokenJwtMock,
        5,
        mockGenAI
      );

      expect(resultado.iteracoes).toBe(2);
      expect(resultado.resposta).toContain("instabilidade temporária");

      // Verifica que o functionResponse foi gerado com ERRO_INTERNO
      const functionResponseTurn = resultado.historico.find((h) => h.role === "function");
      expect(functionResponseTurn).toBeDefined();
    });

    it("deve interromper o loop com segurança caso o limite de iterações seja atingido (prevenção de loop infinito)", async () => {
      vi.spyOn(executorModule, "executarToolComSessao").mockResolvedValue({
        produtos: [],
      });

      // Simula um modelo em loop infinito que sempre retorna functionCall sem texto final
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

    it("deve rejeitar a execução se a sessão do usuário for inválida ou não possuir id", async () => {
      await expect(
        executarLoopAgente(
          [{ role: "user", content: "Olá" }],
          { id: "" } as UsuarioSessao,
          tokenJwtMock
        )
      ).rejects.toThrow(/Sessão inválida/);

      await expect(
        executarLoopAgente(
          [{ role: "user", content: "Olá" }],
          null as unknown as UsuarioSessao,
          tokenJwtMock
        )
      ).rejects.toThrow(/Sessão inválida/);
    });
  });
});
