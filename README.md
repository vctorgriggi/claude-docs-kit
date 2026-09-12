# claude-docs-kit

Comandos de [Claude Code](https://docs.claude.com/en/docs/claude-code/overview)
que montam e mantêm a documentação-de-agente de um projeto — SPEC, PLAN,
CLAUDE, DOMAIN e satélites — sempre na mesma gramática, com um verificador que
falha quando o documento deixa de descrever o código.

## Por quê

Gerar um SPEC.md bonito é fácil e resolve pouco. O problema é o mês seguinte:
o código anda, a documentação não, e o agente passa a obedecer um contrato que
ninguém revalidou. Pior — a documentação incha, porque cada rodada acrescenta
uma nota de "antes era assim" e nada nunca sai.

Este kit ataca os dois lados. Uma **gramática única**, verificável por máquina,
descreve como cada arquivo é escrito. Uma regra central — **presente
permanente** — proíbe cronologia: o que não muda como um agente age agora não
fica. E o verificador confere não só a forma dos documentos, mas se o que eles
afirmam sobre o repositório ainda é verdade.

**O contrato escrito aqui tem quem o cobre.** O
[claude-code-kit](https://github.com/vctorgriggi/claude-code-kit) é o irmão
deste: ele lê o `CLAUDE.md` gerado por aqui e acusa o código que o contradiz —
import cruzando a fronteira declarada na Estrutura, símbolo que o "Nunca fazer"
proíbe. **Um escreve o contrato, o outro cobra.** Os dois funcionam sozinhos; o
segundo só perde a lâmina mais afiada quando não há doc-set.

## O ciclo

```
        ┌──────────────────── doc-set vivo ────────────────────┐
        │                                                      │
   /docs:fundar → /docs:tarefa → (implementação) → /docs:decidir
        │                                                      │
        └──────────── /docs:auditar ←→ /docs:rodada ───────────┘
```

| comando | quando | direção | escreve | veja funcionando |
| --- | --- | --- | --- | --- |
| [**`/docs:fundar`**](commands/docs/fundar.md) | ao começar, ou ao herdar um repo | entrevista→docs, ou código→docs | os documentos | [01](examples/01-modo-a-cli-nova.md) · [02](examples/02-modo-b-varredura.md) |
| [**`/docs:tarefa T2.1`**](commands/docs/tarefa.md) | antes de implementar | docs→código | nada — entrega o briefing | [03](examples/03-tarefa-e-decidir.md) |
| [**`/docs:decidir`**](commands/docs/decidir.md) | no momento em que algo é decidido | conversa→docs | o diff da decisão | [03](examples/03-tarefa-e-decidir.md) |
| [**`/docs:auditar`**](commands/docs/auditar.md) | a qualquer momento, e no CI | código→docs | **nada** — só relatório | [04](examples/04-auditar.md) |
| [**`/docs:rodada`**](commands/docs/rodada.md) | ao fechar um marco | código→docs | os documentos | [05](examples/05-rodada.md) |

**O escopo do kit é documentação.** Os comandos instruem o agente a não
escrever código; `/docs:tarefa` prepara a implementação e para. `Write` e
`Edit` não são pré-autorizados em `allowed-tools`, mas a configuração da sessão
continua governando essas ferramentas: omiti-las não garante bloqueio nem um
novo prompt de permissão. A aprovação do diff é uma instrução conversacional.
Para auditoria com bloqueio técnico de escrita, configure restrições efetivas
no ambiente de execução; a lista de pré-autorização não fornece isolamento.

**E o ciclo não depende de você lembrar dele.** Os cinco comandos são *pull* —
alguém precisa invocá-los. O [hook de `SessionStart`](#o-estado-chegar-ate-voce-em-vez-de-esperar-ser-procurado)
fecha essa lacuna no único momento em que ela importa: ao abrir uma sessão no
repositório, o estado do doc-set entra no contexto, e um aviso aparece na tela
se houver violação ou se o marcador estiver atrasado. É opcional, e vem
desligado.

## O que sai disso

Um `CLAUDE.md` gerado abre assim — o contrato que toda sessão lê antes de
tocar no código:

```markdown
## Regra de ouro

**Zero dependências de runtime: toda funcionalidade usa apenas a stdlib do
Node.** Tudo abaixo é desdobramento disso. Uma feature que "precisa" de pacote
externo ou é reescrita sobre a stdlib ou não entra.

## Nunca fazer

- Nunca replicar condição de transição no chamador — é a divergência que a
  biblioteca existe para eliminar.
- Nunca usar float para dinheiro — 0.1 + 0.2 não fecha caixa (I3).
```

E o verificador diz, com exit code, quando o documento deixou de descrever o
código:

```
$ docscheck .
CLAUDE.md:12 [A1] a árvore da Estrutura cita "src/parser.js", que não existe
CLAUDE.md:21 [A3] a tabela Stack declara Node 18; o package.json exige >=22
PLAN.md:61  [A6] 41 commits desde a última rodada (a1b2c3d)
resumo: 3 violação(ões) da gramática        # exit 1
```

Os doc-sets completos estão em [`examples/fixtures/`](examples/fixtures/) —
[`linkcheck`](examples/fixtures/linkcheck/) para o caso simples,
[`pedidos`](examples/fixtures/pedidos/) para domínio com invariantes,
[`monorepo`](examples/fixtures/monorepo/) para vários pacotes e satélites em
`docs/`. As sessões que os produziram estão em [`examples/`](examples/).

## O que ele gera

| Arquivo | Papel | Quando |
| --- | --- | --- |
| `SPEC.md` | O quê e por quê; fronteira entre presente e planejado | Sempre |
| `CLAUDE.md` | Contrato de como o código é escrito | Sempre |
| `PLAN.md` | Execução fatiada em fases; tarefas com módulo e aceitação | Quando há trabalho à frente |
| `DOMAIN.md` | Glossário e invariantes de negócio, com id `I<n>` | Domínio com vocabulário próprio, ou leis que o código não declara |
| `ROADMAP.md` | Direções sem promessa | Repositório público ou ambições além do SPEC |
| `docs/<tema>.md` | Conhecimento caro e durável | Quando uma área do CLAUDE.md passa de ~meia página |
| `docs/README.md` | Mapa da documentação | docs/ passa de cerca de 3 arquivos |
| `<pacote>/CLAUDE.md` | Recipe local de pacote | Monorepos |
| `AGENTS.md` | Espelho curto para outros agentes | Quando coexistem outros agentes |

O kit não gera placeholders; um arquivo só é criado quando há razão para ele
existir.

## Em que projetos isso funciona

**A gramática e os comandos são agnósticos de linguagem** — o `/docs:fundar`
varre `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile` e
`Package.swift`.

**A ancoragem doc↔código não é.** `A2` (comandos de "Como rodar") e `A3`
(versões da Stack) só comparam contra `package.json` e `Makefile`; nos demais
ecossistemas o `A0` avisa que essas duas não rodaram, em vez de deixar o verde
significar duas coisas diferentes. As outras seis checagens da família — árvore
no disco, env, ponteiro morto, frescor do marcador, satélites, monorepo —
funcionam em qualquer projeto.

Onde ele **não** compensa: script de 50 linhas, protótipo descartável, ou
repositório em que nenhum agente vai trabalhar. A gramática cobra disciplina
que só se paga quando alguém — humano ou modelo — volta ao código depois.

## Instalação

```bash
git clone https://github.com/vctorgriggi/claude-docs-kit
cd claude-docs-kit
./install.sh
```

Instala os comandos em `~/.claude/commands/docs/` (viram `/docs:<nome>`), o
`docscheck` em `~/.claude/bin/`, e a gramática e os templates em
`~/.claude/docs-kit/`. Os comandos leem a gramática em runtime; sem ela
instalada, param e avisam.

Para restringir a um único projeto, copie `commands/docs/` para
`.claude/commands/docs/` dentro dele.

## Uso

```
/docs:fundar                    # detecta: diretório vazio = entrevista; código = varredura
/docs:fundar novo <contexto>    # projeto do zero, já com contexto inicial
/docs:fundar existente          # força o modo varredura
/docs:tarefa T2.1               # briefing de implementação de uma tarefa do PLAN
/docs:decidir <a decisão>       # registra no arquivo de jurisdição correta
/docs:decidir resolver <nome>   # fecha uma pendência convertendo-a no que ela produziu
/docs:auditar                   # relatório de drift, read-only
/docs:auditar <área>            # foca a auditoria numa área ou arquivo
/docs:rodada <nome>             # fecha um marco e sincroniza
```

`/docs:fundar` tem dois modos. Em projeto novo, entrevista em blocos curtos
(problema e usuários; recorte da primeira entrega; stack e restrições;
disciplina), consulta a documentação oficial da stack declarada quando ela tem
pontos de escolha, propõe o conjunto de arquivos e só gera após aprovação. Em
projeto existente, varre o repositório primeiro e devolve um relatório em três
partes — observado, inferido e não determinável. Intenção nunca é inventada.

`/docs:rodada` fecha um marco. Antes de editar, ela **converte**: cada fato novo
passa pela pergunta "isto muda como um agente age daqui em diante?". Muda, vira
convenção, proibição, gap ou exclusão de escopo. Não muda, não entra — o git
guarda a íntegra e o marcador de rodada dá o eixo do tempo.

## A gramática

O texto normativo vive em [`grammar/GRAMATICA.md`](grammar/GRAMATICA.md) — é a
**fonte única**, lida em runtime por todos os comandos. Nenhum comando a
parafraseia, e a tabela de invariantes mecânicos dela é gerada do catálogo do
verificador.

As quatorze regras, em resumo: fronteira entre presente e futuro no SPEC ·
**presente permanente** (sem cronologia) · regra de ouro · proibições
justificadas na linha · critérios verificáveis · documento vivo · resolver é
transição, não estado · **cada fato tem um dono** · a justificativa acompanha a
decisão · rastreabilidade cruzada · escala honesta · pt-BR nos documentos de
agente · tom de contrato técnico · nada gerado sem aval.

### Presente permanente

A regra que mais muda o resultado a longo prazo:

> Nenhum documento narra cronologia. Um fato do passado só permanece se tiver
> sido **convertido** em algo que muda o comportamento agora — uma proibição,
> uma convenção com justificativa, um gap com paliativo, uma exclusão de
> escopo. Convertido, ele perde a data e o "antes era assim". Não convertível,
> ele sai.

A garantia contra apagar em silêncio não é manter no documento: é o diff
aprovado da rodada, o marcador de rodada e o git. Fase concluída sai do PLAN;
decisão resolvida vira o que ela produziu e a linha sai; desvio de execução ou
ensinou uma convenção ou não sobrevive à fase.

### Jurisdição

Cada fato tem um arquivo canônico; os outros referenciam esse dono. Resumos
curtos com link são permitidos quando ajudam a agir sem navegação excessiva.
Stack com versão é do CLAUDE.md e o SPEC cita a tecnologia sem versão; critério
de aceitação é do SPEC e o PLAN cita pelo número; invariante de negócio é do
DOMAIN e todos citam por `I<n>`. Fato repetido são duas verdades que divergem
na primeira mudança, e nenhuma delas se sabe desatualizada.

## Verificação

**[`bin/docscheck.mjs`](bin/docscheck.mjs)** — verificador executável, Node ≥ 20,
zero dependências, instalação por cópia.

```bash
node ~/.claude/bin/docscheck.mjs .            # exit 0 sem violações, 1 com, 2 erro de uso
node ~/.claude/bin/docscheck.mjs --strict .   # H, J e A viram violação
node ~/.claude/bin/docscheck.mjs --json .     # para CI e para os comandos
node ~/.claude/bin/docscheck.mjs --explain H2 # o porquê e os exemplos de uma regra
```

<!-- REGRAS:início — tabela gerada por scripts/gerar-gramatica.mjs; não editar à mão -->

| família | regras | o que cobre |
| ------- | ------ | ----------- |
| **Estrutura comum** | `E1` `E2` `E3` `E4` `E5` | papel declarado em blockquote no cabeçalho; … |
| **Fronteira presente/futuro** | `F1` `F2` `F3` | o cabeçalho declara a fronteira presente/futuro; … |
| **Contrato (CLAUDE.md)** | `C1` `C2` `C3` `C4` `C5` | regra de ouro presente; … |
| **Rastreabilidade cruzada** | `T1` `T2` `T3` `T4` `T5` | id de tarefa único; … |
| **Domínio** | `D1` `D2` `D3` | invariantes numerados e verificáveis; … |
| **Presente permanente** *(aviso)* | `H1` `H2` `H3` `H4` `H5` | sem datas de registro ou referência a rodada no corpo; … |
| **Jurisdição** *(aviso)* | `J1` `J2` | a mesma decisão não aparece em dois arquivos; … |
| **Ancoragem doc↔código** *(aviso)* | `A0` `A1` `A2` `A3` `A4` `A5` `A6` `A7` `A8` | a ancoragem alcança o ecossistema do projeto; … |
| **Supressão** | `S1` | supressão declara o motivo |
| **Volume** *(aviso)* | `V1` | volume do CLAUDE.md acima de 200 linhas |

<!-- REGRAS:fim -->

A gramática v6 permite uma única proibição, exige a seção de decisões no
contrato raiz e verifica as regras comuns também nos arquivos Markdown de
`docs/` (inclusive subpastas) e nos contratos locais sob `packages/` e `apps/`.
Contratos locais não precisam repetir as seções obrigatórias da raiz. Espelhos
por symlink são ignorados. `--strict` pode revelar problemas antes não detectados
nesses documentos; a verificação continua heurística, não prova equivalência
semântica entre contrato e implementação.

As famílias `H`, `J` e `A` entram como **aviso** porque dependem de calibração
por projeto; `--strict`, ou `{"strict": true}` num `.docscheck.json` no
repositório-alvo, as promove a violação. Um achado que não se sustenta pode ser
silenciado com `<!-- docscheck: ignore A3 — motivo -->` — sem motivo na linha,
a própria supressão vira violação.

Fora do verificador: o **marcador de rodada** (`<!-- rodada: <nome> @ <sha> -->`
no fim do PLAN) delimita os commits da rodada seguinte, complementados pelo
estado das mudanças ainda não commitadas; a aprovação conversacional rege os
diffs propostos; e as **checagens de julgamento**
(teste do terceiro, teste de deleção) seguem com o agente.

### Panorama de vários projetos

Um diretório é "verifique isto" — a ausência de doc-set é erro de uso. Vários é
"quais destes derivaram" — diretório sem doc-set é pulado em silêncio:

```
$ docscheck ~/Workspaces/*
linkcheck  ok
monorepo   ok
notas-api  3 violação(ões)
             CLAUDE.md:1 [E1] sem blockquote de papel logo abaixo do título (§1)
             CLAUDE.md:1 [C1] sem seção "Regra de ouro" (regra 3)
             CLAUDE.md:1 [C5] declare "Decisões em aberto" com pendências ou "Nenhuma pendente." (regra 6)
pedidos    ok

resumo: 1 de 4 doc-set(s) com violação
```

### O estado chegar até você, em vez de esperar ser procurado

O resto do kit é **pull**: você precisa lembrar de rodar `/docs:auditar`. O hook
de `SessionStart` inverte isso no único momento em que importa — quando alguém
abre uma sessão para mexer no código:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "node ~/.claude/docs-kit/hooks/estado-na-sessao.mjs"
      }]
    }]
  }
}
```

O `install.sh` copia o script mas **não liga o hook** — isso é edição de
`settings.json`, e é sua decisão. Ligado, ele injeta no contexto da sessão a
fase corrente, as tarefas abertas, as decisões pendentes e o resultado do
`docscheck`; e mostra um aviso na tela só quando há violação ou o marcador está
atrasado. Em diretório sem doc-set não imprime nada, e erro nele nunca trava a
sessão.

O mesmo estado, em JSON, para statusline ou script próprio:

```bash
docscheck --estado .   # {fase_atual, tarefas_abertas, decisoes_pendentes, invariantes, marcador}
```

### No CI de um projeto-alvo

Copie `bin/docscheck.mjs` para `.github/docscheck.mjs` e use a action:

```yaml
- uses: ./.github/actions/docscheck
  with:
    strict: "true"
