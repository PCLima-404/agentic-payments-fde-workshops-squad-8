import "./chat.css";

export default function ToolCallBadge() {
  return (
    <div className="linha-mensagem do-agente">
      <div className="bolha bolha-agente bolha-carregando">
        <span className="ponto" />
        <span className="ponto" />
        <span className="ponto" />
      </div>
    </div>
  );
}
