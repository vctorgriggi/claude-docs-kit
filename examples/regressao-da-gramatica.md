# Regressão da gramática

> Material do mantenedor, não dos comandos: vive fora do runtime de propósito
> (nada disto é reinjetado nas invocações de `/bootstrap`). Rode mentalmente
> após editar a seção "A gramática da casa" (bootstrap.md §0) e antes de
> reinstalar. Resultado divergente que não era a intenção da edição é deriva:
> corrija antes de rodar `./install.sh`. Os resultados são travados; mudar um
> exige justificativa deliberada, não drift.

| #   | Entrada                                                                        | Resultado travado                                                                                                                        |
| --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/bootstrap` em diretório vazio                                                | Modo A (entrevista); nada gerado antes do aval da Proposta (§0.2.12)                                                                     |
| 2   | `/bootstrap` em diretório com manifest ou `src/`                               | Modo B: varredura completa antes de qualquer pergunta                                                                                    |
| 3   | `/bootstrap` em diretório só com protótipos soltos                             | pergunta de uma linha sobre o modo; nunca escolhe sozinho                                                                                |
| 4   | Modo A para script utilitário de ~300 linhas                                   | CLAUDE.md de uma página e SPEC curto; sem ROADMAP; PLAN só se houver ordem a fatiar (§4, §0.2.9)                                         |
| 5   | Modo B em monorepo com um pacote de recipe própria                             | `<pacote>/CLAUDE.md` além do raiz                                                                                                        |
| 6   | Modo B em repo com CLAUDE.md ou SPEC.md existentes                             | oferta das 3 rotas de §3.4; nada sobrescrito antes da escolha                                                                            |
| 7   | Modo B em repo em manutenção, sem backlog estruturado                          | sem PLAN                                                                                                                                 |
| 8   | Varredura encontra rota sem guarda ou validação faltando                       | vira pergunta no relatório; confirmada deliberada → inventário "Gaps conhecidos"; código intocado (§3.3)                                 |
| 9   | Projeto com apenas 2 proibições específicas conhecidas                         | seção "Nunca fazer" não existe; não se preenche com itens genéricos (§0.2.3)                                                             |
| 10  | Duas áreas do código com convenções opostas                                    | decisão em aberto ("hoje coexistem X e Y; padronizar?"), não regra (§3.3)                                                                |
| 11  | Usuário diz "Go"/"Prosseguir" no meio da entrevista do Modo A                  | perguntas cessam; blocos abertos viram "Decisões em aberto (a confirmar)" na Proposta; o aval da Proposta continua sendo exigido         |
| 12  | Manifest declara workspace/alias que não existe na árvore                      | divergência registrada como fato (Observado) + decisão em aberto; nunca resolvida em silêncio (§3.3, fonte contra fonte)                 |
| 13  | Diretório sem repositório git no Modo B                                        | fonte git pulada com "histórico git indisponível" em Não determinável; vocabulário e marcos não são improvisados (§3.1)                  |
| 14  | Resposta monossilábica no Bloco 4 (disciplina)                                 | uma sondagem por especificidade; persistindo o vazio, decisão em aberto — nunca critério inventado (§2)                                  |
| 15  | `/rodada` em repo cujo PLAN termina com `<!-- rodada: ... @ <sha> -->`         | mudanças levantadas com `git log <sha>..HEAD`; marcador atualizado no fecho com o novo HEAD; sem git, a data no lugar do sha             |
| 16  | Fecho de `/bootstrap` ou `/rodada` com `~/.claude/bin/docscheck.mjs` instalado | o script roda nas checagens de entrega; violação exige reparo ou justificativa no resumo; sem o script, checagem manual dos mesmos itens |
| 17  | Projeto sem nada planejado (qualquer modo)                                     | o SPEC ainda carrega "Planejado / …" reduzida ao blockquote "Nada planejado no momento."; o cabeçalho segue declarando a fronteira (§0.2.1, v2)           |
| 18  | Modo A com stack declarada que tem pontos de escolha (ex.: React)              | pesquisa na doc oficial da versão antes da Proposta; cada ponto vira convenção fixada com "(fonte: docs oficiais …, <mês/ano>)" ou decisão em aberto; nunca lista genérica de boas práticas |
| 19  | Modo A de script pequeno em stdlib pura, sem pontos de escolha reais           | pesquisa pulada e anunciada na Proposta (§0.2.9)                                                                                          |
| 20  | `/rodada` sobre PLAN com fase fechada em rodada anterior e decisões resolvidas antigas | compactação proposta no diff: fase vira resumo curto, decisão antiga vira uma linha; corte total só quando nem a linha muda comportamento; nada sem aval (v3) |
| 21  | `/rodada` encontra gap do inventário sanado pelo código                        | a entrada sai de "Gaps conhecidos" e o corte aparece no resumo da rodada                                                                  |
| 22  | Bootstrap (qualquer modo) de projeto com três ou mais fases à frente           | detalhe por tarefa só na fase corrente e na próxima; as demais ficam com objetivo e dependências (regra 9, v4)                            |
| 23  | `/rodada` em que uma fase fecha e a seguinte estava sem detalhe                | a fase que virou a próxima ganha suas tarefas no mesmo diff (rolling wave, regra 9)                                                       |
| 24  | Seção de área do CLAUDE.md passa de ~meia página                               | a rodada propõe extração para docs/<tema>.md com ponteiro de uma linha; o docscheck avisa acima de ~200 linhas sem mudar o exit code      |
