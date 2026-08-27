# Contrato de API — a combinar ANTES de codar em paralelo

## Evento (objeto retornado por listar_catalogo)
```ts
{
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  moeda: string;
  vagasTotais: number;
  vagasRestantes: number;
}
```

## Intenção (retornada por registrar_intencao)
```ts
{
  intencaoId: string;
  eventoId: string;
  quantidade: number;
  valorTotal: number;
  moeda: string;
  status: "pendente";
  expiraEm: string; // ISO 8601
}
```

## Transação (retornada por realizar_compra em caso de sucesso)
```ts
{
  status: "aprovado";
  transacaoId: string;
  intencaoId: string;
  valor: number;
  metodoPagamento: "cartao" | "pix";
  limiteRestante: number;
  data: string; // ISO 8601
}
```

## Erro (retornado por realizar_compra em caso de recusa)
```ts
{
  status: "recusado";
  erro: "INTENCAO_INVALIDA" | "INTENCAO_EXPIRADA" | "INTENCAO_JA_PAGA"
      | "LIMITE_EXCEDIDO" | "METODO_INVALIDO";
  mensagem: string;
}
```

## Decisões a confirmar em equipe
- [ ] A reserva de vaga acontece em `registrar_intencao` (decrementa `vagasRestantes` na hora) ou só na confirmação de `realizar_compra`?
- [ ] Formato exato do token/sessão emitido por `auth/` e como `gemini-chat/` e `tickets-tools/` o validam
- [ ] Tempo de expiração padrão de uma intenção
