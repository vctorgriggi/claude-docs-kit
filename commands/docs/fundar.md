---
description: Funda a documentação-de-agente do projeto (SPEC, PLAN, CLAUDE, DOMAIN e satélites). Entrevista o usuário em projeto novo; varre o repositório em projeto existente. Nada é escrito antes do aval.
argument-hint: [novo|existente] [contexto adicional em texto livre]
# Write/Edit ausentes de propósito: cada escrita passa pelo prompt de permissão
# do harness — um segundo gate além do aval conversacional (regra 14).
# WebFetch/WebSearch servem à pesquisa de stack (§2) e a nomear a recomendação
# vigente numa decisão em aberto (§3.3): docs oficiais da versão declarada,
# nunca fonte de intenção.
allowed-tools: Read, Glob, Grep, WebFetch, WebSearch, Bash(git log:*), Bash(git tag:*), Bash(git branch:*), Bash(git remote:*), Bash(ls:*), Bash(tree:*), Bash(cat:*), Bash(head:*), Bash(wc:*), Bash(node ~/.claude/bin/docscheck.mjs:*)
disable-model-invocation: true
---

# /docs:fundar

Contexto passado na chamada (pode estar vazio): $ARGUMENTS

Sua tarefa é montar (ou completar) o sistema de documentação deste projeto. O
resultado são arquivos que futuras sessões de agente leem antes de trabalhar no
código. Escreva de forma densa e específica, sem texto decorativo, e siga a
gramática abaixo mesmo quando ela contrariar seu hábito de formatação.

---

## 0. Carregue a gramática

Antes de qualquer coisa, leia `~/.claude/docs-kit/GRAMATICA.md` (expanda `~`
para o seu diretório home; `Read` exige caminho absoluto). Ele é o texto
normativo: papéis dos arquivos (GRAMATICA §1), regras invioláveis
(GRAMATICA §2), registro do interlocutor (GRAMATICA §3), marcador de rodada
(GRAMATICA §4) e os invariantes mecânicos que o `docscheck` verifica
(GRAMATICA §5).

Convenção de referência daqui em diante: **"regra N"** e **"GRAMATICA §N"**
apontam para o texto normativo; **"§N"** sozinho aponta para uma seção deste
comando.

Se o arquivo não existir, **pare**: diga ao usuário que a gramática não está
instalada e que `./install.sh` no repositório do kit resolve. Não improvise as
regras de memória — a fonte única existe justamente para que nenhum comando
carregue uma paráfrase que envelhece sozinha.

---

## 1. Detecte o modo

1. Se `$ARGUMENTS` começa com `novo` ou `existente`, use esse modo; o resto do
   texto é contexto inicial (não pergunte o que ele já responde).
2. Caso contrário, examine o diretório atual. Existe código ou manifest
   (`package.json`, `pyproject.toml`, `Package.swift`, `Cargo.toml`, `go.mod`,
   `src/`, `apps/`)? Use o Modo B. Diretório vazio ou contendo apenas README e
   licença? Use o Modo A.
3. Em caso ambíguo (por exemplo, apenas protótipos soltos), pergunte em uma
   linha qual modo usar.

Em qualquer modo: se já existirem CLAUDE.md, SPEC.md, PLAN.md ou AGENTS.md, não
sobrescreva nada antes do passo sobre documentação existente (§3.4).

---

## 2. Modo A: projeto do zero (entrevista, proposta, geração)

Não gere nada imediatamente. Entreviste primeiro, em blocos curtos: um bloco
por mensagem, com 2 a 4 perguntas numeradas, respondíveis em uma única resposta.
Pule perguntas já respondidas em `$ARGUMENTS` ou na conversa; funda blocos
quando o usuário responder além do perguntado.

Abra anunciando a forma, em uma frase: "São 4 blocos curtos de perguntas; ao
fim apresento a proposta de arquivos e só gero após seu OK."

Regras da entrevista:

- **Sondagem.** Resposta monossilábica ou vaga em bloco cuja profundidade
  sustenta o resto (Bloco 2, recorte; Bloco 4, disciplina) recebe uma
  sondagem por especificidade. Persistindo o vazio, o item vira decisão em
  aberto no documento — nunca premissa inventada nem item genérico (regra 4 e
  regra 11).
- **Wildcard.** Se o domínio esconder uma incógnita de alto impacto fora
  destes blocos (constraint regulatória, quirk de runtime, dependência
  frágil), gaste uma das perguntas do bloco com ela — só com estaca concreta
  (a resposta mudaria o SPEC, uma fase ou a regra de ouro), nunca por
  completude.
