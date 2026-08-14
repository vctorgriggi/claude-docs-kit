# Regressão da gramática

> Material do mantenedor, não dos comandos: vive fora do runtime de propósito
> (nada disto é reinjetado nas invocações). Rode mentalmente após editar
> [`grammar/GRAMATICA.md`](../grammar/GRAMATICA.md) ou um comando, e antes de
> reinstalar. Resultado divergente que não era a intenção da edição é deriva:
> corrija antes de rodar `./install.sh`. Os resultados são travados; mudar um
> exige justificativa deliberada, não drift.
>
> O que é mecânico não mora aqui: virou regra do `docscheck`, com id, e o CI
> cobre. Esta tabela guarda o que depende de julgamento do modelo — a forma da
> conversa, o que ele se recusa a fazer, o que ele pergunta em vez de assumir.

## Carregamento da gramática

| #   | Entrada                                                        | Resultado travado                                                                                              |
| --- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | Qualquer comando com `~/.claude/docs-kit/GRAMATICA.md` ausente  | o comando **para** e manda rodar `./install.sh`; não improvisa as regras de memória                            |
| 2   | Qualquer comando com a gramática instalada                      | o passo 0 lê o texto normativo antes de qualquer outra ação; as regras citadas vêm de lá, nunca de paráfrase    |

## `/docs:fundar` — Modo A (projeto novo)

| #   | Entrada                                                                | Resultado travado                                                                                                                                                       |
| --- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | Diretório vazio                                                          | Modo A (entrevista); nada gerado antes do aval da Proposta (regra 14)                                                                                                   |
| 4   | Diretório só com protótipos soltos                                       | pergunta de uma linha sobre o modo; nunca escolhe sozinho                                                                                                               |
| 5   | Script utilitário de ~300 linhas                                         | CLAUDE.md de uma página e SPEC curto; sem ROADMAP, sem DOMAIN; PLAN só se houver ordem a fatiar (§4, regra 11)                                                          |
| 6   | Projeto com apenas 2 proibições específicas conhecidas                   | seção "Nunca fazer" não existe; não se preenche com itens genéricos (regra 4)                                                                                           |
| 7   | Usuário diz "Go"/"Prosseguir" no meio da entrevista                      | perguntas cessam; blocos abertos viram "Decisões em aberto (a confirmar)" na Proposta; o aval da Proposta continua exigido                                              |
| 8   | Resposta monossilábica no Bloco 4 (disciplina)                           | uma sondagem por especificidade; persistindo o vazio, decisão em aberto — nunca critério inventado                                                                      |
| 9   | Stack declarada com pontos de escolha (ex.: React)                       | pesquisa na doc oficial da versão antes da Proposta; cada ponto vira convenção fixada com "(fonte: docs oficiais …, <mês/ano>)" ou decisão em aberto; nunca lista genérica |
| 10  | Script pequeno em stdlib pura, sem pontos de escolha reais               | pesquisa pulada e anunciada na Proposta (regra 11)                                                                                                                      |
| 11  | Projeto sem nada planejado                                               | o SPEC ainda carrega "Planejado / …" reduzida ao blockquote "Nada planejado no momento."; o cabeçalho segue declarando a fronteira (regra 1)                            |
| 12  | Projeto com três ou mais fases à frente                                  | detalhe por tarefa só na fase corrente e na próxima; as demais ficam com objetivo e dependências (regra 11)                                                             |
| 13  | Domínio com vocabulário próprio (5+ termos) ou lei que o código não diz  | `DOMAIN.md` na Proposta, com glossário e invariantes `I<n>`; CRUD sem regra de negócio **não** ganha DOMAIN (§4)                                                        |
| 14  | Geração de um documento qualquer                                         | o template é lido de `~/.claude/docs-kit/templates/<ARQUIVO>` **no momento de gerar aquele arquivo**, um de cada vez                                                    |

## `/docs:fundar` — Modo B (projeto existente)

