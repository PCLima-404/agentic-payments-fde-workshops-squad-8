// gemini-chat/src/mcp/client.ts
// MCP Client: Gerencia a conexão bidirecional com o servidor tickets-tools via Stdio.
//
// Responsabilidades:
//   - Inicialização do subprocesso tickets-tools via StdioClientTransport
//   - Padrão Singleton com reconexão sob demanda (lazy connection)
//   - Descoberta dinâmica de ferramentas (listTools)
//   - Execução de chamadas de ferramentas (callTool)
//   - Encerramento limpo para isolamento de testes e graceful shutdown

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs";

let mcpClient: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

export interface ToolMcp {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

/**
 * Resolve o caminho do script do servidor MCP (tickets-tools).
 * Prioriza o build compilado (dist/src/server.js ou dist/server.js) ou variável de ambiente MCP_SERVER_PATH.
 */
export function resolverCaminhoServidorMcp(): string {
  if (process.env.MCP_SERVER_PATH) {
    return path.resolve(process.env.MCP_SERVER_PATH);
  }

  const caminhosPossiveis = [
    path.resolve(process.cwd(), "../tickets-tools/dist/src/server.js"),
    path.resolve(process.cwd(), "../tickets-tools/dist/server.js"),
    path.resolve(process.cwd(), "tickets-tools/dist/src/server.js"),
    path.resolve(process.cwd(), "tickets-tools/dist/server.js"),
  ];

  for (const caminho of caminhosPossiveis) {
    if (fs.existsSync(caminho)) {
      return caminho;
    }
  }

  return caminhosPossiveis[0];
}

/**
 * Obtém ou inicializa a instância Singleton do cliente MCP conectado ao tickets-tools.
 */
export async function obterMcpClient(): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  const serverPath = resolverCaminhoServidorMcp();

  // Configura o transporte stdio disparando o processo Node do tickets-tools
  mcpTransport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
  });

  const client = new Client(
    {
      name: "gemini-chat",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(mcpTransport);
  mcpClient = client;

  return mcpClient;
}

/**
 * Lista todas as ferramentas registradas disponíveis no servidor MCP tickets-tools.
 */
export async function listarToolsDisponiveis(): Promise<ToolMcp[]> {
  const client = await obterMcpClient();
  const response = await client.listTools();

  return (response.tools || []) as ToolMcp[];
}

/**
 * Executa uma ferramenta no servidor MCP tickets-tools e retorna a resposta formatada.
 *
 * @param nome - Nome da tool MCP (ex: "listar_catalogo", "registrar_intencao", "realizar_compra")
 * @param args - Argumentos validados para a tool
 * @returns Retorno estruturado (JSON ou texto) enviado pelo servidor MCP
 */
export async function chamarToolMcp(
  nome: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const client = await obterMcpClient();
  const response = await client.callTool({
    name: nome,
    arguments: args,
  });

  if (response.isError) {
    const errorMsg =
      response.content &&
      Array.isArray(response.content) &&
      response.content[0]?.type === "text"
        ? (response.content[0] as { text: string }).text
        : `Erro ao executar a tool '${nome}'.`;
    throw new Error(errorMsg);
  }

  if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
    throw new Error(`A tool '${nome}' não retornou conteúdo válido.`);
  }

  const primeiroConteudo = response.content[0];

  if (primeiroConteudo.type === "text" && typeof primeiroConteudo.text === "string") {
    try {
      return JSON.parse(primeiroConteudo.text);
    } catch {
      return primeiroConteudo.text;
    }
  }

  return primeiroConteudo;
}

/**
 * Fecha a conexão do cliente MCP e encerra o subprocesso de transporte.
 * Essencial para limpeza de recursos e isolamento em testes unitários.
 */
export async function fecharMcpClient(): Promise<void> {
  if (mcpClient) {
    try {
      await mcpClient.close();
    } catch {
      // Ignora erro de fechamento se o processo já estiver encerrado
    }
    mcpClient = null;
  }

  if (mcpTransport) {
    try {
      await mcpTransport.close();
    } catch {
      // Ignora erro de fechamento
    }
    mcpTransport = null;
  }
}
