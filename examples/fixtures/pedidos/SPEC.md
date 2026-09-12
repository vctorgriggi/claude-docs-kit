# SPEC.md

> Descreve o **pedidos atual** — biblioteca que guarda o ciclo de vida e a
> aritmética de um pedido. O que foi planejado mas ainda não implementado está
> na seção final "Planejado / não implementado" — nada nela deve ser lido
> como já existente.

## Problema

Regra de pedido espalhada por controller, job e tela diverge: cada lugar
reimplementa "pode cancelar?" com uma condição ligeiramente diferente, e a
diferença só aparece quando um cliente reclama. Esta biblioteca concentra as
transições e o cálculo do total em funções puras, sem I/O, para que exista uma
resposta só — e testável sem subir nada.

Os termos e as leis do domínio vivem em DOMAIN.md; este documento descreve o
que a biblioteca faz com eles.

## Usuários

- **Serviço que registra pedidos** — chama `transicionar` antes de persistir e
  confia no erro para recusar caminho inválido.
- **Relatório financeiro** — usa `total` para conferir valores sem replicar a
  regra de arredondamento.

## Funcionalidades

### Essenciais

**Ciclo de vida**

- `permitida(de, para)` responde se a transição existe, sem efeito colateral.
- `transicionar(de, para)` devolve o estado novo ou lança; nunca devolve
  estado inválido em silêncio.
- `terminal(estado)` identifica estado sem saída.

**Aritmética**

- `total(itens, descontoBps)` soma os itens e aplica o desconto proporcional
  com um único arredondamento no fim.
- Entrada inválida — centavo não inteiro, desconto fora da faixa — lança.

### Fora do escopo

- Persistência: a biblioteca não conhece banco, arquivo nem rede.
- Desconto em valor fixo: o domínio só tem desconto proporcional (DOMAIN.md,
  glossário); aceitar valor fixo criaria duas aritméticas para conciliar.

## Módulos

Dois módulos puros, sem dependência entre si: `estados` (a tabela de transições
e as consultas sobre ela) e `total` (a aritmética de centavos). Nenhum dos dois
faz I/O, lê relógio ou imprime.

## Stack

- **Node, ESM** — stdlib apenas; testes com `node:test`. As versões mínimas
  vivem na tabela de Stack do CLAUDE.md.

## Constraints técnicas

1. **Sem dependências de runtime** — a biblioteca é embutida em serviços que
   não controlam o próprio lockfile.
2. **Funções puras** — nada de relógio, aleatoriedade ou I/O; é o que permite
   testar cada invariante do DOMAIN sem infraestrutura.

## Critérios de aceitação

1. `transicionar("cancelado", "pago")` lança (garante I1).
2. Nenhuma transição parte de `enviado` ou `cancelado` (garante I2).
3. `total` com centavo fracionário lança (garante I3).
4. 3 itens de 333 centavos com 1000 bps de desconto → 899 (arredondamento
   único, DOMAIN.md › Regras de cálculo).

## Planejado / não implementado

> O que está abaixo é **planejado** e não faz parte da biblioteca atual. A
> arquitetura já acomoda: uma transição nova é uma linha na tabela de
> `estados`, e nada fora dela precisa mudar.

### Reembolso parcial

Estado `reembolsado_parcial` entre `pago` e `enviado`, com o valor devolvido
registrado no pedido. Exige um invariante novo no DOMAIN (o reembolso nunca
excede o total pago) antes de virar código.

## Decisões em aberto (a confirmar)

- [ ] **Estorno em pedido enviado** — hoje `enviado` é terminal e o estorno
      acontece fora do domínio; trazer para cá cria um segundo caminho de saída
      e mexe em I2 (afeta T1.1).
