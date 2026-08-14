# DOMAIN.md

> O vocabulário e as leis do <domínio>. Define o que cada termo significa e o
> que nunca pode ser verdade no sistema. Comportamento de feature vive no
> SPEC.md; como o código é escrito, no CLAUDE.md.

## Glossário

- **<termo>** — <o que é, em uma ou duas frases>. <O que ele não é, quando
  existe um vizinho fácil de confundir: "não é carrinho — carrinho não reserva
  estoque".>

## Invariantes

<Leis que valem sempre, independentes de tela, endpoint ou fase. Cada uma
recebe um id `I<n>` estável — critérios do SPEC e tarefas do PLAN citam por
esse id — e é formulada de modo que dê para dizer se foi violada.>

1. **I1 — <a lei, no presente e no absoluto>** — <onde ela é garantida hoje, e
   como se verifica que continua valendo>.
2. **I2 — ...**

## Estados de <entidade>

<Só quando a entidade tem ciclo de vida. Tabela ou lista de transições
permitidas; o que não está listado não acontece. É o que impede um agente
inventar uma transição plausível.>

| de        | para      | quando           |
| --------- | --------- | ---------------- |
| <estado>  | <estado>  | <o gatilho>      |

## Regras de cálculo

<Só quando existe aritmética de negócio que o código não explica sozinho:
arredondamento, moeda, fuso, proporção. Cada regra com um exemplo numérico.>
