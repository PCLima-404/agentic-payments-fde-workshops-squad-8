// src/tools/realizarCompra.ts
// Tool MCP: realizar_compra
//
// Confirma a compra a partir de uma intenção previamente registrada.
// O valor NÃO é argumento — vem exclusivamente da intenção armazenada no backend.
//
// Cadeia de validações (ordem obrigatória, falha rápida):
//   1. metodo_pagamento válido ("cartao" | "pix")
//   2. Intenção existe e pertence ao usuário (INTENCAO_INVALIDA)
//   3. Intenção não foi paga anteriormente (INTENCAO_JA_PAGA)
//   4. Intenção dentro do prazo (INTENCAO_EXPIRADA)
//   5. Valor total dentro do limite do usuário (LIMITE_EXCEDIDO)

import {
  atualizarStatusIntencao,
  buscarIntencaoPorId,
} from "../data/intencoes";
import { transacoes } from "../data/transacoes";
import {
  debitarLimiteUsuario,
  obterLimiteUsuario,
} from "../data/limites";
import { gerarId } from "../utils/ids";
import { registrarChamada } from "../logs/audit";
import { criarErro, ErroTool } from "../types/errors";
import { Transacao } from "../types";
import {
  validarPosse,
  validarStatusPago,
  validarExpiracao,
} from "../validators/intencao.validator";
import { limiteExcedido } from "../validators/limite.validator";

/**
 * Argumentos aceitos pela tool realizar_compra.
 * Valor nunca é argumento — vem da intenção registrada no backend.
 */
export interface ArgsRealizarCompra {
  intencao_id: string;
  metodo_pagamento: "cartao" | "pix";
  usuario_id: string; // injetado pelo gemini-chat/route.ts
  token: string; // JWT do usuário, repassado para consultar o limite em auth/
}

/**
 * Formato do retorno em caso de sucesso, conforme contrato do projeto.
 */
interface RetornoAprovado {
  status: "aprovado";
  transacao_id: string;
  intencao_id: string;
  valor: number;
  metodo_pagamento: "cartao" | "pix";
  limite_restante: number;
  data: string; // ISO 8601
}

/**
 * Executa a compra a partir de uma intenção válida.
 *
 * @param args - intencao_id, metodo_pagamento, usuario_id e token JWT
 * @returns RetornoAprovado em caso de sucesso, ErroTool em caso de falha
 */
export async function realizarCompra(
  args: ArgsRealizarCompra
): Promise<RetornoAprovado | ErroTool> {
  const { intencao_id, metodo_pagamento, usuario_id, token } = args;

  // 1. Valida metodo_pagamento — apenas "cartao" ou "pix" são aceitos
  if (metodo_pagamento !== "cartao" && metodo_pagamento !== "pix") {
    registrarChamada({
      tool: "realizar_compra",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: `METODO_INVALIDO — recebido: ${metodo_pagamento}`,
      timestamp: new Date().toISOString(),
    });
    return criarErro("METODO_INVALIDO");
  }

  // 2. Busca a intenção no banco de dados
  const intencao = buscarIntencaoPorId(intencao_id);

  // 3. Valida posse: intenção deve existir e pertencer ao usuário autenticado
  const erroPosse = validarPosse(intencao, usuario_id);
  if (erroPosse) {
    registrarChamada({
      tool: "realizar_compra",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: `${erroPosse} — intencao_id=${intencao_id}`,
      timestamp: new Date().toISOString(),
    });
    return criarErro(erroPosse);
  }

  // A partir daqui, intencao é garantidamente definida (validarPosse retornou null)
  const intencaoValida = intencao!;

  // 4. Valida se a intenção já foi paga
  const erroStatusPago = validarStatusPago(intencaoValida);
  if (erroStatusPago) {
    registrarChamada({
      tool: "realizar_compra",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: `${erroStatusPago} — intencao_id=${intencao_id}`,
      timestamp: new Date().toISOString(),
    });
    return criarErro(erroStatusPago);
  }

  // 5. Valida se a intenção ainda está dentro do prazo
  const erroExpiracao = validarExpiracao(intencaoValida);
  if (erroExpiracao) {
    registrarChamada({
      tool: "realizar_compra",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: `${erroExpiracao} — expirou em ${intencaoValida.expiraEm}`,
      timestamp: new Date().toISOString(),
    });
    return criarErro(erroExpiracao);
  }

  // 6. Consulta o limite de gasto do usuário no módulo auth/ via HTTP
  let limite: number;
  try {
    limite = await obterLimiteUsuario(token);
  } catch (erro) {
    registrarChamada({
      tool: "realizar_compra",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: "ERRO_INTERNO — falha ao consultar limite no auth/",
      timestamp: new Date().toISOString(),
    });
    return criarErro("ERRO_INTERNO");
  }

  // 7. Valida se o valor total cabe no limite disponível
  if (limiteExcedido(intencaoValida.valorTotal, limite)) {
    registrarChamada({
      tool: "realizar_compra",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: `LIMITE_EXCEDIDO — valorTotal=${intencaoValida.valorTotal}, limite=${limite}`,
      timestamp: new Date().toISOString(),
    });
    return criarErro("LIMITE_EXCEDIDO");
  }

  let limiteRestante: number;
  try {
    limiteRestante = await debitarLimiteUsuario(token, intencaoValida.valorTotal);
  } catch (erro) {
    registrarChamada({
      tool: "realizar_compra",
      usuarioId: usuario_id,
      resultado: "recusado",
      detalhe: "ERRO_INTERNO — falha ao debitar limite no auth/",
      timestamp: new Date().toISOString(),
    });
    return criarErro("ERRO_INTERNO");
  }

  // 8. Todas as validações passaram — processa a compra


  // Marca a intenção como paga no banco de dados (garante idempotência: não pode ser usada novamente)
  atualizarStatusIntencao(intencao_id, "paga");

  // Gera identificador único da transação
  const transacaoId = gerarId("tx");
  const dataCompra = new Date().toISOString();

  // Monta e persiste a transação
  const transacao: Transacao = {
    transacaoId,
    intencaoId: intencao_id,
    valor: intencaoValida.valorTotal,
    metodoPagamento: metodo_pagamento,
    data: dataCompra,
  };
  transacoes.set(transacaoId, transacao);

  registrarChamada({
    tool: "realizar_compra",
    usuarioId: usuario_id,
    resultado: "aprovado",
    detalhe: `transacaoId=${transacaoId} | valor=${intencaoValida.valorTotal} | metodo=${metodo_pagamento} | limiteRestante=${limiteRestante}`,
    timestamp: new Date().toISOString(),
  });

  // Retorna o objeto de sucesso conforme contrato do projeto
  return {
    status: "aprovado",
    transacao_id: transacaoId,
    intencao_id,
    valor: intencaoValida.valorTotal,
    metodo_pagamento,
    limite_restante: limiteRestante,
    data: dataCompra,
  };
}
