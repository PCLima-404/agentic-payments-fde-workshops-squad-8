// TODO (Pessoa 1): setup do Express + rotas de autenticação
// - POST /login (usuário/senha -> JWT)
// - GET /me (dados do usuário autenticado, incluindo limite de gasto)
import express from "express";

const app = express();
app.use(express.json());

// rotas aqui

export default app;
