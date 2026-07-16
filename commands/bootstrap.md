---
description: Gera a documentação-de-agente do projeto (SPEC.md, PLAN.md, CLAUDE.md e satélites). Entrevista o usuário em projeto novo; varre o repositório em projeto existente.
argument-hint: [novo|existente] [contexto adicional em texto livre]
# Write/Edit ausentes de propósito: cada escrita passa pelo prompt de permissão
# do harness — um segundo gate além do aval conversacional (§0.2.12).
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git tag:*), Bash(git branch:*), Bash(git remote:*), Bash(ls:*), Bash(tree:*), Bash(cat:*), Bash(head:*), Bash(wc:*), Bash(node ~/.claude/bin/docscheck.mjs:*)
disable-model-invocation: true
---

# /bootstrap

Contexto passado na chamada (pode estar vazio): $ARGUMENTS

Sua tarefa é montar (ou completar) o sistema de documentação deste projeto. O
resultado são arquivos que futuras sessões de agente leem antes de trabalhar no
código. Escreva de forma densa e específica, sem texto decorativo, e siga a
gramática abaixo mesmo quando ela contrariar seu hábito de formatação.

---

## 0. A gramática da casa

Versão da gramática: v1. Incremente a cada mudança de convenção nesta seção;
depois reinstale (ver Personalização no README).

### 0.1 Papéis dos arquivos

Cada arquivo tem um único papel e o declara no próprio cabeçalho, em um
blockquote (`>`) logo abaixo do título. Nenhum arquivo assume o papel de outro.

| Arquivo              | Papel                                                                                                                      | Nunca é                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `SPEC.md`            | O quê e por quê. Descreve o produto atual (ou o recorte a construir) e isola o futuro em uma seção final.                  | Tutorial, changelog, plano |
| `PLAN.md`            | Ordem de execução fatiada em fases pequenas e revisáveis, incluindo a justificativa dessa ordem. Estado vivo (checkboxes). | Especificação, wishlist    |
| `CLAUDE.md`          | Contrato de como o código é escrito neste repositório. Lido no início de toda sessão; evolui junto com o código.           | Documentação de produto    |
| `ROADMAP.md`         | Direções e possibilidades, sem promessas nem datas. Voltado ao público do repositório.                                     | Plano de execução          |
| `docs/<tema>.md`     | Conhecimento caro e durável de um tema (spikes, referência de API frágil, decisão pesquisada).                             | Rascunho                   |
| `docs/README.md`     | Mapa da documentação: o que mora onde.                                                                                     | —                          |
| `<pacote>/CLAUDE.md` | Recipe local de um pacote com regras próprias (monorepo).                                                                  | Cópia do CLAUDE.md raiz    |

### 0.2 Regras invioláveis

1. **Fronteira entre presente e futuro.** O SPEC declara no cabeçalho que tudo
   que foi planejado mas não implementado vive na seção final "Planejado / …",
   e que nada fora dela deve ser lido como já existente (em projeto novo: como
   escopo da primeira entrega). A seção final abre com um blockquote que reforça
   o aviso. Essa fronteira impede que um agente implemente fase futura ou assuma
   a existência de uma feature apenas planejada.
2. **Regra de ouro.** Todo CLAUDE.md tem uma disciplina arquitetural central,
   formulada em uma frase, em negrito. Escolha a fronteira cuja violação é a
   mais cara de desfazer: borda de dados, tratamento de segredo, isolamento de
   tenant, tipo externo vazando entre camadas. O restante do documento se
   apresenta como desdobramento dessa regra.
3. **Nunca fazer.** Lista de proibições absolutas e específicas do projeto.
   Cada item carrega a justificativa ou a evidência na própria linha (exemplo:
   "descartados: testados, não funcionam neste hardware"). Se não existirem
   pelo menos 4 proibições específicas, a seção ainda não deve existir; não a
   preencha com itens genéricos.
4. **Critérios de aceitação verificáveis.** Cada critério precisa poder virar
   um teste automatizado ou um roteiro de verificação manual. Formulações como
   "funciona bem" ou "é rápido" são proibidas. Teste prático: outra pessoa
   consegue dizer, sem perguntar a ninguém, se o critério passou?
5. **Documento vivo.** Uma convenção decidida durante a implementação é
   registrada no CLAUDE.md no momento da decisão, com a justificativa em poucas
   palavras. O estado é sempre explícito: a seção "Decisões em aberto" com o
   texto "Nenhuma pendente" tem significado; uma seção ausente não tem.
6. **Decisões em aberto com histórico.** Formato: `- [ ] **<decisão>** —
<contexto/opções> (afeta T<x.y>, quando houver)`. Ao resolver:
   `- [x] **<decisão>** — resolvido: <como> (<rodada/data>)`. Decisões
   resolvidas nunca são apagadas; o histórico faz parte do documento. (Os
   travessões acima são sintaxe literal do formato.)
