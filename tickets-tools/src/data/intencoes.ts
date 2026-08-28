import { db } from "../db/database";
import { Intencao } from "../types";

// Tipagem intermediaria para mapear o retorno das colunas renomeadas no SELECT SQL
type IntencaoRow = {
  intencaoId: string;
  eventoId: string;
  quantidade: number;
  valorTotal: number;
  moeda: string;
  status: Intencao["status"];
  usuarioId: string;
  expiraEm: string;
};

function converterLinha(row: IntencaoRow): Intencao {
  return {
    intencaoId: row.intencaoId,
    eventoId: row.eventoId,
    quantidade: row.quantidade,
    valorTotal: row.valorTotal,
    moeda: row.moeda,
    status: row.status,
    usuarioId: row.usuarioId,
    expiraEm: row.expiraEm,
  };
}

// Persiste uma nova intenção de compra na tabela intencoes do SQLite
export function salvarIntencao(intencao: Intencao): void {
  const stmt = db.prepare(`
    INSERT INTO intencoes (
      intencao_id,
      evento_id,
      quantidade,
      valor_total,
      moeda,
      status,
      usuario_id,
      expira_em
    ) VALUES (
      @intencaoId,
      @eventoId,
      @quantidade,
      @valorTotal,
      @moeda,
      @status,
      @usuarioId,
      @expiraEm
    )
  `);

  stmt.run(intencao);
}

// Busca uma intenção pelo ID e garante a atualização de status caso a intenção tenha expirado
export function buscarIntencaoPorId(
  intencaoId: string
): Intencao | undefined {
  const expirada = db.prepare(`
    UPDATE intencoes
    SET status = 'expirada'
    WHERE intencao_id = ?
      AND status = 'pendente'
      AND expira_em <= ?
  `);

  expirada.run(intencaoId, new Date().toISOString());

  const stmt = db.prepare(`
    SELECT
      intencao_id AS intencaoId,
      evento_id AS eventoId,
      quantidade,
      valor_total AS valorTotal,
      moeda,
      status,
      usuario_id AS usuarioId,
      expira_em AS expiraEm
    FROM intencoes
    WHERE intencao_id = ?
  `);

  const row = stmt.get(intencaoId) as IntencaoRow | undefined;

  return row ? converterLinha(row) : undefined;
}

// Atualiza o estado de uma intenção (ex: de 'pendente' para 'paga' ou 'expirada')
export function atualizarStatusIntencao(
  intencaoId: string,
  status: Intencao["status"]
): boolean {
  const stmt = db.prepare(`
    UPDATE intencoes
    SET status = ?
    WHERE intencao_id = ?
  `);

  return stmt.run(status, intencaoId).changes > 0;
}