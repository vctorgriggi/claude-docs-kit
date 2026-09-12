# PLAN.md

> Plano de execução do <projeto> (SPEC.md), fatiado em fases pequenas e
> revisáveis, na ordem que a arquitetura pede: <a justificativa da ordem; por
> exemplo: "lógica pura testada primeiro, UI com dados mockados depois, e por
> último as bordas frágeis, uma de cada vez">.

## Convenções

- Cada task tem: um id (ex.: T2.1), o módulo responsável (coerente com a
  estrutura do AGENTS.md), <"os testes TDD que a definem" | "a verificação que
  a define"> e os critérios de aceitação.
- Uma fase só começa quando todos os checkboxes da anterior estão marcados,
  exceto fases marcadas como opcionais, que podem ser puladas.
- Detalhe por tarefa: fase corrente e próxima; fases além ficam com objetivo
  e dependências até se aproximarem (regra 11).
- <Regras transversais do projeto: "toda borda entra atrás de um protocolo
  mockável", "i18n é fundação transversal", etc.>
- Desvio de execução não vira nota permanente: ou ensinou uma convenção — e
  ela vai para o AGENTS.md — ou sai junto com a fase (regra 2).
- Fase com todos os checkboxes fechados sai deste arquivo na rodada que a
  fecha; o que ela construiu passa a ser descrito no SPEC, no presente.

<Em projeto existente, uma linha antes da primeira fase basta para orientar:
"O core e a CLI estão de pé; o comportamento entregue é o que o SPEC descreve
como atual." O que já foi construído não vira fase de tarefas marcadas
`[x]` (regra 2).>

## Fase <n> — <nome da fase corrente>

Objetivo: <o que fica de pé no fim da fase>.
Depende de: <nada | o que já está de pé>.

- [ ] T<n>.1 — <tarefa> · módulo: <módulo>
  - <Testes (primeiro) | Verificação>: <o que prova a tarefa>.
  - Aceitação: <estado observável ao concluir>.
- [ ] T<n>.2 — ...

## Fase <n+1> — <nome da próxima>

Objetivo: <...>.
Depende de: Fase <n> completa.

- [ ] T<n+1>.1 — ...

## Fase <n+2> — <nome>

Objetivo: <...>.
Depende de: Fase <n+1> completa.

<Fase além da próxima: só objetivo e dependências; as tarefas são detalhadas
na rodada que fechar a Fase <n+1> (regra 11).>

## Riscos e dependências

- **<risco>** (SPEC, constraint <n>) → <fase e tarefas que o mitigam, e o plano B>.

## Decisões em aberto

- [ ] **<decisão>** — afeta T<x.y>.
<Resolvida, a linha sai e o plano passa a refletir a decisão diretamente
(regra 7).>
