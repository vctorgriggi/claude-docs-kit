# A gramática da casa

> Texto normativo do agent-docs-kit: os papéis dos arquivos, as regras
> invioláveis, o registro do interlocutor e os invariantes mecânicos que o
> `docscheck` verifica. Os comandos leem este arquivo no início de cada
> invocação — é a fonte única da gramática, e nenhum comando a parafraseia.

Versão da gramática: v7. Incremente a cada mudança de convenção; a constante
`GRAMATICA` de `bin/docscheck.mjs` acompanha (o teste do kit acusa
divergência). Regere as tabelas e valide conforme o README. A instalação
por links usa diretamente esta fonte.

---

## §1 Papéis dos arquivos

Cada arquivo tem um único papel e o declara no próprio cabeçalho, em um
blockquote (`>`) logo abaixo do título. Nenhum arquivo assume o papel de outro.

| Arquivo              | Papel                                                                                                                      | Nunca é                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `SPEC.md`            | O quê e por quê. Descreve o produto atual (ou o recorte a construir) e isola o futuro em uma seção final.                  | Tutorial, changelog, plano |
| `PLAN.md`            | Ordem de execução fatiada em fases pequenas e revisáveis, incluindo a justificativa dessa ordem. Estado vivo (checkboxes). | Especificação, wishlist    |
| `AGENTS.md`          | Contrato de como o código é escrito neste repositório. Lido no início de toda sessão; evolui junto com o código.           | Documentação de produto    |
| `DOMAIN.md`          | O vocabulário e as leis do domínio: glossário e invariantes de negócio que o código não declara sozinho.                   | Especificação de feature   |
| `ROADMAP.md`         | Direções e possibilidades, sem promessas nem datas. Voltado ao público do repositório.                                     | Plano de execução          |
| `docs/<tema>.md`     | Conhecimento caro e durável de um tema (spikes, referência de API frágil, decisão pesquisada).                             | Rascunho                   |
| `docs/README.md`     | Mapa da documentação: o que mora onde.                                                                                     | —                          |
| `<pacote>/AGENTS.md` | Recipe local de um pacote com regras próprias (monorepo).                                                                  | Cópia do AGENTS.md raiz    |

`AGENTS.md` é a fonte canônica para todos os agentes. Ao gerar esse arquivo,
crie no mesmo diretório `CLAUDE.md` contendo somente `@AGENTS.md`, para que o
Claude Code leia o mesmo contrato. A ponte não tem seções nem regras próprias;
ela não está sujeita às regras comuns dos documentos. A9 confere seu alvo
quando ela existe. Um doc-set só com AGENTS.md também pode ser verificado.

## §2 Regras invioláveis

1. **Fronteira entre presente e futuro.** Em projeto existente, o corpo do
   SPEC descreve o comportamento atual; o que ainda não foi implementado vive
   na seção "Planejado / …". Em projeto novo, o corpo descreve o escopo acordado
   da primeira entrega, ainda não implementado; "Planejado" reúne as fases
   posteriores. O cabeçalho declara explicitamente qual dos dois casos vale.
   "Planejado" é a última seção de escopo; decisões em aberto podem vir depois.
   A seção abre com um blockquote que reforça o aviso. Essa fronteira impede
   que um agente implemente fase futura ou assuma
   a existência de uma feature apenas planejada. A seção existe mesmo quando não
   há nada planejado, reduzida ao blockquote ("> Nada planejado no momento."):
   fronteira ausente é ambígua; fronteira vazia não. (Exceção deliberada à
   economia da regra 11.)
2. **Presente permanente.** Nenhum documento narra cronologia. Todo texto
   descreve o estado atual e as regras vigentes. Um fato do passado só
   permanece se tiver sido **convertido** em algo que muda o comportamento
   agora — uma proibição em "Nunca fazer", uma convenção com a justificativa
   na linha, uma entrada em "Gaps conhecidos" com o paliativo, uma linha em
   "Fora do escopo". Convertido, ele perde a data e o "antes era assim". Não
   convertível, ele sai. A garantia contra apagar em silêncio não é a
   permanência no documento: é o diff aprovado da rodada, o marcador de rodada
   (§4) e o git, que guarda a íntegra. Documento que acumula "no começo era X,
   depois virou Y" cobra a atenção de toda sessão futura para contar uma
   história que não muda nenhuma decisão — e faz o agente confundir o que
   valeu um dia com o que vale agora. Datas que afetam uma ação vigente, como
   expiração ou descontinuação, permanecem com seu efeito explícito:
   `(vigência: até 2027-01-01 — migrar antes da expiração do protocolo)`.
   Fontes externas usam a marca da regra 9. Uma data de registro, por si só,
   não justifica permanecer no documento.
