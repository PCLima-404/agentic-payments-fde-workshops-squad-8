import { NextRequest, NextResponse } from "next/server";
import { executarToolComSessao } from "../../../mcp/executor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      toolCall,
      sessao,
      tokenJwt,
    } = body;

    if (!sessao?.usuarioId) {
      return NextResponse.json(
        { erro: "SESSAO_INVALIDA" },
        { status: 401 }
      );
    }

    if (!tokenJwt) {
      return NextResponse.json(
        { erro: "TOKEN_AUSENTE" },
        { status: 401 }
      );
    }

    if (!toolCall?.name) {
      return NextResponse.json(
        { erro: "TOOL_NAO_IDENTIFICADA" },
        { status: 400 }
      );
    }

    const nomeDaTool = toolCall.name;
    const argumentosDaTool = toolCall.arguments ?? {};

    const resultado = await executarToolComSessao(
      nomeDaTool,
      argumentosDaTool,
      {
        id: sessao.usuarioId,
        username: sessao.username,
      },
      tokenJwt
    );

    return NextResponse.json({
      ok: true,
      resultado,
    });
  } catch (error) {
    console.error("Erro ao executar tool call no route:", error);

    return NextResponse.json(
      {
        erro: "ERRO_EXECUCAO_TOOL",
        mensagem: error instanceof Error ? error.message : "Erro inesperado",
      },
      { status: 500 }
    );
  }
}