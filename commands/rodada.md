---
description: Fecha um marco de implementação. Sincroniza SPEC.md, PLAN.md e CLAUDE.md com o estado real do código e registra as decisões tomadas no caminho.
argument-hint: [nome da rodada ou resumo do que foi feito]
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(git tag:*), Bash(git status:*)
disable-model-invocation: true
---

# /rodada

Rodada ou resumo informado (pode estar vazio): $ARGUMENTS

A documentação deste projeto é viva; este comando a realinha com a realidade ao
fim de um marco. Regra absoluta: só entra na documentação o que vier do código,
do histórico do git ou desta conversa.

## 1. Leia o estado

1. Leia CLAUDE.md, SPEC.md e PLAN.md (e ROADMAP e docs/, se existirem).
2. Levante o que mudou desde a última sincronização: `git log --oneline` desde
   a última tag ou marco (ou desde a última rodada mencionada nos documentos);
   consulte diffs quando um commit não se explicar sozinho.
3. Monte a lista do que aconteceu e pergunte ao usuário o que dela foi decisão
   deliberada (em oposição a acaso do caminho) e se houve decisões que não
   aparecem no código: cortes, adiamentos, resultados de pesquisa.

## 2. Atualize (com a aprovação do usuário)

- **PLAN.md**: marcar `[x]` as tarefas concluídas; registrar desvios na própria
  tarefa ("feito diferente: <o quê>; motivo: <por quê>"); tarefas cortadas
  permanecem no documento, anotadas, nunca apagadas; adicionar tarefas
  descobertas na fase correta; atualizar a seção de Riscos se algum se
  materializou ou se dissolveu.
- **SPEC.md**: mover o que foi implementado da seção "Planejado" para o corpo,
  reescrito no presente (o SPEC descreve o estado atual); atualizar constraints
  e critérios de aceitação se a realidade os mudou; registrar novas exclusões
  de escopo decididas.
- **CLAUDE.md**: registrar convenções novas com a justificativa em poucas
  palavras; resolver decisões em aberto (`[x] ... — resolvido: <como> (rodada
<nome>)`); adicionar dívidas deliberadas ao inventário "Gaps conhecidos", com
  a justificativa e a indicação de onde vive o paliativo; atualizar estrutura,
  aliases e instruções de execução se mudaram.

## 3. Nunca

- Apagar histórico. Decisão resolvida permanece, anotada; tarefa cortada
  permanece, explicada.
- Corrigir código durante a sincronização. Gap encontrado vai para o
  inventário, não para o editor.
- Registrar intenção que o usuário não confirmou nesta conversa.
- Reescrever seções que não mudaram. Mantenha o diff mínimo.

## 4. Feche

Termine com um resumo: o que mudou em cada arquivo (meia linha por mudança) e o
que continua em aberto. Se a rodada recebeu nome em `$ARGUMENTS`, use esse nome
nas anotações de resolução; ele é o marcador histórico do marco.