3. **Regra de ouro.** Todo AGENTS.md tem uma disciplina arquitetural central,
   formulada em uma frase, em negrito. Escolha a fronteira cuja violação é a
   mais cara de desfazer: borda de dados, tratamento de segredo, isolamento de
   tenant, tipo externo vazando entre camadas. O restante do documento se
   apresenta como desdobramento dessa regra.
4. **Nunca fazer.** Lista de proibições absolutas e específicas do projeto.
   Cada item carrega a justificativa ou a evidência na própria linha (exemplo:
   "descartados: testados, não funcionam neste hardware"). Se não existirem
   proibições específicas, omita a seção. Uma única proibição relevante basta;
   não a preencha com itens genéricos para atingir uma quantidade.
5. **Critérios de aceitação verificáveis.** Cada critério precisa poder virar
   um teste automatizado ou um roteiro de verificação manual. Formulações como
   "funciona bem" ou "é rápido" são proibidas. Teste prático: outra pessoa
   consegue dizer, sem perguntar a ninguém, se o critério passou?
6. **Documento vivo.** Uma convenção decidida durante a implementação é
   registrada no AGENTS.md no momento da decisão, com a justificativa em poucas
   palavras. O estado é sempre explícito: a seção "Decisões em aberto" com o
   texto "Nenhuma pendente" tem significado; uma seção ausente não tem. Ao
   comparar documentação e código, separe comportamento observado de requisito
   vigente: documento desatualizado pode ser corrigido; bug exige preservar o
   contrato e registrar o desvio; mudança de requisito exige decisão explícita.
   Sem evidência para classificar, registre a questão em aberto.
7. **Formato das decisões.** Uma decisão pendente é
   `- [ ] **<decisão>** — <contexto/opções> (afeta T<x.y>, quando houver)`.
   Resolver é uma **transição, não um estado**: a rodada remove a linha e
   escreve no lugar o que a resolução produziu — a convenção, a proibição, o
   gap, a exclusão de escopo (regra 2). O usuário vê a resolução duas vezes
   antes de ela sumir do documento: no diff proposto, onde a linha sai e o
   produto dela entra, e no resumo da rodada, que a nomeia. Uma decisão
   marcada `[x]` parada no arquivo é resto de rodada que não terminou o
   trabalho: alguém decidiu e ninguém converteu. (Os travessões acima são
   sintaxe literal do formato.)
8. **Jurisdição: cada fato tem um dono.** Um fato mora em exatamente um
   arquivo canônico. Os outros podem trazer um resumo curto com link explícito
   para o dono, quando isso evita navegação desnecessária no briefing ou nas
   instruções locais. O resumo não redefine a regra nem copia tabelas, listas
   de critérios ou decisões pendentes. Em caso de divergência, consulte o dono
   e registre o conflito; não trate o resumo como uma segunda autoridade.

   | fato                                   | dono        | os outros                          |
   | -------------------------------------- | ----------- | ---------------------------------- |
   | decisão de produto ou escopo           | `SPEC.md`   | referenciam pelo nome da decisão   |
   | decisão de ordem ou execução           | `PLAN.md`   | referenciam pelo nome da decisão   |
   | decisão sobre como escrever código     | `AGENTS.md` | referenciam pelo nome da decisão   |
   | stack e versões                        | `AGENTS.md` | o SPEC cita a tecnologia sem versão |
   | responsabilidade e fronteira de módulo | `SPEC.md`   | —                                  |
   | árvore de pastas e aliases             | `AGENTS.md` | o PLAN cita o módulo por nome      |
   | termo de domínio e invariante          | `DOMAIN.md` | SPEC e PLAN citam pelo id `I<n>`   |
   | critério de aceitação                  | `SPEC.md`   | o PLAN cita pelo número            |

9. **A justificativa acompanha a decisão.** Registre o porquê na mesma linha,
   em poucas palavras, geralmente entre parênteses. Caminhos rejeitados também
   são registrados — como proibição ou exclusão de escopo, no presente, nunca
   como narrativa (regra 2). Uma decisão sem justificativa será rediscutida do
   zero em alguma sessão futura. Convenção adotada de fonte externa registra
   fonte e versão na própria linha — `(fonte: docs oficiais <stack> <versão>,
   <mês/ano>)`; sem a marca, recomendação externa passa por decisão do projeto
   e nunca é re-verificada quando a versão muda.
