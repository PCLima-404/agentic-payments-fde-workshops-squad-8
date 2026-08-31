import type { PedidoAtual, Usuario } from "../types";

interface OrderPanelProps {
  pedido: PedidoAtual | null;
  usuario: Usuario;
  onPagar: (metodo: "cartao" | "pix") => void;
  onVerOpcoesMaisBaratas: () => void;
  onComprarOutro: () => void;
}

function formatarValor(valor: number, moeda: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda || "BRL",
  }).format(valor);
}

export default function OrderPanel({
  pedido,
  usuario,
  onPagar,
  onVerOpcoesMaisBaratas,
  onComprarOutro,
}: OrderPanelProps) {
  return (
    <div className="ig-app__pedido">
      <div className="ig-cabecalho">
        <span className="ig-cabecalho__titulo">Seu pedido</span>
      </div>

      <div className="ig-pedido">
        {!pedido && (
          <p style={{ font: "var(--t-apoio)", color: "var(--c-tinta-45)" }}>
            Nenhum pedido em andamento ainda.
          </p>
        )}

        {pedido?.status === "aprovado" && (
          <div className="ig-resultado ig-resultado--aprovado">
            <div className="ig-resultado__faixa">Pagamento aprovado</div>
            <div className="ig-resultado__corpo">
              <p className="ig-resultado__frase">
                Seu ingresso para {pedido.nome} está confirmado. Enviamos por
                e-mail e ele também fica salvo aqui.
              </p>
              <div className="ig-numeros">
                <div className="ig-numeros__item">
                  <div className="ig-numeros__rotulo">Pago com</div>
                  <div className="ig-numeros__valor">
                    {pedido.metodoPagamento === "pix" ? "Pix" : "Cartão"}
                  </div>
                </div>
                <div className="ig-numeros__item">
                  <div className="ig-numeros__rotulo">Valor</div>
                  <div className="ig-numeros__valor">
                    {formatarValor(pedido.valorTotal, pedido.moeda)}
                  </div>
                </div>
                <div className="ig-numeros__item">
                  <div className="ig-numeros__rotulo">Ainda pode gastar</div>
                  <div className="ig-numeros__valor ig-numeros__valor--positivo">
                    {formatarValor(usuario.limiteGasto, "BRL")}
                  </div>
                </div>
              </div>
              <div className="ig-resultado__acoes">
                <button className="ig-botao ig-botao--tinta">
                  Ver meu ingresso
                </button>
                <button
                  className="ig-botao ig-botao--contorno"
                  onClick={onComprarOutro}
                >
                  Comprar outro
                </button>
              </div>
            </div>
          </div>
        )}

        {pedido?.status === "recusado" && (
          <div className="ig-resultado ig-resultado--bloqueio">
            <div className="ig-resultado__faixa">
              Passou do seu valor disponível
            </div>
            <div className="ig-resultado__corpo">
              <p className="ig-resultado__frase">
                {pedido.mensagemErro ??
                  "Esse pedido custa mais do que você tem disponível agora."}
              </p>
              <div className="ig-numeros">
                <div className="ig-numeros__item">
                  <div className="ig-numeros__rotulo">Pedido</div>
                  <div className="ig-numeros__valor">
                    {formatarValor(pedido.valorTotal, pedido.moeda)}
                  </div>
                </div>
                <div className="ig-numeros__item">
                  <div className="ig-numeros__rotulo">Disponível</div>
                  <div className="ig-numeros__valor ig-numeros__valor--negativo">
                    {formatarValor(usuario.limiteGasto, "BRL")}
                  </div>
                </div>
              </div>
              <div className="ig-resultado__acoes">
                <button
                  className="ig-botao ig-botao--principal"
                  onClick={onVerOpcoesMaisBaratas}
                >
                  Ver opções mais baratas
                </button>
                <button
                  className="ig-botao ig-botao--contorno"
                  onClick={onComprarOutro}
                >
                  Comprar um só
                </button>
              </div>
            </div>
          </div>
        )}

        {pedido?.status === "pendente" && (
          <>
            <div className="ig-pedido__capa" />
            <p className="ig-pedido__nome">{pedido.nome}</p>

            <div className="ig-pedido__linha">
              <span style={{ font: "var(--t-rotulo)" }}>Quantidade</span>
              <span style={{ font: "600 15px/1 var(--fonte)" }}>
                {pedido.quantidade}
              </span>
            </div>

            <div className="ig-pedido__linha">
              <span style={{ font: "var(--t-rotulo)" }}>Total</span>
              <span className="ig-pedido__total">
                {formatarValor(pedido.valorTotal, pedido.moeda)}
              </span>
            </div>

            <div className="ig-pedido__prazo">
              Guardamos esse pedido por um tempo. Nada é cobrado até você
              confirmar.
            </div>

            <div className="ig-pedido__pagamento">
              <p style={{ font: "var(--t-rotulo)" }}>Como quer pagar?</p>
              <button
                className="ig-botao ig-botao--principal ig-botao--bloco"
                onClick={() => onPagar("pix")}
              >
                Pagar com Pix
              </button>
              <button
                className="ig-botao ig-botao--contorno ig-botao--bloco"
                onClick={() => onPagar("cartao")}
              >
                Pagar com cartão
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
