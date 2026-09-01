"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Content } from "@google/generative-ai";
import type { MensagemUI, Usuario } from "../types";
import { enviarMensagem, buscarPerfil } from "../services/api";
import { extrairPedidoAtual } from "../utils/derivarPedido";
import MessageBubble from "./MessageBubble";
import ToolCallBadge from "./ToolCallBadge";
import OrderPanel from "./OrderPanel";
import SystemFailureScreen from "./SystemFailureScreen";

const SUGESTOES = [
  "tem mais barato?",
  "quero dois ingressos",
  "o que rola domingo?",
];

interface ChatWindowProps {
  token: string;
  usuarioInicial: Usuario;
}

export default function ChatWindow({ token, usuarioInicial }: ChatWindowProps) {
  const router = useRouter();
  const [historico, setHistorico] = useState<Content[]>([]);
  const [mensagens, setMensagens] = useState<MensagemUI[]>([]);
  const [entrada, setEntrada] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [falhaSistema, setFalhaSistema] = useState(false);
  // BUG FIX: usuario vira estado local, não fica preso ao valor buscado
  // uma única vez no carregamento — assim o saldo reflete compras
  // aprovadas sem precisar recarregar a página.
  const [usuario, setUsuario] = useState<Usuario>(usuarioInicial);

  const pedido = extrairPedidoAtual(historico);

  function handleLogout() {
    localStorage.removeItem("ingressos_token");
    router.push("/login");
  }

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

      // BUG FIX: depois de qualquer turno (pode ter havido uma compra),
      // busca o perfil de novo pra pegar o limiteGasto atualizado do backend.
      try {
        const perfilAtualizado = await buscarPerfil(token);
        setUsuario(perfilAtualizado);
      } catch {
        // se essa busca falhar isoladamente, não derruba a conversa —
        // o saldo só fica desatualizado até o próximo turno bem-sucedido.
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

  function reiniciarPedido() {
    setHistorico([]);
    setMensagens([]);
  }

  if (falhaSistema) {
    return (
      <SystemFailureScreen
        onTentarNovamente={() => setFalhaSistema(false)}
        onVoltar={() => {
          setFalhaSistema(false);
          reiniciarPedido();
        }}
      />
    );
  }

  return (
    <div className="ig-app">
      <div className="ig-app__lateral">
        <div className="ig-cabecalho">
          <div className="ig-quadro-marca" />
          <span className="ig-cabecalho__titulo">Ingressos</span>
        </div>

        <div className="ig-conversas__titulo">Suas conversas</div>
        <div className="ig-conversa-item ig-conversa-item--ativo">
          Ingressos para hoje
        </div>

        <div className="ig-saldo">
          <div className="ig-saldo__rotulo">Você pode gastar</div>
          <div className="ig-saldo__valor">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(usuario.limiteGasto)}
          </div>
          {/* Barra de consumo omitida: o backend hoje só expõe o valor
              restante, não o limite total original — sem isso não dá
              pra calcular um percentual real. Ver docs/contrato-api.md. */}
        </div>

        <div className="ig-lateral-usuario">
          <div className="ig-lateral-usuario__info">
            <span className="ig-lateral-usuario__rotulo">Conectado como</span>
            <strong className="ig-lateral-usuario__nome">{usuario.username}</strong>
          </div>
          <button
            type="button"
            className="ig-botao ig-botao--contorno ig-botao--compacto ig-lateral-usuario__sair"
            onClick={handleLogout}
          >
            Sair da conta
          </button>
        </div>
      </div>

      <div className="ig-app__conversa">
        <div className="ig-cabecalho">
          <div>
            <div className="ig-cabecalho__titulo">Ingressos para hoje</div>
            <div className="ig-cabecalho__estado">
              Assistente disponível agora
            </div>
          </div>
        </div>

        <div className="ig-mensagens">
          {mensagens.map((m) => (
            <MessageBubble key={m.id} mensagem={m} />
          ))}
          {carregando && <ToolCallBadge />}
        </div>

        <div className="ig-escrita">
          <div className="ig-escrita__atalhos">
            {SUGESTOES.map((s) => (
              <button key={s} className="ig-chip" onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </div>
          <form
            className="ig-escrita__linha"
            onSubmit={(e) => {
              e.preventDefault();
              enviar(entrada);
            }}
          >
            <input
              className="ig-escrita__entrada"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              placeholder="Escreva aqui"
            />
            <button
              type="submit"
              className="ig-botao ig-botao--principal ig-escrita__enviar"
              disabled={carregando}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      <OrderPanel
        pedido={pedido}
        usuario={usuario}
        onPagar={pagar}
        onVerOpcoesMaisBaratas={() => enviar("tem mais barato?")}
        onComprarOutro={reiniciarPedido}
      />
    </div>
  );
}
