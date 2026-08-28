// auth/tests/limite.test.ts
// Suite de testes para o endpoint PATCH /me/limite.
//
// Estrategia: usa supertest para disparar requisicoes HTTP reais contra o app Express,
// com banco SQLite em memoria (configurado via DATABASE_URL ou path de teste).
// O JWT e gerado pela propria funcao gerarToken para nao depender de um servidor externo.
//
// Casos cobertos:
//   - Debito bem-sucedido: saldo reduzido e limiteRestante correto
//   - Debito parcial que zera o saldo
//   - Debito com saldo insuficiente -> LIMITE_INSUFICIENTE (422)
//   - Valor invalido: string, negativo, zero, ausente -> VALOR_INVALIDO (400)
//   - Sem token -> TOKEN_AUSENTE (401)
//   - Token invalido -> TOKEN_INVALIDO (401)

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../src/app";
import { db } from "../src/db/database";
import { gerarToken } from "../src/utils/token";
import { gerarHashSenha } from "../src/utils/senha";

// Usuario de teste isolado — nao interfere nos dados de outros testes
const USUARIO_TESTE = {
  id: "usr_teste_limite_001",
  username: "teste_limite",
  senhaHash: gerarHashSenha("senha_teste"),
  limiteGasto: 200.00,
};

// Insere o usuario de teste antes de rodar os casos
beforeAll(() => {
  db.prepare(`
    INSERT OR REPLACE INTO usuarios (id, username, senha_hash, limite_gasto)
    VALUES (?, ?, ?, ?)
  `).run(
    USUARIO_TESTE.id,
    USUARIO_TESTE.username,
    USUARIO_TESTE.senhaHash,
    USUARIO_TESTE.limiteGasto,
  );
});

// Gera um JWT valido para o usuario de teste
function gerarTokenTeste(): string {
  return gerarToken(USUARIO_TESTE.id, USUARIO_TESTE.username);
}

// Restaura o limite do usuario de teste para 200.00 entre os casos que alteram saldo
function restaurarLimite(novoLimite: number = 200.00): void {
  db.prepare("UPDATE usuarios SET limite_gasto = ? WHERE id = ?")
    .run(novoLimite, USUARIO_TESTE.id);
}

describe("PATCH /me/limite", () => {
  describe("Fluxos de sucesso", () => {
    it("deve debitar o valor e retornar o limiteRestante correto", async () => {
      restaurarLimite(200.00);
      const token = gerarTokenTeste();

      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({ valor: 120.00 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("limiteRestante");
      // 200.00 - 120.00 = 80.00 (tolerancia de floating point)
      expect(res.body.limiteRestante).toBeCloseTo(80.00, 2);
    });

    it("deve debitar o valor exato que zera o saldo (limite = 0)", async () => {
      restaurarLimite(50.00);
      const token = gerarTokenTeste();

      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({ valor: 50.00 });

      expect(res.status).toBe(200);
      expect(res.body.limiteRestante).toBeCloseTo(0.00, 2);
    });

    it("deve debitar valores decimais corretamente", async () => {
      restaurarLimite(100.00);
      const token = gerarTokenTeste();

      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({ valor: 49.90 });

      expect(res.status).toBe(200);
      expect(res.body.limiteRestante).toBeCloseTo(50.10, 2);
    });
  });

  describe("Saldo insuficiente", () => {
    it("deve retornar 422 LIMITE_INSUFICIENTE quando o valor excede o saldo", async () => {
      restaurarLimite(100.00);
      const token = gerarTokenTeste();

      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({ valor: 100.01 });

      expect(res.status).toBe(422);
      expect(res.body.erro).toBe("LIMITE_INSUFICIENTE");
      expect(res.body).toHaveProperty("mensagem");
    });

    it("nao deve alterar o saldo quando o debito falha por limite insuficiente", async () => {
      restaurarLimite(100.00);
      const token = gerarTokenTeste();

      await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({ valor: 999.00 });

      // Confirma que o saldo nao foi alterado
      const saldoApos = db
        .prepare("SELECT limite_gasto FROM usuarios WHERE id = ?")
        .get(USUARIO_TESTE.id) as { limite_gasto: number };

      expect(saldoApos.limite_gasto).toBeCloseTo(100.00, 2);
    });
  });

  describe("Validacao de entrada (VALOR_INVALIDO)", () => {
    it("deve retornar 400 quando valor for zero", async () => {
      const token = gerarTokenTeste();
      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({ valor: 0 });

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("VALOR_INVALIDO");
    });

    it("deve retornar 400 quando valor for negativo", async () => {
      const token = gerarTokenTeste();
      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({ valor: -50 });

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("VALOR_INVALIDO");
    });

    it("deve retornar 400 quando valor for uma string", async () => {
      const token = gerarTokenTeste();
      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({ valor: "cem" });

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("VALOR_INVALIDO");
    });

    it("deve retornar 400 quando o campo valor estiver ausente no body", async () => {
      const token = gerarTokenTeste();
      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("VALOR_INVALIDO");
    });
  });

  describe("Autenticacao (middleware autenticar)", () => {
    it("deve retornar 401 TOKEN_AUSENTE quando nao houver Authorization header", async () => {
      const res = await request(app)
        .patch("/me/limite")
        .send({ valor: 50 });

      expect(res.status).toBe(401);
      expect(res.body.erro).toBe("TOKEN_AUSENTE");
    });

    it("deve retornar 401 TOKEN_INVALIDO quando o token for malformado", async () => {
      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", "Bearer token_invalido_qualquer")
        .send({ valor: 50 });

      expect(res.status).toBe(401);
      expect(res.body.erro).toBe("TOKEN_INVALIDO");
    });

    it("deve retornar 401 TOKEN_AUSENTE com header malformado (sem Bearer)", async () => {
      const token = gerarTokenTeste();
      const res = await request(app)
        .patch("/me/limite")
        .set("Authorization", token) // sem "Bearer "
        .send({ valor: 50 });

      expect(res.status).toBe(401);
      expect(res.body.erro).toBe("TOKEN_AUSENTE");
    });
  });
});
