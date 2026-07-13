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
./install.sh            # copia commands/*.md para ~/.claude/commands/
```

Ou manualmente: `cp commands/*.md ~/.claude/commands/` (escopo pessoal,
disponível em todos os projetos). Para restringir a um único projeto, copie
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
disciplina), propõe o conjunto de arquivos, o esqueleto de fases e a regra de
ouro, e só gera após aprovação. Em projeto existente, varre o repositório
primeiro (manifests, árvore de pastas, configs, documentação existente,
histórico do git, amostragem de código) e devolve um relatório em três partes:
observado, inferido e não determinável. A geração acontece após a validação do
relatório. Intenção nunca é inventada; o que não pode ser deduzido vira
pergunta ou decisão em aberto.

`/rodada` fecha um marco: marca tarefas concluídas no PLAN, move o que foi
implementado da seção "Planejado" para o corpo do SPEC e registra convenções
novas e decisões resolvidas no CLAUDE.md. Histórico nunca é apagado e nenhum
código é alterado durante a sincronização.

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
  como escopo atual.
- Regra de ouro: uma disciplina arquitetural central por projeto, da qual as
  demais regras derivam.
- Nunca fazer: proibições absolutas e específicas, cada uma com a justificativa
  na própria linha.
- Critérios de aceitação verificáveis: cada um pode virar teste ou roteiro de
  verificação.
- Documento vivo: convenções decididas durante a implementação são registradas
  no momento; decisões em aberto usam checkbox e preservam o histórico quando
  resolvidas.
- Rastreabilidade: o PLAN referencia as constraints do SPEC, as tarefas
  referenciam os módulos do CLAUDE.md e as decisões apontam as tarefas que
  dependem delas.
- pt-BR nos documentos de agente (vocabulário técnico em inglês); língua do
  público nos documentos públicos.

## Limitações conhecidas

- A gramática é opinativa e fixa pt-BR para documentos de agente (regra 10) —
  escolha de design, não defeito; limita o reuso do kit a projetos lusófonos.
- O fluxo depende de aprovação humana em cada gate; nada é gerado nem
  verificado de forma autônoma.
- A cópia instalada em `~/.claude/commands/` não se atualiza sozinha após
  editar a fonte (ver Personalização).
- As checagens de entrega são auto-aplicadas pelo agente; não há verificação
  automatizada externa de que a documentação gerada obedece à gramática.
- Os comandos usam o formato clássico (`~/.claude/commands/`), não o formato
  mais recente de skills; se o formato clássico for depreciado, o kit precisa
  ser portado.

## Personalização

Os comandos são arquivos markdown. A fonte da verdade é a seção "A gramática da
casa" em `commands/bootstrap.md`; para mudar uma convenção, edite ali,
incremente a versão da gramática declarada no topo da seção, confira
[`examples/regressao-da-gramatica.md`](examples/regressao-da-gramatica.md)
(resultado divergente que não era a intenção da edição é deriva) e rode
`./install.sh` novamente (a cópia em `~/.claude/commands/` não se atualiza
sozinha). Renomear um comando é renomear o arquivo: `rodada.md` vira `/rodada`,
`sync.md` viraria `/sync`.
