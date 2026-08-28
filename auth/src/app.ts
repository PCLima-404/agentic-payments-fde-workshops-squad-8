// TODO (Pessoa 1): setup do Express + rotas de autenticação
// - POST /login (usuário/senha -> JWT)
// - GET /me (dados do usuário autenticado, incluindo limite de gasto)
import express from "express";

const app = express();
app.use(express.json());

<<<<<<< HEAD
app.post("/login", (req, res) => {
  const { username, senha } = req.body;
  const usuario = usuarios.get(username);

  if (!usuario || !verificarSenha(senha, usuario.senhaHash)) {
    return res.status(401).json({ erro: "CREDENCIAIS_INVALIDAS" });
  }

  const token = gerarToken(usuario.id, usuario.username);
  res.json({ token });
});

app.get("/me", autenticar, (req, res) => {
  const { username } = (req as any).usuario;
  const usuario = usuarios.get(username);
  res.json({
    id: usuario?.id,
    username: usuario?.username,
    limiteGasto: usuario?.limiteGasto,
  });
});

// Serve para validar isoladamente que o middleware bloqueia acesso sem sessão válida,
// Quando o route.ts real do gemini-chat/ estiver pronto, ele deve usar o mesmo padrão
// (aplicar `autenticar` antes de qualquer lógica do chat).
app.get("/chat-stub", autenticar, (req, res) => {
  const usuario = (req as any).usuario;
  res.json({
    ok: true,
    mensagem: "Acesso ao chat permitido — sessão válida.",
    usuario,
  });
});
=======
// rotas aqui
>>>>>>> origin/prod

export default app;
