// tickets-tools/tests/calculo.test.ts
// Suíte de testes unitários para a regra de negócio de cálculo de valor_total no backend.

import { describe, it, expect } from "vitest";
import { calcularValorTotal } from "../src/validators/calculo.validator";

describe("calcularValorTotal (Regra de Negócio: Cálculo no Backend)", () => {
  describe("Cálculos com valores inteiros", () => {
    it("deve calcular o valor total exato para 1 item", () => {
      const resultado = calcularValorTotal(120.0, 1);
      expect(resultado).toBe(120.0);
    });

    it("deve calcular o valor total exato para múltiplos itens", () => {
      const resultado = calcularValorTotal(120.0, 2);
      expect(resultado).toBe(240.0);
    });

    it("deve calcular corretamente para valor unitário zero (evento gratuito)", () => {
      const resultado = calcularValorTotal(0, 5);
      expect(resultado).toBe(0);
    });
  });

  describe("Precisão monetária e ponto flutuante (IEEE 754)", () => {
    it("deve evitar imprecisões decimais como 49.90 * 3 = 149.70 (não 149.70000000000002)", () => {
      const resultado = calcularValorTotal(49.9, 3);
      expect(resultado).toBe(149.7);
    });

    it("deve arredondar com precisão de 2 casas decimais para centavos (ex: 19.99 * 7 = 139.93)", () => {
      const resultado = calcularValorTotal(19.99, 7);
      expect(resultado).toBe(139.93);
    });

    it("deve lidar com preços unitários com casas decimais complexas", () => {
      const resultado = calcularValorTotal(33.33, 3);
      expect(resultado).toBe(99.99);
    });
  });

  describe("Validações e rejeição de parâmetros inválidos", () => {
    it("deve lançar erro quando a quantidade for zero", () => {
      expect(() => calcularValorTotal(100, 0)).toThrowError(
        /Quantidade inválida/
      );
    });

    it("deve lançar erro quando a quantidade for negativa", () => {
      expect(() => calcularValorTotal(100, -2)).toThrowError(
        /Quantidade inválida/
      );
    });

    it("deve lançar erro quando a quantidade for fracionária / decimal", () => {
      expect(() => calcularValorTotal(100, 1.5)).toThrowError(
        /Quantidade inválida/
      );
    });

    it("deve lançar erro quando a quantidade for NaN ou Infinity", () => {
      expect(() => calcularValorTotal(100, NaN)).toThrowError(
        /Quantidade inválida/
      );
      expect(() => calcularValorTotal(100, Infinity)).toThrowError(
        /Quantidade inválida/
      );
    });

    it("deve lançar erro quando o preço unitário for negativo", () => {
      expect(() => calcularValorTotal(-50, 1)).toThrowError(
        /Preço unitário inválido/
      );
    });

    it("deve lançar erro quando o preço unitário for NaN ou Infinity", () => {
      expect(() => calcularValorTotal(NaN, 1)).toThrowError(
        /Preço unitário inválido/
      );
    });
  });
});
