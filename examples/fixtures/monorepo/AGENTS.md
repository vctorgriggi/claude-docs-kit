# tarifa

> Monorepo de duas peças que calculam e imprimem tarifa de energia: um núcleo
> puro publicado como biblioteca e uma CLI que o consome.

Leia este arquivo no início de toda sessão — ele é o **contrato de como
escrevemos código aqui**, não documentação. Quando uma convenção for decidida
durante a implementação, registre-a aqui ou no recipe do pacote afetado.
Contexto detalhado mora em SPEC.md (o quê e por quê) e PLAN.md (ordem de
execução).

**Fase atual = faixas sazonais.** As duas faixas fixas e a CLI estão de pé; a
publicação no registry é fase posterior e não deve ser antecipada.

## Regra de ouro

**Um pacote só conhece o irmão pelo nome publicado, nunca pelo caminho no
disco.** Tudo abaixo é desdobramento disso. Import relativo atravessando
`packages/` transforma dois pacotes em um só com dois `package.json`, e a
separação deixa de existir no dia em que alguém publica.

## Stack

| Camada    | Tecnologia         |
| --------- | ------------------ |
| Runtime   | Node ≥ 20, ESM     |
| Workspace | npm workspaces     |
| Testes    | node:test          |

## Estrutura

```
packages/
  nucleo/    # cálculo puro; recipe própria em packages/nucleo/AGENTS.md
  cli/       # borda: argv, saída, exit code; recipe em packages/cli/AGENTS.md
docs/
  convencoes-versionamento.md   # como as versões dos dois pacotes andam juntas
```

## Como rodar

```bash
npm test              # toda a suíte, nos dois pacotes
npm run tarifa        # a CLI contra os valores de exemplo
```

## Convenções

- Recipe por pacote: cada `packages/*/AGENTS.md` diz **só o que difere** deste
  arquivo; o que vale para os dois mora aqui, e é referenciado, não copiado.
- Versionamento em lockstep — o porquê e o procedimento estão em
  `docs/convencoes-versionamento.md`.
- Centavos inteiros em toda a fronteira entre pacotes: o núcleo devolve
  inteiro e a CLI formata na hora de imprimir.

## Nunca fazer

- Nunca importar de `../nucleo/src` — o import é `@tarifa/nucleo`, senão o
  pacote deixa de ser publicável sem ninguém notar.
- Nunca colocar regra de cálculo na CLI — o núcleo é o único lugar onde tarifa
  vira número, e é o único que a suíte de cálculo cobre.
- Nunca usar float para dinheiro — 0.1 + 0.2 não fecha conta de luz.
- Nunca subir a versão de um pacote sozinho — o consumidor acaba com uma CLI
  nova falando com um núcleo velho, combinação que o `package.json` aceita e a
  tabela de faixas não (`docs/convencoes-versionamento.md`).

## Gaps conhecidos

1. **G1 — a CLI não valida faixa fora do calendário** — o núcleo lança e a CLI
   deixa o erro subir cru; paliativo: a mensagem do núcleo já é legível.
   Revisitar quando houver usuário fora do time.

## Decisões em aberto

Nenhuma pendente.
