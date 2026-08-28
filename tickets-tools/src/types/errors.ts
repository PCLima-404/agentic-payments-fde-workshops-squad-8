// Códigos de erro possíveis ao recusar uma operação de tool
export type CodigoErro =
  | "INTENCAO_INVALIDA"
  | "INTENCAO_JA_PAGA"
  | "INTENCAO_EXPIRADA"
  | "LIMITE_EXCEDIDO"
  | "METODO_INVALIDO"
  | "VAGAS_INSUFICIENTES"
  | "ERRO_INTERNO";

// Formato único que TODA tool deve retornar quando falha
export interface ErroTool {
  status: "recusado";
  erro: CodigoErro;
  mensagem: string;
}

// Mensagens padrão para cada código, usar como referência ao montar o ErroTool
export const MENSAGENS_ERRO: Record<CodigoErro, string> = {
  INTENCAO_INVALIDA:
    "Essa intenção de compra não existe ou não pertence a este usuário.",
  INTENCAO_JA_PAGA: "Essa intenção já foi usada em uma compra anterior.",
  INTENCAO_EXPIRADA:
    "Essa intenção de compra expirou. Registre uma nova intenção.",
  LIMITE_EXCEDIDO:
    "O valor da compra excede o limite de gasto disponível para este usuário.",
  METODO_INVALIDO: "Método de pagamento inválido. Use 'cartao' ou 'pix'.",
  VAGAS_INSUFICIENTES:
    "Não há vagas suficientes disponíveis para este evento na quantidade solicitada.",
  ERRO_INTERNO: "Ocorreu um erro inesperado ao processar a solicitação.",
};

// Função para montar o objeto de erro padronizado
export function criarErro(codigo: CodigoErro): ErroTool {
  return {
    status: "recusado",
    erro: codigo,
    mensagem: MENSAGENS_ERRO[codigo],
  };
}