| #   | Entrada                                                        | Resultado travado                                                                                                                              |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15  | Diretório com manifest ou `src/`                                 | Modo B: varredura completa antes de qualquer pergunta                                                                                          |
| 16  | Repo com CLAUDE.md ou SPEC.md existentes                         | oferta das 3 rotas de §3.4; nada sobrescrito antes da escolha                                                                                  |
| 17  | Repo em manutenção, sem backlog estruturado                      | sem PLAN                                                                                                                                       |
| 18  | Monorepo com um pacote de recipe própria                         | `<pacote>/CLAUDE.md` além do raiz, com regra própria — nunca cópia do raiz (A8)                                                                |
| 19  | Varredura encontra rota sem guarda ou validação faltando          | vira pergunta no relatório; confirmada deliberada → "Gaps conhecidos"; código intocado (§3.3)                                                  |
| 20  | Duas áreas do código com convenções opostas                      | decisão em aberto ("hoje coexistem X e Y; padronizar?"), não regra (§3.3)                                                                      |
| 21  | Manifest declara workspace/alias que não existe na árvore         | divergência registrada como fato (Observado) + decisão em aberto; nunca resolvida em silêncio (fonte contra fonte)                             |
| 22  | Diretório sem repositório git                                    | fonte git pulada com "histórico git indisponível" em Não determinável; vocabulário e marcos não são improvisados (§3.1)                        |
| 23  | Repositório com passado visível no git (abordagem que mudou)     | o PLAN **nasce sem "Fase 0" de tarefas `[x]`**; o que existe é descrito pelo SPEC no presente, e o passado só entra convertido (regra 2)       |

## `/docs:rodada`

| #   | Entrada                                                              | Resultado travado                                                                                                                                          |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 24  | PLAN termina com `<!-- rodada: … @ <sha> -->`                          | mudanças levantadas com `git log <sha>..HEAD`; marcador atualizado no fecho com o novo HEAD; sem git, a data no lugar do sha                               |
| 25  | Início de qualquer rodada                                              | o drift é levantado nas duas camadas (docscheck + julgamento) **antes** de propor edição; o ledger de cobertura fecha a leitura                            |
| 26  | Uma fase fecha nesta rodada                                            | a fase **sai do PLAN**; no lugar, no máximo uma linha de orientação; a fase seguinte ganha detalhe por tarefa (rolling wave, regra 11)                     |
| 27  | Uma decisão em aberto é resolvida                                      | a linha **sai** e entra o que ela produziu (convenção, proibição, gap ou exclusão); nunca fica um `[x]` parado no arquivo (regra 7)                        |
| 28  | Desvio de execução aconteceu numa tarefa                               | ou ensinou uma convenção — e ela vai para o CLAUDE.md — ou sai junto com a fase; nunca vira nota permanente na tarefa (regra 2)                            |
| 29  | Um caminho foi rejeitado com custo conhecido                           | vira proibição em "Nunca fazer" ou linha em "Fora do escopo", no presente e sem data — nunca "tentamos X e não deu"                                        |
| 30  | Rodada encontra gap do inventário sanado pelo código                   | a entrada sai de "Gaps conhecidos" e o corte aparece no resumo                                                                                             |
| 31  | Doc e código divergem                                                  | o código vence; o doc é atualizado; dívida deliberada confirmada vira gap; **nunca** se edita código aqui                                                  |
| 32  | Usuário pede afirmação que o código contradiz                          | a contradição é nomeada em uma frase e as saídas coerentes são oferecidas; o documento não é escrito contra a evidência                                    |
| 33  | Seção de área do CLAUDE.md passa de ~meia página                       | extração para `docs/<tema>.md` com ponteiro de uma linha; o ponteiro é obrigatório (A7)                                                                    |
| 34  | Fecho de qualquer rodada                                               | resumo nomeia cada decisão resolvida com o que ela virou, e o que saiu dos arquivos — é ali que a história é contada, não nos documentos                   |

## `/docs:auditar`, `/docs:tarefa`, `/docs:decidir`

