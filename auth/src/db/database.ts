import Database from "better-sqlite3";
import path from "path";

// Cria o arquivo 'auth.db' na raiz de auth/
const dbPath = path.resolve(__dirname, "../../auth.db");
export const db = new Database(dbPath);

// Modo WAL para performance
db.pragma("journal_mode = WAL");

// Cria a tabela de usuários caso não exista
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    limite_gasto REAL NOT NULL
  );
`);
