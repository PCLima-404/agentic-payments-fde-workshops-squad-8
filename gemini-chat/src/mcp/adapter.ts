// gemini-chat/src/mcp/adapter.ts
// MCP Adapter: Converte schemas de ferramentas MCP para FunctionDeclarations da API do Google Gemini.
//
// Responsabilidades:
//   - Mapeamento de tipos primitivos e estruturas JSONSchema para SchemaType do Gemini
//   - Blindagem de Segurança (Shielding Layer): Ocultação estrita de campos de autenticação
//     (usuario_id, token) das definições enviadas ao LLM para evitar prompt injection/leakage.

import { FunctionDeclaration, SchemaType, Schema } from "@google/generative-ai";
import { ToolMcp } from "./client";

// Campos de sessão e autenticação gerenciados exclusivamente pelo backend (nunca expostos ao LLM)
const CAMPOS_RESTRITOS_SESSAO = new Set(["usuario_id", "usuarioId", "token"]);

/**
 * Converte um tipo de string JSONSchema para o SchemaType correspondente do Gemini SDK.
 */
export function converterTipoParaSchemaType(tipo?: string): SchemaType {
  switch (tipo?.toLowerCase()) {
    case "integer":
      return SchemaType.INTEGER;
    case "number":
      return SchemaType.NUMBER;
    case "boolean":
      return SchemaType.BOOLEAN;
    case "array":
      return SchemaType.ARRAY;
    case "object":
      return SchemaType.OBJECT;
    case "string":
    default:
      return SchemaType.STRING;
  }
}

/**
 * Converte uma propriedade de schema JSONSchema para a interface Schema do Gemini.
 */
export function converterPropriedadeParaSchema(
  prop: Record<string, unknown>
): Schema {
  const schema: Schema = {
    type: converterTipoParaSchemaType(prop.type as string | undefined),
  };

  if (typeof prop.description === "string") {
    schema.description = prop.description;
  }

  if (Array.isArray(prop.enum) && prop.enum.length > 0) {
    schema.enum = prop.enum.map(String);
  }

  if (prop.type === "array" && prop.items && typeof prop.items === "object") {
    schema.items = converterPropriedadeParaSchema(
      prop.items as Record<string, unknown>
    );
  }

  return schema;
}

/**
 * Converte uma ferramenta MCP individual em uma FunctionDeclaration compatível com Gemini,
 * aplicando sanitização e remoção de campos sensíveis de sessão.
 */
export function converterToolMcpParaGemini(
  tool: ToolMcp
): FunctionDeclaration {
  const propertiesOriginais = tool.inputSchema?.properties || {};
  const requiredOriginal = tool.inputSchema?.required || [];

  const propertiesSanitizadas: Record<string, Schema> = {};

  for (const [chave, valor] of Object.entries(propertiesOriginais)) {
    // Filtro de segurança: remove explicitamente usuario_id, token, etc.
    if (!CAMPOS_RESTRITOS_SESSAO.has(chave) && valor && typeof valor === "object") {
      propertiesSanitizadas[chave] = converterPropriedadeParaSchema(
        valor as Record<string, unknown>
      );
    }
  }

  // Remove campos de autenticação da lista de campos obrigatórios visíveis ao modelo
  const requiredSanitizado = requiredOriginal.filter(
    (campo) => !CAMPOS_RESTRITOS_SESSAO.has(campo)
  );

  const parameters: Schema = {
    type: SchemaType.OBJECT,
    properties: propertiesSanitizadas,
    ...(requiredSanitizado.length > 0 ? { required: requiredSanitizado } : {}),
  };

  return {
    name: tool.name,
    description: tool.description || "",
    parameters,
  };
}

/**
 * Converte uma lista de ferramentas MCP para um array de FunctionDeclaration para a API do Gemini.
 *
 * @param toolsMcp - Lista de ferramentas retornadas por listarToolsDisponiveis()
 * @returns Array de FunctionDeclaration prontas para uso no GenerativeModel
 */
export function converterMcpParaGeminiDeclarations(
  toolsMcp: ToolMcp[]
): FunctionDeclaration[] {
  return toolsMcp.map(converterToolMcpParaGemini);
}
