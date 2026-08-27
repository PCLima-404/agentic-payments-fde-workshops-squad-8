// TODO (Pessoa 2): armazenamento em memória das transações concluídas
import { Transacao } from "../types";

export const transacoes = new Map<string, Transacao>();
