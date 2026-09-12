# PLAN.md

> Plano de execução do tarifa (SPEC.md), fatiado em fases pequenas e revisáveis,
> na ordem que a arquitetura pede: cálculo puro testado primeiro, borda de CLI
> depois, publicação por último.

## Convenções

- Cada task tem: um id (ex.: T2.1), o módulo responsável (coerente com a
  estrutura do AGENTS.md), os testes TDD que a definem e os critérios de
  aceitação.
- Uma fase só começa quando todos os checkboxes da anterior estão marcados.
- Detalhe por tarefa: fase corrente e próxima; fases além ficam com objetivo
  e dependências até se aproximarem (regra 11).
- Fase com todos os checkboxes fechados sai deste arquivo na rodada que a
  fecha; o que ela construiu passa a ser descrito no SPEC, no presente
  (regra 2).

O núcleo com as faixas fixas e a CLI estão de pé — o comportamento entregue é o
que o SPEC descreve como atual.

## Fase 2 — Faixas sazonais

Objetivo: escolher a faixa vigente pelo mês sem que a CLI saiba que faixas
existem.
Depende de: núcleo e CLI de pé.

- [ ] T2.1 — tabela de faixas indexada por mês · módulo: nucleo
  - Testes (primeiro): mês dentro da bandeira usa a faixa sazonal; mês fora
    cai na faixa fixa; mês inválido lança.
  - Aceitação: função pura, sem data do sistema — o mês entra por parâmetro.
- [ ] T2.2 — a CLI passa o mês e não decide faixa · módulo: cli
  - Testes (primeiro): sem o argumento, usa a faixa fixa; com o argumento,
    delega ao núcleo sem ramificar por faixa.
  - Aceitação: nenhuma menção a nome de faixa no código da CLI.

## Fase 3 — Publicação no registry

Objetivo: os dois pacotes instaláveis fora do monorepo.
Depende de: Fase 2 completa, e da decisão de escopo em aberto no SPEC.

As tarefas são detalhadas na rodada que fechar a Fase 2 (regra 11).

## Riscos e dependências

- **Import relativo atravessando pacotes** (AGENTS.md, regra de ouro) → hoje
  nada mecânico impede; plano B: checagem de import no CI antes da Fase 3.
- **Divergência de versão entre os dois pacotes** (SPEC, constraint 2) →
  mitigado pelo lockstep descrito em `docs/convencoes-versionamento.md`.

## Decisões em aberto

Nenhuma pendente.

<!-- rodada: faixas-fixas @ b2c3d4e -->
