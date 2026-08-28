// auth/src/session/escopoIntencao.ts
//
// Regra de negócio: o usuario_id de uma chamada a registrar_intencao (e às
// demais tools que dependem de sessão) NUNCA pode vir do modelo/prompt nem
// do frontend. Ele é sempre extraído do token JWT validado no backend.
//
// Este módulo isola essa regra para ser reaproveitado tanto num teste
// isolado (mock) quanto depois, de verdade, no route.ts do gemini-chat/.

export interface PayloadTool {
  [chave: string]: unknown;
}

export interface UsuarioSessao {
  sub: string; // usuario_id
  username: string;
}

/**
 * Recebe o payload que o modelo pediu para uma tool (ex: registrar_intencao)
 * e o usuário já autenticado (extraído do token), e devolve o payload final
 * com usuario_id injetado — sobrescrevendo qualquer usuario_id que porventura
 * já viesse no payload original, por segurança.
 */
export function vincularUsuarioAoPayload(
  payloadDoModelo: PayloadTool,
  usuarioSessao: UsuarioSessao,
): PayloadTool {
  return {
    ...payloadDoModelo,
    usuario_id: usuarioSessao.sub,
  };
}
