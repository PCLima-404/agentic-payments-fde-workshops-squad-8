import Database from "better-sqlite3";
import path from "path";

// Caminho do arquivo SQLite
const dbPath = path.resolve(__dirname, "../../ingressos.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS eventos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    preco REAL NOT NULL,
    moeda TEXT NOT NULL DEFAULT 'BRL',
    vagas_totais INTEGER NOT NULL,
    vagas_restantes INTEGER NOT NULL
  );
`);
