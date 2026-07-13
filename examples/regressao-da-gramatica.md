# Regressão da gramática

> Material do mantenedor, não dos comandos: vive fora do runtime de propósito
> (nada disto é reinjetado nas invocações de `/bootstrap`). Rode mentalmente
> após editar a seção "A gramática da casa" (bootstrap.md §0) e antes de
> reinstalar. Resultado divergente que não era a intenção da edição é deriva:
> corrija antes de rodar `./install.sh`. Os resultados são travados; mudar um
> exige justificativa deliberada, não drift.

| #   | Entrada                                                       | Resultado travado                                                                                                                |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/bootstrap` em diretório vazio                               | Modo A (entrevista); nada gerado antes do aval da Proposta (§0.2.12)                                                             |
| 2   | `/bootstrap` em diretório com manifest ou `src/`              | Modo B: varredura completa antes de qualquer pergunta                                                                            |
| 3   | `/bootstrap` em diretório só com protótipos soltos            | pergunta de uma linha sobre o modo; nunca escolhe sozinho                                                                        |
| 4   | Modo A para script utilitário de ~300 linhas                  | CLAUDE.md de uma página e SPEC curto; sem ROADMAP; PLAN só se houver ordem a fatiar (§4, §0.2.9)                                 |
| 5   | Modo B em monorepo com um pacote de recipe própria            | `<pacote>/CLAUDE.md` além do raiz                                                                                                |
| 6   | Modo B em repo com CLAUDE.md ou SPEC.md existentes            | oferta das 3 rotas de §3.4; nada sobrescrito antes da escolha                                                                    |
| 7   | Modo B em repo em manutenção, sem backlog estruturado         | sem PLAN                                                                                                                         |
| 8   | Varredura encontra rota sem guarda ou validação faltando      | vira pergunta no relatório; confirmada deliberada → inventário "Gaps conhecidos"; código intocado (§3.3)                         |
| 9   | Projeto com apenas 2 proibições específicas conhecidas        | seção "Nunca fazer" não existe; não se preenche com itens genéricos (§0.2.3)                                                     |
| 10  | Duas áreas do código com convenções opostas                   | decisão em aberto ("hoje coexistem X e Y; padronizar?"), não regra (§3.3)                                                        |
| 11  | Usuário diz "Go"/"Prosseguir" no meio da entrevista do Modo A | perguntas cessam; blocos abertos viram "Decisões em aberto (a confirmar)" na Proposta; o aval da Proposta continua sendo exigido |
| 12  | Manifest declara workspace/alias que não existe na árvore     | divergência registrada como fato (Observado) + decisão em aberto; nunca resolvida em silêncio (§3.3, fonte contra fonte)         |
| 13  | Diretório sem repositório git no Modo B                       | fonte git pulada com "histórico git indisponível" em Não determinável; vocabulário e marcos não são improvisados (§3.1)          |
| 14  | Resposta monossilábica no Bloco 4 (disciplina)                | uma sondagem por especificidade; persistindo o vazio, decisão em aberto — nunca critério inventado (§2)                          |
