// auth/src/app.ts
// Setup do Express + rotas de autenticação e gestão de limite.
//
// Rotas disponíveis:
//   POST /login                — autentica usuario/senha e retorna JWT
//   GET  /me                   — retorna dados do usuario autenticado (inclui limiteGasto)
//   PATCH /me/limite           — debita valor do limite de gasto do usuario autenticado
//   GET  /chat-stub            — stub de validacao do middleware (uso interno/testes)

import express from "express";
import {
  buscarUsuarioPorUsername,
  buscarUsuarioPorId,
  debitarLimiteUsuario,
} from "./data/usuarios";
import { verificarSenha } from "./utils/senha";
import { gerarToken } from "./utils/token";
import { autenticar } from "./middleware/auth.middleware";

const app = express();
app.use(express.json());

// POST /login
// Autentica com username e senha. Retorna JWT valido por 2 horas.
app.post("/login", (req, res) => {
  const { username, senha } = req.body;
  const usuario = buscarUsuarioPorUsername(username);

  if (!usuario || !verificarSenha(senha, usuario.senhaHash)) {
    return res.status(401).json({ erro: "CREDENCIAIS_INVALIDAS" });
  }

  const token = gerarToken(usuario.id, usuario.username);
  res.json({ token });
});

// GET /me
// Retorna os dados publicos do usuario autenticado, incluindo o limiteGasto atual.
// Consumido pelo tickets-tools via obterLimiteUsuario() para validar LIMITE_EXCEDIDO.
app.get("/me", autenticar, (req, res) => {
  const { username } = (req as any).usuario;
  const usuario = buscarUsuarioPorUsername(username);
  res.json({
    id: usuario?.id,
    username: usuario?.username,
    limiteGasto: usuario?.limiteGasto,
  });
});

// PATCH /me/limite
// Debita o valor informado do limite de gasto do usuario autenticado.
// Deve ser chamado pelo tickets-tools apos a aprovacao de realizar_compra.
//
// Body esperado: { valor: number } — valor positivo em reais (ex: 120.00)
//
// Respostas:
//   200 { limiteRestante: number } — debito realizado com sucesso
//   400 { erro: "VALOR_INVALIDO" } — valor ausente, nao numerico ou <= 0
//   401 { erro: "TOKEN_AUSENTE" | "TOKEN_INVALIDO" } — middleware rejeita
//   422 { erro: "LIMITE_INSUFICIENTE" } — saldo insuficiente para o debito
app.patch("/me/limite", autenticar, (req, res) => {
  const { sub: usuarioId } = (req as any).usuario;
  const { valor } = req.body;

  // Validacao de entrada: valor deve ser um numero positivo
  if (typeof valor !== "number" || valor <= 0) {
    return res.status(400).json({
      erro: "VALOR_INVALIDO",
      mensagem: "O valor de debito deve ser um numero positivo.",
    });
  }

  // Debito atomico via SQL: UPDATE WHERE limite_gasto >= valor
  // Se retornar false, o saldo era insuficiente — nao ha debito parcial
  const debitou = debitarLimiteUsuario(usuarioId, valor);

  if (!debitou) {
    return res.status(422).json({
      erro: "LIMITE_INSUFICIENTE",
      mensagem: "Saldo de limite insuficiente para realizar o debito.",
    });
  }

  // Retorna o saldo atualizado para confirmacao pelo chamador
  const usuarioAtualizado = buscarUsuarioPorId(usuarioId);
  return res.json({
    limiteRestante: usuarioAtualizado?.limiteGasto ?? 0,
  });
});

// GET /chat-stub
// Valida isoladamente que o middleware bloqueia acesso sem sessao valida.
// Quando o route.ts do gemini-chat/ estiver pronto, ele deve usar o mesmo padrao.
app.get("/chat-stub", autenticar, (req, res) => {
  const usuario = (req as any).usuario;
  res.json({
    ok: true,
    mensagem: "Acesso ao chat permitido — sessão válida.",
    usuario,
  });
});

export default app;