import Database from "better-sqlite3";
import path from "path";

// Caminho do arquivo SQLite (compatível com src/ e dist/src/)
const dbPath =
  process.env.DB_PATH ||
  (__dirname.includes("dist")
    ? path.resolve(__dirname, "../../../ingressos.db")
    : path.resolve(__dirname, "../../ingressos.db"));
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS eventos (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    preco REAL NOT NULL CHECK (preco >= 0),
    moeda TEXT NOT NULL DEFAULT 'BRL',
    vagas_totais INTEGER NOT NULL CHECK (vagas_totais >= 0),
    vagas_restantes INTEGER NOT NULL CHECK (vagas_restantes >= 0)
  );

  CREATE TABLE IF NOT EXISTS intencoes (
    intencao_id TEXT PRIMARY KEY,
    evento_id TEXT NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_total REAL NOT NULL CHECK (valor_total >= 0),
    moeda TEXT NOT NULL DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'expirada')),
    usuario_id TEXT NOT NULL,
    expira_em TEXT NOT NULL,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_intencoes_usuario
  ON intencoes(usuario_id);

  CREATE INDEX IF NOT EXISTS idx_intencoes_status_expira
  ON intencoes(status, expira_em);
`);
