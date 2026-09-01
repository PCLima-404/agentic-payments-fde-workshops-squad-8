// gemini-chat/src/mcp/executor.ts
// Executor Seguro: Intercepta chamadas de ferramentas do Gemini e injeta o contexto de sessão autenticado.
//
// Responsabilidades:
//   - Injeção obrigatória e determinística de usuario_id e token no payload
//   - Blindagem contra usurpação de identidade (sobrescreve campos forjados pelo modelo)
//   - Execução via MCP Client (chamarToolMcp)
//   - Retorno estruturado de sucesso ou erro (ErroTool)

import { chamarToolMcp } from "./client";

export interface UsuarioSessao {
  id: string;
  username?: string;
}

/**
 * Injeta com segurança as credenciais e identificadores da sessão do usuário
 * nos argumentos da ferramenta antes de despachá-la para o servidor MCP tickets-tools.
 *
 * @param nome - Nome da tool MCP (ex: "listar_catalogo", "registrar_intencao", "realizar_compra")
 * @param argsDoModelo - Argumentos produzidos pelo modelo Gemini
 * @param sessao - Dados do usuário autenticado extraídos da sessão/JWT
 * @param tokenJwt - Token JWT válido do usuário para validações entre microsserviços
 * @returns Resposta estruturada da ferramenta MCP (objeto de sucesso ou ErroTool)
 */
export async function executarToolComSessao(
  nome: string,
  argsDoModelo: Record<string, unknown> = {},
  sessao: UsuarioSessao,
  tokenJwt: string
): Promise<unknown> {
  if (!sessao || !sessao.id) {
    throw new Error(
      "Sessão inválida: usuario_id é obrigatório para executar ferramentas."
    );
  }

  // Clona os argumentos recebidos do modelo para evitar mutações colaterais
  const argsInjetados: Record<string, unknown> = { ...argsDoModelo };

  // Injeção mandatória de usuario_id (sobrescreve qualquer tentativa de injection/spoofing)
  argsInjetados.usuario_id = sessao.id;

  // Injeção mandatória do token JWT do usuário para ferramentas que se comunicam com o auth/
  if (nome === "realizar_compra" || tokenJwt) {
    argsInjetados.token = tokenJwt;
  }

  // Despacha a execução via cliente MCP
  return await chamarToolMcp(nome, argsInjetados);
}
