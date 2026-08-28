import jwt from "jsonwebtoken";

const SEGREDO = process.env.JWT_SECRET || "troque_este_valor";

export function gerarToken(usuarioId: string, username: string): string {
  return jwt.sign({ sub: usuarioId, username }, SEGREDO, { expiresIn: "2h" });
}

export function verificarToken(token: string) {
  return jwt.verify(token, SEGREDO) as { sub: string; username: string };
}
