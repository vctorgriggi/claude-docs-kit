---
description: Fecha um marco de implementação. Sincroniza SPEC.md, PLAN.md e CLAUDE.md com o estado real do código, registra as decisões tomadas no caminho e compacta histórico antigo dentro do diff aprovado.
argument-hint: [nome da rodada ou resumo do que foi feito]
# Write/Edit ausentes de propósito: cada escrita passa pelo prompt de permissão
# do harness — um segundo gate além do aval conversacional exigido no passo 2.
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(git tag:*), Bash(git status:*), Bash(git rev-parse:*), Bash(node ~/.claude/bin/docscheck.mjs:*)
disable-model-invocation: true
---

# /rodada

Rodada ou resumo informado (pode estar vazio): $ARGUMENTS

A documentação deste projeto é viva; este comando a realinha com a realidade ao
fim de um marco. Regra absoluta: só entra na documentação o que vier do código,
do histórico do git ou desta conversa.

## 1. Leia o estado

1. Leia CLAUDE.md, SPEC.md e PLAN.md (e ROADMAP e docs/, se existirem).
2. Levante o que mudou desde a última sincronização. Se o fim do PLAN.md (ou
   do CLAUDE.md, quando não há PLAN) tiver o marcador
   `<!-- rodada: <nome> @ <ref> -->`, a janela é determinística:
   `git log <ref>..HEAD --oneline`. Sem marcador, use `git log --oneline`
   desde a última tag ou marco (ou desde a última rodada mencionada nos
   documentos). Consulte diffs quando um commit não se explicar sozinho. Sem
   repositório git, apoie-se apenas no diff de arquivos e nesta conversa, e
   diga isso ao usuário.
3. Monte a lista do que aconteceu e pergunte ao usuário o que dela foi decisão
   deliberada (em oposição a acaso do caminho) e se houve decisões que não
   aparecem no código: cortes, adiamentos, resultados de pesquisa.

## 2. Atualize (com a aprovação do usuário)

- **PLAN.md**: marcar `[x]` as tarefas concluídas; registrar desvios na própria
  tarefa ("feito diferente: <o quê>; motivo: <por quê>"); tarefas cortadas
  permanecem anotadas até a compactação da fase (abaixo); adicionar tarefas
  descobertas na fase correta; atualizar a seção de Riscos se algum se
  materializou ou se dissolveu; se esta rodada fechou uma fase, detalhar as
  tarefas da fase que virou a próxima (rolling wave, regra 9).
- **SPEC.md**: mover o que foi implementado da seção "Planejado" para o corpo,
  reescrito no presente (o SPEC descreve o estado atual); feature removida do
  produto vira uma linha em "Fora do escopo" com o porquê — a guarda contra
  re-propor fica no documento, a cronologia fica no git; atualizar constraints
  e critérios de aceitação se a realidade os mudou; registrar novas exclusões
  de escopo decididas.
- **CLAUDE.md**: registrar convenções novas com a justificativa em poucas
  palavras; resolver decisões em aberto (`[x] ... — resolvido: <como> (rodada
<nome>)`); adicionar dívidas deliberadas ao inventário "Gaps conhecidos", com
  a justificativa e a indicação de onde vive o paliativo; aposentar gap que o
  código desta janela sanou (a entrada sai; o corte aparece no resumo);
  atualizar estrutura, aliases e instruções de execução se mudaram.
- **Compactação e extração** (no mesmo diff, cobertas pelo mesmo aval): fase
  cujos checkboxes fecharam todos em rodadas anteriores colapsa em um resumo
  curto no estilo da Fase 0 do Modo B — objetivo, o que ficou de pé e os
  desvios que ainda ensinam; decisão resolvida em rodada anterior compacta
  para uma linha, sem referência a tarefas já colapsadas; linha que nem
  compactada muda como um agente age é cortada (teste de deleção — o git
  guarda a íntegra); seção de área do CLAUDE.md que passou de ~meia página
  extrai para docs/<tema>.md, com um ponteiro de uma linha no lugar (regra 9).

## 3. Nunca

- Apagar histórico silenciosamente. A compactação (§2) entra no diff proposto
  e passa pelo aval como qualquer edição; fora dela, decisão resolvida
  permanece anotada e tarefa cortada permanece explicada. Reescrever o passado
  para contar outra história, nunca.
- Corrigir código durante a sincronização. Quando doc e código divergem, o
  código é a verdade: atualize o doc (§2); dívida deliberada confirmada entra
  em "Gaps conhecidos" (§2); nunca edite código aqui.
- Registrar intenção que o usuário não confirmou nesta conversa.
- Reescrever seções que não mudaram. Mantenha o diff mínimo.

## 4. Feche

1. **Checagens de entrega nos arquivos tocados.** Se
   `~/.claude/bin/docscheck.mjs` existir, rode
   `node ~/.claude/bin/docscheck.mjs .` e repare cada violação (ou justifique
   em uma linha no resumo). Sem o script, confira manualmente os invariantes
   mecânicos: fronteira presente/futuro intacta no SPEC (com o blockquote de
   reforço); formato das decisões (`- [x] **<decisão>** — resolvido: <como>
(<rodada>)`); rastreabilidade fechada (tarefas → módulos, riscos →
   constraints numeradas, decisões pendentes → tarefas); zero placeholder ou
   "TBD". Em
   qualquer caso, aplique as checagens de julgamento: diff mínimo (seções que
   não mudaram não foram reescritas) e teste de deleção nos trechos novos
   (linha que não muda como um agente age no código é cortada).
2. **Marcador de rodada.** Atualize (ou crie) na última linha do PLAN.md — do
   CLAUDE.md, quando não há PLAN — o marcador
   `<!-- rodada: <nome> @ <ref> -->`, onde `<ref>` é a saída de
   `git rev-parse --short HEAD`; sem repositório git, a data (AAAA-MM-DD). A
   próxima rodada parte dele (§1).
3. Termine com um resumo: o que mudou em cada arquivo (meia linha por mudança)
   e o que continua em aberto. Se a rodada recebeu nome em `$ARGUMENTS`, use
   esse nome nas anotações de resolução; ele é o marcador histórico do marco.
