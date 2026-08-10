# claude-docs-kit

Comandos de [Claude Code](https://docs.claude.com/en/docs/claude-code/overview)
que geram e mantêm a documentação-de-agente dos meus projetos (SPEC.md,
PLAN.md, CLAUDE.md e satélites), sempre na mesma gramática.

## Por quê

Todo projeto meu carrega o mesmo sistema de documentação: um SPEC (o quê e por
quê, com fronteira explícita entre o que existe e o que é planejado), um PLAN
(execução fatiada em fases, com tarefas identificadas por módulo e critérios de
aceitação) e um CLAUDE.md (o contrato de como o código é escrito ali: regra de
ouro, proibições, decisões em aberto, documento vivo). Montar esse sistema do
zero, ou retroajustá-lo em um repositório existente, é trabalho repetitivo.
Estes comandos entregam a gramática pronta para o agente executar esse
trabalho.

## Instalação

```bash
git clone <este-repo>
cd claude-docs-kit
./install.sh            # commands/*.md → ~/.claude/commands/; docscheck → ~/.claude/bin/
```

Ou manualmente: `cp commands/*.md ~/.claude/commands/` (escopo pessoal,
disponível em todos os projetos) e `cp bin/docscheck.mjs ~/.claude/bin/`
(as checagens mecânicas de entrega; ver Verificação). Para restringir a um único projeto, copie
para `.claude/commands/` dentro dele. O Claude Code também aceita o formato
mais recente de skills (`~/.claude/skills/<nome>/SKILL.md`); o formato clássico
de commands segue suportado e é o usado aqui.

## Uso

```
/bootstrap                      # detecta: diretório vazio = entrevista; código = varredura
/bootstrap novo <contexto>      # projeto do zero, já com contexto inicial
/bootstrap existente            # força o modo varredura
/rodada <nome-da-rodada>        # ao fechar um marco: sincroniza documentação e código
```

`/bootstrap` tem dois modos. Em projeto novo, entrevista em blocos curtos
(problema e usuários; recorte da primeira entrega; stack e restrições;
disciplina), consulta a documentação oficial da stack declarada quando ela tem
pontos de escolha (cada um vira convenção fixada com fonte e versão, ou
decisão em aberto), propõe o conjunto de arquivos, o esqueleto de fases e a
regra de ouro, e só gera após aprovação. Em projeto existente, varre o repositório
primeiro (manifests, árvore de pastas, configs, documentação existente,
histórico do git, amostragem de código) e devolve um relatório em três partes:
observado, inferido e não determinável. A geração acontece após a validação do
relatório. Intenção nunca é inventada; o que não pode ser deduzido vira
pergunta ou decisão em aberto.

`/rodada` fecha um marco: marca tarefas concluídas no PLAN, move o que foi
implementado da seção "Planejado" para o corpo do SPEC e registra convenções
novas e decisões resolvidas no CLAUDE.md. Quando uma fase fecha, a seguinte
ganha seu detalhe por tarefa (rolling wave). Histórico não se apaga
silenciosamente — fase antiga e decisão resolvida compactam dentro do diff
aprovado, com o git guardando a íntegra — e nenhum código é alterado durante
a sincronização.

## O que ele gera

| Arquivo              | Papel                                                             | Quando                                       |
| -------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| `SPEC.md`            | O quê e por quê; fronteira entre presente e planejado             | Sempre                                       |
| `CLAUDE.md`          | Contrato de como o código é escrito; documento vivo               | Sempre                                       |
| `PLAN.md`            | Execução fatiada em fases; tarefas com módulo, testes e aceitação | Quando há trabalho à frente                  |
| `ROADMAP.md`         | Direções sem promessa                                             | Repositório público ou ambições além do SPEC |
| `docs/<tema>.md`     | Conhecimento caro e durável (spikes, APIs frágeis)                | Quando um tema acumula                       |
| `docs/README.md`     | Mapa da documentação                                              | docs/ passa de cerca de 3 arquivos           |
| `<pacote>/CLAUDE.md` | Recipe local de pacote                                            | Monorepos                                    |
| `AGENTS.md`          | Espelho curto para outros agentes                                 | Quando coexistem outros agentes              |

O kit não gera placeholders; um arquivo só é criado quando há razão para ele
existir.

## Veja funcionando

Transcrições anotadas em [`examples/`](examples/): a entrevista do Modo A com
proposta, gate e checagens de entrega
([01](examples/01-modo-a-cli-nova.md)); a varredura do Modo B com o relatório
em três listas, o gap virando pergunta e as 3 rotas para documentação
existente ([02](examples/02-modo-b-varredura.md)); e uma `/rodada` movendo um
item de "Planejado" para o corpo do SPEC sem apagar história
([03](examples/03-rodada.md)). As sessões rodam sobre os repositórios-amostra
de `examples/fixtures/` — o doc-set preenchido de `fixtures/linkcheck/` é a
referência viva da gramática.

## A gramática (resumo)

- Cada arquivo tem um único papel e o declara no próprio cabeçalho.
- Fronteira entre presente e futuro no SPEC: tudo que ainda não existe fica
  isolado na seção "Planejado", o que evita que um agente trate fase futura
  como escopo atual. A seção existe mesmo sem nada planejado ("Nada planejado
  no momento."): fronteira ausente é ambígua; fronteira vazia não.
- Regra de ouro: uma disciplina arquitetural central por projeto, da qual as
  demais regras derivam.
- Nunca fazer: proibições absolutas e específicas, cada uma com a justificativa
  na própria linha.
- Critérios de aceitação verificáveis: cada um pode virar teste ou roteiro de
  verificação.
- Documento vivo: convenções decididas durante a implementação são registradas
  no momento; decisões em aberto usam checkbox e preservam o histórico quando
  resolvidas. Histórico compacta nas rodadas quando deixa de mudar o
  comportamento de um agente; o git guarda a íntegra.
- Rastreabilidade: o PLAN referencia as constraints do SPEC, as tarefas
  referenciam os módulos do CLAUDE.md e as decisões apontam as tarefas que
  dependem delas.
- Escolhas de ecossistema são fixadas por projeto, nunca deixadas ao gosto de
  cada sessão; convenção vinda de pesquisa carrega fonte e versão na linha.
- Escala honesta no espaço e no tempo: nada de placeholder; o PLAN detalha
  tarefas só da fase corrente e da próxima; seção de área do CLAUDE.md que
  crescer além de ~meia página extrai para docs/<tema>.md.
- pt-BR nos documentos de agente (vocabulário técnico em inglês); língua do
  público nos documentos públicos.

## Verificação

- **`bin/docscheck.mjs`** — verificador executável dos invariantes mecânicos
  da gramática: fronteira presente/futuro com o blockquote de reforço, regra
  de ouro em negrito, "Nunca fazer" com 4+ proibições justificadas na linha,
  formato e estado das decisões, rastreabilidade cruzada (tarefas → módulos
  definidos na Estrutura ou nos títulos do CLAUDE.md, riscos → constraints,
  decisões pendentes → tarefas), zero "TBD" e papel declarado no cabeçalho. Conteúdo de
  blocos de código cercados é ignorado (um exemplo de doc dentro de um fence
  não é gramática do documento). Acima de ~200 linhas no CLAUDE.md, emite
  aviso — sem mudar o exit code — sugerindo compactação ou extração (regra 9).
  Node ≥ 20, zero dependências, instalação por cópia. Uso:
  `node ~/.claude/bin/docscheck.mjs <dir>`; exit 0 sem violações, 1 com
  violações, 2 erro de uso. Os comandos o executam nas checagens de entrega
  quando instalado, e o CI de um projeto-alvo pode copiá-lo e rodá-lo também.
  As checagens de julgamento (teste do terceiro, teste de deleção) seguem com
  o agente.
- **Marcador de rodada** — `/rodada` carimba `<!-- rodada: <nome> @ <sha> -->`
  no fim do PLAN.md; a rodada seguinte levanta as mudanças com
  `git log <sha>..HEAD`, sem adivinhar qual foi o último marco.
- **Gate duplo na escrita** — os comandos não levam `Write`/`Edit` em
  `allowed-tools` de propósito: além do aval conversacional (Proposta,
  Relatório, OK da rodada), cada escrita passa pelo prompt de permissão do
  harness.
- **CI do kit** — roda os testes do docscheck, os testes do fixture linkcheck
  e o docscheck contra o doc-set de referência
  ([`examples/fixtures/linkcheck/`](examples/fixtures/linkcheck/)).
- **`scripts/regressao-smoke.sh`** — ferramenta do mantenedor: roda casos
  baratos da [regressão da gramática](examples/regressao-da-gramatica.md) em
  headless (`claude -p`) contra os fixtures e confere os sinais travados por
  grep. Custa tokens e é heurístico; não roda no CI.

## Limitações conhecidas

- A gramática é opinativa e fixa pt-BR para documentos de agente (regra 10) —
  escolha de design, não defeito; limita o reuso do kit a projetos lusófonos.
- O fluxo depende de aprovação humana em cada gate; nada é gerado de forma
  autônoma.
- A cópia instalada em `~/.claude/commands/` não se atualiza sozinha após
  editar a fonte (ver Personalização).
- O `docscheck` cobre apenas os invariantes mecânicos da gramática; as
  checagens de julgamento (teste do terceiro, teste de deleção) seguem
  auto-aplicadas pelo agente, sem verificação externa.
- Os comandos usam o formato clássico (`~/.claude/commands/`), não o formato
  mais recente de skills; se o formato clássico for depreciado, o kit precisa
  ser portado.
- O `/bootstrap` pré-autoriza WebFetch/WebSearch para a pesquisa de stack
  (docs oficiais da versão declarada). Quem preferir superfície mínima remove
  as duas do `allowed-tools`; o passo degrada sem quebrar — pontos de escolha
  viram decisões em aberto.

## Personalização

Os comandos são arquivos markdown. A fonte da verdade é a seção "A gramática da
casa" em `commands/bootstrap.md`; para mudar uma convenção, edite ali,
incremente a versão da gramática declarada no topo da seção, confira
[`examples/regressao-da-gramatica.md`](examples/regressao-da-gramatica.md)
(resultado divergente que não era a intenção da edição é deriva) e rode
`./install.sh` novamente (a cópia em `~/.claude/commands/` não se atualiza
sozinha). Se a mudança afetar um invariante mecânico, atualize o `docscheck`
junto — a constante `GRAMATICA` dele acompanha a versão declarada no
`bootstrap.md`, e o teste acusa divergência — e rode
`node --test test/docscheck.test.mjs` e
`node bin/docscheck.mjs examples/fixtures/linkcheck` (o CI cobre os dois);
para mudanças de comportamento dos comandos, `./scripts/regressao-smoke.sh`
roda os casos baratos da regressão em headless (custa tokens). Renomear um comando é renomear o arquivo: `rodada.md` vira `/rodada`,
`sync.md` viraria `/sync`.
