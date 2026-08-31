const TRADUCOES: Record<string, string> = {
  limiteGasto: "quanto você pode gastar",
  INTENCAO_INVALIDA: "esse pedido não é mais válido",
  LIMITE_EXCEDIDO: "passou do seu valor disponível",
  INTENCAO_EXPIRADA: "esse pedido venceu, separo de novo?",
  INTENCAO_JA_PAGA: "esse ingresso já está pago",
  METODO_INVALIDO: "aceitamos Pix e cartão",
  VAGAS_INSUFICIENTES: "não sobrou vaga suficiente",
  ERRO_INTERNO: "algo saiu do ar por aqui",
};

export function traduzir(termoTecnico: string): string {
  return TRADUCOES[termoTecnico] ?? "não foi possível continuar";
}
