# PLAN.md

> Plano de execução do pedidos (SPEC.md), fatiado em fases pequenas e
> revisáveis, na ordem que a arquitetura pede: a lei do domínio primeiro, o
> caminho novo depois — cada invariante ganha teste antes do código que o
> sustenta.

## Convenções

- Cada task tem: um id (ex.: T1.1), o módulo responsável (coerente com a
  estrutura do CLAUDE.md), os testes TDD que a definem e os critérios de
  aceitação.
- Tarefa que sustenta uma lei do domínio cita o invariante pelo id `I<n>`
  (regra 10); o teste dela nomeia o mesmo id.
- Detalhe por tarefa: fase corrente e próxima; fases além ficam com objetivo
  e dependências até se aproximarem (regra 11).
- Fase com todos os checkboxes fechados sai deste arquivo na rodada que a
  fecha; o que ela construiu passa a ser descrito no SPEC (regra 2).

A máquina de estados e a aritmética de centavos estão de pé — o comportamento
entregue é o que o SPEC descreve como atual.

## Fase 1 — Reembolso parcial

Objetivo: um pedido pago pode devolver parte do valor sem quebrar I1 nem I2.
Depende de: máquina de estados de pé.

- [ ] T1.1 — invariante do reembolso no DOMAIN antes do código · módulo: estados
  - Testes (primeiro): reembolso maior que o total pago é recusado; soma de
    reembolsos parciais nunca ultrapassa o pago.
  - Aceitação: o invariante novo existe no DOMAIN.md com id, e o SPEC cita ele
    no critério correspondente. Resolve a decisão em aberto sobre estorno em
    pedido enviado (SPEC).
- [ ] T1.2 — estado `reembolsado_parcial` na tabela de transições · módulo: estados
  - Testes (primeiro): `pago → reembolsado_parcial` permitida;
    `reembolsado_parcial → enviado` permitida; `cancelado → reembolsado_parcial`
    recusada (garante I1).
  - Aceitação: nenhuma transição existente muda de comportamento; I2 continua
    valendo para `enviado` e `cancelado`.
- [ ] T1.3 — valor devolvido no cálculo do total · módulo: total
  - Testes (primeiro): o arredondamento continua único e no fim, agora com o
    reembolso na conta (garante I3).
  - Aceitação: o exemplo numérico do DOMAIN continua batendo.

## Fase 2 — Histórico de transições

Objetivo: saber por onde o pedido passou, sem sair da pureza dos módulos.
Depende de: Fase 1 completa.

As tarefas são detalhadas na rodada que fechar a Fase 1 (regra 11).

## Riscos e dependências

- **Reembolso reabre um estado terminal** (SPEC, constraint 2 — funções puras)
  → T1.2 adiciona o estado novo sem tocar `enviado`; plano B: o reembolso vira
  um campo do pedido em vez de um estado.
- **Aritmética com duas fontes de arredondamento** (SPEC, constraint 2) →
  mitigado por T1.3, que mantém o arredondamento único; plano B: expor uma
  função de conciliação e proibir cálculo fora dela.

## Decisões em aberto

Nenhuma pendente.

<!-- rodada: fundacao @ 4f2a9c1 -->
