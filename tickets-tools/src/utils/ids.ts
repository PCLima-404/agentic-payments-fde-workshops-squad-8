// TODO (Pessoa 2): geração de ids (intencao_id, transacao_id)
export function gerarId(prefixo: string): string {
  return `${prefixo}_${Math.random().toString(36).slice(2, 10)}`;
}
