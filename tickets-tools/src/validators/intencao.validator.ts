// src/validators/intencao.validator.ts
// Funções de validação de uma intenção de compra antes de realizar_compra.
// Cada função retorna o CodigoErro correspondente ou null quando a validação passa.

import { Intencao } from "../types";
import { CodigoErro } from "../types/errors";

/**
 * Verifica se a intenção existe e pertence ao usuário que está realizando a compra.
 *
 * @param intencao - Objeto Intencao buscado no Map, ou undefined se não encontrado
 * @param usuarioId - ID do usuário autenticado que está chamando realizar_compra
 * @returns "INTENCAO_INVALIDA" se não existe ou o dono não bate; null se válida
 */
export function validarPosse(
  intencao: Intencao | undefined,
  usuarioId: string,
): CodigoErro | null {
  // Intenção inexistente ou gerada com usuarioId diferente do autenticado
  if (!intencao || intencao.usuarioId !== usuarioId) {
    return "INTENCAO_INVALIDA";
  }
  return null;
}
/**
 * Valida se o valor total da intenção cabe dentro do limite de gasto
 * disponível para o usuário, consultado no módulo auth (GET /me).
 *
 * O valor_total NUNCA é recalculado ou aceito do modelo aqui — ele já
 * vem pronto da intenção persistida (calculada no backend em
 * registrar_intencao). Essa função só compara contra o limite.
 *
 * Retorna null se o valor cabe no limite, ou "LIMITE_EXCEDIDO" se não cabe.
 */
export function validarLimiteGasto(
  valorTotalIntencao: number,
  limiteGastoDisponivel: number,
): CodigoErro | null {
  if (valorTotalIntencao > limiteGastoDisponivel) {
    return "LIMITE_EXCEDIDO";
  }

  return null;
}

/**
 * Verifica se a intenção já foi usada em uma compra anterior.
 *
 * @param intencao - Objeto Intencao a ser verificado
 * @returns "INTENCAO_JA_PAGA" se o status for "paga"; null caso contrário
 */
export function validarStatusPago(intencao: Intencao): CodigoErro | null {
  if (intencao.status === "paga") {
    return "INTENCAO_JA_PAGA";
  }
  return null;
}

/**
 * Verifica se a intenção ainda está dentro do prazo de validade.
 *
 * @param intencao - Objeto Intencao com campo expiraEm em formato ISO 8601
 * @returns "INTENCAO_EXPIRADA" se o prazo já passou; null se ainda válida
 */
export function validarExpiracao(intencao: Intencao): CodigoErro | null {
  if (new Date() > new Date(intencao.expiraEm)) {
    return "INTENCAO_EXPIRADA";
  }
  return null;
}
