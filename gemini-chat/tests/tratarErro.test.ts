import { describe, it, expect } from "vitest";
import {
  tratarErroParaLinguagemNatural,
  ehErroTool,
  type ErroTool,
} from "../src/utils/tratarErro";

describe("tratarErroParaLinguagemNatural", () => {
  it("usa a mensagem enviada pela própria tool quando presente", () => {
    const erro: ErroTool = {
      status: "recusado",
      erro: "LIMITE_EXCEDIDO",
      mensagem: "Você tentou gastar R$500, mas seu limite disponível é R$240.",
    };

    expect(tratarErroParaLinguagemNatural(erro)).toBe(
      "Você tentou gastar R$500, mas seu limite disponível é R$240.",
    );
  });

  it("usa a mensagem padrão de fallback quando a tool não envia 'mensagem'", () => {
    const erro: ErroTool = {
      status: "recusado",
      erro: "METODO_INVALIDO",
      mensagem: "",
    };

    expect(tratarErroParaLinguagemNatural(erro)).toBe(
      "Esse método de pagamento não é aceito. Você pode usar cartão ou pix.",
    );
  });

  it("cobre todos os códigos de erro conhecidos com uma mensagem amigável", () => {
    const codigos: ErroTool["erro"][] = [
      "INTENCAO_INVALIDA",
      "INTENCAO_JA_PAGA",
      "INTENCAO_EXPIRADA",
      "LIMITE_EXCEDIDO",
      "METODO_INVALIDO",
      "VAGAS_INSUFICIENTES",
      "ERRO_INTERNO",
    ];

    for (const codigo of codigos) {
      const erro: ErroTool = { status: "recusado", erro: codigo, mensagem: "" };
      const resultado = tratarErroParaLinguagemNatural(erro);
      expect(typeof resultado).toBe("string");
      expect(resultado.length).toBeGreaterThan(0);
    }
  });
});

describe("ehErroTool", () => {
  it("retorna true para um objeto no formato ErroTool", () => {
    const erro: ErroTool = {
      status: "recusado",
      erro: "INTENCAO_EXPIRADA",
      mensagem: "Expirou.",
    };

    expect(ehErroTool(erro)).toBe(true);
  });

  it("retorna false para um retorno de sucesso comum", () => {
    const sucesso = { status: "aprovado", transacao_id: "tx_1" };
    expect(ehErroTool(sucesso)).toBe(false);
  });

  it("retorna false para undefined ou tipos inesperados", () => {
    expect(ehErroTool(undefined)).toBe(false);
    expect(ehErroTool("string qualquer")).toBe(false);
    expect(ehErroTool(42)).toBe(false);
  });
});