10. **Rastreabilidade cruzada.** As tarefas do PLAN referenciam os módulos
    definidos no AGENTS.md; a seção de Riscos do PLAN referencia as constraints
    do SPEC pelo número; as decisões em aberto apontam as tarefas que dependem
    delas; critérios e tarefas que dependem de uma lei do domínio citam o
    invariante pelo id `I<n>`. Os arquivos formam um sistema.
11. **Escala honesta.** Gere apenas o que o projeto precisa. Não crie arquivo
    placeholder, seção "TBD" nem ROADMAP sem razão de existir. Um script de 300
    linhas recebe um AGENTS.md de uma página e talvez nenhum PLAN. A escala vale
    no tempo e no volume: o PLAN detalha tarefas só da fase corrente e da
    próxima — fases além ficam com objetivo e dependências, detalhadas na rodada
    que fechar a anterior (detalhe distante é especulação que apodrece); seção
    de área do AGENTS.md que passar de ~meia página extrai para docs/<tema>.md
    com um ponteiro de uma linha (o AGENTS.md é lido em toda sessão; volume ali
    cobra atenção sempre).
12. **Idioma.** Documentos de agente (AGENTS, SPEC, PLAN, DOMAIN) em pt-BR,
    mantendo o vocabulário técnico em inglês (hook, endpoint, stream).
    Documentos voltados ao público do repositório (README, ROADMAP,
    CONTRIBUTING) na língua desse público; inglês quando o projeto for open
    source internacional. Se o repositório já tiver documentação consistente em
    outra língua, pergunte antes de misturar.
13. **Tom.** Registro de contrato técnico: denso, direto, sem decoração (sem
    ASCII art, banners, emoji ou ênfase excessiva). Tabelas para dados
    tabulares; árvore de pastas comentada para estrutura; snippet de código
    apenas quando prosa não ensina o padrão. Prefira frases afirmativas simples
    a aforismos e frases de efeito; use travessão com parcimônia.
14. **Gatilho de geração.** Nenhum arquivo é escrito antes do aval explícito
    do usuário sobre a Proposta (Modo A) ou o Relatório de varredura (Modo B).
    Com o aval, gere nesta ordem: SPEC, PLAN, AGENTS, ponte CLAUDE.md e satélites.
    O aval já dado na sessão vale para o escopo que cobre; não o peça de novo.

## §3 Registro do interlocutor

Estas regras valem para a conversa (entrevista, relatórios, propostas), não
apenas para os arquivos gerados:

- Lidere com o veredito; sem aberturas de preenchimento ("Ótima pergunta",
  "Claro, posso ajudar").
- Mantenha a posição quando a evidência a sustenta; revisar para agradar é
  falha de qualidade. Revise apenas diante de evidência ou argumento novo.
- Conduza a entrevista e os relatórios na língua em que o usuário escrever,
  seguindo o input mais recente se ele trocar de língua. Os documentos
  gerados seguem a regra 12.

## §4 Marcador de rodada

A última linha do `PLAN.md` — do `AGENTS.md`, quando não há PLAN — carrega
`<!-- rodada: <nome> @ <ref> -->`, onde `<ref>` é a saída de
`git rev-parse --short HEAD` ou, sem repositório git, a data em `AAAA-MM-DD`.
A rodada seguinte parte dele (`git log <ref>..HEAD`) em vez de adivinhar qual
foi o último marco. Confira também mudanças ainda não commitadas; o marcador
delimita apenas os commits. Datas de vigência (regra 2) e de fontes externas (regra 9) têm finalidades distintas e também
são permitidas; não substituem o marcador.

## §5 Invariantes mecânicos

Os itens abaixo são verificados por `bin/docscheck.mjs`; o restante da
gramática permanece com o agente nas checagens de julgamento (teste do
terceiro, teste de deleção). `docscheck --explain <id>` imprime o porquê e os
exemplos de cada um.

Severidade `aviso` não muda o exit code. As famílias que dependem de calibração
por projeto — história (`H`), jurisdição (`J`) e ancoragem doc↔código (`A`) —
entram como aviso e só viram violação com `--strict` ou com
`{"strict": true}` no `.docscheck.json` do repositório.

