import { describe, it, expect, beforeEach, vi } from "vitest";
import { listarCatalogo } from "../src/tools/listarCatalogo";
import { registrarIntencao } from "../src/tools/registrarIntencao";
import { realizarCompra } from "../src/tools/realizarCompra";
import { intencoes } from "../src/data/intencoes";
import { transacoes } from "../src/data/transacoes";
import * as limitesModule from "../src/data/limites";

describe("Suite de Testes das Tools MCP", () => {
  beforeEach(() => {
    // Limpa estado em memória antes de cada teste
    intencoes.clear();
    transacoes.clear();
    vi.restoreAllMocks();
  });

  describe("listar_catalogo", () => {
    it("deve retornar todos os eventos disponíveis do catálogo", () => {
      const resultado = listarCatalogo({ usuario_id: "usr_001" });
      expect(resultado).toHaveProperty("produtos");
      expect(Array.isArray(resultado.produtos)).toBe(true);
      expect(resultado.produtos.length).toBeGreaterThan(0);

      const primeiro = resultado.produtos[0];
      expect(primeiro).toHaveProperty("id");
      expect(primeiro).toHaveProperty("nome");
      expect(primeiro).toHaveProperty("preco");
      expect(primeiro).toHaveProperty("moeda", "BRL");
      expect(primeiro).toHaveProperty("estoque");
    });

    it("deve filtrar eventos por categoria", () => {
      const resultado = listarCatalogo({
        categoria: "Workshop",
        usuario_id: "usr_001",
      });
      expect(resultado.produtos.length).toBeGreaterThan(0);
    });

    it("deve retornar array vazio se categoria não existir", () => {
      const resultado = listarCatalogo({
        categoria: "CategoriaInexistente123",
        usuario_id: "usr_001",
      });
      expect(resultado.produtos).toEqual([]);
    });
  });

  describe("registrar_intencao", () => {
    it("deve registrar intenção com sucesso e calcular valor no backend", () => {
      const intencao = registrarIntencao({
        evento_id: "evt_001",
        quantidade: 2,
        usuario_id: "usr_001",
      });

      expect(intencao).toHaveProperty("intencaoId");
      if ("intencaoId" in intencao) {
        expect(intencao.eventoId).toBe("evt_001");
        expect(intencao.quantidade).toBe(2);
        expect(intencao.valorTotal).toBe(240); // 120 * 2
        expect(intencao.status).toBe("pendente");
        expect(intencao.usuarioId).toBe("usr_001");
        expect(intencao.expiraEm).toBeDefined();
      }
    });

    it("deve retornar INTENCAO_INVALIDA se evento não existir", () => {
      const erro = registrarIntencao({
        evento_id: "evt_inexistente",
        quantidade: 1,
        usuario_id: "usr_001",
      });

      expect(erro).toEqual({
        status: "recusado",
        erro: "INTENCAO_INVALIDA",
        mensagem: expect.any(String),
      });
    });

    it("deve retornar VAGAS_INSUFICIENTES se quantidade exceder vagas restantes", () => {
      const erro = registrarIntencao({
        evento_id: "evt_005", // tem poucas vagas
        quantidade: 999,
        usuario_id: "usr_001",
      });

      expect(erro).toEqual({
        status: "recusado",
        erro: "VAGAS_INSUFICIENTES",
        mensagem: expect.any(String),
      });
    });
  });

  describe("realizar_compra", () => {
    it("deve concluir compra com sucesso via cartao", async () => {
      vi.spyOn(limitesModule, "obterLimiteUsuario").mockResolvedValue(1000);

      const intencao = registrarIntencao({
        evento_id: "evt_002",
        quantidade: 1,
        usuario_id: "usr_001",
      });

      if (!("intencaoId" in intencao)) throw new Error("Falha ao registrar");

      const resultado = await realizarCompra({
        intencao_id: intencao.intencaoId,
        metodo_pagamento: "cartao",
        usuario_id: "usr_001",
        token: "token_mock",
      });

      expect(resultado).toHaveProperty("status", "aprovado");
      if ("transacao_id" in resultado) {
        expect(resultado.transacao_id).toMatch(/^tx_/);
        expect(resultado.intencao_id).toBe(intencao.intencaoId);
        expect(resultado.valor).toBe(intencao.valorTotal);
        expect(resultado.metodo_pagamento).toBe("cartao");
        expect(resultado.limite_restante).toBe(1000 - intencao.valorTotal);
      }
    });

    it("deve concluir compra com sucesso via pix", async () => {
      vi.spyOn(limitesModule, "obterLimiteUsuario").mockResolvedValue(500);

      const intencao = registrarIntencao({
        evento_id: "evt_004",
        quantidade: 2,
        usuario_id: "usr_001",
      });

      if (!("intencaoId" in intencao)) throw new Error("Falha ao registrar");

      const resultado = await realizarCompra({
        intencao_id: intencao.intencaoId,
        metodo_pagamento: "pix",
        usuario_id: "usr_001",
        token: "token_mock",
      });

      expect(resultado).toHaveProperty("status", "aprovado");
      if ("transacao_id" in resultado) {
        expect(resultado.metodo_pagamento).toBe("pix");
      }
    });

    it("deve recusar com INTENCAO_INVALIDA se intencao_id não existir", async () => {
      const resultado = await realizarCompra({
        intencao_id: "int_falsa_999",
        metodo_pagamento: "pix",
        usuario_id: "usr_001",
        token: "token_mock",
      });

      expect(resultado).toEqual({
        status: "recusado",
        erro: "INTENCAO_INVALIDA",
        mensagem: expect.any(String),
      });
    });

    it("deve recusar com INTENCAO_INVALIDA se intenção pertencer a outro usuário", async () => {
      const intencao = registrarIntencao({
        evento_id: "evt_001",
        quantidade: 1,
        usuario_id: "usr_dono_original",
      });

      if (!("intencaoId" in intencao)) throw new Error("Falha ao registrar");

      const resultado = await realizarCompra({
        intencao_id: intencao.intencaoId,
        metodo_pagamento: "pix",
        usuario_id: "usr_atacante",
        token: "token_mock",
      });

      expect(resultado).toEqual({
        status: "recusado",
        erro: "INTENCAO_INVALIDA",
        mensagem: expect.any(String),
      });
    });

    it("deve recusar com METODO_INVALIDO se método não for cartao ou pix", async () => {
      const resultado = await realizarCompra({
        intencao_id: "int_qualquer",
        metodo_pagamento: "boleto" as any,
        usuario_id: "usr_001",
        token: "token_mock",
      });

      expect(resultado).toEqual({
        status: "recusado",
        erro: "METODO_INVALIDO",
        mensagem: expect.any(String),
      });
    });

    it("deve recusar com LIMITE_EXCEDIDO se valor total for superior ao limite", async () => {
      // Limite de apenas 50 reais
      vi.spyOn(limitesModule, "obterLimiteUsuario").mockResolvedValue(50);

      const intencao = registrarIntencao({
        evento_id: "evt_001", // custa 120 reais
        quantidade: 1,
        usuario_id: "usr_001",
      });

      if (!("intencaoId" in intencao)) throw new Error("Falha ao registrar");

      const resultado = await realizarCompra({
        intencao_id: intencao.intencaoId,
        metodo_pagamento: "pix",
        usuario_id: "usr_001",
        token: "token_mock",
      });

      expect(resultado).toEqual({
        status: "recusado",
        erro: "LIMITE_EXCEDIDO",
        mensagem: expect.any(String),
      });
    });

    it("deve recusar com INTENCAO_JA_PAGA se intenção já foi consumida em compra anterior", async () => {
      vi.spyOn(limitesModule, "obterLimiteUsuario").mockResolvedValue(1000);

      const intencao = registrarIntencao({
        evento_id: "evt_004",
        quantidade: 1,
        usuario_id: "usr_001",
      });

      if (!("intencaoId" in intencao)) throw new Error("Falha ao registrar");

      // Primeira compra com sucesso
      await realizarCompra({
        intencao_id: intencao.intencaoId,
        metodo_pagamento: "cartao",
        usuario_id: "usr_001",
        token: "token_mock",
      });

      // Segunda tentativa com a mesma intenção
      const resultadoRepetido = await realizarCompra({
        intencao_id: intencao.intencaoId,
        metodo_pagamento: "cartao",
        usuario_id: "usr_001",
        token: "token_mock",
      });

      expect(resultadoRepetido).toEqual({
        status: "recusado",
        erro: "INTENCAO_JA_PAGA",
        mensagem: expect.any(String),
      });
    });

    it("deve recusar com INTENCAO_EXPIRADA se intenção passou do prazo", async () => {
      const intencao = registrarIntencao({
        evento_id: "evt_001",
        quantidade: 1,
        usuario_id: "usr_001",
      });

      if (!("intencaoId" in intencao)) throw new Error("Falha ao registrar");

      // Força expiração no passado
      intencao.expiraEm = new Date(Date.now() - 1000 * 60).toISOString();
      intencoes.set(intencao.intencaoId, intencao);

      const resultado = await realizarCompra({
        intencao_id: intencao.intencaoId,
        metodo_pagamento: "pix",
        usuario_id: "usr_001",
        token: "token_mock",
      });

      expect(resultado).toEqual({
        status: "recusado",
        erro: "INTENCAO_EXPIRADA",
        mensagem: expect.any(String),
      });
    });
  });
});