7. **A justificativa acompanha a decisão.** Registre o porquê na mesma linha,
   em poucas palavras, geralmente entre parênteses. Caminhos rejeitados também
   são registrados. Uma decisão sem justificativa será rediscutida do zero em
   alguma sessão futura.
8. **Rastreabilidade cruzada.** As tarefas do PLAN referenciam os módulos
   definidos no CLAUDE.md; a seção de Riscos do PLAN referencia as constraints
   do SPEC pelo número; as decisões em aberto apontam as tarefas que dependem
   delas. Os três arquivos formam um sistema.
9. **Escala honesta.** Gere apenas o que o projeto precisa (ver §4). Não crie
   arquivo placeholder, seção "TBD" nem ROADMAP sem razão de existir. Um script
   de 300 linhas recebe um CLAUDE.md de uma página e talvez nenhum PLAN.
10. **Idioma.** Documentos de agente (CLAUDE, SPEC, PLAN) em pt-BR, mantendo o
    vocabulário técnico em inglês (hook, endpoint, stream). Documentos voltados
    ao público do repositório (README, ROADMAP, CONTRIBUTING) na língua desse
    público; inglês quando o projeto for open source internacional. Se o
    repositório já tiver documentação consistente em outra língua, pergunte
    antes de misturar.
11. **Tom.** Registro de contrato técnico: denso, direto, sem decoração (sem
    ASCII art, banners, emoji ou ênfase excessiva). Tabelas para dados
    tabulares; árvore de pastas comentada para estrutura; snippet de código
    apenas quando prosa não ensina o padrão. Prefira frases afirmativas simples
    a aforismos e frases de efeito; use travessão com parcimônia.
12. **Gatilho de geração.** Nenhum arquivo é escrito antes do aval explícito
    do usuário sobre a Proposta (Modo A) ou o Relatório de varredura (Modo B).
    Com o aval, gere nesta ordem: SPEC, PLAN, CLAUDE, satélites.

### 0.3 Registro do interlocutor

Estas regras valem para a conversa (entrevista, relatórios, propostas), não
apenas para os arquivos gerados:

- Lidere com o veredito; sem aberturas de preenchimento ("Ótima pergunta",
  "Claro, posso ajudar").
- Mantenha a posição quando a evidência a sustenta; revisar para agradar é
  falha de qualidade. Revise apenas diante de evidência ou argumento novo.
- Conduza a entrevista e os relatórios na língua em que o usuário escrever,
  seguindo o input mais recente se ele trocar de língua. Os documentos
  gerados seguem a regra 10.

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
  aberto no documento — nunca premissa inventada nem item genérico (§0.2.3 e
  §0.2.9).
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
  (§0.2.12).

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

**Proposta.** Antes de escrever qualquer arquivo, apresente em uma única
mensagem:

- o conjunto de arquivos a gerar, com uma linha de justificativa por item (use
  a paleta do §4 para incluir e excluir com critério);
- o esqueleto de fases do PLAN (nome e objetivo de cada fase, sem as tarefas) e
  a justificativa da ordem;
- a regra de ouro proposta, formulada.

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
  entra como decisão em aberto ("hoje coexistem X e Y; padronizar?").
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
satélites). No PLAN de projeto existente, as fases já concluídas entram
marcadas `[x]` de forma resumida (uma "Fase 0" com o inventário do que já foi
construído é aceitável); o detalhamento por tarefa vale para o trabalho à
frente.

---

## 4. Paleta de arquivos e gatilhos

| Arquivo                                           | Gerar quando                                                                                                   | Não gerar quando                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `SPEC.md`                                         | Sempre                                                                                                         | —                                                  |
| `CLAUDE.md`                                       | Sempre                                                                                                         | —                                                  |
| `PLAN.md`                                         | Há trabalho à frente que se beneficia de ordem                                                                 | Projeto em manutenção sem backlog estruturado      |
| `ROADMAP.md`                                      | Repositório público/OSS ou ambições reais além do SPEC                                                         | A única motivação for completar o conjunto         |
| `docs/<tema>.md`                                  | Um tema acumulou conhecimento caro (spike, API frágil, pesquisa) que não cabe inline                           | O conteúdo ainda cabe em um parêntese do CLAUDE.md |
| `docs/README.md`                                  | `docs/` passou de cerca de 3 arquivos                                                                          | docs/ vazio                                        |
| `<pacote>/CLAUDE.md`                              | Monorepo em que um pacote tem recipe própria (como adicionar um recurso ali)                                   | O CLAUDE.md raiz já cobre                          |
| `AGENTS.md`                                       | Outros agentes além do Claude Code atuam no repositório (espelho curto apontando para o CLAUDE.md, ou symlink) | Apenas Claude Code                                 |
| `CONTRIBUTING.md`                                 | OSS que aceita contribuição                                                                                    | Projeto pessoal ou fechado                         |
| Inventário "Gaps conhecidos" (seção no CLAUDE.md) | Existem dívidas deliberadas confirmadas                                                                        | Não invente gaps para justificar a seção           |

