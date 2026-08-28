export type CodigoErro =
  | "INTENCAO_INVALIDA"
  | "INTENCAO_JA_PAGA"
  | "INTENCAO_EXPIRADA"
  | "LIMITE_EXCEDIDO"
  | "METODO_INVALIDO"
  | "VAGAS_INSUFICIENTES"
  | "ERRO_INTERNO";

export interface ErroTool {
  status: "recusado";
  erro: CodigoErro;
  mensagem: string;
}
