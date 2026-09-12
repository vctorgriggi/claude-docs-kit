# docs rodada

A documentação deste projeto é viva; este comando a realinha com a realidade ao
fim de um marco. Regra absoluta: só entra na documentação o que vier do código,
do histórico do git ou desta conversa.

## 0. Carregue a gramática

Leia `$DOCS_KIT/grammar/GRAMATICA.md` antes de tocar em qualquer documento. Ela é o
texto normativo — papéis dos arquivos, regras invioláveis, registro do
interlocutor, marcador de rodada e os invariantes mecânicos. Ausente: **pare**
e informe que a instalação está incompleta; restaure a gramática no diretório da skill.

As checagens do §5 combinam o verificador e os critérios de julgamento da
gramática.

## 1. Leia o estado

1. **Levante o drift como `docs auditar` levanta** — as duas camadas, mecânica
   e de julgamento. Se `$DOCS_KIT/bin/docscheck.mjs` existir, comece por
   `node "$DOCS_KIT/bin/docscheck.mjs" --json .`; depois confira o que só
   julgamento pega: o SPEC promete o que o código faz, a seção "Planejado"
   ainda é futuro, a regra de ouro é obedecida, as convenções descrevem o
   código real, os gaps conhecidos ainda existem. Sem isso, a rodada
   sincroniza só o que o usuário lembrar de contar.
2. Leia AGENTS.md, SPEC.md e PLAN.md (e DOMAIN, ROADMAP e docs/, se existirem).
   Classifique cada divergência antes de propor edição: **documento
   desatualizado**, **bug de implementação** ou **mudança deliberada de
   requisito**. Na primeira, atualize a descrição com evidência; na segunda,
   preserve o contrato e registre o desvio e a correção necessária; na terceira,
   altere o requisito somente com decisão explícita do usuário. Sem evidência,
   mantenha a questão aberta. Não rebaixe critérios para fazer o código passar.
3. Levante o que mudou desde a última sincronização. Se o fim do PLAN.md (ou
   do AGENTS.md, quando não há PLAN) tiver o marcador
   `<!-- rodada: <nome> @ <ref> -->`, a janela é determinística:
   `git log <ref>..HEAD --oneline`. Sem marcador, use `git log --oneline`
   desde a última tag ou marco (ou desde a última rodada mencionada nos
   documentos). Confira também `git status --short`, `git diff` e
   `git diff --cached` para incluir mudanças ainda não commitadas; identifique-as
   separadamente da janela de commits. Consulte diffs quando um commit não se
   explicar sozinho. Sem repositório git, apoie-se apenas no diff de arquivos e nesta conversa, e
   diga isso ao usuário.
4. Monte a lista do que aconteceu e pergunte ao usuário o que dela foi decisão
   deliberada (em oposição a acaso do caminho) e se houve decisões que não
   aparecem no código: cortes, adiamentos, resultados de pesquisa.

**Ledger de cobertura.** Antes de propor qualquer edição, feche a leitura com
uma linha: "Cobertura — janela: `<ref>..HEAD`, N commits · tarefas fechadas:
<quais> · fases fechadas: <quais> · decisões a converter: <quantas> · drift
crítico: <o quê | nenhum> · não determinável: <o quê>". Item vazio que
deveria estar preenchido é pergunta ao usuário, não silêncio: a entrevista do
`docs fundar` tem esse rigor e a sincronização precisa do mesmo, porque é ela
que roda toda semana.

## 2. Converta antes de escrever

Toda rodada produz fatos novos: uma decisão foi tomada, uma fase fechou, um
desvio aconteceu, um gap foi sanado. A pergunta que governa cada um deles é
sempre a mesma, e vem antes de qualquer edição:

> **Isto muda como um agente age no código daqui em diante?**

- **Muda** → converta no artefato que carrega essa mudança, escrito no
  presente, sem cronologia de registro: uma **convenção** no AGENTS.md com a justificativa na
  linha; uma **proibição** em "Nunca fazer"; um **gap conhecido** com o
  paliativo e onde ele vive; uma linha em **"Fora do escopo"** do SPEC quando
  o caminho foi rejeitado e alguém pode re-propor.
- **Não muda** → não entra. O git guarda a íntegra e o marcador de rodada dá o
  eixo do tempo; o documento não precisa contar a história de novo (regra 2).

Nenhuma conversão inventa: só entra o que veio do código, do git ou desta
conversa.

## 3. Atualize (com a aprovação do usuário)

- **PLAN.md**: marcar `[x]` as tarefas concluídas; adicionar tarefas
  descobertas na fase correta; atualizar a seção de Riscos se algum se
  materializou ou se dissolveu. **Fase que fechou nesta rodada sai do
  arquivo** — o que ela construiu passa a ser descrito no SPEC, no presente
  (regra 2); no lugar dela fica, no máximo, uma linha de orientação sobre o
  que está de pé. Fechada uma fase, detalhe as tarefas da que virou a próxima
  (rolling wave, regra 11). Desvio de execução não vira nota permanente na
  tarefa: ou ensinou uma convenção — e ela vai para o AGENTS.md (§2) — ou sai
  junto com a fase.