- **Atalho (opt-out).** Se o usuário disser "Go" ou "Prosseguir", encerre as
  perguntas e vá à Proposta. Bloco não respondido não vira premissa: o que
  for deduzível de `$ARGUMENTS` entra; o resto entra na Proposta como
  "Decisões em aberto (a confirmar)" sinalizadas. A regra "intenção não se
  infere" (§3.3) continua valendo, e o aval da Proposta permanece obrigatório
  (regra 14).

**Bloco 1: problema e usuários**

1. Que dor este projeto resolve, e para quem?
2. O que existe hoje que não serve, e por quê? (isso vira a seção "Problema" do SPEC)
3. Quais são os perfis de usuário e o que cada um faz?

**Bloco 2: recorte da primeira entrega**

1. Qual a menor primeira entrega que já é útil? A Fase 1 precisa caber em uma frase.
2. O que explicitamente fica para depois (fases posteriores)?
3. O que está fora do escopo em definitivo, e por quê?

**Bloco 3: stack e restrições duras**

1. Stack decidida ou preferida (com versões mínimas, se souber)?
2. Integrações externas, dados sensíveis, segredos? Onde cada segredo pode e não pode viver?
3. Restrições de plataforma, compliance ou licença?
4. Como o projeto roda e é publicado (se já souber)?

**Bloco 4: disciplina**

1. Qual fronteira arquitetural não pode ser violada nunca? (candidata a regra de ouro)
2. Proibições que você já conhece ("nunca X")?
3. O que precisaria estar verificado para você aceitar a entrega como pronta? (semente dos critérios de aceitação)
4. O projeto terá disciplina de teste por tarefa (TDD) ou verificação manual?

**Ledger de cobertura.** Encerre cada mensagem da entrevista com "Prontidão:
em descoberta | refinando | pronto para propor". Antes da Proposta, o ledger
em uma linha: "Cobertura — 0 Regra-de-ouro candidata: <frase | ainda não> ·
1 Problema/usuários: <resumo> · 2 Recorte da Fase 1: <frase> · 3
Stack/segredos: <resumo> · 4 Disciplina/critérios: <resumo>". "Pronto" exige
a linha 0 formulada em uma frase e nenhum item raso; faltando, volte ao bloco
correspondente em vez de propor.

**Pesquisa de stack (antes da Proposta).** Com a stack e as versões declaradas
no Bloco 3, consulte a documentação oficial dessa versão (WebFetch/WebSearch —
docs oficiais, não blogs) atrás de duas coisas: (a) **pontos de escolha**,
onde o ecossistema aceita mais de um caminho válido (estrutura de pastas,
gerência de estado, roteamento, estilo de teste) — sem escolha registrada,
cada sessão futura decide diferente e o codebase diverge; (b) **recomendações
atuais** que possam ter mudado desde o seu treinamento. Cada ponto de escolha
vira convenção fixada na Proposta ou decisão em aberto — nunca fica ao gosto
da sessão. O teste de deleção governa o filtro: princípio que qualquer sessão
já aplicaria sozinha ("nomes idiomáticos", "escreva testes") não entra; entra
a escolha entre alternativas e o desvio deliberado do padrão. Projeto de
stdlib pura ou sem pontos de escolha reais: pule a pesquisa e diga isso na
Proposta (regra 11). Sem WebFetch/WebSearch disponíveis, os pontos de escolha
viram decisões em aberto.

**Proposta.** Antes de escrever qualquer arquivo, apresente em uma única
mensagem:

- o conjunto de arquivos a gerar, com uma linha de justificativa por item (use
  a paleta do §4 para incluir e excluir com critério);
- o esqueleto de fases do PLAN (nome e objetivo de cada fase, sem as tarefas) e
  a justificativa da ordem;
- a regra de ouro proposta, formulada;
- as escolhas de ecossistema: fixadas com fonte e versão (pesquisa de stack)
  ou listadas como decisões em aberto.

Peça aprovação ou ajustes. Com o OK, gere nesta ordem: SPEC, depois PLAN,
depois CLAUDE, depois satélites. A ordem importa: o PLAN deriva do SPEC e o
CLAUDE.md referencia os dois. Use os templates do §5.

---

## 3. Modo B: projeto existente (varredura, relatório, geração)

### 3.1 Varredura (antes de qualquer pergunta)

Leia, nesta ordem, anotando evidências:

1. **Manifests e locks**: nome, versões, workspaces, scripts (`package.json`,
   `pnpm-workspace.yaml`, `pyproject.toml`, `Package.swift`, `Cargo.toml`,
   `go.mod`, `Gemfile`, `*.xcodeproj`).
2. **Árvore de pastas**: até 3 níveis, ignorando `node_modules`, `.git` e
   diretórios de build. Identifique as áreas do projeto (apps, pacotes,
   camadas); elas viram as seções do CLAUDE.md.
