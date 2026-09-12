# Exemplo 5: /docs rodada — fechar um marco convertendo, não acumulando

Continuação do [exemplo 1](01-modo-a-cli-nova.md): a fase-1 do linkcheck foi
implementada e a documentação precisa voltar a refletir o código. O estado
final desta sessão é exatamente [`fixtures/linkcheck/`](fixtures/linkcheck/).
Blockquotes em itálico são anotações; o resto é a sessão.

O valor do `/docs rodada` só aparece entre dois pontos no tempo: compare o que
o exemplo 1 gerou com o que esta sessão entrega — e repare no que **sai** dos
arquivos, não só no que entra.

---

**Usuário:** `/docs rodada fase-1`

**Agente:** [lê `$DOCS_KIT/grammar/GRAMATICA.md`; roda
`node "$DOCS_KIT/bin/docscheck.mjs" --json .`; lê AGENTS.md, SPEC.md e PLAN.md]

O PLAN não tem marcador de rodada — esta é a primeira. Janela levantada com
`git log --oneline` desde o commit inicial; a partir daqui ela passa a ser
determinística, porque o fecho desta sessão carimba o marcador.

> _O marcador é carimbado pelo `/docs rodada`, não pelo `/docs fundar`: só
> existe marco depois que houve implementação para fechar._

Commits na janela: `t0.1: parser de links`, `t0.2: validação de alvos + slug`,
`t1.1: cli e relatório`, `anchors: valida âncora por slug com NFD`.

O `docscheck` acusa 2 avisos, os dois `H4`: as fases 0 e 1 vão terminar esta
rodada com todos os checkboxes fechados.

Cobertura — janela: 4 commits desde o commit inicial · tarefas fechadas: T0.1,
T0.2, T1.1 · fases fechadas: 0 e 1 · decisões a converter: 1 · drift crítico:
nenhum · não determinável: por que as âncoras foram antecipadas.

O que preciso que você confirme:

1. Âncoras estavam em "Planejado" no SPEC e aparecem implementadas
   (`anchors: ...`) — antecipação deliberada?
2. A normalização NFD no slug: convenção para registrar no AGENTS.md?
3. Houve corte, adiamento ou decisão que não aparece no código?

> _A rodada não assume: o commit prova o quê, o usuário confirma o porquê. Só
> entra na documentação o que vier do código, do git ou desta conversa._

**Usuário:**

1. sim, ficou barato depois do t0.2
2. sim
3. relatório fica em texto simples, json adiado. e âncora de heading html a
   gente não detecta — deixei assim mesmo, os docs só usam heading markdown

**Agente:** Antes de editar, converto cada fato pela pergunta "isto muda como
um agente age daqui em diante?":

| fato | muda? | vira |
| --- | --- | --- |
| slug precisa de NFD | sim | convenção no AGENTS.md, com o porquê na linha |
| heading HTML não é detectado | sim | gap G1, com o paliativo que você disse |
| relatório é texto simples; JSON adiado | sim | convenção no AGENTS.md + "Fora do escopo" no SPEC |
| âncoras saíram baratas depois do T0.2 | **não** | nada — não muda nenhuma decisão futura |
| fases 0 e 1 fecharam | **não** | nada; o que elas construíram já está no SPEC |

> _As duas últimas linhas são a diferença entre esta rodada e um changelog. "Saiu
> barata depois do T0.2" é verdade e é irrelevante: nenhuma sessão futura age
> diferente por saber disso. Sai — o git guarda._

Atualizo, com seu OK:

- **SPEC.md** — "validação de âncoras" sai de "Planejado" e entra no corpo, no
  presente; critério de aceitação novo (âncora acentuada válida); JSON entra em
  "Fora do escopo" com o porquê, que é a guarda contra re-propor. Com a
  primeira entrega existindo, o cabeçalho passa a descrever o **linkcheck
  atual** e a seção final vira "Planejado / não implementado (roadmap futuro)".
- **PLAN.md** — as fases 0 e 1 **saem do arquivo**, substituídas por uma linha
  de orientação; a Fase 2 (links externos) ganha detalhe por tarefa, porque
  virou a corrente (rolling wave).
- **AGENTS.md** — convenção do slug; convenção do formato de relatório; G1 em
  "Gaps conhecidos"; a decisão "Formato do relatório" **sai** da lista de
  pendentes, e a seção passa a declarar "Nenhuma pendente."

**Usuário:** ok

**Agente:** [aplica os diffs. Trechos antes → depois:]

SPEC.md — antes (gerado no exemplo 1):

```
## Planejado / fases posteriores

### Validação de âncoras

Âncoras (`#secao`) comparadas por slug. Critério: âncora com acento válida.
```

SPEC.md — depois, no corpo:

```
- Valida âncoras (`#secao`) por slug: minúsculas, NFD sem diacríticos,
  não-alfanumérico vira hífen — "## Configuração" casa com `#configuracao`.
```

PLAN.md — antes: duas fases com quatro tarefas `[x]` e uma nota de desvio.
Depois, tudo isso substituído por:

```
O core puro e a borda de CLI estão de pé — o comportamento entregue é o que o
SPEC descreve como atual.

## Fase 2 — Links externos (HTTP)
...
```

AGENTS.md — a decisão resolvida não vira `[x]`; ela vira o que produziu:

```
## Convenções
...
- Relatório: texto simples é a única saída; formato alternativo entra apenas
  com consumidor real (uma saída só mantém o core sem formatador).

## Decisões em aberto

Nenhuma pendente.
```

> _Aqui está o corte com a v4. Antes, esta seção guardaria
> `- [x] **Formato do relatório** — resolvido: texto simples (rodada fase-1)`
> para sempre. O que muda o comportamento de um agente é a convenção; o
> registro de que houve uma decisão, não. Se ela reaparecer numa conversa, o
> `git log` responde._

Checagens de entrega: `docscheck` limpo, inclusive `--strict` (os dois avisos `H4`
foram tratados, não silenciados); a fronteira presente/futuro permanece
(HTTP e JSON continuam em "Planejado"); rastreabilidade fechada (T2.1–T2.3 →
módulos check e cli; riscos → constraint 1); diff mínimo.

Marcador carimbado no fim do PLAN.md: `<!-- rodada: fase-1 @ a1b2c3d -->` — a
próxima rodada levanta as mudanças com `git log a1b2c3d..HEAD`, sem adivinhar
o último marco.

Resumo:

- **SPEC** — âncoras movidas para o corpo; critério novo; JSON em "Fora do
  escopo".
- **PLAN** — fases 0 e 1 removidas (4 tarefas fechadas); Fase 2 detalhada;
  risco de rede na suíte adicionado.
- **AGENTS** — 2 convenções novas; G1 registrado.
- **Decisão resolvida** — "Formato do relatório" → convenção em
  AGENTS §Convenções + exclusão em SPEC §Fora do escopo.
- **Saiu** — 2 fases concluídas e 1 nota de desvio.
- Em aberto: nada pendente.

> _O resumo é onde a história é contada — e é por isso que ela não precisa
> ficar nos arquivos. O par exemplo 1 → exemplo 5 mostra a documentação
> acompanhando o código sem engordar: o PLAN terminou a rodada **menor** do que
> começou, com mais trabalho descrito à frente._
