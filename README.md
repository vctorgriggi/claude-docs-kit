# agent-docs-kit

Uma skill para criar e manter a documentação de projetos usados por agentes.
Funciona no **Codex e no Claude Code**, com a mesma gramática, os mesmos
workflows e um verificador em Node, sem dependências externas.

`AGENTS.md` guarda o contrato. `CLAUDE.md` apenas importa `@AGENTS.md`, para
que ambos leiam as mesmas instruções. SPEC, PLAN e DOMAIN completam o contexto
quando o projeto precisa deles.

O projeto irmão [agent-code-kit](https://github.com/vctorgriggi/agent-code-kit) revisa o
código e verifica se ele respeita o contrato do projeto. Este kit cria e mantém
a documentação; os dois funcionam de forma independente, no Codex e no Claude Code.

## Instalação

Requisitos: Node ≥ 20, Git para as verificações de histórico e Bash em macOS,
Linux ou WSL. Dentro deste checkout:

```bash
./install.sh
```

O instalador cria três links para esta cópia do repositório:

| Local | Uso |
| --- | --- |
| `~/.agents/skills/docs` | Descoberta da skill pelo Codex |
| `~/.claude/skills/docs` | Descoberta da skill pelo Claude Code |
| `~/.local/bin/docscheck` | Verificador no terminal |

Inclua `~/.local/bin` no `PATH` para chamar `docscheck`. Abra uma nova sessão
para descobrir a skill. Edições neste checkout passam a valer sem copiar
arquivos; se mover ou renomear a pasta, rode `./install.sh` novamente.
O instalador recusa substituir diretórios ou arquivos comuns já existentes.

A instalação usa os locais e o suporte a symlinks documentados para
[Codex](https://learn.chatgpt.com/docs/build-skills) e
[Claude Code](https://code.claude.com/docs/en/skills). A ponte entre os contratos
usa a [importação de AGENTS.md pelo Claude Code](https://code.claude.com/docs/en/memory#agentsmd).

## Uso

No Codex, use `$docs`; no Claude Code, `/docs`. O restante da solicitação é
igual nos dois. A skill também pode ser selecionada pelo agente quando o pedido
corresponde à sua descrição.

| Ação | Quando | Resultado |
| --- | --- | --- |
| [fundar](workflows/fundar.md) | Projeto novo ou herdado | Entrevista ou varredura, proposta e doc-set |
| [tarefa](workflows/tarefa.md) | Antes de implementar | Briefing de uma tarefa do PLAN |
| [decidir](workflows/decidir.md) | Ao tomar uma decisão | Diff no documento que tem jurisdição |
| [auditar](workflows/auditar.md) | Para conferir docs contra código | Relatório de divergências, sem editar |
| [rodada](workflows/rodada.md) | Ao fechar um marco | Sincronização dos documentos |
| `estado` | Ao retomar o projeto | Fase, tarefas abertas e decisões pendentes |

```text
$docs fundar novo CLI para validar links
$docs fundar existente
$docs tarefa T2.1
$docs decidir resolver Formato do relatório
$docs auditar
$docs rodada primeira-entrega
$docs estado
```

No Claude Code, por exemplo: `/docs tarefa T2.1`.

O kit trabalha com documentação. `tarefa` prepara o briefing; a implementação
acontece na sessão normal. Antes de escrever, o agente apresenta a proposta ou
o diff e obtém o aval que ainda faltar. Uma autorização já dada continua válida.
Isso é uma instrução de trabalho; a skill não configura permissões nem isola
ferramentas. Restrições técnicas de escrita pertencem ao ambiente do agente.

## Documentos

| Arquivo | Papel | Quando |
| --- | --- | --- |
| `AGENTS.md` | Contrato de como escrever código | Sempre |
| `CLAUDE.md` | Ponte de uma linha: `@AGENTS.md` | Junto ao contrato, para Claude Code |
| `SPEC.md` | Produto atual ou recorte da primeira entrega; futuro separado | Sempre |
| `PLAN.md` | Fases, tarefas e dependências do trabalho à frente | Quando há trabalho que precisa de ordem |
| `DOMAIN.md` | Glossário e invariantes de negócio | Quando o domínio exige |
| `ROADMAP.md` | Direções públicas, sem promessas | Quando há razão para publicar essas direções |
| `docs/<tema>.md` | Conhecimento durável que não cabe no contrato | Quando necessário |
| `docs/README.md` | Índice dos satélites | Quando há mais de três |
| `<pacote>/AGENTS.md` | Regras locais sem repetir o contrato raiz | Monorepos com diferenças reais |
| `<pacote>/CLAUDE.md` | Importa o `AGENTS.md` do mesmo pacote | Junto ao contrato local |

Os [templates](templates/) são pontos de partida, não formulários obrigatórios.
Não há geração de placeholders para completar o conjunto.

## Regras

A [gramática](grammar/GRAMATICA.md) é a fonte normativa. Ela preserva o estado
atual, separa futuro de comportamento entregue, exige critérios verificáveis e
dá um dono canônico a cada fato. Resumos curtos com referência são permitidos;
decisões resolvidas viram regras ou mudanças concretas, não um diário.

Ao comparar código e documento, o agente distingue **documento desatualizado**,
**bug de implementação** e **mudança deliberada de requisito**. Um bug não
revoga o contrato. Datas de vigência podem ficar quando mudam uma ação atual.
Uma única proibição específica basta para a seção “Nunca fazer”.

Os documentos de agente usam pt-BR. Idioma do material público segue seu público.

## Verificação

```bash
docscheck .
docscheck --strict .
docscheck --json .
docscheck --estado .
docscheck --explain A5
docscheck ~/Workspaces/*
```

Sem instalar, execute `node bin/docscheck.mjs <projeto>` a partir deste checkout.
Exit codes: **0** sem violações, **1** com violações, **2** para erro de uso ou
configuração. Vários diretórios produzem um panorama e pulam os que não têm
doc-set; um único diretório sem doc-set é erro.

<!-- REGRAS:início — tabela gerada por scripts/gerar-gramatica.mjs; não editar à mão -->

| família | regras | o que cobre |
| ------- | ------ | ----------- |
| **Estrutura comum** | `E1` `E2` `E3` `E4` `E5` | papel declarado em blockquote no cabeçalho; … |
| **Fronteira presente/futuro** | `F1` `F2` `F3` | o cabeçalho declara a fronteira presente/futuro; … |
| **Contrato (AGENTS.md)** | `C1` `C2` `C3` `C4` `C5` | regra de ouro presente; … |
| **Rastreabilidade cruzada** | `T1` `T2` `T3` `T4` `T5` | id de tarefa único; … |
| **Domínio** | `D1` `D2` `D3` | invariantes numerados e verificáveis; … |
| **Presente permanente** *(aviso)* | `H1` `H2` `H3` `H4` `H5` | sem datas de registro ou referência a rodada no corpo; … |
| **Jurisdição** *(aviso)* | `J1` `J2` | a mesma decisão não aparece em dois arquivos; … |
| **Ancoragem doc↔código** *(aviso)* | `A0` `A1` `A2` `A3` `A4` `A5` `A6` `A7` `A8` `A9` | a ancoragem alcança o ecossistema do projeto; … |
| **Supressão** | `S1` | supressão declara o motivo |
| **Volume** *(aviso)* | `V1` | volume do AGENTS.md acima de 200 linhas |

<!-- REGRAS:fim -->

As famílias H, J e A são avisos calibráveis. `--strict` ou
`{"strict": true}` em `.docscheck.json` promove esses avisos a violações.
Uma supressão exige motivo: `<!-- docscheck: ignore A3 — motivo -->`.

As regras comuns também percorrem Markdown em `docs/` e contratos locais em
`packages/` e `apps/`. A ponte `CLAUDE.md` não duplica o contrato no verificador.
A ancoragem de comandos e versões compara `package.json` e `Makefile`; A0
informa quando encontra um ecossistema conhecido que não cobre. As demais
checagens de ancoragem não dependem da linguagem do código.

O resultado é uma verificação estrutural e heurística. Não comprova que toda
regra foi respeitada pela implementação; a auditoria acrescenta a leitura do
código e o julgamento. O estado é consultado explicitamente com `docs estado`
ou `docscheck --estado`; não há hook específico de agente.

## CI e manutenção

No projeto-alvo, copie `bin/docscheck.mjs` e rode:

```bash
node caminho/do/docscheck.mjs --strict .
```

Há também uma [action local](.github/actions/docscheck/action.yml); copie a
pasta da action para o projeto junto do verificador e configure seus caminhos.

Neste kit:

```bash
node --test test/*.test.mjs
node scripts/gerar-gramatica.mjs --check
node bin/docscheck.mjs --strict examples/fixtures/linkcheck examples/fixtures/pedidos examples/fixtures/monorepo
```

Ao alterar a gramática, atualize sua versão e o catálogo em `bin/docscheck.mjs`,
rode `node scripts/gerar-gramatica.mjs` e valide. A suíte cobre o verificador,
casos de mutação, integridade dos recursos e a instalação em diretórios
isolados. Os [cenários de regressão](examples/regressao-da-gramatica.md) cobrem
as decisões do agente; testes de arquivos não substituem essa avaliação.

## Exemplos

O [ciclo completo](examples/ciclo-completo.md) mostra o fluxo. Há transcrições
por ação no [índice de exemplos](examples/README.md) e três doc-sets com código:
[linkcheck](examples/fixtures/linkcheck/), [pedidos](examples/fixtures/pedidos/)
e [monorepo](examples/fixtures/monorepo/).
