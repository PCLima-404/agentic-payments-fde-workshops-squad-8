import type { MensagemUI } from "../types";

export default function MessageBubble({ mensagem }: { mensagem: MensagemUI }) {
  const ehUsuario = mensagem.role === "user";
  return (
    <div
      className={`ig-fala ${ehUsuario ? "ig-fala--usuario" : "ig-fala--agente"}`}
    >
      {mensagem.texto}
    </div>
  );
}
