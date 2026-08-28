import { describe, expect, it } from "vitest";
import { Intencao } from "../src/types";
import { validarExpiracao } from "../src/validators/intencao.validator";
import { realizarCompra } from "../src/tools/realizarCompra";

// Suíte de testes unitários para a regra de validação do tempo de expiração da intenção
describe("Validação de expiração da intenção", () => {
    // Objeto base utilizado para montar os cenários de teste
  const intencaoBase: Intencao = {
    intencaoId: "int_teste",
    eventoId: "evt_001",
    quantidade: 1,
    valorTotal: 120,
    moeda: "BRL",
    status: "pendente",
    usuarioId: "user_001",
    expiraEm: "2026-08-28T12:00:00.000Z",
  };

  // Garante que intenções com timestamp no passado retornem a chave do erro esperado
  it("deve retornar INTENCAO_EXPIRADA quando o prazo já passou", () => {
    const intencaoExpirada: Intencao = {
      ...intencaoBase,
      expiraEm: "2020-01-01T00:00:00.000Z",
    };

    expect(validarExpiracao(intencaoExpirada)).toBe("INTENCAO_EXPIRADA");
  });

  // Garante que intenções dentro do prazo de validade passem sem erros
  it("deve retornar null quando a intenção ainda está válida", () => {
    const intencaoValida: Intencao = {
      ...intencaoBase,
      expiraEm: "2999-01-01T00:00:00.000Z",
    };

    expect(validarExpiracao(intencaoValida)).toBeNull();
  });
});

// Suíte de testes unitários para a validação de intenções inexistentes ou não vinculadas ao usuário
describe("Validação de intenção inexistente", () => {
    // Garante que passar um intencao_id que não consta no banco retorne o contrato de erro INTENCAO_INVALIDA
  it("deve retornar INTENCAO_INVALIDA para um intencao_id inexistente", async () => {
    const resultado = await realizarCompra({
      intencao_id: "int_inexistente",
      metodo_pagamento: "cartao",
      usuario_id: "user_001",
      token: "token-teste",
    });

    expect(resultado).toEqual({
      status: "recusado",
      erro: "INTENCAO_INVALIDA",
      mensagem:
        "Essa intenção de compra não existe ou não pertence a este usuário.",
    });
  });
});