| #   | Entrada                                                        | Resultado travado                                                                                                                       |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 35  | `/docs:auditar` em repo com drift                                | relatório classificado CRÍTICO/ALTO/MÉDIO com remediação **proposta**; `git status` limpo depois — o comando não escreve nada           |
| 36  | `/docs:auditar` em repo sem achado                               | diz isso em uma linha e para; não infla o relatório para parecer útil                                                                   |
| 37  | `/docs:tarefa T<x.y>` de tarefa existente                        | briefing com contrato, proibições, invariantes, o que prova e os buracos; nenhum arquivo tocado                                         |
| 38  | `/docs:tarefa` de id inexistente                                 | diz que não existe e lista os ids próximos; não inventa a tarefa                                                                        |
| 39  | `/docs:tarefa` de tarefa travada por decisão em aberto           | nomeia a decisão e sugere `/docs:decidir` **antes** de implementar                                                                      |
| 40  | `/docs:tarefa` cuja tarefa implementa item de "Planejado"        | diz em destaque que o SPEC ainda descreve como futuro e que a rodada seguinte terá que mover                                            |
| 41  | `/docs:decidir` com decisão ambígua quanto ao tipo               | pergunta **uma** coisa: qual das cinco linhas da tabela de classificação é. Não escreve por adivinhação                                 |
| 42  | `/docs:decidir resolver <nome>`                                  | a linha pendente sai e o produto dela entra, no arquivo da jurisdição; o marcador de rodada **não** é atualizado                        |
| 43  | Decisão que já existe em outro arquivo                           | a cópia é removida, não sincronizada (regra 8)                                                                                          |

## Gates

| #   | Entrada                                                        | Resultado travado                                                                                              |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 44  | Qualquer escrita, em qualquer comando                            | passa pelo aval conversacional **e** pelo prompt de permissão do harness (`Write`/`Edit` fora do `allowed-tools`) |
| 45  | Fecho de comando com `~/.claude/bin/docscheck.mjs` instalado     | o script roda; violação exige reparo ou justificativa de uma linha no resumo; avisos de `H` e `J` são tratados, não ignorados |
| 46  | Achado de ancoragem que não se sustenta no projeto               | supressão com motivo na linha (`<!-- docscheck: ignore A3 — … -->`); sem motivo, a supressão vira violação (S1) |

## Ferramenta

Estes não dependem de julgamento do modelo — são comportamento do `docscheck`
e do hook, cobertos por teste. Ficam aqui porque a **decisão de design** por
trás de cada um é o que não se deve derivar sem querer.

| #   | Entrada                                                     | Resultado travado                                                                                                       |
| --- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 47  | `docscheck <dir>` num diretório sem doc-set                   | erro de uso (exit 2): você apontou para o lugar errado                                                                  |
| 48  | `docscheck <dir> <dir> …` com um deles sem doc-set            | o sem doc-set é **pulado em silêncio**; a pergunta ali é "quais destes derivaram", não "todos são doc-set?"             |
| 49  | Panorama com pelo menos um doc-set em violação                | exit 1, e o resumo diz "N de M doc-set(s) com violação"                                                                 |
| 50  | Hook de `SessionStart` num diretório que não é doc-set        | **nenhuma saída**; sem isso toda sessão aberta em qualquer pasta ganharia ruído                                         |
| 51  | Hook num doc-set limpo                                        | contexto para o agente (fase, tarefas, decisões), **sem** `systemMessage`: doc-set em dia não interrompe o usuário      |
| 52  | Hook num doc-set com violação, ou marcador acima do limite    | `systemMessage` na tela apontando `/docs:auditar` ou `/docs:rodada`                                                     |
| 53  | Hook com o kit quebrado (config inválida, docscheck ausente)  | degrada em silêncio e nunca falha a sessão — um hook não é motivo para o Claude Code não abrir                          |
| 54  | Projeto cujo manifest a ancoragem não lê (`pyproject.toml` …) | `A0` declara que `A2` e `A3` não rodaram; cobertura que some em silêncio faria o verde significar duas coisas           |
