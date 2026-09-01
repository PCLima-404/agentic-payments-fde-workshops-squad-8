# Vocabulário da Interface e Diretrizes de UX (Squad 8)

![Squad 8 Header](../headers/agentic-payments-fde-workshops-mainheader-squad8.webp)

Guia normativo de experiência do usuário (UX), mapeamento de personas reais da aplicação e dicionário de tradução entre o backend e a interface visual (`gemini-chat`).

---

## 1. Personas Reais da Aplicação

A aplicação foi projetada considerando os usuários cadastrados no banco de dados (`auth/src/data/usuarios.ts`) e o comportamento dinâmico da interface gráfica diante de cada saldo:

| Usuário | Limite de Gasto | Comportamento da Interface e Perfil de UX |
| :--- | :--- | :--- |
| **pedro** | R$ 500,00 | Perfil equilibrado. Consegue explorar o catálogo de workshops e hackathons e concluir compras à vista via Pix ou cartão. |
| **luis** | R$ 300,00 | Perfil intermediário. A interface atualiza o saldo restante no painel lateral após cada reserva aprovada. |
| **everson** | R$ 50,00 | Perfil com saldo reduzido. Utilizado para validar a tela de bloqueio amigável de valor insuficiente sem constrangimento. |
| **carlos** | R$ 5.000,00 | Perfil corporativo. Permite a compra de múltiplos ingressos em lote com validação de estoque em tempo real. |
| **fernanda** | R$ 0,00 | Perfil sem saldo. A interface permite navegar no catálogo e sugere opções acessíveis ou criação de nova conta. |

---

## 2. Estrutura Visual da Interface (Front-end)

A interface em Next.js 14 é dividida em três áreas funcionais integradas ao estado do agente:

1. **Painel Lateral Esquerdo (Conta e Saldo):**
   * Exibe a marca do sistema e o bloco **"Você pode gastar"**, com o saldo formatado em moeda brasileira (`BRL`).
   * O valor é atualizado automaticamente pelo componente `ChatWindow` ao final de cada turno bem-sucedido via consulta a `GET /me`.
2. **Área Central (Diálogo Conversacional):**
   * Exibe as mensagens trocadas (`MessageBubble`), atalhos rápidos de escrita (`"tem mais barato?"`, `"quero dois ingressos"`, `"o que rola domingo?"`) e indicador de execução de ferramentas (`ToolCallBadge`).
3. **Painel Lateral Direito (OrderPanel):**
   * Renderiza dinamicamente o estado atual do pedido extraído do histórico (`extrairPedidoAtual`).
   * **Estado Pendente:** Exibe quantidade, valor total, aviso de reserva temporária e botões de ação direta ("Pagar com Pix" e "Pagar com cartão").
   * **Estado Aprovado:** Exibe faixa "Pagamento aprovado", método utilizado, novo saldo restante e botões "Ver meu ingresso" e "Comprar outro".
   * **Estado Recusado:** Exibe faixa "Passou do seu valor disponível", comparação entre valor do pedido e saldo disponível, e botões "Ver opções mais baratas" e "Comprar um só".

---

## 3. Tradução Obrigatória de Termos (Backend para Interface)

Regra fundamental: termos técnicos de engenharia nunca são exibidos diretamente ao usuário final.

| Termo Técnico no Backend | Como Aparece na Interface |
| :--- | :--- |
| `limite_gasto` | Você pode gastar |
| `registrar_intencao` | Guardamos esse pedido por um tempo |
| `LIMITE_EXCEDIDO` | Passou do seu valor disponível |
| `INTENCAO_EXPIRADA` | Esse pedido venceu, separo de novo? |
| `INTENCAO_JA_PAGA` | Esse ingresso já está pago |
| `VAGAS_INSUFICIENTES` | Não temos vagas suficientes para esta quantidade |
| `METODO_INVALIDO` | Aceitamos Pix e cartão |
| `INTENCAO_INVALIDA` | Pedido não localizado |
| `ERRO_INTERNO` / Falha MCP | Algo saiu do ar por aqui |
| `tokenJwt` / `usuario_id` | Oculto (mantido em memória de sessão) |

---

## 4. Padrões de Mensagens de Resultado

Todas as mensagens geradas pelo sistema seguem estrutura objetiva com título, motivo, impacto financeiro e ação recomendada:

* **Pagamento Aprovado:**
  * *Título:* "Pagamento aprovado"
  * *Texto:* "Seu ingresso para [Evento] está confirmado. Enviamos por e-mail e ele também fica salvo aqui."
  * *Ações:* "Ver meu ingresso" e "Comprar outro".
* **Valor Insuficiente:**
  * *Título:* "Passou do seu valor disponível"
  * *Texto:* "Esse pedido custa mais do que você tem disponível agora. Não cobramos nada e seu pedido segue guardado."
  * *Ações:* "Ver opções mais baratas" e "Comprar um só".
* **Pedido Vencido:**
  * *Título:* "Esse pedido venceu"
  * *Texto:* "Passou do tempo limite de 5 minutos que conseguimos segurar o ingresso. Posso separar de novo pelo preço atual."
  * *Ação:* "Separar de novo".
* **Forma de Pagamento Não Aceita:**
  * *Título:* "Essa forma não está disponível"
  * *Texto:* "Por aqui dá para pagar com Pix ou cartão."
  * *Ação:* Botões rápidos de pagamento.
* **Falha de Sistema:**
  * *Título:* "Algo saiu do ar por aqui"
  * *Texto:* "Não conseguimos processar sua mensagem agora. O problema é do nosso lado e nenhuma compra sua foi afetada."
  * *Ações:* "Tentar de novo" e "Voltar para o início".

---

## 5. Onde o Detalhe Técnico Vive

Identificadores de pedidos, códigos HTTP e logs de auditoria (`audit.ts`) são processados exclusivamente no backend. A interface do usuário e o diálogo com o agente preservam uma linguagem clara, acessível e segura.

---

## 6. Evidências Visuais e Prints da Interface (Front-end)

Abaixo estão os locais reservados para inclusão das capturas de tela demonstrando a interface em funcionamento:

### A. Tela de Autenticação e Cadastro (`LoginForm`)
<!-- Adicione aqui o print da tela de login e escolha de usuário -->
![Tela de Autenticação 1](../screenshots/interface-login-form-1.png)
![Tela de Autenticação 2](../screenshots/interface-login-form-2.png)

### B. Tela de Carregamento
<!-- Adicione aqui o print da tela de carregamento -->
![Tela de Carregamento](../screenshots/loading-screen.png)

### C. Interface Principal do Chat e Saldo em Tempo Real
<!-- Adicione aqui o print da conversa com saldo no painel lateral esquerdo -->
![Interface do Chat Principal](../screenshots/talking1.png)
![Interface do Chat Principal 2](../screenshots/talking2.png)

### D. Confirmação de Pagamento e Atualização de Saldo
<!-- Adicione aqui o print da confirmação de compra com botão Ver meu ingresso -->
![Pagamento Aprovado](../screenshots/madeit.png)

### E. Bloqueio Amigável por Saldo Insuficiente
<!-- Adicione aqui o print do aviso de saldo ultrapassado com opções mais baratas -->
![Saldo Insuficiente](../screenshots/dontmadeit.png)
![Saldo Insuficiente 2](../screenshots/dontmadeit2.png)