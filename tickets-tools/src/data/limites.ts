// src/data/limites.ts
// Consulta o limite de gasto do usuário autenticado no módulo auth/.
// O tickets-tools nunca armazena o limite localmente — a fonte da verdade é o auth/.
//
// Contrato esperado de GET /me (auth/):
//   Response: { id: string, username: string, limiteGasto: number }
//   Header:   Authorization: Bearer <token>

const URL_AUTH = process.env.AUTH_SERVICE_URL ?? "http://localhost:4000";

/**
 * Consulta o limite de gasto disponível para o usuário no serviço de autenticação.
 *
 * @param token - Token JWT do usuário (Bearer), repassado pelo gemini-chat via argumento da tool
 * @returns limiteGasto em reais (número)
 * @throws Lança erro se o serviço auth/ não estiver disponível ou retornar status inesperado
 */
export async function obterLimiteUsuario(token: string): Promise<number> {
  const resposta = await fetch(`${URL_AUTH}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Propaga erros de autenticação ou indisponibilidade do serviço
  if (!resposta.ok) {
    throw new Error(
      `Falha ao consultar limite do usuário em auth/. Status: ${resposta.status}`
    );
  }

  const dados = (await resposta.json()) as { limiteGasto: number };
  return dados.limiteGasto;
}

/**
 * Debita o valor da compra no limite do usuário autenticado.
 *
 * @param token - Token JWT do usuário
 * @param valor - Valor da compra calculado pelo backend
 * @returns Limite restante após o débito
 */
export async function debitarLimiteUsuario(
  token: string,
  valor: number
): Promise<number> {
  const resposta = await fetch(`${URL_AUTH}/me/limite`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ valor }),
  });

  if (!resposta.ok) {
    throw new Error(
      `Falha ao debitar limite do usuário. Status: ${resposta.status}`
    );
  }

  const dados = (await resposta.json()) as {
    limiteRestante: number;
  };

  return dados.limiteRestante;
}