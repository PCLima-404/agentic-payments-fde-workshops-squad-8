// src/data/intencoes.ts
import { db } from "../db/database";
import { Intencao } from "../types";
import { incrementarVagas } from "./eventos";

// Tipagem intermediária para mapear o retorno das colunas renomeadas no SELECT SQL
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

// Busca uma intenção pelo ID e garante a atualização de status e o estorno de vagas
// caso a intenção tenha expirado de forma atômica (db.transaction)
export function buscarIntencaoPorId(
  intencaoId: string
): Intencao | undefined {
  const agora = new Date().toISOString();

  const processarConsultaEExpiracao = db.transaction(() => {
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
    if (!row) return undefined;

    // Se estiver pendente e já tiver ultrapassado o prazo de expiração
    if (row.status === "pendente" && row.expiraEm <= agora) {
      const updateStmt = db.prepare(`
        UPDATE intencoes
        SET status = 'expirada'
        WHERE intencao_id = ? AND status = 'pendente'
      `);

      const info = updateStmt.run(intencaoId);

      // Garante idempotência: somente estorna se de fato transicionou de status
      if (info.changes > 0) {
        incrementarVagas(row.eventoId, row.quantidade);
        row.status = "expirada";
      }
    }

    return converterLinha(row);
  });

  return processarConsultaEExpiracao();
}

// Varre todas as intenções pendentes que ultrapassaram a data de expiração,
// atualizando seus status para 'expirada' e restaurando o estoque de vagas dos eventos correspondentes.
export function expirarIntencoesVencidas(): number {
  const agora = new Date().toISOString();

  const sweepTransaction = db.transaction(() => {
    const selectPendentesVencidas = db.prepare(`
      SELECT
        intencao_id AS intencaoId,
        evento_id AS eventoId,
        quantidade
      FROM intencoes
      WHERE status = 'pendente' AND expira_em <= ?
    `);

    const vencidas = selectPendentesVencidas.all(agora) as Array<{
      intencaoId: string;
      eventoId: string;
      quantidade: number;
    }>;

    if (vencidas.length === 0) return 0;

    const updateStmt = db.prepare(`
      UPDATE intencoes
      SET status = 'expirada'
      WHERE intencao_id = ? AND status = 'pendente'
    `);

    let totalEstornadas = 0;
    for (const intencao of vencidas) {
      const info = updateStmt.run(intencao.intencaoId);
      if (info.changes > 0) {
        incrementarVagas(intencao.eventoId, intencao.quantidade);
        totalEstornadas++;
      }
    }

    return totalEstornadas;
  });

  return sweepTransaction();
}

// Confirma o pagamento de uma intenção,
// garantindo que ela ainda esteja com status 'pendente' e não tenha sido expirada/estornada concorrentemente.
export function confirmarPagamentoIntencao(intencaoId: string): boolean {
  const stmt = db.prepare(`
    UPDATE intencoes
    SET status = 'paga'
    WHERE intencao_id = ? AND status = 'pendente'
  `);

  return stmt.run(intencaoId).changes > 0;
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