import { Request, Response, NextFunction } from "express";
import { verificarToken } from "../utils/token";

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "TOKEN_AUSENTE" });
  }
  try {
    const payload = verificarToken(authHeader.split(" ")[1]);
    (req as any).usuario = payload;
    next();
  } catch {
    return res.status(401).json({ erro: "TOKEN_INVALIDO" });
  }
}
