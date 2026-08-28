// TODO (Pessoa 2): tipos compartilhados entre as tools
export interface Evento {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  moeda: string;
  vagasTotais: number;
  vagasRestantes: number;
}

export interface Intencao {
  intencaoId: string;
  eventoId: string;
  quantidade: number;
  valorTotal: number;
  moeda: string;
  status: "pendente" | "paga" | "expirada";
  usuarioId: string;
  expiraEm: string;
}

export interface Transacao {
  transacaoId: string;
  intencaoId: string;
  valor: number;
  metodoPagamento: "cartao" | "pix";
  data: string;
}
