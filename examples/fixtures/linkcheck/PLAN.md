# PLAN.md

> Plano de execução do linkcheck (SPEC.md), fatiado em fases pequenas e
> revisáveis, na ordem que a arquitetura pede: lógica pura testada primeiro,
> borda de CLI depois, bordas frágeis por último — uma de cada vez.

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

O core puro e a borda de CLI estão de pé — o comportamento entregue é o que o
SPEC descreve como atual.

## Fase 2 — Links externos (HTTP)

Objetivo: validar URLs http(s) sem tornar a suíte dependente de rede.
Depende de: core e CLI de pé.

- [ ] T2.1 — coletor de URLs externas separado do validador interno · módulo: check
  - Testes (primeiro): link http e https entram no coletor; link relativo e
    âncora pura (`#secao`) não entram.
  - Aceitação: função pura devolve `{url, arquivo, linha}` sem tocar a rede.
- [ ] T2.2 — verificação HTTP atrás de um fetcher injetável · módulo: check
  - Testes (primeiro): 200 passa; 404 entra no relatório; timeout e erro de
    rede viram aviso e não mudam o exit code.
  - Aceitação: a suíte roda offline com o fetcher mockado; nenhum teste
    unitário abre socket.
- [ ] T2.3 — flag `--externos` e linha de aviso no relatório · módulo: cli
  - Verificação: rodar contra um fixture com uma URL 404 → a URL aparece
    listada; sem a flag, nenhuma requisição é feita.
  - Aceitação: o default segue offline — o critério 3 do SPEC não muda de
    comportamento nem de tempo.

## Fase 3 — Relatório JSON

Objetivo: saída parseável para outras ferramentas.
Depende de: Fase 2 completa.

As tarefas são detalhadas na rodada que fechar a Fase 2 (regra 11).

## Riscos e dependências

- **Falso negativo em âncora de heading HTML inline** (SPEC, constraint 1 —
  sem parser HTML na stdlib) → aceito como gap conhecido G1 (AGENTS.md);
  plano B: parser mínimo de heading, se aparecer caso real.
- **Rede dentro da suíte de testes** (SPEC, constraint 1) → mitigado por T2.2,
  que injeta o fetcher; plano B: a verificação HTTP vira smoke manual.

## Decisões em aberto

Nenhuma pendente.

<!-- rodada: fase-1 @ a1b2c3d -->
