import { db } from "../db/database";
import { gerarHashSenha } from "../utils/senha";

export interface Usuario {
  id: string;
  username: string;
  senhaHash: string;
  limiteGasto: number;
}

export const USUARIOS_INICIAIS: Usuario[] = [
  {
    id: "usr_001",
    username: "pedro",
    senhaHash: gerarHashSenha("123456"),
    limiteGasto: 500.0,
  },
  {
    id: "usr_002",
    username: "luis",
    senhaHash: gerarHashSenha("123456"),
    limiteGasto: 300.0,
  },
  {
    id: "usr_003",
    username: "everson",
    senhaHash: gerarHashSenha("123456"),
    limiteGasto: 50.0, // Perfeito para testar LIMITE_EXCEDIDO
  },
  {
    id: "usr_004",
    username: "carlos",
    senhaHash: gerarHashSenha("123456"),
    limiteGasto: 5000.0,
  },
  {
    id: "usr_005",
    username: "fernanda",
    senhaHash: gerarHashSenha("123456"),
    limiteGasto: 0.0, // Sem limite
  },
];

// Busca um usuário pelo username no SQLite
export function buscarUsuarioPorUsername(
  username: string,
): Usuario | undefined {
  const stmt = db.prepare(`
    SELECT 
      id, username, 
      senha_hash AS senhaHash, 
      limite_gasto AS limiteGasto 
    FROM usuarios 
    WHERE username = ?
  `);
  return stmt.get(username) as Usuario | undefined;
}

// Busca um usuário pelo ID
export function buscarUsuarioPorId(id: string): Usuario | undefined {
  const stmt = db.prepare(`
    SELECT 
      id, username, 
      senha_hash AS senhaHash, 
      limite_gasto AS limiteGasto 
    FROM usuarios 
    WHERE id = ?
  `);
  return stmt.get(id) as Usuario | undefined;
}

// Atualiza o limite de gasto do usuário após uma compra
export function debitarLimiteUsuario(id: string, valor: number): boolean {
  const stmt = db.prepare(`
    UPDATE usuarios 
    SET limite_gasto = limite_gasto - ? 
    WHERE id = ? AND limite_gasto >= ?
  `);
  const info = stmt.run(valor, id, valor);
  return info.changes > 0;
}

export function criarUsuario(usuario: Usuario): void {
  const stmt = db.prepare(`
    INSERT INTO usuarios (id, username, senha_hash, limite_gasto)
    VALUES (@id, @username, @senhaHash, @limiteGasto)
  `);
  stmt.run(usuario);
}
