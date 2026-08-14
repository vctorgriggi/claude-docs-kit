# Exemplo 4: /docs:auditar — o relatório de drift, sem escrever nada

Sessão sobre [`fixtures/linkcheck/`](fixtures/linkcheck/) **depois de um mês de
código sem rodada**. Blockquotes em itálico são anotações; o resto é a sessão.

Para reproduzir, aplique estas três mudanças ao fixture antes de rodar — elas
são a premissa do exemplo, não o estado dele no repositório:

1. `src/check.js` ganhou `process.exit(2)` no caminho de diretório inexistente.
2. `src/cli.js` ganhou uma flag `--json`, com um serializador inline.
3. `package.json` passou a exigir `"node": ">=22"`.

Nenhum documento foi tocado. É o cenário normal: o código andou, a rodada não
aconteceu, e ninguém sabe o tamanho do buraco.

---

**Usuário:** `/docs:auditar`

**Agente:** [lê `~/.claude/docs-kit/GRAMATICA.md`; roda
`node ~/.claude/bin/docscheck.mjs --json .`; lê SPEC, PLAN, CLAUDE; amostra
`src/check.js` e `src/cli.js`]

**[CRÍTICO]** `CLAUDE.md:12` — a regra de ouro declara **core puro: `check.js`
não chama `process.exit`**, e `src/check.js:38` chama `process.exit(2)`. Um
agente que ler o contrato vai assumir que pode testar o core sem subprocess, e
a suíte vai morrer no meio.
→ remediação: o `process.exit` volta para `cli.js`, ou a regra de ouro muda
deliberadamente — **e a segunda opção invalida os critérios de aceitação 1 e 3
do SPEC**, que dependem do core devolver dados.

**[CRÍTICO]** `SPEC.md:41` — "Fora do escopo" afirma que o relatório JSON não
existe ("a ferramenta reporta, não edita" e o JSON adiado para o roadmap), e
`src/cli.js` tem `--json` funcionando. O documento afirma algo falso sobre o
presente.
→ remediação: mover para o corpo do SPEC, no presente, e tirar de "Fora do
escopo"; o critério de aceitação do formato precisa de uma linha nova.

**[ALTO]** `CLAUDE.md` §Convenções — o `--json` introduziu um serializador e
nenhuma convenção diz como o erro serializa. A convenção "Erros de uso saem
pela `cli.js` com exit 2" não cobre o caso JSON.
→ remediação: registrar a convenção com `/docs:decidir`, ou na rodada.

**[MÉDIO]** `CLAUDE.md:21` (`A3`) — a tabela de Stack declara `Node ≥ 20`; o
`package.json` exige `>=22`. Um agente vai escolher API pela versão errada.

**[MÉDIO]** `PLAN.md:61` (`A6`) — 41 commits desde a última rodada
(`a1b2c3d`). Acima do limite brando: nada garante que o resto do doc-set ainda
descreva o código.

**[MÉDIO]** `PLAN.md` (`H4`) — a Fase 2 está com todos os checkboxes fechados e
continua no arquivo. Fase concluída sai na rodada que a fecha.

---

**Veredito:** o doc-set está 41 commits atrás do código, com 2 achados críticos
— a regra de ouro é desmentida pelo próprio core, e o SPEC nega uma feature que
existe.

**Remediação, na ordem em que faria sentido:**

1. Decidir o `process.exit` no core: é bug ou é a regra de ouro que mudou? A
   resposta muda o SPEC, não só o CLAUDE. (Só você decide — o código não diz
   qual dos dois foi intenção.)
2. `/docs:rodada json` — move o JSON de "Fora do escopo" para o corpo, fecha a
   Fase 2, corrige a Stack e carimba o marcador novo.
3. A convenção de serialização de erro entra na mesma rodada, ou antes com
   `/docs:decidir`.

Nada disto foi aplicado. `/docs:rodada <nome>` executa com aval;
`/docs:decidir` registra uma decisão isolada.

> _Duas camadas em um relatório. `A3`, `A6` e `H4` vieram do `docscheck` — são
> mecânicas, rodam no CI e não precisam de mim. Os dois CRÍTICOS não: exigem
> ler o código e comparar com a intenção declarada, e nenhum verificador
> mecânico os encontra._

> _E repare no que o comando **não** fez: não consertou o `process.exit`, não
> moveu a seção do SPEC, não escolheu entre "é bug" e "a regra mudou". A
> pergunta 1 é devolvida ao usuário porque o código não prova qual dos dois foi
> intenção — inferir isso seria inventar. `git status` continua limpo depois
> desta sessão, e é o que permite pendurar este comando num hook ou no CI._
