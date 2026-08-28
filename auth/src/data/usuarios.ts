import { gerarHashSenha } from "../utils/senha";

export interface Usuario {
  id: string;
  username: string;
  senhaHash: string;
  limiteGasto: number;
}

export const usuarios = new Map<string, Usuario>();

usuarios.set("pedro", {
  id: "usr_001",
  username: "pedro",
  senhaHash: gerarHashSenha("123456"),
  limiteGasto: 500,
});
