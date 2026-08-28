# tickets-tools

Servidor MCP com as 3 tools de compra de ingressos. Responsável: **Pessoa 2**.

## Tools expostas
- `listar_catalogo` — lista eventos disponíveis (com filtro opcional por categoria)
- `registrar_intencao` — reserva temporária de vaga(s) para um evento
- `realizar_compra` — confirma a compra a partir de uma intenção válida

## Regras de negócio (fonte da verdade = backend)
- `realizar_compra` nunca recebe o valor como argumento — vem da intenção registrada
- Validação de intenção: `INTENCAO_INVALIDA`, `INTENCAO_EXPIRADA`, `INTENCAO_JA_PAGA`, `LIMITE_EXCEDIDO`, `METODO_INVALIDO`
- Vagas de evento controladas em `data/eventos.ts` — tratar concorrência (evento esgotar entre listar e reservar)
- Log auditável de cada chamada de tool em `logs/audit.ts`

## Rodando localmente
```bash
npm install
npm run dev
```

## Banco de dados e seed
O módulo utiliza SQLite para armazenar os eventos.

Para criar a tabela e inserir os eventos iniciais:

```bash
npm run db:seed
```

## Testes
```bash
npm test
```
Cobre casos de erro obrigatórios e tentativas de jailbreak (`tests/jailbreak.test.ts`).
