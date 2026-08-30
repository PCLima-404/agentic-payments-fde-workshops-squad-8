// gemini-chat/tests/chatRoute.test.ts
// Testes unitários e de integração para o endpoint HTTP POST /api/chat (route.ts).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, extrairSessaoDoToken } from "../src/app/api/chat/route";
import * as agentModule from "../src/services/geminiAgent";
import { NextRequest } from "next/server";

// Helper para gerar tokens JWT válidos em formato base64url para testes
function criarTokenJwtMock(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url"
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = "mock_signature_bytes";

  return `${header}.${body}.${signature}`;
}

describe("Endpoint HTTP /api/chat (gemini-chat/src/app/api/chat/route.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validação e Extração de Sessão (extrairSessaoDoToken)", () => {
    it("deve extrair id e username de um token JWT válido com claim 'sub'", () => {
      const token = criarTokenJwtMock({
        sub: "usr_pedro_001",
        username: "pedro",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      const sessao = extrairSessaoDoToken(token);

      expect(sessao).toEqual({
        id: "usr_pedro_001",
        username: "pedro",
      });
    });

    it("deve suportar tokens com claim 'userId' ou 'usuario_id'", () => {
      const token = criarTokenJwtMock({
        userId: "usr_everson_002",
        username: "everson",
      });

      const sessao = extrairSessaoDoToken(token);

      expect(sessao).toEqual({
        id: "usr_everson_002",
        username: "everson",
      });
    });

    it("deve rejeitar tokens expirados", () => {
      const tokenExpirado = criarTokenJwtMock({
        sub: "usr_expirado",
        username: "expirado",
        exp: Math.floor(Date.now() / 1000) - 3600, // expirou há 1 hora
      });

      const sessao = extrairSessaoDoToken(tokenExpirado);
      expect(sessao).toBeNull();
    });

    it("deve retornar null para strings malformadas ou vazias", () => {
      expect(extrairSessaoDoToken("")).toBeNull();
      expect(extrairSessaoDoToken("token.invalido")).toBeNull();
      expect(extrairSessaoDoToken("abc.def.ghi.jkl")).toBeNull();
    });
  });

  describe("Handler POST /api/chat - Autenticação e Validação", () => {
    it("deve retornar 401 TOKEN_AUSENTE quando o header Authorization não for enviado", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "Olá" }] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.erro).toBe("TOKEN_AUSENTE");
    });

    it("deve retornar 401 TOKEN_AUSENTE quando o header Authorization não utilizar o prefixo Bearer", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          Authorization: "Basic dXN1YXJpbzpzZW5oYQ==",
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "Olá" }] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.erro).toBe("TOKEN_AUSENTE");
    });

    it("deve retornar 401 TOKEN_INVALIDO quando o token JWT for forjado ou inválido", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          Authorization: "Bearer token_falso_invalido",
        },
        body: JSON.stringify({ messages: [{ role: "user", content: "Olá" }] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.erro).toBe("TOKEN_INVALIDO");
    });

    it("deve retornar 400 PAYLOAD_INVALIDO quando o corpo não for um JSON válido", async () => {
      const tokenValido = criarTokenJwtMock({
        sub: "usr_001",
        username: "pedro",
      });

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenValido}`,
        },
        body: "isto_nao_e_um_json",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.erro).toBe("PAYLOAD_INVALIDO");
    });

    it("deve retornar 400 PAYLOAD_INVALIDO quando o campo messages for omitido ou vazio", async () => {
      const tokenValido = criarTokenJwtMock({
        sub: "usr_001",
        username: "pedro",
      });

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenValido}`,
        },
        body: JSON.stringify({ messages: [] }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.erro).toBe("PAYLOAD_INVALIDO");
    });
  });

  describe("Handler POST /api/chat - Execução e Resposta", () => {
    it("deve processar mensagem com sucesso e retornar status 200 com payload estruturado", async () => {
      const tokenValido = criarTokenJwtMock({
        sub: "usr_pedro_001",
        username: "pedro",
      });

      const spyExecutarLoop = vi
        .spyOn(agentModule, "executarLoopAgente")
        .mockResolvedValue({
          resposta: "Olá Pedro! Temos vários workshops disponíveis.",
          historico: [
            { role: "user", parts: [{ text: "Olá" }] },
            { role: "model", parts: [{ text: "Olá Pedro! Temos vários workshops disponíveis." }] },
          ],
          iteracoes: 1,
        });

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenValido}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Olá" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.resposta).toBe("Olá Pedro! Temos vários workshops disponíveis.");
      expect(json.historico.length).toBe(2);
      expect(json.iteracoes).toBe(1);

      expect(spyExecutarLoop).toHaveBeenCalledWith(
        [{ role: "user", content: "Olá" }],
        { id: "usr_pedro_001", username: "pedro" },
        tokenValido,
        5
      );
    });

    it("deve repassar maxIteracoes customizado quando fornecido no corpo da requisição", async () => {
      const tokenValido = criarTokenJwtMock({
        sub: "usr_pedro_001",
        username: "pedro",
      });

      const spyExecutarLoop = vi
        .spyOn(agentModule, "executarLoopAgente")
        .mockResolvedValue({
          resposta: "Resposta com limite 3.",
          historico: [],
          iteracoes: 2,
        });

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenValido}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Teste limite customizado" }],
          maxIteracoes: 3,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(spyExecutarLoop).toHaveBeenCalledWith(
        [{ role: "user", content: "Teste limite customizado" }],
        { id: "usr_pedro_001", username: "pedro" },
        tokenValido,
        3
      );
    });

    it("deve retornar 500 ERRO_INTERNO caso o orquestrador lance uma exceção não tratada", async () => {
      // Silencia a saída de console.error esperada para este cenário de teste de falha
      vi.spyOn(console, "error").mockImplementation(() => {});

      const tokenValido = criarTokenJwtMock({
        sub: "usr_pedro_001",
        username: "pedro",
      });

      vi.spyOn(agentModule, "executarLoopAgente").mockRejectedValue(
        new Error("Falha crítica de comunicação com o modelo Gemini.")
      );

      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenValido}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Erro proposital" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.erro).toBe("ERRO_INTERNO");
    });
  });
});
