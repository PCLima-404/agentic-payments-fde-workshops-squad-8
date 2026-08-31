import type { MensagemUI } from "../types";
import "./chat.css";

export default function MessageBubble({ mensagem }: { mensagem: MensagemUI }) {
  const ehUsuario = mensagem.role === "user";
  return (
    <div className={`linha-mensagem ${ehUsuario ? "do-usuario" : "do-agente"}`}>
      <div className={`bolha ${ehUsuario ? "bolha-usuario" : "bolha-agente"}`}>
        {mensagem.texto}
      </div>
    </div>
  );
}
