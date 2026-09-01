// gemini-chat/src/utils/tratarErro.ts
// Converte o retorno estruturado ErroTool (vindo de qualquer tool MCP)
// em uma mensagem em linguagem natural para ser exibida/repassada ao usuário.

type CodigoErro =
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
  mensagem?: string;
  [key: string]: unknown;
}

/**
 * Mensagens em linguagem natural para cada código de erro, servindo de
 * fallback caso a tool não tenha enviado uma "mensagem" própria, ou
 * como texto padrão para exibição amigável ao usuário final.
 *
 * Mantido sincronizado com a tabela de mapeamento em docs/contrato-api.md
 * (seção 3.2).
 */
const MENSAGENS_AMIGAVEIS: Record<CodigoErro, string> = {
  INTENCAO_INVALIDA:
    "Não encontrei essa intenção de compra, ou ela não pertence a você.",
  INTENCAO_JA_PAGA: "Essa compra já foi concluída anteriormente.",
  INTENCAO_EXPIRADA:
    "O prazo para concluir essa compra expirou. Vamos começar de novo?",
  LIMITE_EXCEDIDO:
    "Esse valor ultrapassa o seu limite de gasto disponível no momento.",
  METODO_INVALIDO:
    "Esse método de pagamento não é aceito. Você pode usar cartão ou pix.",
  VAGAS_INSUFICIENTES:
    "Não há vagas suficientes disponíveis para a quantidade solicitada.",
  ERRO_INTERNO:
    "Tive um problema inesperado ao processar isso. Pode tentar novamente?",
};

/**
 * Recebe o ErroTool retornado por uma tool MCP e devolve uma string
 * pronta para ser enviada como resposta em linguagem natural.
 *
 * Prioriza a mensagem enviada pela própria tool (campo `mensagem`),
 * já que ela pode conter contexto específico da situação; usa o
 * dicionário de fallback apenas se a tool não tiver enviado nada.
 */
export function tratarErroParaLinguagemNatural(erro: ErroTool): string {
  if (erro.mensagem && erro.mensagem.trim().length > 0) {
    return erro.mensagem;
  }

  return MENSAGENS_AMIGAVEIS[erro.erro] ?? MENSAGENS_AMIGAVEIS.ERRO_INTERNO;
}

/**
 * Verifica se um objeto retornado por uma tool é um ErroTool válido
 * (status "recusado"), útil no loop de tool calling para decidir se
 * o retorno deve ser tratado como erro ou como sucesso.
 */
export function ehErroTool(resultado: unknown): resultado is ErroTool {
  return (
    typeof resultado === "object" &&
    resultado !== null &&
    (resultado as ErroTool).status === "recusado"
  );
}
