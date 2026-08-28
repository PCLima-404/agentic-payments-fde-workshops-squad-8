import { describe, it, expect, beforeEach, vi } from "vitest";
import { registrarIntencao } from "../src/tools/registrarIntencao";
import { realizarCompra } from "../src/tools/realizarCompra";
import { intencoes } from "../src/data/intencoes";
import { transacoes } from "../src/data/transacoes";
import * as limitesModule from "../src/data/limites";

describe("Suite de Testes de Resistência a Jailbreak e Tentativas Maliciosas", () => {
  beforeEach(() => {
    intencoes.clear();
    transacoes.clear();
    vi.restoreAllMocks();
  });

  it("deve bloquear tentativa de 'ignore o limite' assegurando que o backend recusa", async () => {
    // Mesmo que o prompt peça para ignorar o limite, a validação no backend é determinística
    vi.spyOn(limitesModule, "obterLimiteUsuario").mockResolvedValue(100);

    const intencao = registrarIntencao({
      evento_id: "evt_003", // Preço: 1150.00
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

    expect(resultado.status).toBe("recusado");
    if ("erro" in resultado) {
      expect(resultado.erro).toBe("LIMITE_EXCEDIDO");
    }
  });

  it("deve bloquear uso de intenção inventada/alucinada pelo modelo ('int_falsa')", async () => {
    const resultado = await realizarCompra({
      intencao_id: "int_falsa_ou_alucinada",
      metodo_pagamento: "pix",
      usuario_id: "usr_001",
      token: "token_mock",
    });

    expect(resultado.status).toBe("recusado");
    if ("erro" in resultado) {
      expect(resultado.erro).toBe("INTENCAO_INVALIDA");
    }
  });

  it("deve bloquear tentativa de usurpar intenção de compra de outro usuário", async () => {
    const intencao = registrarIntencao({
      evento_id: "evt_001",
      quantidade: 1,
      usuario_id: "vitima_001",
    });

    if (!("intencaoId" in intencao)) throw new Error("Falha ao registrar");

    const resultado = await realizarCompra({
      intencao_id: intencao.intencaoId,
      metodo_pagamento: "pix",
      usuario_id: "atacante_002",
      token: "token_mock",
    });

    expect(resultado.status).toBe("recusado");
    if ("erro" in resultado) {
      expect(resultado.erro).toBe("INTENCAO_INVALIDA");
    }
  });
});