3. **Configs**: tsconfig (paths viram a tabela de aliases), lint, format, test,
   CI, docker, `.env.example` (apenas nomes de variáveis, nunca valores).
4. **Documentação existente**: README*, CLAUDE*, AGENTS*, SPEC*, PLAN\*, docs/ e
   comentários de cabeçalho relevantes.
5. **Git**: `git log --oneline -40`, tags e branches. Extraia vocabulário,
   ritmo, convenção de commit e marcos já nomeados. Se o diretório não for
   repositório git, pule esta fonte, registre "histórico git indisponível"
   em "Não determinável" e siga com as demais; não improvise vocabulário nem
   marcos.
6. **Amostragem de código**: 3 a 5 arquivos representativos por área, para
   inferir convenções reais: exports, tratamento de erro, nomenclatura, onde
   ficam validação e tipos, como as camadas se comunicam.

### 3.2 Relatório de varredura (uma mensagem, três listas)

1. **Observado (fatos)**: o que o código e as configs afirmam por si.
2. **Inferido (com a evidência)**: "parece que X, porque Y". Convenções
   deduzidas de padrão repetido, não de declaração explícita.
3. **Não determinável pelo código**: intenção, fases, o que é dívida deliberada
   e o que é acidente, escopo futuro. Transforme cada item em uma pergunta
   objetiva ou proponha registrá-lo como decisão em aberto.

Antes do fecho, o ledger de cobertura em uma linha: "Cobertura — 0
Regra-de-ouro candidata (com evidência): <frase | ainda não> · 1
Áreas/módulos mapeados · 2 Convenções fortes vs. em aberto · 3
Segredos/bordas · 4 Gaps/decisões pendentes". Só passe à geração com a
linha 0 preenchida.

Termine com: "Com seu OK (e correções), eu gero os arquivos."

### 3.3 Regras contra alucinação (invioláveis no Modo B)

- **Intenção não se infere.** Fase, roadmap, prioridade e a razão de uma
  escolha só entram na documentação quando ditas pelo usuário ou encontradas
  por escrito no repositório.
- **Gap não se conserta durante a documentação.** Ao encontrar validação
  faltando, rota sem guarda ou teste ausente, transforme o achado em pergunta
  no relatório. Confirmado como deliberado, ele entra em um inventário "Gaps
  conhecidos" numerado, com a justificativa e a indicação de onde vive o
  paliativo. Não corrija código nesta tarefa.
- **Afirme com a confiança que a evidência permite.** No documento final,
  convenção inferida de padrão forte entra como regra; padrão fraco ou misto
  entra como decisão em aberto ("hoje coexistem X e Y; padronizar?"). Ao
  formular a pergunta, a doc oficial atual da stack pode ser consultada para
  nomear a recomendação vigente — informa a decisão; nunca vira migração
  proposta por conta própria.
- **Fonte contra fonte.** Quando duas fontes que deveriam concordar divergem
  (manifest declara workspace ou alias ausente na árvore; lockfile fora do
  manifest; duas áreas com convenções opostas), o comportamento que o código
  executa vence a declaração. Registre a divergência como fato (Observado) e
  proponha decisão em aberto ("X declara Y, mas o código faz Z; alinhar?").
  Nunca resolva o conflito silenciosamente.
- **Pedido contra a evidência.** Se o usuário pedir uma afirmação que a
  evidência do código contradiz (uma regra de ouro que o código desmente),
  nomeie a contradição em uma frase e ofereça as saídas coerentes: documentar
  o comportamento real; registrar a intenção como decisão em aberto ou gap
  conhecido; ou confirmar que a mudança de código acontece fora desta tarefa.
  Não escreva o documento contra a evidência.
- **Critérios de aceitação de código existente** descrevem o comportamento real
  verificado, não o comportamento ideal.

### 3.4 Documentação existente

Se o repositório já tem documentação de agente, ofereça três rotas e aguarde a
escolha:

1. **Auditar e atualizar** os documentos existentes contra o código (a
   divergência vira um diff proposto);
2. **Completar** apenas os faltantes, respeitando os que existem;
3. **Migrar** para a gramática da casa, preservando todo o conteúdo (mostre o
   mapeamento antes de executar).

### 3.5 Geração

Com o relatório validado, gere na mesma ordem do Modo A (SPEC, PLAN, CLAUDE,
satélites).

O PLAN de projeto existente **nasce sem passado**: o que já foi construído é
descrito pelo SPEC, no presente, e não vira uma "Fase 0" de tarefas marcadas
`[x]` (regra 2 — o plano guarda o que falta). Se ajudar a orientar, uma linha
de contexto basta: "O core e a CLI estão de pé; o comportamento entregue é o
que o SPEC descreve como atual." A primeira fase do arquivo é a corrente, e o
detalhamento por tarefa vale para ela e para a próxima (regra 11).

