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

## Variáveis de ambiente
Ver `.env.example`.

## Endpoints
- `POST /login` — recebe usuário/senha, retorna token
- `GET /me` — retorna dados do usuário autenticado (inclui limite de gasto)