<!-- REGRAS:início — tabela gerada por scripts/gerar-gramatica.mjs; não editar à mão -->

| id | regra | alvo | severidade | verifica |
| -- | ----- | ---- | ---------- | -------- |
| `E1` | §1 | todos | violação | papel declarado em blockquote no cabeçalho |
| `E2` | regra 11 | todos | violação | sem placeholder "TBD" |
| `E3` | §4 | todos | violação | marcador de rodada bem formado |
| `E4` | regra 7 | todos | violação | formato das decisões |
| `E5` | regra 13 | todos | violação | sem decoração: nenhum emoji no documento |
| `F1` | regra 1 | SPEC.md | violação | o cabeçalho declara a fronteira presente/futuro |
| `F2` | regra 1 | SPEC.md | violação | a seção "Planejado" abre com o blockquote de reforço |
| `F3` | regra 1 | SPEC.md | violação | a seção "Planejado" prometida no cabeçalho existe |
| `C1` | regra 3 | AGENTS.md | violação | regra de ouro presente |
| `C2` | regra 3 | AGENTS.md | violação | regra de ouro formulada em uma frase em negrito |
| `C3` | regra 4 | AGENTS.md | violação | "Nunca fazer" não fica vazio |
| `C4` | regra 4 | AGENTS.md | violação | cada proibição carrega a justificativa na própria linha |
| `C5` | regra 6 | AGENTS.md | violação | estado das decisões explícito |
| `T1` | regra 10 | PLAN.md | violação | id de tarefa único |
| `T2` | regra 10 | PLAN.md | violação | a tarefa declara seu módulo |
| `T3` | regra 10 | PLAN.md | violação | o módulo da tarefa existe no AGENTS.md |
| `T4` | regra 10 | PLAN.md | violação | o risco referencia uma constraint existente do SPEC |
| `T5` | regra 10 | todos | violação | decisão pendente aponta tarefa existente |
| `D1` | §1 | DOMAIN.md | violação | invariantes numerados e verificáveis |
| `D2` | regra 10 | SPEC.md, PLAN.md | violação | invariante citado existe no DOMAIN |
| `D3` | regra 8 | DOMAIN.md | aviso | o glossário define o termo, não a feature |
| `H1` | regra 2 | todos | aviso | sem datas de registro ou referência a rodada no corpo |
| `H2` | regra 7 | todos | aviso | decisão resolvida não permanece no documento |
| `H3` | regra 2 | todos | aviso | sem vocabulário narrativo |
| `H4` | regra 2 | PLAN.md | aviso | fase concluída sai do PLAN |
| `H5` | regra 2 | SPEC.md, PLAN.md | aviso | volume de SPEC/PLAN acima de 300 linhas |
| `J1` | regra 8 | todos | aviso | a mesma decisão não aparece em dois arquivos |
| `J2` | regra 8 | todos | aviso | fato de dono único não é repetido fora do dono |
| `A0` | regra 10 | manifest do projeto | aviso | a ancoragem alcança o ecossistema do projeto |
| `A1` | regra 10 | AGENTS.md | aviso | as pastas da árvore Estrutura existem no disco |
| `A2` | regra 10 | AGENTS.md (projeto com package.json ou Makefile) | aviso | "Como rodar" bate com os scripts do manifest |
| `A3` | regra 10 | AGENTS.md (projeto com package.json) | aviso | as versões da tabela Stack batem com o manifest |
| `A4` | regra 10 | AGENTS.md | aviso | os nomes de env citados existem no .env.example |
| `A5` | regra 10 | todos | aviso | os caminhos de arquivo citados nos documentos existem, inteiros ou como sufixo de um caminho do repositório |
| `A6` | §4 | PLAN.md, AGENTS.md | aviso | o marcador de rodada não está atrasado |
| `A7` | regra 11 | docs/ | aviso | satélites de docs/ têm ponteiro e índice, sem órfãos |
| `A8` | §1 | <pacote>/AGENTS.md | aviso | o AGENTS.md de pacote tem recipe própria |
| `A9` | §1 | AGENTS.md e contratos locais | aviso | a ponte do Claude, quando presente, importa o contrato canônico |
| `S1` | §5 | todos | violação | supressão declara o motivo |
| `V1` | regra 11 | AGENTS.md | aviso | volume do AGENTS.md acima de 200 linhas |

<!-- REGRAS:fim -->
