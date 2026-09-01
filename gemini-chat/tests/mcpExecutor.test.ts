// gemini-chat/tests/mcpExecutor.test.ts
// Testes unitários para o Executor Seguro com injeção de contexto de sessão (usuario_id e token).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { executarToolComSessao, UsuarioSessao } from "../src/mcp/executor";
import * as clientModule from "../src/mcp/client";

describe("MCP Executor (gemini-chat/src/mcp/executor.ts)", () => {
  const sessaoLegitima: UsuarioSessao = {
    id: "usr_pedro_001",
    username: "pedro",
  };
  const tokenJwtValido = "jwt_valido_sessao_123";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Injeção Obrigatória de Contexto de Sessão", () => {
    it("deve injetar usuario_id automaticamente ao executar listar_catalogo", async () => {
      const chamarToolSpy = vi
        .spyOn(clientModule, "chamarToolMcp")
        .mockResolvedValue({ produtos: [] });

      await executarToolComSessao(
        "listar_catalogo",
        { categoria: "Workshop" },
        sessaoLegitima,
        tokenJwtValido
      );

      expect(chamarToolSpy).toHaveBeenCalledWith("listar_catalogo", {
        categoria: "Workshop",
        usuario_id: "usr_pedro_001",
        token: tokenJwtValido,
      });
    });

    it("deve injetar usuario_id automaticamente ao executar registrar_intencao", async () => {
      const chamarToolSpy = vi
        .spyOn(clientModule, "chamarToolMcp")
        .mockResolvedValue({ intencaoId: "int_123", status: "pendente" });

      await executarToolComSessao(
        "registrar_intencao",
        { evento_id: "evt_001", quantidade: 2 },
        sessaoLegitima,
        tokenJwtValido
      );

      expect(chamarToolSpy).toHaveBeenCalledWith("registrar_intencao", {
        evento_id: "evt_001",
        quantidade: 2,
        usuario_id: "usr_pedro_001",
        token: tokenJwtValido,
      });
    });

    it("deve injetar usuario_id e token obrigatoriamente ao executar realizar_compra", async () => {
      const chamarToolSpy = vi
        .spyOn(clientModule, "chamarToolMcp")
        .mockResolvedValue({ status: "aprovado", transacao_id: "tx_999" });

      await executarToolComSessao(
        "realizar_compra",
        { intencao_id: "int_123", metodo_pagamento: "pix" },
        sessaoLegitima,
        tokenJwtValido
      );

      expect(chamarToolSpy).toHaveBeenCalledWith("realizar_compra", {
        intencao_id: "int_123",
        metodo_pagamento: "pix",
        usuario_id: "usr_pedro_001",
        token: tokenJwtValido,
      });
    });
  });

  describe("Blindagem Anti-Tampering (Sobrescrita de Payloads Forjados pelo LLM)", () => {
    it("deve sobrescrever qualquer usuario_id forjado enviado nos argumentos do modelo", async () => {
      const chamarToolSpy = vi
        .spyOn(clientModule, "chamarToolMcp")
        .mockResolvedValue({ intencaoId: "int_123" });

      const argsAdulteradosPeloModelo = {
        evento_id: "evt_001",
        quantidade: 1,
        usuario_id: "usr_vitima_forjado", // Tentativa de jailbreak/spoofing
      };

      await executarToolComSessao(
        "registrar_intencao",
        argsAdulteradosPeloModelo,
        sessaoLegitima,
        tokenJwtValido
      );

      // O usuario_id repassado ao MCP DEVE ser estritamente o da sessão legítima
      expect(chamarToolSpy).toHaveBeenCalledWith(
        "registrar_intencao",
        expect.objectContaining({
          usuario_id: "usr_pedro_001",
        })
      );
    });

    it("deve sobrescrever qualquer token forjado enviado nos argumentos do modelo", async () => {
      const chamarToolSpy = vi
        .spyOn(clientModule, "chamarToolMcp")
        .mockResolvedValue({ status: "aprovado" });

      const argsAdulterados = {
        intencao_id: "int_123",
        metodo_pagamento: "cartao",
        token: "token_falso_do_modelo",
      };

      await executarToolComSessao(
        "realizar_compra",
        argsAdulterados,
        sessaoLegitima,
        tokenJwtValido
      );

      expect(chamarToolSpy).toHaveBeenCalledWith(
        "realizar_compra",
        expect.objectContaining({
          token: tokenJwtValido,
        })
      );
    });
  });

  describe("Validações Defensivas de Sessão", () => {
    it("deve lançar erro se a sessão for nula ou não possuir id", async () => {
      await expect(
        executarToolComSessao(
          "listar_catalogo",
          {},
          null as unknown as UsuarioSessao,
          tokenJwtValido
        )
      ).rejects.toThrow(/Sessão inválida/);

      await expect(
        executarToolComSessao(
          "listar_catalogo",
          {},
          { id: "" } as UsuarioSessao,
          tokenJwtValido
        )
      ).rejects.toThrow(/Sessão inválida/);
    });
  });
});