- **SPEC.md**: mover o que foi implementado da seção "Planejado" para o corpo,
  reescrito no presente (o SPEC descreve o estado atual); feature removida do
  produto vira uma linha em "Fora do escopo" com o porquê — a guarda contra
  re-propor fica no documento, a cronologia fica no git; atualizar constraints
  e critérios de aceitação apenas quando houver mudança deliberada aprovada.
  Se o código descumpre um requisito vigente, registre o desvio sem removê-lo.
- **AGENTS.md**: registrar as convenções e proibições que saíram da conversão
  (§2), cada uma com a justificativa em poucas palavras; adicionar dívidas
  deliberadas a "Gaps conhecidos", com o paliativo e onde ele vive; aposentar
  gap que o código desta janela sanou (a entrada sai; o corte aparece no
  resumo); atualizar estrutura, aliases e instruções de execução se mudaram.
- **Decisões resolvidas**: a linha `- [ ] **<decisão>** — …` **sai** do
  arquivo e o produto dela entra (regra 7). No mesmo diff, para o usuário ver
  a troca; e nomeada no resumo do §5. Não marque `[x]` e siga: `[x]` parado no
  arquivo é rodada que não terminou o trabalho.
- **Jurisdição** (regra 8): ao escrever, confira que o fato está indo para o
  arquivo dono dele. Stack com versão é do AGENTS.md; critério de aceitação é
  do SPEC; a árvore de pastas é do AGENTS.md; a decisão mora em um arquivo só.
  Se o fato já existe em outro lugar, o certo é remover a cópia, não sincronizar
  as duas.
- **Extração** (regra 11): seção de área do AGENTS.md que passou de ~meia
  página vai para `docs/<tema>.md`, deixando um ponteiro de uma linha.

## 4. Nunca

- Apagar histórico silenciosamente. As remoções do §3 entram no diff proposto
  e passam pelo aval como qualquer edição, e o resumo do §5 as nomeia. O que
  não se faz é remover fora do diff — ou reescrever o passado para contar
  outra história.
- Manter história por precaução. Se a linha não muda como um agente age, ela
  não fica "por via das dúvidas": o git guarda a íntegra (regra 2).
- Corrigir código durante a sincronização. Classifique a divergência conforme
  o §1; preserve requisitos vigentes e encaminhe bugs para correção fora deste
  comando. Dívida deliberada confirmada entra em "Gaps conhecidos".
- Registrar intenção que o usuário não confirmou nesta conversa.
- Reescrever seções que não mudaram. Mantenha o diff mínimo.
- **Resolver conflito de fonte em silêncio.** Quando duas fontes que deveriam
  concordar divergem — o manifest declara um alias que a árvore não tem, duas
  áreas adotaram convenções opostas, o SPEC promete o que o código não faz —
  registre comportamento observado e requisito declarado separadamente.
  Proponha decisão em aberto quando faltar evidência para classificar a
  divergência. Escolher um lado sozinho é inventar intenção.
- **Escrever o documento contra a evidência.** Se o usuário pedir uma
  afirmação que o código contradiz, nomeie a contradição em uma frase e
  ofereça as saídas coerentes: documentar o comportamento real; registrar a
  intenção como decisão em aberto ou gap conhecido; ou confirmar que a mudança
  de código acontece fora desta tarefa. A sincronização escreve afirmação
  sobre o presente, e por isso responde ao mesmo padrão de evidência que a
  varredura do `docs fundar`.

## 5. Feche

1. **Checagens de entrega nos arquivos tocados**, em duas camadas:
   - **Mecânicas.** Se `$DOCS_KIT/bin/docscheck.mjs` existir, rode
     `node "$DOCS_KIT/bin/docscheck.mjs" .` e repare cada violação (ou
     justifique em uma linha no resumo); `--explain <id>` imprime o porquê e
     os exemplos de uma regra. Os avisos das famílias `H` (presente
     permanente) e `J` (jurisdição) apontam exatamente o que a conversão do
     §2 deixou passar — trate-os, não os ignore. Sem o script, confira à mão a
     tabela de GRAMATICA §5, que lista cada invariante com id, alvo e
     severidade. Não reproduza a lista aqui: ela muda, e cópia envelhece.
   - **De julgamento** (sempre auto-aplicadas): diff mínimo (seções que não
     mudaram não foram reescritas) e teste de deleção nos trechos novos
     (linha que não muda como um agente age no código é cortada).
2. **Marcador de rodada.** Atualize (ou crie) na última linha do PLAN.md — do
   AGENTS.md, quando não há PLAN — o marcador
   `<!-- rodada: <nome> @ <ref> -->`, onde `<ref>` é a saída de
   `git rev-parse --short HEAD`; sem repositório git, a data (AAAA-MM-DD). A
   próxima rodada parte dele (§1). Ele delimita commits; as mudanças ainda não
   commitadas também devem ser conferidas na próxima rodada (GRAMATICA §4).
3. **Resumo.** Termine com: o que mudou em cada arquivo (meia linha por
   mudança); **cada decisão resolvida, nomeada, com o que ela virou** ("Formato
   do relatório → convenção em AGENTS §Convenções"); o que saiu do documento e
   por quê (fase fechada, gap sanado, linha que não passou no teste de
   deleção); e o que continua em aberto. Esse resumo é onde a história é
   contada — é por isso que ela não precisa ficar nos arquivos.
