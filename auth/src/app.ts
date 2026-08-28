// auth/src/app.ts
import express from "express";
import { usuarios } from "./data/usuarios";
import { verificarSenha } from "./utils/senha";
import { gerarToken } from "./utils/token";
import { autenticar } from "./middleware/auth.middleware";

const app = express();
app.use(express.json());

app.post("/login", (req, res) => {
  const { username, senha } = req.body;
  const usuario = usuarios.get(username);

  if (!usuario || !verificarSenha(senha, usuario.senhaHash)) {
    return res.status(401).json({ erro: "CREDENCIAIS_INVALIDAS" });
  }

  const token = gerarToken(usuario.id, usuario.username);
  res.json({ token });
});

// GET /me: usado pelo tickets-tools para checar o limiteGasto, nunca vindo do frontend/prompt
app.get("/me", autenticar, (req, res) => {
  const { username } = (req as any).usuario;
  const usuario = usuarios.get(username);
  res.json({
    id: usuario?.id,
    username: usuario?.username,
    limiteGasto: usuario?.limiteGasto,
  });
});

export default app;
