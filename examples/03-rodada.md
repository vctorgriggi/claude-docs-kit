# Exemplo 3: /rodada — fechar um marco sem apagar história

Continuação do [exemplo 1](01-modo-a-cli-nova.md): a fase-1 do linkcheck foi
implementada e a documentação precisa voltar a refletir o código. O estado
final desta sessão é exatamente [`fixtures/linkcheck/`](fixtures/linkcheck/).
Blockquotes em itálico são anotações; o resto é a sessão.

O valor do `/rodada` só aparece entre dois pontos no tempo: compare o que o
exemplo 1 gerou com o que esta sessão entrega.

---

**Usuário:** `/rodada fase-1`

**Agente:** [lê CLAUDE.md, SPEC.md e PLAN.md; `git log --oneline` desde o
bootstrap]

Commits desde o marco: `t0.1: parser de links`, `t0.2: validação de alvos +
slug`, `t1.1: cli e relatório`, `anchors: valida âncora por slug com NFD`.

O que disso foi decisão deliberada:

1. Âncoras estavam em "Planejado" no SPEC e aparecem implementadas
   (`anchors: ...`) — antecipação deliberada?
2. A normalização NFD no slug: convenção para registrar no CLAUDE.md?
3. Houve corte, adiamento ou decisão que não aparece no código?

> _A rodada não assume: o commit prova o quê, o usuário confirma o porquê.
> Só entra na documentação o que vier do código, do git ou desta conversa._

**Usuário:**

1. sim, ficou barato depois do t0.2
2. sim
3. relatório fica em texto simples, json adiado. e âncora de heading html a
   gente não detecta — deixei assim mesmo, os docs só usam heading markdown

**Agente:** Atualizo, com seu OK:

- **PLAN.md** — T0.1, T0.2 e T1.1 marcadas `[x]`; T1.2 nova, anotada "movida
  do roadmap; saiu barata após T0.2 (rodada fase-1)"; risco novo: falso
  negativo em heading HTML → aponta o gap G1.
- **SPEC.md** — "validação de âncoras" sai de "Planejado" e entra no corpo,
  reescrita no presente; critério de aceitação novo: âncora acentuada válida.
  Com a primeira entrega existindo, o cabeçalho passa a descrever o
  **linkcheck atual** ("o que vamos construir" era verdade até aqui) e a
  seção final vira "Planejado / não implementado (roadmap futuro)".
- **CLAUDE.md** — convenção nova: slug com NFD (com o porquê na linha);
  decisão "formato do relatório" resolvida preservando o histórico; G1 no
  inventário "Gaps conhecidos" com o paliativo dito por você.

**Usuário:** ok

**Agente:** [aplica os diffs. Trechos antes → depois:]

SPEC.md — antes (gerado no exemplo 1):

```
## Planejado / fases posteriores

### Validação de âncoras

Âncoras (`#secao`) comparadas por slug. Critério: âncora com acento válida.
```

SPEC.md — depois:

```
## Funcionalidades
...
- Valida âncoras (`#secao`) por slug: minúsculas, NFD sem diacríticos,
  não-alfanumérico vira hífen — "## Configuração" casa com `#configuracao`.
```

A seção "Planejado" permanece, com HTTP e JSON, renomeada "Planejado / não
implementado (roadmap futuro)"; o blockquote do topo acompanha ("o que vamos
construir" vira "o **linkcheck atual**").

CLAUDE.md — depois:

```
## Decisões em aberto

- [x] Formato do relatório — resolvido: texto simples; JSON adiado para o
      roadmap (rodada fase-1).

Nenhuma pendente.
```

Checagens de entrega nos arquivos tocados: a fronteira presente/futuro
permanece (HTTP e JSON continuam em "Planejado"); rastreabilidade fechada
(T1.2 → módulo check; risco → G1); diff mínimo — seções que não mudaram não
foram reescritas.

Resumo: PLAN com 4 tarefas fechadas, 1 desvio anotado e 1 risco novo; SPEC
com âncoras movidas para o corpo e critério novo; CLAUDE com a convenção de
slug, G1 e a decisão resolvida. Em aberto: nada pendente.

> _Nada foi apagado: a tarefa antecipada carrega o motivo no próprio texto, a
> decisão resolvida mantém o checkbox com o desfecho e a rodada que o selou,
> e a dívida deliberada virou G1 com paliativo — não conserto de código. É a
> durabilidade temporal do kit: o par exemplo 1 → exemplo 3 prova que a
> documentação acompanha o código sem perder a história._
