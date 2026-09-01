// gemini-chat/src/utils/derivarPedido.ts
// O backend (geminiAgent.ts) já embute os resultados de cada tool dentro
// do historico (Content[]), como partes functionResponse. Em vez do
// frontend chamar as tools de novo, ele só LÊ o que já veio pronto.
//
// Formato real usado pelo geminiAgent.ts:
//   part.functionResponse.response = { name: string, content: <resultado real> }

import type { Content } from "@google/generative-ai";
import type { EventoCatalogo, PedidoAtual } from "../types";

interface FunctionResponsePart {
  functionResponse?: {
    name: string;
    response: { name: string; content: unknown };
  };
}

function coletarFunctionResponses(
  historico: Content[],
  nomeTool: string,
): unknown[] {
  const resultados: unknown[] = [];

  for (const turno of historico) {
    for (const parte of turno.parts as FunctionResponsePart[]) {
      if (parte.functionResponse?.name === nomeTool) {
        resultados.push(parte.functionResponse.response.content);
      }
    }
  }

  return resultados;
}

/** Junta todos os eventos já vistos em listar_catalogo, por id. */
export function extrairCatalogoConhecido(
  historico: Content[],
): Record<string, EventoCatalogo> {
  const respostas = coletarFunctionResponses(historico, "listar_catalogo") as {
    produtos?: EventoCatalogo[];
  }[];

  const catalogo: Record<string, EventoCatalogo> = {};
  for (const resposta of respostas) {
    for (const evento of resposta.produtos ?? []) {
      catalogo[evento.id] = evento;
    }
  }
  return catalogo;
}

/** Deriva o pedido atual (o mais recente), combinando intenção + resultado de compra + nome do catálogo. */
export function extrairPedidoAtual(historico: Content[]): PedidoAtual | null {
  const catalogo = extrairCatalogoConhecido(historico);

  const intencoes = coletarFunctionResponses(historico, "registrar_intencao");
  const compras = coletarFunctionResponses(historico, "realizar_compra");

  const ultimaCompra = compras[compras.length - 1] as any;
  const ultimaIntencao = intencoes[intencoes.length - 1] as any;

  const base = ultimaCompra ?? ultimaIntencao;
  if (!base) return null;

  if (base.status === "recusado") {
    // pode ser recusa da intenção OU da compra — usa o que tiver disponível
    const origem =
      ultimaIntencao?.status === "recusado" ? ultimaIntencao : ultimaCompra;
    const eventoId = origem?.evento_id ?? origem?.eventoId ?? "";
    return {
      eventoId,
      nome: catalogo[eventoId]?.nome ?? "esse pedido",
      quantidade: origem?.quantidade ?? 1,
      valorTotal: origem?.valor_total ?? origem?.valorTotal ?? 0,
      moeda: origem?.moeda ?? "BRL",
      status: "recusado",
      mensagemErro: origem?.mensagem,
    };
  }

  const eventoId = ultimaIntencao?.produto_id ?? ultimaIntencao?.eventoId ?? "";

  return {
    intencaoId: ultimaIntencao?.intencao_id ?? ultimaIntencao?.intencaoId,
    eventoId,
    nome: catalogo[eventoId]?.nome ?? "seu ingresso",
    quantidade: ultimaIntencao?.quantidade ?? 1,
    valorTotal:
      ultimaCompra?.valor ??
      ultimaIntencao?.valor_total ??
      ultimaIntencao?.valorTotal ??
      0,
    moeda: ultimaIntencao?.moeda ?? "BRL",
    status: ultimaCompra?.status === "aprovado" ? "aprovado" : "pendente",
    metodoPagamento: ultimaCompra?.metodo_pagamento,
  };
}