Pela mesma razão, o que a varredura descobriu sobre a evolução do repositório
— o que já foi tentado, o que mudou de abordagem — só entra convertido:
proibição em "Nunca fazer", gap conhecido com o paliativo, ou linha em "Fora
do escopo". Nunca como cronologia.

---

## 4. Paleta de arquivos e gatilhos

| Arquivo                                           | Gerar quando                                                                                                   | Não gerar quando                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `SPEC.md`                                         | Sempre                                                                                                         | —                                                  |
| `CLAUDE.md`                                       | Sempre                                                                                                         | —                                                  |
| `PLAN.md`                                         | Há trabalho à frente que se beneficia de ordem                                                                 | Projeto em manutenção sem backlog estruturado      |
| `DOMAIN.md`                                       | O domínio tem vocabulário próprio (5+ termos que um dev novo erraria) ou leis que o código não declara sozinho | CRUD sem regra de negócio; ferramenta de infra     |
| `ROADMAP.md`                                      | Repositório público/OSS ou ambições reais além do SPEC                                                         | A única motivação for completar o conjunto         |
| `docs/<tema>.md`                                  | Um tema acumulou conhecimento caro (spike, API frágil, pesquisa) que não cabe inline, ou uma seção de área do CLAUDE.md passou de ~meia página (extração, regra 11) | O conteúdo ainda cabe em um parêntese do CLAUDE.md |
| `docs/README.md`                                  | `docs/` passou de cerca de 3 arquivos                                                                          | docs/ vazio                                        |
| `<pacote>/CLAUDE.md`                              | Monorepo em que um pacote tem recipe própria (como adicionar um recurso ali)                                   | O CLAUDE.md raiz já cobre                          |
| `AGENTS.md`                                       | Outros agentes além do Claude Code atuam no repositório (espelho curto apontando para o CLAUDE.md, ou symlink) | Apenas Claude Code                                 |
| `CONTRIBUTING.md`                                 | OSS que aceita contribuição                                                                                    | Projeto pessoal ou fechado                         |
| Inventário "Gaps conhecidos" (seção no CLAUDE.md) | Existem dívidas deliberadas confirmadas                                                                        | Não invente gaps para justificar a seção           |

---

## 5. Templates

Os templates vivem em `~/.claude/docs-kit/templates/<ARQUIVO>` — um por
documento da paleta (SPEC.md, PLAN.md, CLAUDE.md, DOMAIN.md, ROADMAP.md).

**Leia o template no momento de gerar aquele arquivo, um de cada vez.** Não
carregue os cinco de uma vez: o que não vai ser escrito agora só ocupa
contexto e mistura formas na sua cabeça.

Eles são esqueletos, não formulários: omita seções sem conteúdo real e
acrescente as que o projeto pedir. Os textos entre `<...>` são placeholders e
nunca sobrevivem no arquivo gerado (regra 11). Os cabeçalhos em blockquote
reproduzem a assinatura dos documentos originais; mantenha o espírito e adapte
a letra.

---

## 6. Entrega

1. Escreva os arquivos aprovados.
2. **Checagens de entrega.** Re-aplique os invariantes ao que foi escrito, em
   duas camadas:
   - **Mecânicas.** Se `~/.claude/bin/docscheck.mjs` existir, rode
     `node ~/.claude/bin/docscheck.mjs .`; `--explain <id>` imprime o porquê e
     os exemplos de qualquer regra acusada. Sem o script, confira à mão a
     tabela de GRAMATICA §5 — ela lista cada invariante mecânico com id, alvo
     e severidade. Não reproduza a lista aqui: ela muda, e cópia
     envelhece.
   - **De julgamento** (sempre auto-aplicadas): cada critério de aceitação
     passa no teste do terceiro (regra 5); teste de deleção — linha cuja
     remoção não muda como um agente age no código é cortada (regra 13).
     Qualquer falha exige reparo ou uma linha de justificativa no resumo.
3. Feche com um resumo compacto: cada arquivo criado, seu papel em meia linha e
   o que ficou registrado como decisão em aberto nele.
4. Encaminhe o ciclo em duas linhas: `/docs:tarefa <id>` monta o briefing de
   uma tarefa do PLAN antes de implementar, e `/docs:decidir` registra uma
   convenção no momento em que ela é decidida. Ao fechar o marco,
   `/docs:rodada <nome>` sincroniza; `/docs:auditar` diz a qualquer momento,
   sem escrever nada, se os documentos ainda descrevem o código.
