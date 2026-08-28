// src/tools/listarCatalogo.ts
// Tool MCP: listar_catalogo
//
// Retorna os eventos disponíveis no catálogo, com filtro opcional por categoria.
// O campo "estoque" é mapeado de vagasRestantes (nomenclatura interna do banco).
// Não há caminho de erro: lista vazia é retorno válido.

import { listarEventos } from "../data/eventos";
import { expirarIntencoesVencidas } from "../data/intencoes";
import { registrarChamada } from "../logs/audit";

/**
 * Argumentos aceitos pela tool listar_catalogo.
 * categoria é opcional — sem filtro, retorna o catálogo completo.
 */
export interface ArgsListarCatalogo {
  categoria?: string;
  usuario_id: string; // injetado pelo gemini-chat/route.ts, não enviado pelo LLM diretamente
}

/**
 * Formato de cada produto retornado pela tool, conforme contrato do projeto.
 */
interface ProdutoCatalogo {
  id: string;
  nome: string;
  preco: number;
  moeda: string;
  estoque: number; // mapeado de vagasRestantes
}

/**
 * Executa a listagem do catálogo de eventos.
 * Chamada diretamente pelo servidor MCP ao registrar a tool.
 *
 * @param args - Argumentos da tool (categoria opcional, usuario_id obrigatório)
 * @returns Objeto com array de produtos no formato do contrato
 */
export function listarCatalogo(args: ArgsListarCatalogo): {
  produtos: ProdutoCatalogo[];
} {
  // Libera vagas de intenções cujo prazo de 5 minutos expirou antes de listar
  expirarIntencoesVencidas();

  // Consulta ao banco SQLite via função do módulo eventos (entregue pelo PR do colega)
  const eventos = listarEventos(args.categoria);

  // Mapeia os campos internos para o contrato público da tool
  const produtos: ProdutoCatalogo[] = eventos.map((evento) => ({
    id: evento.id,
    nome: evento.nome,
    preco: evento.preco,
    moeda: evento.moeda,
    estoque: evento.vagasRestantes, // vagasRestantes -> estoque (contrato público)
  }));

  // Registra a chamada no log de auditoria
  registrarChamada({
    tool: "listar_catalogo",
    usuarioId: args.usuario_id,
    resultado: "listagem",
    detalhe: `${produtos.length} evento(s) retornado(s)`,
    timestamp: new Date().toISOString(),
  });

  return { produtos };
}
