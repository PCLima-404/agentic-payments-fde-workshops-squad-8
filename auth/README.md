# auth

API de autenticação (login + JWT). Responsável: **Pessoa 1**.

## Responsabilidades
- Login/senha → emissão de token JWT
- Middleware de verificação de token, usado pelos demais módulos
- Fonte da verdade para o **limite de gasto** de cada usuário (nunca no frontend/prompt)

## Rodando localmente
```bash
npm install
npm run dev
```

## Banco de dados e seed
O módulo utiliza SQLite para armazenar os usuários e seus limites de gasto.

Para criar a tabela e inserir os usuários iniciais:

```bash
npm run db:seed
```

## Variáveis de ambiente
Ver `.env.example`.

## Endpoints
- `POST /login` — recebe usuário/senha, retorna token
- `GET /me` — retorna dados do usuário autenticado (inclui limite de gasto)