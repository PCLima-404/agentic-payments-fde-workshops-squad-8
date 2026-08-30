// gemini-chat/src/app/api/chat/route.ts
// Endpoint HTTP POST /api/chat: Orquestrador da API conversacional com o Gemini.
//
// Responsabilidades:
//   - Autenticação e extração da sessão do usuário a partir do token Bearer JWT
//   - Validação do payload de mensagens recebido do cliente
//   - Invocação do Orquestrador de Tool Calling (executarLoopAgente)
//   - Retorno estruturado de resposta (200 OK) e tratamento defensivo de erros (400, 401, 500)

import { NextRequest, NextResponse } from "next/server";
import { executarLoopAgente } from "../../../services/geminiAgent";
import { UsuarioSessao } from "../../../mcp/executor";

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

    // Valida expiração se o campo 'exp' estiver presente no JWT
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

/**
 * Handler HTTP POST para processamento de mensagens no chat.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Extração e validação do Header de Autorização
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { erro: "TOKEN_AUSENTE", mensagem: "Token de autenticação não fornecido." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();
    const sessao = extrairSessaoDoToken(token);

    if (!sessao) {
      return NextResponse.json(
        { erro: "TOKEN_INVALIDO", mensagem: "Token JWT inválido ou expirado." },
        { status: 401 }
      );
    }

    // 2. Validação do Corpo da Requisição
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { erro: "PAYLOAD_INVALIDO", mensagem: "Corpo da requisição deve ser um JSON válido." },
        { status: 400 }
      );
    }

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        {
          erro: "PAYLOAD_INVALIDO",
          mensagem: "O campo 'messages' é obrigatório e deve ser um array não vazio.",
        },
        { status: 400 }
      );
    }

    // 3. Execução do Loop de Tool Calling
    const resultado = await executarLoopAgente(
      body.messages,
      sessao,
      token,
      body.maxIteracoes || 5
    );

    // 4. Retorno de Sucesso
    return NextResponse.json(
      {
        resposta: resultado.resposta,
        historico: resultado.historico,
        iteracoes: resultado.iteracoes,
      },
      { status: 200 }
    );
  } catch (erro) {
    console.error("[POST /api/chat] Erro inesperado:", erro);

    return NextResponse.json(
      {
        erro: "ERRO_INTERNO",
        mensagem: "Ocorreu um erro interno ao processar a conversa.",
      },
      { status: 500 }
    );
  }
}
