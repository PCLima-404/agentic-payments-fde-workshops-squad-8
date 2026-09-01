// gemini-chat/tests/derivarPedido.test.ts
import { describe, it, expect } from "vitest";
import {
  extrairPedidoAtual,
  extrairCatalogoConhecido,
} from "../src/utils/derivarPedido";
import type { Content } from "@google/generative-ai";

function functionResponse(nome: string, content: unknown): Content {
  return {
    role: "user",
    parts: [
      { functionResponse: { name: nome, response: { name: nome, content } } },
    ],
  };
}

describe("extrairCatalogoConhecido", () => {
  it("junta eventos vistos em listar_catalogo por id", () => {
    const historico = [
      functionResponse("listar_catalogo", {
        produtos: [
          {
            id: "evt_001",
            nome: "Workshop MCP",
            preco: 120,
            moeda: "BRL",
            estoque: 10,
          },
        ],
      }),
    ];

    const catalogo = extrairCatalogoConhecido(historico);
    expect(catalogo["evt_001"].nome).toBe("Workshop MCP");
  });
});

describe("extrairPedidoAtual", () => {
  it("retorna null quando não há nenhum pedido no histórico", () => {
    expect(extrairPedidoAtual([])).toBeNull();
  });

  it("deriva pedido pendente combinando catálogo + intenção", () => {
    const historico = [
      functionResponse("listar_catalogo", {
        produtos: [
          {
            id: "evt_001",
            nome: "Workshop MCP",
            preco: 120,
            moeda: "BRL",
            estoque: 10,
          },
        ],
      }),
      functionResponse("registrar_intencao", {
        intencao_id: "int_abc",
        produto_id: "evt_001",
        quantidade: 2,
        valor_total: 240,
        moeda: "BRL",
        status: "pendente",
      }),
    ];

    const pedido = extrairPedidoAtual(historico);
    expect(pedido).toMatchObject({
      nome: "Workshop MCP",
      quantidade: 2,
      valorTotal: 240,
      status: "pendente",
    });
  });

  it("marca como aprovado quando realizar_compra retorna sucesso", () => {
    const historico = [
      functionResponse("registrar_intencao", {
        intencao_id: "int_abc",
        produto_id: "evt_001",
        quantidade: 1,
        valor_total: 120,
        moeda: "BRL",
        status: "pendente",
      }),
      functionResponse("realizar_compra", {
        status: "aprovado",
        valor: 120,
        metodo_pagamento: "pix",
      }),
    ];

    const pedido = extrairPedidoAtual(historico);
    expect(pedido?.status).toBe("aprovado");
    expect(pedido?.metodoPagamento).toBe("pix");
  });

  it("marca como recusado quando a intenção é rejeitada", () => {
    const historico = [
      functionResponse("registrar_intencao", {
        status: "recusado",
        erro: "LIMITE_EXCEDIDO",
        mensagem: "Passou do seu valor disponível agora.",
      }),
    ];

    const pedido = extrairPedidoAtual(historico);
    expect(pedido?.status).toBe("recusado");
    expect(pedido?.mensagemErro).toContain("valor disponível");
  });
});
