// tickets-tools/tests/tools.test.ts
import { describe, it, expect } from "vitest";
import {
  validarPosse,
  validarStatusPago,
  validarExpiracao,
  validarLimiteGasto,
  validarMetodoPagamento,
} from "../src/validators/intencao.validator";
import { Intencao } from "../src/types";

describe("validarPosse", () => {
  const intencaoDoPedro: Intencao = {
    intencaoId: "int_abc123",
    eventoId: "evt_001",
    quantidade: 1,
    valorTotal: 100,
    moeda: "BRL",
    status: "pendente",
    usuarioId: "usr_001",
    expiraEm: new Date(Date.now() + 60_000).toISOString(),
  };

  it("retorna null quando a intenção pertence ao usuário da sessão", () => {
    expect(validarPosse(intencaoDoPedro, "usr_001")).toBeNull();
  });

  it("retorna INTENCAO_INVALIDA quando a intenção pertence a outro usuário", () => {
    expect(validarPosse(intencaoDoPedro, "usr_999_outro")).toBe(
      "INTENCAO_INVALIDA",
    );
  });

  it("retorna INTENCAO_INVALIDA quando a intenção não existe (id inventado)", () => {
    expect(validarPosse(undefined, "usr_001")).toBe("INTENCAO_INVALIDA");
  });

  it("simula uma tentativa de jailbreak: modelo tenta usar intencao_id de outro usuário", () => {
    const intencaoDeOutroUsuario: Intencao = {
      ...intencaoDoPedro,
      usuarioId: "usr_999",
    };
    expect(validarPosse(intencaoDeOutroUsuario, "usr_001")).toBe(
      "INTENCAO_INVALIDA",
    );
  });
});

describe("validarStatusPago", () => {
  it("retorna null quando a intenção ainda está pendente", () => {
    const intencao: Intencao = {
      intencaoId: "int_1",
      eventoId: "evt_001",
      quantidade: 1,
      valorTotal: 100,
      moeda: "BRL",
      status: "pendente",
      usuarioId: "usr_001",
      expiraEm: new Date(Date.now() + 60_000).toISOString(),
    };
    expect(validarStatusPago(intencao)).toBeNull();
  });

  it("retorna INTENCAO_JA_PAGA quando a intenção já foi usada", () => {
    const intencao: Intencao = {
      intencaoId: "int_1",
      eventoId: "evt_001",
      quantidade: 1,
      valorTotal: 100,
      moeda: "BRL",
      status: "paga",
      usuarioId: "usr_001",
      expiraEm: new Date(Date.now() + 60_000).toISOString(),
    };
    expect(validarStatusPago(intencao)).toBe("INTENCAO_JA_PAGA");
  });
});

describe("validarExpiracao", () => {
  it("retorna null quando o prazo ainda não passou", () => {
    const intencao: Intencao = {
      intencaoId: "int_1",
      eventoId: "evt_001",
      quantidade: 1,
      valorTotal: 100,
      moeda: "BRL",
      status: "pendente",
      usuarioId: "usr_001",
      expiraEm: new Date(Date.now() + 60_000).toISOString(),
    };
    expect(validarExpiracao(intencao)).toBeNull();
  });

  it("retorna INTENCAO_EXPIRADA quando o prazo já passou", () => {
    const intencao: Intencao = {
      intencaoId: "int_1",
      eventoId: "evt_001",
      quantidade: 1,
      valorTotal: 100,
      moeda: "BRL",
      status: "pendente",
      usuarioId: "usr_001",
      expiraEm: new Date(Date.now() - 60_000).toISOString(), // no passado
    };
    expect(validarExpiracao(intencao)).toBe("INTENCAO_EXPIRADA");
  });
});

describe("validarLimiteGasto", () => {
  it("retorna null quando o valor total está dentro do limite disponível", () => {
    expect(validarLimiteGasto(240, 500)).toBeNull();
  });

  it("retorna null quando o valor total é exatamente igual ao limite", () => {
    expect(validarLimiteGasto(240, 240)).toBeNull();
  });

  it("retorna LIMITE_EXCEDIDO quando o valor total ultrapassa o limite disponível", () => {
    expect(validarLimiteGasto(500, 240)).toBe("LIMITE_EXCEDIDO");
  });

  it("retorna LIMITE_EXCEDIDO quando o limite disponível é zero", () => {
    expect(validarLimiteGasto(1, 0)).toBe("LIMITE_EXCEDIDO");
  });
});

describe("validarMetodoPagamento", () => {
  it("retorna null quando o método é 'pix'", () => {
    expect(validarMetodoPagamento("pix")).toBeNull();
  });

  it("retorna null quando o método é 'cartao'", () => {
    expect(validarMetodoPagamento("cartao")).toBeNull();
  });

  it("retorna METODO_INVALIDO quando o método é um valor inventado", () => {
    expect(validarMetodoPagamento("boleto")).toBe("METODO_INVALIDO");
  });

  it("retorna METODO_INVALIDO quando o método é undefined", () => {
    expect(validarMetodoPagamento(undefined)).toBe("METODO_INVALIDO");
  });

  it("retorna METODO_INVALIDO quando o método é string vazia", () => {
    expect(validarMetodoPagamento("")).toBe("METODO_INVALIDO");
  });
});