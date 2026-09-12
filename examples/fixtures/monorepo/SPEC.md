# SPEC.md

> Descreve o **tarifa atual** — núcleo de cálculo e CLI, publicados como dois
> pacotes de um monorepo. O que foi planejado mas ainda não implementado está
> na seção final "Planejado / não implementado (roadmap futuro)" — nada nela
> deve ser lido como já existente.

## Problema

Conta de luz é calculada com faixas que mudam por época do ano, e cada time que
precisa do número reimplementa as faixas na própria linguagem. A divergência só
aparece na fatura do cliente. O tarifa isola o cálculo num pacote testado e
entrega uma CLI para conferência manual, de modo que quem integra consome a
biblioteca em vez de copiar a tabela.

## Usuários

- **Time de faturamento** — consome `@tarifa/nucleo` no próprio serviço.
- **Suporte** — roda a CLI para conferir uma fatura contestada.

## Funcionalidades

### Essenciais

**Cálculo**

- Faixas fixas: até 100 kWh e acima de 100 kWh, com valores por faixa.
- Entrada e saída em centavos inteiros; fração é recusada com erro.
- A CLI recebe o consumo em kWh e imprime o valor formatado.
- Exit code: 0 no cálculo; 2 em erro de uso.

### Fora do escopo

- Impostos estaduais — variam por unidade federativa e exigem uma tabela que
  ninguém no time mantém.
- Histórico de faturas: o tarifa calcula um valor, não guarda nada.

## Módulos

Dois pacotes com uma fronteira publicada: `nucleo` (cálculo puro, sem I/O) e
`cli` (argv, formatação, exit code). A fronteira é o nome do pacote, não o
caminho — a regra de ouro do CLAUDE.md.

## Stack

- **Node, ESM, npm workspaces** — stdlib apenas; testes com `node:test`. As
  versões mínimas vivem na tabela de Stack do CLAUDE.md.

## Constraints técnicas

1. **Zero dependências de runtime** — quem integra o núcleo não herda árvore
   de dependência nenhuma.
2. **Os dois pacotes versionam juntos** — o procedimento está em
   `docs/convencoes-versionamento.md`.

## Critérios de aceitação

1. Consumo de 80 kWh → valor da faixa baixa, em centavos inteiros.
2. Consumo de 250 kWh → soma das duas faixas, sem arredondamento intermediário.
3. Consumo fracionário → erro, e a CLI sai com código 2.

## Planejado / não implementado (roadmap futuro)

> O que está abaixo é **planejado** e não faz parte do produto atual. A
> arquitetura já acomoda: faixa nova é uma entrada na tabela do núcleo.

### Faixas sazonais

Faixa de bandeira tarifária que muda por mês. Critério: o mês entra como
parâmetro e a faixa vigente é escolhida sem tocar a CLI.

### Publicação no registry

Os dois pacotes publicados sob o escopo `@tarifa`. Critério: instalar o núcleo
num projeto vazio e calcular, sem o monorepo.

## Decisões em aberto (a confirmar)

- [ ] **Escopo público ou registry interno** — público simplifica o consumo e
      expõe a tabela de faixas; sem decisão de negócio ainda (afeta T2.2).
