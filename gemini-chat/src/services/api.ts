// gemini-chat/src/services/api.ts
import type { Content } from "@google/generative-ai";
import type { Usuario, RespostaChat } from "../types";

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:4000";

export async function login(username: string, senha: string): Promise<string> {
  const resp = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, senha }),
  });

  if (!resp.ok) {
    throw new Error("E-mail ou senha não conferem.");
  }

  const dados = await resp.json();
  return dados.token as string;
}

export async function buscarPerfil(token: string): Promise<Usuario> {
  const resp = await fetch(`${AUTH_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    throw new Error("Não conseguimos confirmar sua conta.");
  }

  return resp.json();
}

export async function enviarMensagem(
  token: string,
  historicoAtual: Content[],
  textoUsuario: string,
): Promise<RespostaChat> {
  const mensagens: Content[] = [
    ...historicoAtual,
    { role: "user", parts: [{ text: textoUsuario }] },
  ];

  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages: mensagens, maxIteracoes: 5 }),
  });

  if (!resp.ok) {
    throw new Error("Não conseguimos abrir sua conversa agora.");
  }

  return resp.json();
}
export async function registrar(
  username: string,
  senha: string,
): Promise<string> {
  const resp = await fetch(`${AUTH_URL}/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, senha }),
  });

  if (!resp.ok) {
    const dados = await resp.json().catch(() => ({}));
    throw new Error(dados.mensagem || "Não foi possível criar sua conta.");
  }

  const dados = await resp.json();
  return dados.token as string;
}
