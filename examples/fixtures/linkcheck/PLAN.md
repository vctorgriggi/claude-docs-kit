# PLAN.md

> Plano de execução do linkcheck (SPEC.md), fatiado em fases pequenas e
> revisáveis, na ordem que a arquitetura pede: lógica pura testada primeiro,
> borda de CLI por último.

## Convenções

- Cada task tem: um id (ex.: T0.1), o módulo responsável (coerente com a
  estrutura do CLAUDE.md), os testes TDD que a definem e os critérios de
  aceitação.
- Uma fase só começa quando todos os checkboxes da anterior estão marcados.
- Desvios são registrados na própria tarefa: o que mudou e por quê.

## Fase 0 — Fundação (core puro)

Objetivo: extração e validação de links testadas, sem CLI.
Depende de: nada.

- [x] T0.1 — extração de links de markdown · módulo: check
  - Testes (primeiro): link inline, link com âncora, link dentro de bloco de
    código é ignorado.
  - Aceitação: função pura devolve lista `{alvo, linha}`.
- [x] T0.2 — resolução e validação de alvos internos · módulo: check
  - Testes: arquivo existente e inexistente; âncora por slug com acento.
  - Desvio: normalização NFD adicionada ao slug — âncoras acentuadas falhavam
    sem ela (convenção registrada no CLAUDE.md).
  - Aceitação: critérios 1 e 2 do SPEC cobertos por teste.

## Fase 1 — CLI

Objetivo: comando utilizável em CI.
Depende de: Fase 0 completa.

- [x] T1.1 — cli com argumento de diretório e relatório · módulo: cli
  - Verificação: rodar contra diretório com 1 quebra → exit 1 e a linha certa.
  - Aceitação: critérios 1 e 3 do SPEC observáveis no terminal.
- [x] T1.2 — validação de âncoras no relatório · módulo: check
  - Desvio: movida do roadmap; saiu barata após T0.2 (rodada fase-1).
  - Aceitação: critério 2 do SPEC.

## Riscos e dependências

- **Falso negativo em âncora de heading HTML inline** (SPEC, constraint 1 —
  sem parser HTML na stdlib) → aceito como gap conhecido G1 (CLAUDE.md);
  plano B: parser mínimo de heading em fase futura, se aparecer caso real.

## Decisões em aberto

- [x] **Formato do relatório** — resolvido: texto simples; JSON vira item de
      roadmap (rodada fase-1).

<!-- rodada: fase-1 @ b7e4d21 -->
