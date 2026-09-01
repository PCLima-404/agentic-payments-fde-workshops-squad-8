// gemini-chat/src/utils/sessao.ts
// Extraído de src/app/api/chat/route.ts — arquivos route.ts do Next.js
// só podem exportar handlers HTTP (GET, POST, etc.) e um conjunto restrito
// de configs especiais. Qualquer outro export quebra o "next build" com
// erro de tipo (mesmo funcionando normalmente em "next dev").

import { UsuarioSessao } from "../mcp/executor";

/**
 * Decodifica e valida o payload de um token JWT sem dependência de módulos nativos externos.
 * Valida a presença de identificador de usuário (sub, userId ou usuario_id) e expiração.
 */
export function extrairSessaoDoToken(token: string): UsuarioSessao | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const partes = token.split(".");
    if (partes.length !== 3) {
      return null;
    }

    const payloadJson = Buffer.from(partes[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);

    if (payload.exp && typeof payload.exp === "number") {
      const agoraEmSegundos = Math.floor(Date.now() / 1000);
      if (agoraEmSegundos >= payload.exp) {
        return null;
      }
    }

    const usuarioId =
      payload.sub || payload.userId || payload.usuario_id || payload.id;

    if (!usuarioId || typeof usuarioId !== "string") {
      return null;
    }

    return {
      id: usuarioId,
      username:
        typeof payload.username === "string" ? payload.username : usuarioId,
    };
  } catch {
    return null;
  }
}
