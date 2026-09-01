# Checklist antes de abrir revisão de código

## Visual

- [ ] Nenhum `border-radius` diferente de 0.
- [ ] Nenhum `linear-gradient`, `radial-gradient` ou `conic-gradient`.
- [ ] Nenhum `box-shadow`, `text-shadow` ou `filter: blur`.
- [ ] Nenhum valor de cor escrito direto no componente. Só variável de `tokens.css`.
- [ ] Uma única ação azul por tela.
- [ ] Verde só em pagamento aprovado. Vermelho só em bloqueio ou falha.
- [ ] Amarelo só em valor disponível e etapa em andamento.

## Texto

- [ ] Nenhuma palavra da coluna esquerda de `vocabulario.md` na interface.
- [ ] Nenhum código de erro, identificador ou data técnica renderizados.
- [ ] Toda mensagem de recusa termina em uma ação possível.
- [ ] Todo valor de dinheiro vem da API, nunca calculado no cliente.

## Estrutura

- [ ] Tela de conversa com as três colunas na ordem: conversas, conversa, pedido.
- [ ] Bloco de valor disponível fixo no rodapé da coluna esquerda.
- [ ] Recusa de pagamento acontece dentro da conversa, sem tirar o usuário da tela.
- [ ] Tela cheia de falha só quando a conversa não pode existir.

## Acessibilidade

- [ ] Foco visível em botão, campo, chip e cartão de evento.
- [ ] Alvo de toque de 44px ou mais.
- [ ] `aria-label` no contador de quantidade e em qualquer botão sem texto.
- [ ] Lista de etapas do carregamento com `aria-live="polite"`.
- [ ] Cartão escolhido identificado por cor e por palavra.
