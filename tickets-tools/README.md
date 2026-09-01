# tickets-tools (Servidor MCP de Ferramentas de Pagamento)

![Squad 8 Header](../docs/headers/agentic-payments-fde-workshops-mainheader-squad8.webp)

Servidor Model Context Protocol (MCP 1.0) implementado em TypeScript via transporte Stdio, expondo as ferramentas transacionais de catálogo, reserva de assentos e confirmação de pagamentos com soberania de regras no backend.

> **Fonte da Verdade:** Para a documentação arquitetural completa, contratos normativos e matriz de testes do ecossistema, consulte o [`README.md`](../README.md) raiz do repositório e o contrato formal em [`docs/contrato-api.md`](../docs/contrato-api.md).

---

## 1. Ferramentas (Tools) Expostas

O servidor disponibiliza 3 ferramentas estritas via protocolo MCP:

| Ferramenta | Parâmetros de Entrada | Descrição e Comportamento de Negócio |
| :--- | :--- | :--- |
| **`listar_catalogo`** | `categoria` (opcional, string) | Consulta os eventos cadastrados no SQLite. Executa automaticamente a rotina `expirarIntencoesVencidas()` para liberar vagas presas antes da listagem. |
| **`registrar_intencao`** | `evento_id` (string), `quantidade` (number), `usuario_id` (injetado via sessão) | Reserva atômica de assentos por 5 minutos (`expira_em`). O `valor_total` é calculado exclusivamente no backend via `calcularValorTotal(precoUnitario, quantidade)` em centavos. Decrementa o estoque imediatamente. |
| **`realizar_compra`** | `intencao_id` (string), `metodo_pagamento` (`"pix"` ou `"cartao"`), `usuario_id` e `token` (injetados) | Confirmação da transação. Valida posse, expiração, unicidade de pagamento, consulta saldo no `auth/`, debita o limite via `PATCH /me/limite` e consolida a baixa atômica contra race conditions (TOCTOU). |

---

## 2. Soberania das Regras de Negócio e Segurança

1. **Blindagem de Cálculos Financeiros:** O modelo de IA nunca calcula preços e nem define valores totais. A função `calcularValorTotal()` garante precisão monetária determinística contra imprecisões de ponto flutuante IEEE 754.
2. **Estorno e Devolução Proativa de Vagas:** A rotina idempotente `expirarIntencoesVencidas()` varre intenções pendentes que ultrapassaram a janela de 5 minutos, devolvendo os assentos ao estoque original.
3. **Prevenção contra Overbooking e TOCTOU:** Transições de status de compra exigem condição atômica no banco de dados (`WHERE status = 'pendente'`).
4. **Códigos Padronizados de Erro (`ErroTool`):** Retornos de erro estruturados com os códigos normativos: `INTENCAO_INVALIDA`, `VAGAS_INSUFICIENTES`, `INTENCAO_JA_PAGA`, `INTENCAO_EXPIRADA`, `LIMITE_EXCEDIDO`, `METODO_INVALIDO` e `ERRO_INTERNO`.
5. **Trilha de Auditoria:** Cada invocação de ferramenta gera um registro auditável estruturado em `src/logs/audit.ts`.

---

## 3. Banco de Dados e Seeds

O módulo utiliza SQLite com modo WAL (Write-Ahead Logging) para garantir alta performance e concorrência:

```bash
# 1. Instalação de dependências
npm install

# 2. Criação das tabelas e carga do catálogo inicial
npm run db:seed

# 3. Compilação do servidor para distribuição (dist/server.js)
npm run build
```

---

## 4. Execução

```bash
# Execução em modo desenvolvimento via ts-node-dev
npm run dev

# Execução em produção a partir do build compilado
npm start
```

---

## 5. Testes Automatizados

A suíte de testes cobre cálculos decimais, contratos de ferramentas, estornos automáticos, resiliência contra concorrência e tentativas de jailbreak (`tests/jailbreak.test.ts`):

```bash
npm test
```

* **Total:** 44 testes automatizados com 100% de aprovação no Vitest.
