// gemini-chat/tests/vocabulario.test.ts
import { describe, it, expect } from "vitest";
import { traduzir } from "../src/utils/vocabulario";

describe("traduzir (vocabulario)", () => {
  it("traduz LIMITE_EXCEDIDO para linguagem humana", () => {
    expect(traduzir("LIMITE_EXCEDIDO")).toBe("passou do seu valor disponível");
  });

  it("nunca devolve o próprio código técnico como fallback", () => {
    const resultado = traduzir("CODIGO_DESCONHECIDO_QUALQUER");
    expect(resultado).not.toMatch(/[A-Z_]{4,}/); // sem SCREAMING_CASE visível
  });
});
