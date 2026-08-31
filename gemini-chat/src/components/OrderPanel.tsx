import type { PedidoAtual, Usuario } from "../types";
import "./order-panel.css";

interface OrderPanelProps {
  pedido: PedidoAtual | null;
  usuario: Usuario;
  onPagar: (metodo: "cartao" | "pix") => void;
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
}: OrderPanelProps) {
  return (
    <aside className="painel-pedido">
      <div className="bloco-disponivel">
        <p className="rotulo">Você pode gastar</p>
        <p className="valor-disponivel">
          {formatarValor(usuario.limiteGasto, "BRL")}
        </p>
      </div>

      {!pedido && (
        <p className="mensagem-vazia">Nenhum pedido em andamento ainda.</p>
      )}

      {pedido?.status === "recusado" && (
        <div className="faixa-resultado faixa-bloqueio">
          <p className="titulo-resultado">Passou do seu valor disponível</p>
          <p className="texto-resultado">
            {pedido.mensagemErro ??
              "Esse pedido custa mais do que você tem disponível agora."}
          </p>
        </div>
      )}

      {pedido?.status === "aprovado" && (
        <div className="faixa-resultado faixa-aprovado">
          <p className="titulo-resultado">Pagamento aprovado</p>
          <div className="trio-numeros">
            <div>
              <p className="rotulo">Pago com</p>
              <p className="valor-medio">
                {pedido.metodoPagamento === "pix" ? "Pix" : "Cartão"}
              </p>
            </div>
            <div>
              <p className="rotulo">Valor</p>
              <p className="valor-medio">
                {formatarValor(pedido.valorTotal, pedido.moeda)}
              </p>
            </div>
          </div>
        </div>
      )}

      {pedido?.status === "pendente" && (
        <>
          <div className="cartao-evento">
            <p className="nome-evento">{pedido.nome}</p>
          </div>

          <div className="linha-quantidade">
            <span className="rotulo">Quantidade</span>
            <span className="valor-medio">{pedido.quantidade}</span>
          </div>

          <div className="linha-total">
            <span className="rotulo">Total</span>
            <span className="texto-total">
              {formatarValor(pedido.valorTotal, pedido.moeda)}
            </span>
          </div>

          <p className="aviso-neutro">
            Guardamos esse pedido por um tempo. Nada é cobrado até você
            confirmar.
          </p>

          <p className="rotulo">Como quer pagar?</p>
          <button className="botao-primario" onClick={() => onPagar("pix")}>
            Pagar com Pix
          </button>
          <button
            className="botao-secundario"
            onClick={() => onPagar("cartao")}
          >
            Pagar com cartão
          </button>
        </>
      )}
    </aside>
  );
}