```

### No CI deste repo

Sete camadas, todas rápidas e sem custo de token:

| passo | o que garante |
| --- | --- |
| [`test/docscheck.test.mjs`](test/docscheck.test.mjs) | cada regra do catálogo se comporta como o `--explain` dela promete |
| [`test/mutacao.test.mjs`](test/mutacao.test.mjs) | cada regra tem um caso que **detecta uma violação no fixture**: parte de um fixture limpo, quebra um invariante do jeito que um humano quebraria e exige que a regra acuse |
| [`test/coerencia.test.mjs`](test/coerencia.test.mjs) | links, caminhos, ids de regra, nomes de comando e tabelas cruzadas resolvem em todo o repositório |
| [`test/completude.test.mjs`](test/completude.test.mjs) | confere as ligações previstas: comando sem transcrição, regra sem caso de mutação, suíte que o CI não roda, fixture que nada exercita, regra da gramática que ninguém enforça nem declara como julgamento |
| `scripts/gerar-gramatica.mjs --check` | as tabelas da gramática e do README estão em dia com o catálogo |
| `node --test` em cada fixture | o código sob os doc-sets de referência funciona — no `pedidos`, cada teste nomeia o invariante de domínio que prova |
| `docscheck --strict` nos dois fixtures | os exemplos obedecem a gramática que ensinam |

As duas camadas do meio existem por razões diferentes, e as duas por
experiência própria:

- **Mutação**, porque teste unitário prova que a regra dispara no input que o
  autor inventou — não que ela pegaria a violação que aparece no mundo. Regra
  que não detecta nada é decoração, e decoração num verificador é pior que
  ausência: o CI verde passa a mentir.
- **Completude**, porque a lacuna típica não é um bug, é uma peça que ninguém
  lembrou de ligar. Se a completude depende de memória, ela falha — então cada
  "não esqueci de" virou asserção. Rule of thumb do repo: quando algo só está
  certo porque alguém lembrou, o certo é fazer a máquina lembrar.

Cinco coisas passavam batido antes e agora quebram o build: editar uma regra sem
regerar a tabela; criar uma regra sem teste que a nomeie; criar uma regra sem
caso de mutação que prove que ela morde; renomear qualquer coisa deixando uma
referência pendurada; e adicionar um comando, um fixture ou uma suíte sem ligar
nos lugares onde ele precisa aparecer.

## Veja funcionando

**[O ciclo completo](examples/ciclo-completo.md)** é o melhor ponto de partida:
uma semana no linkcheck, do hook na segunda à rodada na sexta, com as partes
que não são comando — verificador no terminal, panorama entre projetos, CI.

Depois dele, as transcrições anotadas em [`examples/`](examples/), uma por
comando, e três doc-sets de referência com código real por baixo:

- [`fixtures/linkcheck/`](examples/fixtures/linkcheck/) — a gramática no caso
  simples: core puro, borda fina, uma fase viva.
- [`fixtures/monorepo/`](examples/fixtures/monorepo/) — o caso de vários
  pacotes: recipe local por pacote sem repetir o contrato raiz (`A8`), e
  satélite em `docs/` com ponteiro de ida e volta (`A7`).
- [`fixtures/pedidos/`](examples/fixtures/pedidos/) — a referência do
  `DOMAIN.md`: glossário, invariantes `I<n>` rastreados até o nome dos testes,
  máquina de estados e regras de cálculo.

Os três passam `docscheck --strict` com **zero achados** no CI — é a única
forma honesta de manter um exemplo confiável.

## Limitações conhecidas

- A gramática é opinativa e fixa pt-BR para documentos de agente — escolha de
  design, não defeito; limita o reuso a projetos lusófonos.
- O fluxo depende de aprovação humana em cada gate; nada é gerado de forma
  autônoma.
- A cópia instalada não se atualiza sozinha após editar a fonte; rode
  `./install.sh` de novo.
- O `docscheck` cobre o mecânico; teste do terceiro e teste de deleção seguem
  auto-aplicados pelo agente, sem verificação externa.
- A ancoragem doc↔código (família `A`) é heurística por natureza: entra como
  aviso e pode precisar de supressão justificada em repositório atípico.
- Os comandos usam o formato clássico (`~/.claude/commands/`), não o formato
  mais recente de skills.
- `/docs:fundar` pré-autoriza WebFetch/WebSearch para a pesquisa de stack. Quem
  preferir superfície mínima remove as duas do `allowed-tools`; o passo degrada
  sem quebrar.

## Personalização

A fonte da verdade é [`grammar/GRAMATICA.md`](grammar/GRAMATICA.md). Para mudar
uma convenção:

1. Edite a regra ali e incremente a versão declarada no topo.
2. Se a mudança tiver lado mecânico, atualize o catálogo `REGRAS` de
   [`bin/docscheck.mjs`](bin/docscheck.mjs) — a constante `GRAMATICA` acompanha
   a versão, e o teste acusa divergência.
3. `node scripts/gerar-gramatica.mjs` regera as tabelas da gramática e deste
   README.
4. `node --test test/*.test.mjs` e
   `node bin/docscheck.mjs --strict examples/fixtures/linkcheck`.
5. `./install.sh` para atualizar a cópia instalada.

Confira [`examples/regressao-da-gramatica.md`](examples/regressao-da-gramatica.md)
antes de reinstalar: resultado divergente que não era a intenção da edição é
deriva. `./scripts/regressao-smoke.sh` roda os casos baratos em headless (custa
tokens).

Regra nova exige teste que a nomeie — a suíte falha se faltar. Renomear um
comando é renomear o arquivo: `commands/docs/rodada.md` responde por
`/docs:rodada`.
