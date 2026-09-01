# auth (Microsserviço de Autenticação e Limites)

![Squad 8 Header](../docs/headers/agentic-payments-fde-workshops-mainheader-squad8.webp)

Microsserviço independente em Express (porta 4000) responsável pela autenticação de usuários, emissão e validação de tokens JWT (RFC 7519) e controle transacional do saldo de gastos.

> **Fonte da Verdade:** Para a documentação arquitetural completa, contratos normativos e matriz de testes do ecossistema, consulte o [`README.md`](../README.md) raiz do repositório e o contrato formal em [`docs/contrato-api.md`](../docs/contrato-api.md).

---

## 1. Responsabilidades do Módulo

* **Autenticação Segura:** Autenticação de credenciais via `POST /login` e emissão de tokens JWT com expiração de 2 horas.
* **Cadastro de Usuários:** Rota `POST /register` permitindo a criação de novas contas com limite inicial configurado de R$ 500,00.
* **Consulta de Perfil:** Rota `GET /me` com extração do usuário autenticado e retorno do limite de gastos disponível.
* **Controle Transacional de Limite:** Rota `PATCH /me/limite` com débito atômico de saldo e retorno `422 LIMITE_INSUFICIENTE` quando o valor ultrapassa o saldo disponível.
* **Middleware de Autorização:** `auth.middleware.ts` protegendo rotas restritas contra requisições sem Bearer token válido.

---

## 2. Variáveis de Ambiente

Crie o arquivo `.env` dentro de `auth/`:

```env
PORT=4000
JWT_SECRET=super-secret-key-123456
```

---

## 3. Banco de Dados e Seeds

O módulo utiliza SQLite para armazenar as credenciais e saldos de cada usuário:

```bash
# 1. Instalação de dependências
npm install

# 2. Criação da tabela de usuários e carga dos dados iniciais
npm run db:seed
```

### Usuários Pré-Cadastrados para Testes (Senha: `123456`)

| Usuário | Limite Inicial | Finalidade no Teste de UX |
| :--- | :--- | :--- |
| `pedro` | R$ 500,00 | Perfil padrão equilibrado para compras de workshops |
| `luis` | R$ 300,00 | Perfil com saldo intermediário |
| `everson` | R$ 50,00 | Perfil com saldo reduzido para teste de recusa amigável (`LIMITE_EXCEDIDO`) |
| `carlos` | R$ 5.000,00 | Perfil corporativo de alto limite para compras em lote |
| `fernanda` | R$ 0,00 | Perfil sem saldo para validação de bloqueio inicial |

---

## 4. Execução

```bash
# Modo desenvolvimento (reinicialização automática)
npm run dev

# Compilação e execução em produção
npm run build
npm start
```

* O microsserviço estará disponível em **`http://localhost:4000`**.

---

## 5. Testes Automatizados

A suíte de testes unitários e de integração cobre validações de autenticação, persistência, limites e concorrência:

```bash
npm test
```

* **Total:** 15 testes automatizados com 100% de aprovação no Vitest.