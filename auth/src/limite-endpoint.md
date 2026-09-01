# PATCH /me/limite — Debito de Limite de Gasto

Endpoint protegido que debita um valor do limite de gasto do usuario autenticado.
Consumido pelo `tickets-tools` apos a aprovacao de `realizar_compra`.

---

## Comportamento

- Requer token JWT valido no header `Authorization: Bearer <token>`
- Aceita apenas valores numericos positivos no campo `valor`
- O debito e atomico via SQL: `UPDATE WHERE limite_gasto >= valor`
- Se o saldo for insuficiente, nao ha debito parcial

---

## Contrato

**Request**
```http
PATCH /me/limite
Authorization: Bearer <token>
Content-Type: application/json

{ "valor": 120 }
```

**Respostas**

| Status | Corpo | Condicao |
|--------|-------|----------|
| 200 | `{ "limiteRestante": 380 }` | Debito realizado com sucesso |
| 400 | `{ "erro": "VALOR_INVALIDO" }` | Valor ausente, negativo, zero ou nao numerico |
| 401 | `{ "erro": "TOKEN_AUSENTE" }` | Header Authorization ausente ou malformado |
| 401 | `{ "erro": "TOKEN_INVALIDO" }` | Token expirado ou invalido |
| 422 | `{ "erro": "LIMITE_INSUFICIENTE" }` | Saldo insuficiente para o debito |

---

## Como testar

### Testes automatizados (recomendado)

```bash
cd auth
npm run db:seed
npm test
```

### Teste manual via PowerShell

```powershell
# 1. Subir o servidor (terminal separado)
npx ts-node-dev src/server.ts

# 2. Login — obter token
$response = Invoke-RestMethod -Method POST -Uri "http://localhost:4000/login" -ContentType "application/json" -Body '{"username":"pedro","senha":"123456"}'
$token = $response.token

# 3. Debitar limite
Invoke-RestMethod -Method PATCH -Uri "http://localhost:4000/me/limite" -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body '{"valor":120}'

# Retorno esperado: { limiteRestante: 380 }
```

### Cenarios de erro

```powershell
# Valor invalido (zero)
Invoke-RestMethod -Method PATCH -Uri "http://localhost:4000/me/limite" -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body '{"valor":0}'

# Limite insuficiente
Invoke-RestMethod -Method PATCH -Uri "http://localhost:4000/me/limite" -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body '{"valor":99999}'

# Sem token
Invoke-RestMethod -Method PATCH -Uri "http://localhost:4000/me/limite" -ContentType "application/json" -Body '{"valor":50}'
```
