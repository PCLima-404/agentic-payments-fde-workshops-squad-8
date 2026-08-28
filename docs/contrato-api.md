<!--
  contrato-api.md: Especificacao de Contratos de API e Ferramentas MCP

  Projeto: agentic-payments-fde-workshops (Squad 8)

  Contexto: UOL / Agentic Payments
-->

# Contrato de API e Ferramentas MCP

Documento normativo de tipos, payloads, codigos de erro e diretrizes de prompt para comunicacao entre os modulos `gemini-chat`, `tickets-tools` e `auth`.

---

## Sumario

- [1. Visao Geral](#1-visao-geral)

- [2. Especificacao das Tools MCP](#2-especificacao-das-tools-mcp)
  - [2.1. listar_catalogo](#21-listar_catalogo)
  - [2.2. registrar_intencao](#22-registrar_intencao)
  - [2.3. realizar_compra](#23-realizar_compra)

- [3. Padronizacao de Erros](#3-padronizacao-de-erros)
  - [3.1. Formato ErroTool](#31-formato-errotool)
  - [3.2. Mapeamento Situacao vs Codigo](#32-mapeamento-situacao-vs-codigo)

- [4. Registro de Decisoes Tecnicas](#4-registro-de-decisoes-tecnicas)

- [5. Vinculo de Sessao ao Escopo de Intencoes](#5-vinculo-de-sessao-ao-escopo-de-intencoes)

- [6. Testes de Validacao da Intencao](#6-testes-de-validacao-da-intencao)

---

## 1. Visao Geral

O servidor MCP expoe tres ferramentas principais para consumo pelo agente inteligente. Todas as operacoes financeiras e de manipulacao de estoque sao estritamente validadas no backend, garantindo que o modelo de linguagem atue como interface conversacional sem autoridade de aprovacao direta.

---

## 2. Especificacao das Tools MCP

### 2.1. listar_catalogo

Retorna a listagem de eventos disponíveis para compra, com suporte a filtro opcional por categoria.

#### Entrada (Input Schema)

```json
{
  "categoria": "string (opcional)",
  "usuario_id": "string (obrigatorio, injetado pelo backend)"
}
```

#### Retorno de Sucesso

```json
{
  "produtos": [
    {
      "id": "evt_001",
      "nome": "Workshop: Agentes Inteligentes com MCP e TypeScript",
      "preco": 120.0,
      "moeda": "BRL",
      "estoque": 30
    }
  ]
}
```

---

### 2.2. registrar_intencao

Cria uma intencao de compra temporaria. O valor total e calculado exclusivamente no backend (preco multiplicado pela quantidade). O estoque e decrementado no ato do registro.

#### Entrada (Input Schema)

```json
{
  "evento_id": "string (obrigatorio)",
  "quantidade": "number (inteiro positivo, obrigatorio)",
  "usuario_id": "string (obrigatorio, injetado pelo backend)"
}
```

#### Retorno de Sucesso

```json
{
  "intencao_id": "int_a1b2c3",
  "produto_id": "evt_001",
  "quantidade": 2,
  "valor_total": 240.0,
  "moeda": "BRL",
  "status": "pendente",
  "expira_em": "2026-08-28T03:25:00.000Z"
}
```

#### Retorno em Caso de Falha

Retorna objeto no formato `ErroTool` com `INTENCAO_INVALIDA` ou `VAGAS_INSUFICIENTES`.

---

### 2.3. realizar_compra

Efetiva a transacao financeira a partir de uma intencao previamente registrada e valida. O valor nao e aceito como argumento.

#### Entrada (Input Schema)

```json
{
  "intencao_id": "string (obrigatorio)",
  "metodo_pagamento": "cartao | pix (obrigatorio)",
  "usuario_id": "string (obrigatorio, injetado pelo backend)",
  "token": "string (JWT de autenticacao para consulta de limite)"
}
```

#### Retorno de Sucesso

```json
{
  "status": "aprovado",
  "transacao_id": "tx_9f8e7d",
  "intencao_id": "int_a1b2c3",
  "valor": 240.0,
  "metodo_pagamento": "pix",
  "limite_restante": 260.0,
  "data": "2026-08-28T03:21:00.000Z"
}
```

#### Retorno em Caso de Recusa

Retorna objeto no formato `ErroTool`.

---

## 3. Padronizacao de Erros

### 3.1. Formato ErroTool

Toda tool que falha ou recusa uma solicitacao retorna estritamente a seguinte estrutura:

```ts
export type CodigoErro =
  | "INTENCAO_INVALIDA"
  | "INTENCAO_JA_PAGA"
  | "INTENCAO_EXPIRADA"
  | "LIMITE_EXCEDIDO"
  | "METODO_INVALIDO"
  | "VAGAS_INSUFICIENTES"
  | "ERRO_INTERNO";

export interface ErroTool {
  status: "recusado";
  erro: CodigoErro;
  mensagem: string;
}
```

### 3.2. Mapeamento Situacao vs Codigo

| Codigo de Erro        | Tool de Origem                           | Cenario de Ocorrencia                                                    | Mensagem Padrao                                                                 |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `INTENCAO_INVALIDA`   | `registrar_intencao` / `realizar_compra` | Evento inexistente, intencao inexistente ou pertencente a outro usuario  | Essa intencao de compra nao existe ou nao pertence a este usuario.              |
| `VAGAS_INSUFICIENTES` | `registrar_intencao`                     | Quantidade solicitada maior que vagas restantes ou concorrencia esgotada | Nao ha vagas suficientes disponiveis para este evento na quantidade solicitada. |
| `INTENCAO_JA_PAGA`    | `realizar_compra`                        | Intencao ja consumida em transacao aprovada anterior                     | Essa intencao ja foi usada em uma compra anterior.                              |
| `INTENCAO_EXPIRADA`   | `realizar_compra`                        | Compra tentada apos a janela de 5 minutos da intencao                    | Essa intencao de compra expirou. Registre uma nova intencao.                    |
| `LIMITE_EXCEDIDO`     | `realizar_compra`                        | Valor total da compra maior que limite disponivel no modulo auth         | O valor da compra excede o limite de gasto disponivel para este usuario.        |
| `METODO_INVALIDO`     | `realizar_compra`                        | Metodo informado diferente de cartao ou pix                              | Metodo de pagamento invalido. Use 'cartao' ou 'pix'.                            |
| `ERRO_INTERNO`        | Todas                                    | Indisponibilidade de servicos externos ou falha de infraestrutura        | Ocorreu um erro inesperado ao processar a solicitacao.                          |

### Exemplo de uso dentro de uma tool

```ts
import { criarErro } from "../types/errors";

if (!intencaoExiste) {
  return criarErro("INTENCAO_INVALIDA");
}
```

---

## 4. Registro de Decisoes Tecnicas

Decisoes consolidadas pela equipe para a integracao entre modulos:

### Mapeamento situação → erro

| Situação                                           | Código de erro      |
| -------------------------------------------------- | ------------------- |
| `intencao_id` inexistente ou inventado pelo modelo | `INTENCAO_INVALIDA` |
| Intenção pertencente a outro usuário               | `INTENCAO_INVALIDA` |
| Intenção já utilizada em uma compra                | `INTENCAO_JA_PAGA`  |
| Intenção fora do prazo de validade                 | `INTENCAO_EXPIRADA` |
| Valor da intenção acima do limite do usuário       | `LIMITE_EXCEDIDO`   |
| Método de pagamento diferente de `cartao`/`pix`    | `METODO_INVALIDO`   |
| Qualquer falha não prevista                        | `ERRO_INTERNO`      |

### Exemplo de uso dentro de uma tool

```ts
import { criarErro } from "../types/errors";

if (!intencaoExiste) {
  return criarErro("INTENCAO_INVALIDA");
}
```

### Decisoes consolidadas

- [x] Momento de reserva de vagas: Executado de forma atomica em `registrar_intencao` (`decrementarVagas`).

- [x] Janela de expiracao da intencao: Fixada em 5 minutos a partir da emissao.

- [x] Fonte de verdade para limite de gasto: Modulo `auth` via endpoint `GET /me`, consultado em `realizar_compra`.

- [x] Novo codigo de erro: Inclusao de `VAGAS_INSUFICIENTES` para cobrir indisponibilidade de ingressos na intencao.

- [ ] Injecao de credenciais: Repasse transparente de `usuario_id` e `token` pelo adaptador do `gemini-chat` nas chamadas MCP.

---

## 5. Vinculo de Sessao ao Escopo de Intencoes

O `usuario_id` usado em `registrar_intencao` e demais tools que dependem de usuário **nunca** vem do modelo (Gemini) nem é enviado pelo cliente. Ele é sempre extraído do token JWT validado no backend e injetado no payload antes da chamada à tool MCP.

### Fluxo

1. Gemini decide chamar a tool e propõe o payload, por exemplo:

```ts
registrar_intencao({ evento_id, quantidade });
```

2. O `route.ts` do `gemini-chat/` intercepta essa chamada.

3. Extrai o `usuario_id` do token da sessão autenticada, nunca do payload proposto pelo modelo.

4. Monta o payload final:

```ts
registrar_intencao({ evento_id, quantidade, usuario_id });
```

5. Chama a tool MCP de verdade com esse payload já seguro.

Qualquer `usuario_id` que porventura viesse no payload proposto pelo modelo é **sobrescrito**, nunca confiado.

A implementação de referência está em:

```text
auth/src/session/escopoIntencao.ts
```

A implementação é validada em:

```text
auth/tests/escopoIntencao.test.ts
```

---

## 6. Testes de Validacao da Intencao

As funções `validarPosse`, `validarStatusPago` e `validarExpiracao`, localizadas em:

```text
tickets-tools/src/validators/intencao.validator.ts
```

estão cobertas por testes automatizados em:

```text
tickets-tools/tests/tools.test.ts
```

Os testes incluem:

- posse válida vs. intenção de outro usuário vs. intenção inexistente;
- intenção já paga (`INTENCAO_JA_PAGA`);
- intenção expirada (`INTENCAO_EXPIRADA`);
- simulação de tentativa de jailbreak utilizando `intencao_id` de outro usuário.

---
