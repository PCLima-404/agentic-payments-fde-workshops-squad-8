// auth/tests/escopoIntencao.test.ts
import { describe, it, expect, vi } from "vitest";
import { vincularUsuarioAoPayload } from "../src/session/escopoIntencao";

describe("vincularUsuarioAoPayload", () => {
  const usuarioAutenticado = { sub: "usr_001", username: "pedro" };

  it("injeta o usuario_id da sessão em um payload legítimo do modelo", () => {
    const payloadDoModelo = { evento_id: "evt_001", quantidade: 2 };

    const payloadFinal = vincularUsuarioAoPayload(
      payloadDoModelo,
      usuarioAutenticado,
    );

    expect(payloadFinal).toEqual({
      evento_id: "evt_001",
      quantidade: 2,
      usuario_id: "usr_001",
    });
  });

  it("sobrescreve um usuario_id forjado vindo do modelo (tentativa de jailbreak)", () => {
    const payloadMalicioso = {
      evento_id: "evt_002",
      quantidade: 1,
      usuario_id: "usr_999_forjado",
    };

    const payloadFinal = vincularUsuarioAoPayload(
      payloadMalicioso,
      usuarioAutenticado,
    );

    expect(payloadFinal.usuario_id).toBe("usr_001");
    expect(payloadFinal.usuario_id).not.toBe("usr_999_forjado");
  });

  it("o payload final chega correto na tool (mock) que recebe a chamada", () => {
    const registrarIntencaoMock = vi.fn((payload: Record<string, unknown>) => ({
      intencao_id: "int_teste_123",
      ...payload,
    }));

    const payloadDoModelo = { evento_id: "evt_003", quantidade: 3 };
    const payloadFinal = vincularUsuarioAoPayload(
      payloadDoModelo,
      usuarioAutenticado,
    );
    const resultado = registrarIntencaoMock(payloadFinal);

    expect(registrarIntencaoMock).toHaveBeenCalledWith(
      expect.objectContaining({ usuario_id: "usr_001" }),
    );
    expect(resultado.intencao_id).toBe("int_teste_123");
  });
});
