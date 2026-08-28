// src/validators/calculo.validator.ts
// Regra de Negócio: Cálculo de valor total no backend.
//
// Garante precisão monetária (2 casas decimais) e integridade matemática,
// impedindo valores fracionários, negativos ou imprecisões de ponto flutuante (IEEE 754).

/**
 * Calcula o valor total de uma intenção de compra no backend com arredondamento monetário exato.
 *
 * @param precoUnitario - Preço unitário do evento (obtido exclusivamente do banco de dados)
 * @param quantidade - Quantidade de ingressos desejada (inteiro positivo)
 * @returns Valor total calculado e arredondado em reais (ex: 240.00)
 * @throws Error se a quantidade não for um inteiro positivo ou se o preço for inválido/negativo
 */
export function calcularValorTotal(
  precoUnitario: number,
  quantidade: number
): number {
  if (
    typeof quantidade !== "number" ||
    !Number.isFinite(quantidade) ||
    !Number.isInteger(quantidade) ||
    quantidade <= 0
  ) {
    throw new Error(
      `Quantidade inválida: deve ser um número inteiro positivo. Recebido: ${quantidade}`
    );
  }

  if (
    typeof precoUnitario !== "number" ||
    !Number.isFinite(precoUnitario) ||
    precoUnitario < 0
  ) {
    throw new Error(
      `Preço unitário inválido: deve ser um número não-negativo. Recebido: ${precoUnitario}`
    );
  }

  // Multiplicação com precisão bancária (2 casas decimais) evitando dízimas IEEE 754
  return Math.round(precoUnitario * quantidade * 100) / 100;
}