---

## 5. Templates

Os templates abaixo são esqueletos, não formulários: omita seções sem conteúdo
real e adicione as que o projeto pedir. Os textos entre `<...>` são
placeholders. Os cabeçalhos em blockquote reproduzem a assinatura dos
documentos originais; mantenha o espírito e adapte a letra.

<template arquivo="SPEC.md">
# SPEC.md

> Descreve o **<projeto> atual** <ou, em projeto novo: "o frontend/app/serviço
> X — o que vamos construir">. O que foi planejado mas ainda não implementado
> está na seção final "Planejado / <fases posteriores | não implementado
> (roadmap futuro)>" — nada fora dela deve ser lido como <já existente no app |
> escopo da primeira entrega>.

## Problema

<A dor, por que as alternativas não servem e o que este projeto faz. Numerado
quando o projeto faz mais de uma coisa. 2 a 4 parágrafos.>

## Usuários

- **<perfil>** — <o que faz e o que quer>.
- **(Fase posterior) <perfil futuro>** — <marcado como tal, nunca misturado aos atuais>.

## Funcionalidades

### Essenciais<, com o sufixo "— Fase 1" quando houver fases>

**<grupo>**

- <capacidade observável, com os detalhes de comportamento que importam:
  defaults, toggles, timers, edge cases já decididos>.

### Fora do escopo

- <exclusão deliberada, com justificativa curta quando não for óbvia>.

## Módulos

<Arquitetura em uma frase (por exemplo, "um core, várias views") seguida da
lista de módulos, com a responsabilidade de cada um e o que nunca atravessa as
fronteiras entre eles.>

## Stack

- **<tecnologia>** — <papel; versão mínima; justificativa quando a escolha não for óbvia>.

## Constraints técnicas

1. **<nome curto da constraint>** — <o fato duro e a mitigação ou decisão tomada>.
2. ...

## Critérios de aceitação

1. <Verificável: ação e resultado observável. Cada critério vira teste ou roteiro.>
2. ...

## Planejado / <fases posteriores | não implementado (roadmap futuro)>

> O que está abaixo é **planejado** e não faz parte <da Fase 1 | do app atual>.
> <Como a arquitetura já acomoda isso sem depender disso.>

### <feature futura>

<Descrição, constraints associadas e critérios de aceitação para quando for
implementada. O futuro também recebe critérios.>

## Decisões em aberto (a confirmar)

- [ ] **<decisão>** — <contexto e opções>.
- [x] **<decisão resolvida>** — resolvido: <como> (<rodada/data>).
      </template>

<template arquivo="PLAN.md">
# PLAN.md

> Plano de execução do <projeto> (SPEC.md), fatiado em fases pequenas e
> revisáveis, na ordem que a arquitetura pede: <a justificativa da ordem; por
> exemplo: "lógica pura testada primeiro, UI com dados mockados depois, e por
> último as bordas frágeis, uma de cada vez">.

## Convenções

- Cada task tem: um id (ex.: T2.1), o módulo responsável (coerente com a
  estrutura do CLAUDE.md), <"os testes TDD que a definem" | "a verificação que
  a define"> e os critérios de aceitação.
- Uma fase só começa quando todos os checkboxes da anterior estão marcados,
  exceto fases marcadas como opcionais, que podem ser puladas.
- <Regras transversais do projeto: "toda borda entra atrás de um protocolo
  mockável", "i18n é fundação transversal", etc.>
- Desvios são registrados na própria tarefa: o que mudou e por quê ficam no
  texto dela (ex.: "substituiu X; implementado, testado e cortado por <motivo>").

## Fase 0 — <Fundação | O que já existe (Modo B: resumida e marcada [x])>

Objetivo: <o que fica de pé no fim da fase>.
Depende de: nada.

- [ ] T0.1 — <tarefa> · módulo: <módulo>
  - <Testes (primeiro) | Verificação>: <o que prova a tarefa>.
  - Aceitação: <estado observável ao concluir>.

## Fase 1 — <nome>

Objetivo: <...>.
Depende de: Fase 0 completa.

- [ ] T1.1 — ...

## Riscos e dependências

- **<risco>** (SPEC, constraint <n>) → <fase e tarefas que o mitigam, e o plano B>.

## Decisões em aberto

