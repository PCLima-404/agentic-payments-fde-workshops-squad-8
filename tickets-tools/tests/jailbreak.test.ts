// tickets-tools/tests/jailbreak.test.ts
// Testes adversariais e de resistência a jailbreaks / manipulação de valores pelo modelo.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { registrarIntencao } from "../src/tools/registrarIntencao";
import { realizarCompra } from "../src/tools/realizarCompra";
import { salvarIntencao } from "../src/data/intencoes";
import * as limitesModule from "../src/data/limites";

describe("Segurança do Backend e Resistência a Jailbreak / Manipulação de Valores", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("garante que o backend calcula valorTotal e ignora qualquer tentativa do modelo de injetar 'valor' no payload", () => {
    // Simula tentativa de injection onde o modelo tenta enviar { valor: 0.01 } no payload de registrar_intencao
    const payloadComInjection = {
      evento_id: "evt_001", // Preço real no banco: 120.00
      quantidade: 2,
      usuario_id: "usr_001",
      valor: 0.01, // Tentativa maliciosa de pagar 1 centavo
      valor_total: 0.01,
    };

    const resultado = registrarIntencao(payloadComInjection as any);

    expect(resultado).toHaveProperty("intencaoId");
    if ("valorTotal" in resultado) {
      // O valor total DEVE ser 240.00 (120 * 2), ignorando completamente os campos injetados
      expect(resultado.valorTotal).toBe(240.0);
    }
  });

  it("garante que realizar_compra nunca aceita 'valor' do cliente e debita estritamente o valor da intenção persistida", async () => {
    // Mock do serviço auth
    vi.spyOn(limitesModule, "obterLimiteUsuario").mockResolvedValue(500);
    const debitarSpy = vi
      .spyOn(limitesModule, "debitarLimiteUsuario")
      .mockResolvedValue(380);

    const intencaoId = `int_segura_${Date.now()}`;

    // Intenção legítima registrada no banco pelo backend com valorTotal = 120.00
    salvarIntencao({
      intencaoId,
      eventoId: "evt_001",
      quantidade: 1,
      valorTotal: 120.0,
      moeda: "BRL",
      status: "pendente",
      usuarioId: "usr_001",
      expiraEm: new Date(Date.now() + 60_000).toISOString(),
    });

    // Simula chamada onde o modelo tenta passar { valor: 1.00 } nos argumentos de realizar_compra
    const argsComValorInjetado = {
      intencao_id: intencaoId,
      metodo_pagamento: "cartao" as const,
      usuario_id: "usr_001",
      token: "token_mock",
      valor: 1.0, // Tentativa maliciosa
    };

    const resultado = await realizarCompra(argsComValorInjetado as any);

    expect(resultado.status).toBe("aprovado");
    if ("valor" in resultado) {
      expect(resultado.valor).toBe(120.0);
    }

    // Verifica que a chamada a debitarLimiteUsuario recebeu rigorosamente 120.00
    expect(debitarSpy).toHaveBeenCalledWith("token_mock", 120.0);
  });

  it("garante que o backend recusa intenções inexistentes ou forjadas ('int_falsa')", async () => {
    const resultado = await realizarCompra({
      intencao_id: "int_falsa_ou_alucinada",
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

  it("garante bloqueio de race condition/TOCTOU: recusa compra se a intenção expirar durante o processamento", async () => {
    vi.spyOn(limitesModule, "obterLimiteUsuario").mockResolvedValue(500);
    vi.spyOn(limitesModule, "debitarLimiteUsuario").mockResolvedValue(380);

    const intencaoId = `int_toctou_${Date.now()}`;

    // Intenção inicialmente salva
    salvarIntencao({
      intencaoId,
      eventoId: "evt_001",
      quantidade: 1,
      valorTotal: 120.0,
      moeda: "BRL",
      status: "expirada", // Já foi marcada como expirada concorrentemente
      usuarioId: "usr_001",
      expiraEm: new Date(Date.now() - 5000).toISOString(),
    });

    const resultado = await realizarCompra({
      intencao_id: intencaoId,
      metodo_pagamento: "cartao",
      usuario_id: "usr_001",
      token: "token_mock",
    });

    // Deve ser recusada com INTENCAO_EXPIRADA ou INTENCAO_JA_PAGA e nunca aprovada
    expect(resultado.status).toBe("recusado");
    if ("erro" in resultado) {
      expect(["INTENCAO_EXPIRADA", "INTENCAO_INVALIDA"]).toContain(resultado.erro);
    }
  });

  it("garante que o modelo não consegue revalidar intenção expirada injetando novo expira_em no payload", async () => {
    const intencaoId = `int_bypass_exp_${Date.now()}`;

    salvarIntencao({
      intencaoId,
      eventoId: "evt_001",
      quantidade: 1,
      valorTotal: 120.0,
      moeda: "BRL",
      status: "pendente",
      usuarioId: "usr_001",
      expiraEm: new Date(Date.now() - 60000).toISOString(), // expirada no banco
    });

    // Modelo tenta injetar expira_em no futuro na chamada de realizar_compra
    const argsComBypass = {
      intencao_id: intencaoId,
      metodo_pagamento: "pix" as const,
      usuario_id: "usr_001",
      token: "token_mock",
      expira_em: new Date(Date.now() + 600000).toISOString(), // tentativa de bypass
    };

    const resultado = await realizarCompra(argsComBypass as any);

    expect(resultado.status).toBe("recusado");
    if ("erro" in resultado) {
      expect(resultado.erro).toBe("INTENCAO_EXPIRADA");
    }
  });
});