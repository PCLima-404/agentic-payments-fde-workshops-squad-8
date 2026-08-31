import "./system-failure.css";

interface SystemFailureScreenProps {
  onTentarNovamente: () => void;
  onVoltar: () => void;
}

export default function SystemFailureScreen({
  onTentarNovamente,
  onVoltar,
}: SystemFailureScreenProps) {
  return (
    <div className="tela-falha">
      <div className="conteudo-falha">
        <p className="texto-falha">
          Não conseguimos abrir sua conversa agora. O problema é do nosso lado e
          nenhuma compra sua foi afetada.
        </p>
        <div className="acoes-falha">
          <button className="botao-primario" onClick={onTentarNovamente}>
            Tentar de novo
          </button>
          <button className="botao-secundario" onClick={onVoltar}>
            Voltar para o início
          </button>
        </div>
        <p className="nota-falha">
          Se continuar assim, fale com o atendimento. O detalhe técnico já foi
          registrado internamente e não precisa ser informado por você.
        </p>
      </div>
    </div>
  );
}
