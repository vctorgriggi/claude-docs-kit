# O ciclo completo — uma semana no linkcheck

> O mapa, não o mergulho. As transcrições numeradas mostram **um comando cada**,
> em profundidade; esta mostra **a sequência inteira**, incluindo as partes que
> não são comando: o verificador no terminal e o CI. Cada passo aponta
> para a transcrição que o detalha.

O projeto é [`fixtures/linkcheck/`](fixtures/linkcheck/), no estado em que ele
está no repositório: doc-set de pé, Fase 2 (links externos) aberta com T2.1,
T2.2 e T2.3, e uma decisão pendente no SPEC.

A fundação já aconteceu — é o [exemplo 01](01-modo-a-cli-nova.md) em projeto
novo, ou o [02](02-modo-b-varredura.md) em repositório herdado. `/docs fundar`
é o único comando que não se repete.

---

## Segunda — abrir o repositório

Use a ação `estado` na skill (`$docs estado` no Codex ou `/docs estado` no
Claude Code), ou consulte o verificador diretamente:

```bash
docscheck --estado .
```

No fixture linkcheck, o estado mostra a Fase 2 (links externos), T2.1, T2.2 e
T2.3 abertas, e a decisão sobre o timeout. A consulta não escreve arquivos.
O kit não instala hooks; a mesma consulta funciona com qualquer agente.

## Segunda — pegar a primeira tarefa

```
/docs tarefa T2.1
```

Devolve o briefing: o que fazer e **o que está fora** (T2.2 é a verificação
HTTP; adicionar rede aqui é vazar escopo), a regra de ouro que vale (zero
dependências de runtime), a proibição relevante, e o que prova a tarefa —
os testes vêm primeiro, porque o PLAN declara TDD.

Você implementa na sessão. **O comando não escreveu nada.**

> Detalhe em [03-tarefa-e-decidir](03-tarefa-e-decidir.md), inclusive o caso em
> que o briefing **para** porque a tarefa está travada por decisão em aberto.

## Terça — a decisão que aparece no meio

Implementando T2.2, você precisa do timeout — e é justamente a decisão pendente
do SPEC. Em vez de escolher em silêncio:

```
/docs decidir resolver Timeout padrão dos links externos
```

Você responde 5s. O comando classifica: é uma **convenção de como escrever
código aqui**, então vai para o AGENTS.md com a justificativa na linha. A linha
pendente **sai** do SPEC; a seção passa a declarar "Nenhuma pendente."

> Se fosse uma lei de domínio — "URL sem esquema nunca é externa" — iria para o
> `DOMAIN.md` como invariante `I<n>`, e as tarefas passariam a citá-la por id.

## Quarta — o resto da fase

`/docs tarefa T2.2`, implementa. `/docs tarefa T2.3`, implementa.

Sem lembrar o id: `/docs tarefa` sozinho lista as tarefas abertas da fase e
pergunta qual.

Apareceu uma convenção nova no caminho — o fetcher injetável virou o padrão de
toda borda de rede? `/docs decidir` na hora, não no fim. É barato, e no fim
ninguém lembra.

## Quinta — antes de fechar, o retrato

```
/docs auditar
```

Read-only. Devolve o drift em três severidades e a remediação **proposta**, não
aplicada — `git status` continua limpo depois. É aqui que você descobre se o
SPEC ainda promete como futuro algo que você acabou de implementar.

> Detalhe em [04-auditar](04-auditar.md), com a regra de ouro sendo desmentida
> pelo próprio código e o que o comando devolve ao usuário em vez de inferir.

## Sexta — fechar o marco

```
/docs rodada externos
```

Não é por tarefa, é por **marco**: as três tarefas da Fase 2 fecham juntas.

Antes de editar, a rodada **converte** cada fato pela pergunta *"isto muda como
um agente age daqui em diante?"*. O fetcher injetável muda → vira convenção. O
detalhe de que a T2.2 saiu mais fácil que o esperado não muda → não entra.

O resultado: a Fase 2 **sai do PLAN**, o que ela construiu passa a ser descrito
no SPEC no presente, a Fase 3 ganha detalhe por tarefa, e o marcador é
recarimbado. O PLAN termina a semana **menor** do que começou.

> Detalhe em [05-rodada](05-rodada.md), com a tabela de conversão e o
> tratamento das decisões resolvidas.

## E fora do ciclo

**No CI do projeto**, a cada push:

```
node .github/docscheck.mjs --strict .
```

**Entre projetos**, quando você quer o panorama e não o detalhe:

```
$ docscheck ~/Workspaces/*
linkcheck  ok
monorepo   ok
notas-api  3 violação(ões)
             AGENTS.md:1 [E1] sem blockquote de papel logo abaixo do título (§1)
             AGENTS.md:1 [C1] sem seção "Regra de ouro" (regra 3)
             AGENTS.md:1 [C5] declare "Decisões em aberto" com pendências ou "Nenhuma pendente." (regra 6)
pedidos    ok

resumo: 1 de 4 doc-set(s) com violação
```

Diretório sem doc-set some da lista — a pergunta ali é "quais destes
derivaram", não "todos são doc-set?".

**Quando uma regra acusar e você discordar**, a saída é declarada, não
silenciosa: `<!-- docscheck: ignore A3 — a versão é gerada no build -->`. Sem
motivo na linha, a própria supressão vira violação.

---

## O ciclo em uma tela

| quando | comando | escreve |
| --- | --- | --- |
| uma vez, no início | `/docs fundar` | os documentos |
| ao retomar o projeto | `docs estado` | nada |
| antes de cada tarefa | `/docs tarefa <id>` | nada |
| ao decidir algo | `/docs decidir` | uma linha, um arquivo |
| quando quiser o retrato | `/docs auditar` | nada |
| ao fechar um marco | `/docs rodada <nome>` | os documentos |

Dos seis passos, **três não escrevem nada** e um escreve uma linha. O kit gasta
a maior parte do tempo lendo e propondo — escrever é o gate, não o padrão.
