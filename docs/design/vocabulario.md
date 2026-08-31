# Vocabulário da interface

Regra única: se uma frase só faz sentido para quem construiu o sistema,
ela é reescrita ou removida. O usuário é jovem, comprando ingresso, sem
contexto técnico. Ele precisa saber o que vai ver, quanto custa, quanto
sobra e o que fazer em seguida.

## Tradução obrigatória

| Nunca aparece na tela                                    | Aparece assim                       |
| -------------------------------------------------------- | ----------------------------------- |
| limite de gasto                                          | quanto você pode gastar             |
| intenção registrada, pedido persistido                   | separei para você                   |
| limite excedido                                          | passou do seu valor disponível      |
| pedido expirado                                          | esse pedido venceu, separo de novo? |
| pedido já pago                                           | esse ingresso já está pago          |
| forma de pagamento inválida                              | aceitamos Pix e cartão              |
| catálogo                                                 | eventos                             |
| ferramenta, protocolo, sessão, token                     | não é exibido                       |
| identificador do pedido, código de erro, horário técnico | não é exibido                       |
| falha na integração                                      | algo saiu do ar por aqui            |

## Frases de resultado

Todas seguem a mesma estrutura: título curto, uma frase de motivo, uma
frase de consequência para o dinheiro do usuário, e uma ação possível.

Aprovado
: Título "Pagamento aprovado". Frase: "Seu ingresso para [evento] está
confirmado. Enviamos por e-mail e ele também fica salvo aqui."

Valor insuficiente
: Título "Passou do seu valor disponível". Frase: "Esse ingresso custa
mais do que você tem disponível agora. Não cobramos nada e seu pedido
segue guardado por [tempo]." Ação: "Ver opções mais baratas".

Pedido vencido
: Título "Esse pedido venceu". Frase: "Passou do tempo que a gente
consegue segurar o ingresso. Posso separar de novo pelo preço de
agora." Ação: "Separar de novo".

Pedido já pago
: Título "Esse ingresso já está pago". Frase: "Você já concluiu essa
compra. Ele está salvo na sua conta." Ação: "Ver meu ingresso".

Forma de pagamento não aceita
: Título "Essa forma não está disponível". Frase: "Por aqui dá para pagar
com Pix ou cartão." Ação: dois botões de pagamento.

Falha de sistema
: Título "Algo saiu do ar por aqui". Frase: "Não conseguimos abrir sua
conversa agora. O problema é do nosso lado e nenhuma compra sua foi
afetada." Ações: "Tentar de novo" e "Voltar para o início".

## Onde o detalhe técnico vive

Código de erro, identificador de pedido e horário exato continuam
existindo e devem ser registrados no log e enviados ao monitoramento.
Eles nunca são renderizados para o comprador, nem em texto pequeno, nem
em atributo visível. Se o atendimento precisar do dado, ele consulta o
registro interno pelo horário da conversa.
