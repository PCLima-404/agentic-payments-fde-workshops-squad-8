// gemini-chat/src/components/ChatWindow.tsx
"use client";

import { useState } from "react";
import type { Content } from "@google/generative-ai";
import type { MensagemUI, Usuario } from "../types";
import { enviarMensagem, buscarPerfil } from "../services/api";
import { extrairPedidoAtual } from "../utils/derivarPedido";
import MessageBubble from "./MessageBubble";
import ToolCallBadge from "./ToolCallBadge";
import OrderPanel from "./OrderPanel";
import SystemFailureScreen from "./SystemFailureScreen";
import "./chat-window.css";

const SUGESTOES = [
  "tem mais barato?",
  "quero dois ingressos",
  "o que rola domingo?",
];

interface ChatWindowProps {
  token: string;
  usuario: Usuario;
  onUsuarioAtualizado: (usuario: Usuario) => void;
}

export default function ChatWindow({
  token,
  usuario,
  onUsuarioAtualizado,
}: ChatWindowProps) {
  const [historico, setHistorico] = useState<Content[]>([]);
  const [mensagens, setMensagens] = useState<MensagemUI[]>([]);
  const [entrada, setEntrada] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [falhaSistema, setFalhaSistema] = useState(false);

  const pedido = extrairPedidoAtual(historico);

  async function enviar(texto: string) {
    if (!texto.trim() || carregando) return;

    setMensagens((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", texto },
    ]);
    setEntrada("");
    setCarregando(true);
    setFalhaSistema(false);

    try {
      const resultado = await enviarMensagem(token, historico, texto);
      setHistorico(resultado.historico);
      setMensagens((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "model", texto: resultado.resposta },
      ]);

      // Se a compra foi aprovada, o limite de gasto mudou no backend —
      // busca o perfil atualizado para refletir o novo valor disponível sem precisar recarregar a página.
      const pedidoAtualizado = extrairPedidoAtual(resultado.historico);
      if (pedidoAtualizado?.status === "aprovado") {
        try {
          const perfilAtualizado = await buscarPerfil(token);
          onUsuarioAtualizado(perfilAtualizado);
        } catch {
          // Se falhar, o usuário só não vê o valor atualizado até recarregar — não é crítico.
        }
      }
    } catch {
      setFalhaSistema(true);
    } finally {
      setCarregando(false);
    }
  }

  function pagar(metodo: "cartao" | "pix") {
    enviar(metodo === "pix" ? "Pode pagar no pix." : "Pode pagar no cartão.");
  }

  if (falhaSistema) {
    return (
      <SystemFailureScreen
        onTentarNovamente={() => setFalhaSistema(false)}
        onVoltar={() => {
          setFalhaSistema(false);
          setHistorico([]);
          setMensagens([]);
        }}
      />
    );
  }

  return (
    <div className="tela-chat">
      <main className="coluna-conversa">
        <div className="lista-mensagens">
          {mensagens.map((m) => (
            <MessageBubble key={m.id} mensagem={m} />
          ))}
          {carregando && <ToolCallBadge />}
        </div>

        <div className="chips-sugestoes">
          {SUGESTOES.map((s) => (
            <button key={s} className="chip-sugestao" onClick={() => enviar(s)}>
              {s}
            </button>
          ))}
        </div>

        <form
          className="campo-envio"
          onSubmit={(e) => {
            e.preventDefault();
            enviar(entrada);
          }}
        >
          <input
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Escreva aqui"
          />
          <button type="submit" className="botao-enviar" disabled={carregando}>
            Enviar
          </button>
        </form>
      </main>

      <OrderPanel pedido={pedido} usuario={usuario} onPagar={pagar} />
    </div>
  );
}
