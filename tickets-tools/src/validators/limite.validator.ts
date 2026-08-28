// src/validators/limite.validator.ts
// Validação de limite de gasto antes de confirmar uma compra.

/**
 * Verifica se o valor total da intenção excede o limite disponível do usuário.
 *
 * @param valorTotal - Valor calculado pelo backend em registrar_intencao (em reais)
 * @param limiteDisponivel - Limite de gasto retornado por obterLimiteUsuario (em reais)
 * @returns true se o limite for excedido; false se a compra cabe no limite
 */
export function limiteExcedido(
  valorTotal: number,
  limiteDisponivel: number
): boolean {
  return valorTotal > limiteDisponivel;
}
