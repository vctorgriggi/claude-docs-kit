# DOMAIN.md

> O vocabulário e as leis do domínio de pedidos. Define o que cada termo
> significa e o que nunca pode ser verdade no sistema. Comportamento de feature
> vive no SPEC.md; como o código é escrito, no AGENTS.md.

## Glossário

- **Pedido** — intenção de compra registrada, com itens e um estado. Não é
  carrinho: carrinho não reserva nada e some sozinho; pedido tem ciclo de vida
  e existe até um estado terminal.
- **Item** — uma linha do pedido: valor unitário em centavos e quantidade. Não
  é produto: o mesmo produto vira itens diferentes em pedidos diferentes, com
  o preço congelado no momento do registro.
- **Estado terminal** — estado do qual não sai nenhuma transição. Hoje são
  `enviado` e `cancelado`.
- **Desconto** — redução proporcional sobre o bruto, em pontos-base (100 bps =
  1%). Não é abatimento em valor: valor fixo não existe neste domínio.
- **Centavo** — a unidade monetária do sistema. Todo valor é inteiro nessa
  unidade; "reais" é apresentação, nunca armazenamento.

## Invariantes

1. **I1 — pedido cancelado nunca volta a um estado de venda** — `cancelado` é
   terminal; a transição não existe na tabela de `src/estados.js` e
   `transicionar` lança em vez de devolver estado inválido. Verificável: para
   todo destino, `permitida("cancelado", destino)` é falso.
2. **I2 — estado terminal não tem saída** — `enviado` e `cancelado` têm lista
   de destinos vazia. Verificável: `terminal(e)` implica nenhuma transição
   permitida a partir de `e`.
3. **I3 — dinheiro só existe em centavos inteiros** — nenhum valor monetário
   trafega como float, em nenhuma camada. Verificável: `total` recusa item com
   `centavos` não inteiro.
4. **I4 — o preço do item é congelado no registro** — mudança de preço do
   produto não altera pedido já registrado. Verificável: o item carrega o
   próprio `centavos`; nada em `src/` lê preço de fora na hora de somar.

## Estados de pedido

O que não está na tabela não acontece. `src/estados.js` é a única fonte das
transições; qualquer caminho novo entra ali primeiro.

| de                     | para                   | quando                          |
| ---------------------- | ---------------------- | ------------------------------- |
| `rascunho`             | `aguardando_pagamento` | o cliente confirma os itens     |
| `rascunho`             | `cancelado`            | abandono ou cancelamento manual |
| `aguardando_pagamento` | `pago`                 | o pagamento é confirmado        |
| `aguardando_pagamento` | `cancelado`            | expiração ou recusa             |
| `pago`                 | `enviado`              | a remessa é despachada          |
| `pago`                 | `cancelado`            | cancelamento com estorno        |

## Regras de cálculo

- **Total do pedido** — soma de `centavos × quantidade` de cada item, depois o
  desconto proporcional, com **um único arredondamento no fim**, meio-para-cima.
  Arredondar por item acumula erro que não fecha com o extrato do cliente.
  Exemplo: 3 itens de 333 centavos com 1000 bps de desconto → bruto 999,
  999 × 0,9 = 899,1 → **899**.
- **Faixa do desconto** — de 0 a 10000 bps. Fora disso é erro de programação,
  não entrada de usuário: `total` lança.
