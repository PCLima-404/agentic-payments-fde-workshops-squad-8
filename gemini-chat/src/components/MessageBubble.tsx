import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MensagemUI } from "../types";

export default function MessageBubble({ mensagem }: { mensagem: MensagemUI }) {
  const ehUsuario = mensagem.role === "user";
  return (
    <div
      className={`ig-fala ${ehUsuario ? "ig-fala--usuario" : "ig-fala--agente"}`}
    >
      {ehUsuario ? (
        mensagem.texto
      ) : (
        <div className="ig-fala__markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {mensagem.texto}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
