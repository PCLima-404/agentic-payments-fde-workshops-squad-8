// src/logs/audit.ts
// Log auditável de cada chamada de tool.
// Registra: nome da tool, usuarioId, timestamp e resultado (aprovado/recusado/listagem).
// Em produção, substituir console.log por persistência em arquivo ou banco de dados.

export interface EntradaAuditoria {
  tool: string;
  usuarioId: string;
  resultado: "aprovado" | "recusado" | "listagem";
  detalhe?: string; // código de erro em caso de recusa, ou quantidade de itens em listagem
  timestamp: string; // ISO 8601
}

/**
 * Registra uma chamada de tool no log de auditoria.
 *
 * @param entrada - Objeto com os dados da chamada a ser registrada
 */
export function registrarChamada(entrada: EntradaAuditoria): void {
  console.log(
    `[AUDIT] ${entrada.timestamp} | tool=${entrada.tool} | usuario=${entrada.usuarioId} | resultado=${entrada.resultado}${entrada.detalhe ? ` | detalhe=${entrada.detalhe}` : ""}`
  );
}
