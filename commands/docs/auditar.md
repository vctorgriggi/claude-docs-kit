---
description: Confere a documentação-de-agente contra o código sem tocar em nada. Roda o docscheck, soma o drift que só julgamento pega e devolve um relatório classificado com a remediação proposta.
argument-hint: [área ou arquivo para focar, opcional]
# Nem Write nem Edit: este comando é read-only por contrato, não por omissão.
# É o que permite rodá-lo em qualquer momento, inclusive em CI, sem risco.
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git rev-parse:*), Bash(ls:*), Bash(tree:*), Bash(cat:*), Bash(head:*), Bash(wc:*), Bash(node ~/.claude/bin/docscheck.mjs:*)
disable-model-invocation: true
---

# /docs:auditar

Foco pedido (pode estar vazio): $ARGUMENTS

Diz se a documentação ainda descreve o repositório. **Não escreve nada** — nem
documento, nem código. A remediação é proposta, nunca aplicada: quem aplica é
`/docs:rodada`, com aval.

Rode isto quando quiser saber onde o doc-set está antes de decidir o que fazer:
antes de abrir uma rodada, ao voltar a um projeto parado, ao herdar um
repositório, ou periodicamente no CI.

## 0. Carregue a gramática

Leia `~/.claude/docs-kit/GRAMATICA.md` (expanda `~`; `Read` exige caminho
absoluto). Ausente: **pare** e diga que `./install.sh` no repositório do kit
resolve.

## 1. Camada mecânica

Rode `node ~/.claude/bin/docscheck.mjs --json .` e use a saída como base do
relatório — não reimplemente as checagens dele à mão e não parafraseie as
mensagens. Cada achado traz `id`, `arquivo`, `linha`, `severidade` e `msg`;
`--explain <id>` dá o porquê e os exemplos quando você precisar explicar um
achado ao usuário.

Sem o script instalado, diga isso em uma linha e siga só com a camada de
julgamento, avisando que a cobertura está reduzida.

## 2. Camada de julgamento

O que o `docscheck` não alcança, porque exige ler o código e comparar com a
intenção declarada. Investigue nesta ordem, sempre com evidência:

1. **O SPEC promete o que o código faz?** Funcionalidade descrita como atual
   que não existe no código; comportamento que existe e o SPEC não menciona;
   critério de aceitação que o código já não satisfaz.
2. **A seção "Planejado" ainda é futuro?** Item planejado que já foi
   implementado e ficou lá — a fronteira da regra 1 só funciona se estiver
   correta nos dois sentidos.
3. **A regra de ouro é obedecida?** Procure a violação mais cara: o
   `process.exit` no core puro, o segredo fora da borda, o tipo externo
   vazando. Uma regra de ouro que o código desmente é pior que nenhuma.
4. **As convenções do CLAUDE.md descrevem o código real?** Amostre 3 a 5
   arquivos por área e confira. Convenção que o código abandonou é ruído que
   o agente vai obedecer contra o repositório.
5. **Os gaps conhecidos ainda existem?** Gap sanado pelo código e não
   aposentado engana tanto quanto gap não registrado.
6. **O PLAN reflete o que está feito?** Tarefa concluída sem `[x]`, fase
   fechada que não saiu, tarefa viva que ninguém mais vai fazer.

Regra absoluta, herdada da varredura: **intenção não se infere**. Divergência é
fato observável; a razão dela é pergunta para o usuário, não dedução sua.
Quando duas fontes discordam, o comportamento que o código executa vence a
declaração — e a divergência entra como achado, nunca resolvida em silêncio.

## 3. Relatório

Uma mensagem, achados classificados por consequência — não por arquivo, não
por ordem de descoberta:

- **CRÍTICO** — o documento afirma algo falso sobre o presente. Um agente que
  ler isto vai agir errado: regra de ouro desmentida pelo código, feature
  planejada descrita como existente, comando de execução que não funciona,
  convenção que o código abandonou.
- **ALTO** — o documento está incompleto de um jeito que custa: convenção real
  não registrada, gap sanado ainda listado, decisão resolvida que ninguém
  converteu, fase fechada ainda no PLAN.
- **MÉDIO** — acúmulo e forma: cronologia, volume, jurisdição, ponteiro morto,
  rastreabilidade frouxa.

Cada achado em uma linha, no formato:

```
[CRÍTICO] CLAUDE.md:12 (C2) — a regra de ouro diz "core puro" e src/check.js
          chama process.exit em 3 lugares → remediação: …
```

Feche com:

1. **Veredito em uma frase.** "O doc-set descreve o repositório" ou "o doc-set
   está N commits atrás do código, com M achados críticos".
2. **A remediação como plano**, na ordem em que faria sentido executar — e a
   frase que a entrega: "Nada disto foi aplicado. `/docs:rodada <nome>` executa
   com aval; `/docs:decidir` registra uma decisão isolada."
3. Se não houver achado nenhum, diga isso em uma linha e pare. Relatório
   inflado para parecer útil é o oposto do que este comando serve.
