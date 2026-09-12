# @tarifa/cli

> Recipe local: só o que difere do contrato raiz. O que vale para os dois
> pacotes está em ../../AGENTS.md e não é repetido aqui.

## Regra de ouro

**Esta camada traduz, não decide.** Ela transforma argv em parâmetro e centavo
em texto; qualquer ramificação que dependa de faixa, valor ou calendário é
sinal de que a regra vazou do núcleo para cá.

## Convenções locais

- Exit code: 0 no cálculo, 2 em erro de uso. É o único lugar do monorepo que
  chama `process.exit`.
- Formatação de moeda mora aqui e só aqui — o núcleo devolve centavos inteiros.
