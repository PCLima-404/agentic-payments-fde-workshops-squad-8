// gemini-chat/tests/mcpAdapter.test.ts
// Testes unitários para o MCP Adapter (conversão de schemas MCP para Gemini FunctionDeclarations com sanitização).

import { describe, it, expect } from "vitest";
import { SchemaType } from "@google/generative-ai";
import {
  converterTipoParaSchemaType,
  converterPropriedadeParaSchema,
  converterToolMcpParaGemini,
  converterMcpParaGeminiDeclarations,
} from "../src/mcp/adapter";
import { ToolMcp } from "../src/mcp/client";

describe("MCP Adapter (gemini-chat/src/mcp/adapter.ts)", () => {
  describe("Mapeamento de Tipos Primitivos (converterTipoParaSchemaType)", () => {
    it("deve mapear corretamente os tipos primitivos JSONSchema para SchemaType", () => {
      expect(converterTipoParaSchemaType("string")).toBe(SchemaType.STRING);
      expect(converterTipoParaSchemaType("number")).toBe(SchemaType.NUMBER);
      expect(converterTipoParaSchemaType("integer")).toBe(SchemaType.INTEGER);
      expect(converterTipoParaSchemaType("boolean")).toBe(SchemaType.BOOLEAN);
      expect(converterTipoParaSchemaType("array")).toBe(SchemaType.ARRAY);
      expect(converterTipoParaSchemaType("object")).toBe(SchemaType.OBJECT);
      expect(converterTipoParaSchemaType(undefined)).toBe(SchemaType.STRING);
    });
  });

  describe("Conversão de Propriedades (converterPropriedadeParaSchema)", () => {
    it("deve preservar descrição e lista de enums", () => {
      const propMcp = {
        type: "string",
        description: "Método de pagamento aceito",
        enum: ["cartao", "pix"],
      };

      const resultado = converterPropriedadeParaSchema(propMcp);

      expect(resultado.type).toBe(SchemaType.STRING);
      expect(resultado.description).toBe("Método de pagamento aceito");
      expect(resultado.enum).toEqual(["cartao", "pix"]);
    });
  });

  describe("Sanitização e Blindagem de Segurança das Tools do Projeto", () => {
    const mockToolsDoMcp: ToolMcp[] = [
      {
        name: "listar_catalogo",
        description: "Lista os eventos disponíveis para compra de ingressos.",
        inputSchema: {
          type: "object",
          properties: {
            categoria: {
              type: "string",
              description: "Categoria do evento",
            },
            usuario_id: {
              type: "string",
              description: "ID do usuário autenticado",
            },
          },
          required: ["usuario_id"],
        },
      },
      {
        name: "registrar_intencao",
        description: "Registra a intenção de compra de um ingresso para um evento.",
        inputSchema: {
          type: "object",
          properties: {
            evento_id: {
              type: "string",
              description: "ID do evento",
            },
            quantidade: {
              type: "integer",
              description: "Quantidade de ingressos desejada",
            },
            usuario_id: {
              type: "string",
              description: "ID do usuário autenticado",
            },
          },
          required: ["evento_id", "quantidade", "usuario_id"],
        },
      },
      {
        name: "realizar_compra",
        description: "Confirma a compra de um ingresso a partir de uma intenção registrada.",
        inputSchema: {
          type: "object",
          properties: {
            intencao_id: {
              type: "string",
              description: "ID da intenção",
            },
            metodo_pagamento: {
              type: "string",
              enum: ["cartao", "pix"],
              description: "Método de pagamento",
            },
            usuario_id: {
              type: "string",
              description: "ID do usuário autenticado",
            },
            token: {
              type: "string",
              description: "JWT do usuário",
            },
          },
          required: ["intencao_id", "metodo_pagamento", "usuario_id", "token"],
        },
      },
    ];

    it("deve converter todas as tools mantendo nome e descrição originais", () => {
      const declarations = converterMcpParaGeminiDeclarations(mockToolsDoMcp);

      expect(declarations.length).toBe(3);
      expect(declarations.map((d) => d.name)).toEqual([
        "listar_catalogo",
        "registrar_intencao",
        "realizar_compra",
      ]);
    });

    it("deve remover estritamente 'usuario_id' e 'token' de properties e required em TODAS as declarações", () => {
      const declarations = converterMcpParaGeminiDeclarations(mockToolsDoMcp);

      for (const decl of declarations) {
        const properties = decl.parameters?.properties || {};
        const required = decl.parameters?.required || [];

        // Nenhuma declaração enviada ao Gemini pode conter usuario_id ou token
        expect(properties).not.toHaveProperty("usuario_id");
        expect(properties).not.toHaveProperty("usuarioId");
        expect(properties).not.toHaveProperty("token");

        expect(required).not.toContain("usuario_id");
        expect(required).not.toContain("usuarioId");
        expect(required).not.toContain("token");
      }
    });

    it("deve manter estritamente os campos de negócio corretos para cada ferramenta", () => {
      const declarations = converterMcpParaGeminiDeclarations(mockToolsDoMcp);

      // 1. listar_catalogo: apenas categoria opcional
      const listarCatalogoDecl = declarations.find((d) => d.name === "listar_catalogo")!;
      expect(Object.keys(listarCatalogoDecl.parameters?.properties || {})).toEqual(["categoria"]);
      expect(listarCatalogoDecl.parameters?.required).toBeUndefined();

      // 2. registrar_intencao: evento_id e quantidade
      const registrarIntencaoDecl = declarations.find((d) => d.name === "registrar_intencao")!;
      expect(Object.keys(registrarIntencaoDecl.parameters?.properties || {})).toEqual([
        "evento_id",
        "quantidade",
      ]);
      expect(registrarIntencaoDecl.parameters?.required).toEqual(["evento_id", "quantidade"]);

      // 3. realizar_compra: intencao_id e metodo_pagamento com enum
      const realizarCompraDecl = declarations.find((d) => d.name === "realizar_compra")!;
      expect(Object.keys(realizarCompraDecl.parameters?.properties || {})).toEqual([
        "intencao_id",
        "metodo_pagamento",
      ]);
      expect(realizarCompraDecl.parameters?.required).toEqual(["intencao_id", "metodo_pagamento"]);
      expect(realizarCompraDecl.parameters?.properties?.metodo_pagamento?.enum).toEqual([
        "cartao",
        "pix",
      ]);
    });
  });
});
