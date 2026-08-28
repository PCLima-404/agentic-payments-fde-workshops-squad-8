// auth/src/utils/senha.ts
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function gerarHashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarSenha(senha: string, senhaHash: string): boolean {
  const [salt, hashOriginal] = senhaHash.split(":");
  const hashTentativa = scryptSync(senha, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hashOriginal), Buffer.from(hashTentativa));
}