- [ ] **<decisão>** — afeta T<x.y>.
- [x] **<decisão>** — resolvido: <como refletiu no plano> (<rodada/data>).
      </template>

<template arquivo="CLAUDE.md">
# <Projeto>

> <Uma a três linhas: o que o projeto é.>

Leia este arquivo no início de toda sessão — ele é o **contrato de como
escrevemos código aqui**, não documentação. Quando uma convenção for decidida
durante a implementação, registre-a aqui. Contexto detalhado mora em @SPEC.md
(o quê e por quê) e @PLAN.md (ordem de execução).

<Se houver fases: "**Fase atual = <recorte>.** <O que não pertence a esta fase
e onde está descrito.>">

## Regra de ouro

**<A disciplina central, em uma frase.>** Tudo abaixo é desdobramento disso.

<Um parágrafo: o que ela implica na prática. O que sobe, o que desce, o que
nunca atravessa.>

## Stack

| Camada   | Tecnologia                   |
| -------- | ---------------------------- |
| <camada> | <tecnologia e versão mínima> |

## Estrutura

```
<árvore comentada: pastas com o papel de cada uma. Em monorepo, a tabela de
aliases entra aqui, com a lista de todos os lugares a atualizar ao criar um
alias novo.>
```

## Como rodar

```bash
<comandos reais: dev, build, test, lint>
```

## <Seções por área, uma por costura do projeto>

<Esta é a parte específica do projeto: uma seção por camada ou borda relevante
(camada de dados, API, auth, i18n, concorrência, integrações frágeis), cada uma
com o padrão adotado, as regras do que atravessa e do que nunca atravessa a
fronteira, e um snippet mínimo quando prosa não ensina. Derive as seções das
áreas reais identificadas, não de um sumário genérico.>

## Convenções

- <Linguagem e tipos: ex. "interface para shapes; sem enum, usar uniões
  literais e mapas as const; named exports".>
- <Nomenclatura: casing por tipo de item; regra bilíngue, se houver.>
- <Erros: o padrão adotado (Result, notFound(), exceções e onde) e a fronteira
  que um erro nunca cruza.>
- <Comentários: explicam o porquê, não o quê; sem decoração; conhecimento caro
  e durável permanece detalhado.>
- <Testes: o que é unitário (roda sem tocar borda real) e o que é borda fina
  (smoke ou manual), e a regra que mantém a borda fina.>
- <Env e segredos: split client/server; onde cada segredo pode viver.>

## Nunca fazer

- Nunca <proibição absoluta e específica> — <justificativa ou evidência na mesma linha>.
- Nunca ... (4 a 8 itens; cada um carrega sua justificativa)

## Decisões em aberto

- [ ] **<decisão>** — <contexto>.
- [x] **<decisão>** — resolvido: <como> (<rodada/data>).
      <Quando vazio: "Nenhuma pendente.">
      </template>

<template arquivo="ROADMAP.md">
# Roadmap

<Projeto> faz poucas coisas e tenta fazê-las bem. Este documento reúne direções
e possibilidades, não promessas nem compromissos com data. <Se OSS: "Se alguma
destas te importa, contribuições são bem-vindas; veja CONTRIBUTING.md.">

## <Direção>

<Um parágrafo: o problema, a abordagem provável (com as ferramentas já
cogitadas) e por que ainda não foi feito.>
</template>

---

## 6. Entrega

1. Escreva os arquivos aprovados.
2. **Checagens de entrega.** Re-aplique os invariantes ao que foi escrito, em
   duas camadas:
   - **Mecânicas.** Se `~/.claude/bin/docscheck.mjs` existir, rode
     `node ~/.claude/bin/docscheck.mjs .`; ele verifica a fronteira
     presente/futuro com o blockquote de reforço (regra 1), a regra de ouro
     formulada em negrito (regra 2), "Nunca fazer" com 4 ou mais proibições
     justificadas na linha (regra 3), o estado e o formato das decisões
     (regras 5 e 6), a rastreabilidade tarefas → módulos, riscos → constraints
     numeradas, decisões → tarefas (regra 8) e placeholders/"TBD" (regra 9).
     Sem o script, confira esses mesmos itens manualmente.
   - **De julgamento** (sempre auto-aplicadas): cada critério de aceitação
     passa no teste do terceiro (regra 4); teste de deleção — linha cuja
     remoção não muda como um agente age no código é cortada (regra 11).
     Qualquer falha exige reparo ou uma linha de justificativa no resumo.
3. Feche com um resumo compacto: cada arquivo criado, seu papel em meia linha e
   o que ficou registrado como decisão em aberto nele.
4. Lembre o usuário de rodar `/rodada` ao fechar cada marco de implementação.
   Os documentos precisam continuar refletindo o código para que a gramática
   funcione.
