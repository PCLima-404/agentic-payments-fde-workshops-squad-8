// src/tools/registrarIntencao.ts
// Tool MCP: registrar_intencao
//
// Cria uma intenção de compra temporária para um evento.
// O valor total é SEMPRE calculado no backend (preco × quantidade).
// O cliente nunca envia valor — apenas evento_id e quantidade.
//
// Decisão de equipe: decrementarVagas é chamada AQUI (em registrar_intencao),
// reservando a vaga no momento da intenção. Se a intenção expirar sem compra,
// a vaga permanece subtraída até a próxima versão do sistema implementar
// liberação de vagas por expiração (task futura).
//
// Prazo de expiração: 5 minutos a partir do momento de registro (decisão de equipe).

import { buscarEventoPorId, decrementarVagas } from "../data/eventos";
import { intencoes } from "../data/intencoes";
import { gerarId } from "../utils/ids";
import { registrarChamada } from "../logs/audit";
import { criarErro, ErroTool } from "../types/errors";
import { Intencao } from "../types";

// Prazo de expiração da intenção em minutos (decisão de equipe: 5 minutos)
const MINUTOS_EXPIRACAO = 5;

/**
 * Argumentos aceitos pela tool registrar_intencao.
 */
export interface ArgsRegistrarIntencao {
  evento_id: string;
  quantidade: number;
  usuario_id: string; // injetado pelo gemini-chat/route.ts
}

/**
 * Executa o registro de uma intenção de compra.
 *
 * @param args - evento_id, quantidade e usuario_id
 * @returns Objeto Intencao em caso de sucesso, ou ErroTool em caso de falha
 */
export function registrarIntencao(
  args: ArgsRegistrarIntencao
): Intencao | ErroTool {
  const { evento_id, quantidade, usuario_id } = args;

  // Busca o evento no banco SQLite (função entregue pelo PR do colega)
  const evento = buscarEventoPorId(evento_id);

  // Evento não encontrado no catálogo
  if (!evento) {
    registrarChamada({
      tool: "registrar_intencao",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: "INTENCAO_INVALIDA — evento_id inexistente",
      timestamp: new Date().toISOString(),
    });
    return criarErro("INTENCAO_INVALIDA");
  }

  // Verifica disponibilidade de vagas antes de decrementar
  if (evento.vagasRestantes < quantidade) {
    registrarChamada({
      tool: "registrar_intencao",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: `VAGAS_INSUFICIENTES — solicitado=${quantidade}, disponivel=${evento.vagasRestantes}`,
      timestamp: new Date().toISOString(),
    });
    return criarErro("VAGAS_INSUFICIENTES");
  }

  // Decrementa as vagas atomicamente via SQL (WHERE vagas_restantes >= ?)
  // Proteção contra race condition: se retornar false, outro processo esgotou antes
  const decrementou = decrementarVagas(evento_id, quantidade);
  if (!decrementou) {
    registrarChamada({
      tool: "registrar_intencao",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: "VAGAS_INSUFICIENTES — race condition ao decrementar",
      timestamp: new Date().toISOString(),
    });
    return criarErro("VAGAS_INSUFICIENTES");
  }

  // Calcula valor total no backend — cliente nunca envia valor
  const valorTotal = evento.preco * quantidade;

  // Calcula o timestamp de expiração (agora + MINUTOS_EXPIRACAO)
  const expiraEm = new Date(
    Date.now() + MINUTOS_EXPIRACAO * 60 * 1000
  ).toISOString();

  // Gera identificador único para esta intenção
  const intencaoId = gerarId("int");

  // Monta o objeto de intenção conforme a interface Intencao
  const intencao: Intencao = {
    intencaoId,
    eventoId: evento_id,
    quantidade,
    valorTotal,
    moeda: evento.moeda,
    status: "pendente",
    usuarioId: usuario_id,
    expiraEm,
  };

  // Persiste a intenção no Map em memória
  intencoes.set(intencaoId, intencao);

  registrarChamada({
    tool: "registrar_intencao",
    usuarioId: usuario_id,
    resultado: "aprovado",
    detalhe: `intencaoId=${intencaoId} | valorTotal=${valorTotal} | expiraEm=${expiraEm}`,
    timestamp: new Date().toISOString(),
  });

  return intencao;
}
