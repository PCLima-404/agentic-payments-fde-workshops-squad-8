interface SystemFailureScreenProps {
  onTentarNovamente: () => void;
  onVoltar: () => void;
}

export default function SystemFailureScreen({
  onTentarNovamente,
  onVoltar,
}: SystemFailureScreenProps) {
  return (
    <div className="ig-tela-falha">
      <div className="ig-falha">
        <div className="ig-falha__bloco">
          <div className="ig-quadro-marca" style={{ background: "#fff" }} />
          <p className="ig-falha__titulo">Algo saiu do ar por aqui</p>
        </div>
        <div className="ig-falha__lado">
          <p className="ig-falha__texto">
            Não conseguimos abrir sua conversa agora. O problema é do nosso lado
            e nenhuma compra sua foi afetada.
          </p>
          <div className="ig-falha__acoes">
            <button
              className="ig-botao ig-botao--principal"
              onClick={onTentarNovamente}
            >
              Tentar de novo
            </button>
            <button className="ig-botao ig-botao--contorno" onClick={onVoltar}>
              Voltar para o início
            </button>
          </div>
          <p className="ig-falha__nota">
            Se continuar assim, fale com o atendimento. O detalhe técnico já foi
            registrado internamente e não precisa ser informado por você.
          </p>
        </div>
      </div>
    </div>
  );
}
