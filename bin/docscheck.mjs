#!/usr/bin/env node
// docscheck: verifica os invariantes mecânicos da gramática do agent-docs-kit
// no doc-set de um diretório (SPEC, PLAN, AGENTS, DOMAIN, ROADMAP,
// docs/ e AGENTS.md de pacote) e a ancoragem dele no código. Zero dependências
// (Node ≥ 20); instalação por cópia, como o restante do kit.
//
// Uso: node docscheck.mjs [diretório]
//      node docscheck.mjs --explain <id>     catálogo de uma regra
//      node docscheck.mjs --json [diretório] saída legível por máquina
//      node docscheck.mjs --strict [dir]     H/J/A viram violação
// Exit: 0 sem violações; 1 com violações; 2 erro de uso. Avisos não mudam o
// exit.
//
// O catálogo REGRAS abaixo é a fonte legível-por-máquina dos invariantes
// mecânicos: a tabela de grammar/GRAMATICA.md é gerada dele
// (scripts/gerar-gramatica.mjs) e o --explain o imprime. Nenhum invariante
// mecânico deve existir só no texto normativo ou só aqui.
//
// Cobre apenas o verificável por máquina. As checagens de julgamento da
// gramática (teste do terceiro nos critérios de aceitação, teste de deleção)
// permanecem com o agente nas checagens de entrega.

import { readFile, readdir, lstat } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Os documentos do doc-set que carregam a gramática. Os invariantes comuns
// (família E, mais H1/H3/J1/A5) valem para todos; os específicos são chaveados
// por nome. AGENTS.md é o contrato canônico; a ponte CLAUDE.md não duplica
// o contrato nas regras comuns. Symlinks de documentos são ignorados.
const ARQUIVOS = [
  "SPEC.md",
  "PLAN.md",
  "AGENTS.md",
  "DOMAIN.md",
  "ROADMAP.md",
];

// Versão da gramática que este verificador implementa. Deve acompanhar a
// declaração "Versão da gramática" em grammar/GRAMATICA.md; o teste do kit
// acusa divergência.
export const GRAMATICA = "v8";

// Limite brando de volume do AGENTS.md (regra 11): acima disso vira aviso —
// nunca violação; o critério de corte segue sendo o teste de deleção.
const LIMITE_CONTRATO = 200;

// Limite brando de SPEC e PLAN (regra 2): gatilho de revisão por acúmulo —
// fase que não saiu, decisão que não foi convertida, desvio virado nota.
const LIMITE_SPEC_PLAN = 300;

// <!-- rodada: <nome> @ <sha curto | AAAA-MM-DD (sem git)> -->
const MARCADOR = /^<!-- rodada: .+ @ ([0-9a-f]{7,40}|\d{4}-\d{2}-\d{2}) -->$/;

// Catálogo dos invariantes mecânicos. Prefixos por família:
//   E — estrutura comum a todos os documentos
//   F — fronteira presente/futuro (SPEC)
//   C — contrato (AGENTS)
//   T — rastreabilidade cruzada
//   H — presente permanente (história que não foi convertida nem cortada)
//   J — jurisdição (fato repetido fora do seu dono)
//   V — volume
// Campos: id · regra (referência ao texto normativo) · alvo · severidade ·
// titulo · porque · ok/ruim (exemplos mínimos, consumidos por --explain e pelo
// corpus). `promovivel: true` marca a regra que vira violação sob --strict;
// ausente equivale a false (o aviso nunca muda o exit code).
export const REGRAS = [
  {
    id: "E1",
    regra: "§1",
    alvo: "todos",
    severidade: "violacao",
    titulo: "papel declarado em blockquote no cabeçalho",
    porque:
      "Um agente que abre o arquivo no meio de uma sessão precisa saber na primeira linha o que este documento é — e o que ele nunca é.",
    ok: "# SPEC.md\n\n> Descreve o produto atual; o planejado vive na seção final.",
    ruim: "# SPEC.md\n\nDescrição solta, sem blockquote de papel.",
  },
  {
    id: "E2",
    regra: "regra 11",
    alvo: "todos",
    severidade: "violacao",
    titulo: 'sem placeholder "TBD"',
    porque:
      "Placeholder é escala desonesta: o agente lê TBD como permissão para inventar o que falta.",
    ok: "## Decisões em aberto\n\n- [ ] **Formato do relatório** — texto ou JSON.",
    ruim: "## Formato do relatório\n\nTBD",
  },
  {
    id: "E3",
    regra: "§4",
    alvo: "todos",
    severidade: "violacao",
    titulo: "marcador de rodada bem formado",
    porque:
      "A rodada seguinte levanta as mudanças com `git log <ref>..HEAD`; marcador fora do formato faz a janela virar adivinhação.",
    ok: "<!-- rodada: fase-1 @ b7e4d21 -->",
    ruim: "<!-- rodada: fase-1 -->",
  },
  {
    id: "E4",
    regra: "regra 7",
    alvo: "todos",
    severidade: "violacao",
    titulo: "formato das decisões",
    porque:
      "O formato fixo é o que deixa o estado da decisão inequívoco e legível por máquina.",
    ok: "- [ ] **Formato do relatório** — texto simples ou JSON (afeta T1.2).",
    ruim: "- [ ] decidir o formato do relatório",
  },
  {
    id: "E5",
    regra: "regra 13",
    alvo: "todos",
    severidade: "violacao",
    titulo: "sem decoração: nenhum emoji no documento",
    porque:
      "O registro é de contrato técnico. Emoji num documento que o agente lê como norma dilui a distinção entre o que é regra e o que é enfeite — e, na prática, ninguém escreve só um. Notação com variante emoji não conta: `↔`, `→`, `≥` e `✓` passam, e a árvore de pastas com `├──` também.",
    ok: "## Nunca fazer\n\n- Nunca usar `var` — escopo de função quebra os closures.",
    ruim: "## Nunca fazer 🚫\n\n- ⚠️ Nunca usar `var`!",
  },
  {
    id: "F1",
    regra: "regra 1",
    alvo: "SPEC.md",
    severidade: "violacao",
    titulo: "o cabeçalho declara a fronteira presente/futuro",
    porque:
      "Sem a fronteira anunciada no cabeçalho, um agente lê feature planejada como já existente — e assume que ela está lá, ou a implementa de novo.",
    ok: '> Descreve o produto atual. O que foi planejado e ainda não implementado está na seção final "Planejado".',
    ruim: "> Descreve o produto.",
  },
  {
    id: "F2",
    regra: "regra 1",
    alvo: "SPEC.md",
    severidade: "violacao",
    titulo: 'a seção "Planejado" abre com o blockquote de reforço',
    porque:
      "O aviso repetido na própria seção é o que segura a leitura de quem entrou direto ali, sem passar pelo cabeçalho.",
    ok: "## Planejado / fases posteriores\n\n> O que está abaixo é **planejado** e não faz parte do app atual.",
    ruim: "## Planejado / fases posteriores\n\n### Relatório JSON",
  },
  {
    id: "F3",
    regra: "regra 1",
    alvo: "SPEC.md",
    severidade: "violacao",
    titulo: 'a seção "Planejado" prometida no cabeçalho existe',
    porque:
      "Cabeçalho que promete uma fronteira inexistente é pior que fronteira ausente: o agente confia numa separação que o documento não faz.",
    ok: '> …está na seção final "Planejado".\n\n## Planejado / fases posteriores\n\n> Nada planejado no momento.',
    ruim: '> …está na seção final "Planejado".\n\n(documento termina sem a seção)',
  },
  {
    id: "C1",
    regra: "regra 3",
    alvo: "AGENTS.md",
    severidade: "violacao",
    titulo: "regra de ouro presente",
    porque:
      "A disciplina central é a âncora da qual as outras regras derivam; sem ela o AGENTS.md vira lista de preferências avulsas.",
    ok: "## Regra de ouro\n\n**Zero dependências de runtime.** Tudo abaixo é desdobramento disso.",
    ruim: "(documento sem a seção)",
  },
  {
    id: "C2",
    regra: "regra 3",
    alvo: "AGENTS.md",
    severidade: "violacao",
    titulo: "regra de ouro formulada em uma frase em negrito",
    porque:
      "O negrito é o que separa a disciplina central do parágrafo que a explica; sem ele não há uma frase para citar quando a regra é violada.",
    ok: "**Zero dependências de runtime.** Tudo abaixo é desdobramento disso.",
    ruim: "Evitamos dependências externas sempre que dá.",
  },
  {
    id: "C3",
    regra: "regra 4",
    alvo: "AGENTS.md",
    severidade: "violacao",
    titulo: '"Nunca fazer" não fica vazio',
    porque:
      "Uma proibição específica e relevante basta. Sem proibições, omita a seção em vez de preencher com itens genéricos.",
    ok: "## Nunca fazer\n\n- Nunca expor tokens — permite acesso indevido.",
    ruim: "## Nunca fazer\n\n## Convenções",
  },
  {
    id: "C4",
    regra: "regra 4",
    alvo: "AGENTS.md",
    severidade: "violacao",
    titulo: "cada proibição carrega a justificativa na própria linha",
    porque:
      "Proibição sem o porquê na linha é rediscutida do zero em alguma sessão futura, e vencida pelo primeiro argumento razoável.",
    ok: "- Nunca usar `var` — escopo de função quebra os closures dos handlers.",
    ruim: "- Nunca usar `var`.",
  },
  {
    id: "C5",
    regra: "regra 6",
    alvo: "AGENTS.md",
    severidade: "violacao",
    titulo: "estado das decisões explícito",
    porque:
      'Seção vazia e seção ausente têm significados diferentes: "Nenhuma pendente." afirma que a pergunta foi feita.',
    ok: "## Decisões em aberto\n\nNenhuma pendente.",
    ruim: "## Decisões em aberto\n\n## Próxima seção",
  },
  {
    id: "T1",
    regra: "regra 10",
    alvo: "PLAN.md",
    severidade: "violacao",
    titulo: "id de tarefa único",
    porque:
      "Id repetido quebra a rastreabilidade: uma decisão que aponta T2.1 passa a apontar duas tarefas diferentes.",
    ok: "- [ ] T1.1 — … · módulo: core\n- [ ] T1.2 — … · módulo: cli",
    ruim: "- [ ] T1.1 — … · módulo: core\n- [ ] T1.1 — … · módulo: cli",
  },
  {
    id: "T2",
    regra: "regra 10",
    alvo: "PLAN.md",
    severidade: "violacao",
    titulo: "a tarefa declara seu módulo",
    porque:
      "Tarefa que não nomeia o módulo não fecha o triângulo SPEC→PLAN→AGENTS; o agente escolhe sozinho onde escrever.",
    ok: "- [ ] T1.1 — extração de links · módulo: check",
    ruim: "- [ ] T1.1 — extração de links",
  },
  {
    id: "T3",
    regra: "regra 10",
    alvo: "PLAN.md",
    severidade: "violacao",
    titulo: "o módulo da tarefa existe no AGENTS.md",
    porque:
      "Módulo ausente da Estrutura e dos títulos do AGENTS.md é nome inventado no plano — o agente cria a pasta em qualquer lugar.",
    ok: "Estrutura do AGENTS.md contém `src/check.js`; a tarefa usa `· módulo: check`.",
    ruim: "A tarefa usa `· módulo: parser`, que não aparece no AGENTS.md.",
  },
  {
    id: "T4",
    regra: "regra 10",
    alvo: "PLAN.md",
    severidade: "violacao",
    titulo: "o risco referencia uma constraint existente do SPEC",
    porque:
      "Risco que aponta constraint inexistente é rastreabilidade decorativa: some a checagem e o número nunca mais é conferido.",
    ok: "- **Falso negativo em âncora** (SPEC, constraint 1) → mitigado em T0.2.",
    ruim: "- **Falso negativo em âncora** (SPEC, constraint 7) → …",
  },
  {
    id: "T5",
    regra: "regra 10",
    alvo: "todos",
    severidade: "violacao",
    titulo: "decisão pendente aponta tarefa existente",
    porque:
      "A decisão em aberto existe para destravar um trabalho; sem tarefa viva do outro lado ela não bloqueia nada e nunca é resolvida.",
    ok: "- [ ] **Formato do relatório** — afeta T1.2.",
    ruim: "- [ ] **Formato do relatório** — afeta T9.9.",
  },
  {
    id: "D1",
    regra: "§1",
    alvo: "DOMAIN.md",
    severidade: "violacao",
    titulo: "invariantes numerados e verificáveis",
    porque:
      "O invariante existe para ser citado de fora (por um critério, por uma tarefa) e para virar teste. Sem id ele não é referenciável; sem forma verificável ele é um desejo.",
    ok: "## Invariantes\n\n1. **I1 — pedido cancelado nunca volta a pago** — a transição não existe na máquina de estados.",
    ruim: "## Invariantes\n\n- O fluxo de pagamento precisa ser consistente.",
  },
  {
    id: "D2",
    regra: "regra 10",
    alvo: "SPEC.md, PLAN.md",
    severidade: "violacao",
    titulo: "invariante citado existe no DOMAIN",
    porque:
      "Critério ou tarefa que aponta um `I<n>` inexistente é rastreabilidade decorativa — o agente procura a lei do domínio e não acha.",
    ok: "- [ ] T2.1 — bloquear a transição · módulo: pedidos (garante I1)",
    ruim: "- [ ] T2.1 — bloquear a transição · módulo: pedidos (garante I9)",
  },
  {
    id: "D3",
    regra: "regra 8",
    alvo: "DOMAIN.md",
    severidade: "aviso",
    promovivel: true,
    titulo: "o glossário define o termo, não a feature",
    porque:
      "Glossário que descreve comportamento invade o SPEC (regra 8) e passa a divergir dele. Aqui mora o que a palavra significa e o que ela não é.",
    ok: "- **Pedido** — intenção de compra confirmada pelo cliente. Não é carrinho: carrinho não reserva estoque.",
    ruim: "- **Pedido** — o usuário clica em comprar, o sistema valida o estoque e envia o e-mail de confirmação.",
  },
  {
    id: "H1",
    regra: "regra 2",
    alvo: "todos",
    severidade: "aviso",
    promovivel: true,
    titulo: "sem datas de registro ou referência a rodada no corpo",
    porque:
      "Datas de registro pertencem ao git e ao marcador. Datas de fontes e de vigência com efeito explícito podem orientar decisões atuais (regras 2 e 9).",
    ok: "- Slug de âncora: NFD sem diacríticos (âncoras acentuadas falhavam sem normalização).",
    ruim: "- Slug de âncora: NFD sem diacríticos (decidido na fase-1, 2026-07-13).",
  },
  {
    id: "H2",
    regra: "regra 7",
    alvo: "todos",
    severidade: "aviso",
    promovivel: true,
    titulo: "decisão resolvida não permanece no documento",
    porque:
      "Resolver é transição, não estado: a linha `[x]` existe para o usuário ver o que aconteceu no diff da rodada e sai ao fim dela. O que permanece é o que a resolução produziu — convenção, proibição, gap ou exclusão de escopo.",
    ok: "## Decisões em aberto\n\nNenhuma pendente.\n\n(a resolução virou uma convenção em ## Convenções)",
    ruim: "- [x] **Formato do relatório** — resolvido: texto simples (rodada fase-1).",
  },
  {
    id: "H3",
    regra: "regra 2",
    alvo: "todos",
    severidade: "aviso",
    promovivel: true,
    titulo: "sem vocabulário narrativo",
    porque:
      '"Anteriormente", "originalmente", "feito diferente" abrem uma linha do tempo dentro de um documento que deveria descrever só o estado atual. Se o fato ainda importa, ele vira regra no presente; se não, sai.',
    ok: "- Erros de uso saem pela `cli.js` com exit 2 — o core nunca decide exit code.",
    ruim: "- Anteriormente o core decidia o exit code; feito diferente na fase-1.",
  },
  {
    id: "H4",
    regra: "regra 2",
    alvo: "PLAN.md",
    severidade: "aviso",
    promovivel: true,
    titulo: "fase concluída sai do PLAN",
    porque:
      "Um plano guarda o que falta. Fase com todos os checkboxes fechados é história: o que ela construiu está descrito no SPEC, no presente. Mantê-la faz toda sessão futura ler tarefas que ninguém vai executar.",
    ok: "## Fase 2 — Relatório\n\n- [ ] T2.1 — … · módulo: cli",
    ruim: "## Fase 0 — Fundação\n\n- [x] T0.1 — … · módulo: check\n- [x] T0.2 — … · módulo: check",
  },
  {
    id: "H5",
    regra: "regra 2",
    alvo: "SPEC.md, PLAN.md",
    severidade: "aviso",
    promovivel: true,
    titulo: `volume de SPEC/PLAN acima de ${LIMITE_SPEC_PLAN} linhas`,
    porque:
      "SPEC e PLAN que só crescem são o sintoma mais comum de acúmulo: fase que não saiu, decisão que não foi convertida, desvio que virou nota permanente. O limite é um gatilho de revisão, não um teto.",
    ok: "Fase fechada sai; decisão resolvida vira convenção; o SPEC descreve o presente.",
    ruim: "Seis fases concluídas ainda listadas tarefa a tarefa.",
  },
  {
    id: "J1",
    regra: "regra 8",
    alvo: "todos",
    severidade: "aviso",
    promovivel: true,
    titulo: "a mesma decisão não aparece em dois arquivos",
    porque:
      "Decisão duplicada são duas verdades que divergem na primeira edição — e nenhuma das duas se sabe desatualizada. Ela mora no arquivo da sua jurisdição; os outros a referenciam pelo nome.",
    ok: 'A decisão de escopo vive no SPEC; o PLAN escreve "ver decisão **Formato do relatório** (SPEC)".',
    ruim: 'A mesma "- [ ] **Formato do relatório** — …" no SPEC, no PLAN e no AGENTS.',
  },
  {
    id: "J2",
    regra: "regra 8",
    alvo: "todos",
    severidade: "aviso",
    promovivel: true,
    titulo: "fato de dono único não é repetido fora do dono",
    porque:
      "Stack com versão, árvore de pastas e critério de aceitação têm um dono na tabela da regra 8. Repetir em outro arquivo cria a segunda cópia que ninguém atualiza.",
    ok: "O AGENTS.md tem a tabela de Stack com versões; o SPEC cita a tecnologia sem versão.",
    ruim: "SPEC e AGENTS têm, cada um, a sua tabela de Stack com versões.",
  },
  {
    id: "A0",
    regra: "regra 10",
    alvo: "manifest do projeto",
    severidade: "aviso",
    titulo: "a ancoragem alcança o ecossistema do projeto",
    porque:
      "A2 e A3 comparam o documento com package.json e Makefile. Num projeto Python, Go, Rust ou Swift eles simplesmente não rodam — e cobertura que some em silêncio é pior que cobertura ausente, porque o verde passa a significar duas coisas diferentes.",
    ok: "Projeto com package.json: `Como rodar` e a tabela de Stack são conferidos contra o manifest.",
    ruim: "Projeto com pyproject.toml: A2 e A3 não têm o que comparar, e nada avisava isso.",
  },
  {
    id: "A1",
    regra: "regra 10",
    alvo: "AGENTS.md",
    severidade: "aviso",
    promovivel: true,
    titulo: "as pastas da árvore Estrutura existem no disco",
    porque:
      "A árvore do AGENTS.md é lida como mapa: um caminho que não existe manda o agente criar arquivo no lugar errado, ou procurar onde não há.",
    ok: "A árvore cita `src/check.js` e `src/check.js` existe.",
    ruim: "A árvore cita `src/parser/`, removido numa refatoração e nunca tirado do documento.",
  },
  {
    id: "A2",
    regra: "regra 10",
    alvo: "AGENTS.md (projeto com package.json ou Makefile)",
    severidade: "aviso",
    promovivel: true,
    titulo: '"Como rodar" bate com os scripts do manifest',
    porque:
      "Comando de execução errado é a primeira coisa que um agente tenta e a última que ele questiona: ele conclui que o ambiente está quebrado. Só compara contra package.json e Makefile; em outro ecossistema a checagem não roda, e o aviso de manifest não suportado avisa isso.",
    ok: "`npm run build` documentado, e `build` existe em `scripts` do package.json.",
    ruim: "`npm run dev` documentado depois de o script ter sido renomeado para `start`.",
  },
  {
    id: "A3",
    regra: "regra 10",
    alvo: "AGENTS.md (projeto com package.json)",
    severidade: "aviso",
    promovivel: true,
    titulo: "as versões da tabela Stack batem com o manifest",
    porque:
      "Versão documentada que diverge do manifest faz o agente escolher API pela versão errada — e o erro só aparece em runtime. Só compara contra o package.json; em outro ecossistema a checagem não roda.",
    ok: "A tabela diz `Node ≥ 20` e o package.json declara `engines.node: >=20`.",
    ruim: "A tabela diz `Node ≥ 18` e o manifest já exige `>=22`.",
  },
  {
    id: "A4",
    regra: "regra 10",
    alvo: "AGENTS.md",
    severidade: "aviso",
    promovivel: true,
    titulo: "os nomes de env citados existem no .env.example",
    porque:
      "Variável documentada e ausente do exemplo (ou o contrário) é a causa mais comum de agente inventando nome de segredo. Só nomes são comparados; valor nunca é lido.",
    ok: "O AGENTS.md cita `DATABASE_URL` e o `.env.example` a declara.",
    ruim: "O AGENTS.md cita `DB_URL`; o `.env.example` só tem `DATABASE_URL`.",
  },
  {
    id: "A5",
    regra: "regra 10",
    alvo: "todos",
    severidade: "aviso",
    promovivel: true,
    titulo:
      "os caminhos de arquivo citados nos documentos existem, inteiros ou como sufixo de um caminho do repositório",
    porque:
      "Ponteiro morto é pior que ausência: o agente confia que o detalhe está em outro lugar e não o procura. Um atalho relativo ao pacote (`queries/sessions.ts` por `packages/database/prisma/queries/sessions.ts`) é citação da casa, não ponteiro morto — resolve se for sufixo de um caminho rastreado; um token que começa com `@` ou `$` é alias, pacote ou variável, e não é caminho.",
    ok: "`ver docs/borda-http.md` e o arquivo existe; `ver queries/sessions.ts` e `packages/database/prisma/queries/sessions.ts` é rastreado.",
    ruim: "`ver docs/borda-http.md` depois de o arquivo ter sido renomeado.",
  },
  {
    id: "A6",
    regra: "§4",
    alvo: "PLAN.md, AGENTS.md",
    severidade: "aviso",
    promovivel: true,
    titulo: "o marcador de rodada não está atrasado",
    porque:
      "O marcador é a prova de que a documentação foi confrontada com o código. Muitos commits depois dele, o doc-set descreve um repositório que não existe mais.",
    ok: "Marcador a poucos commits de HEAD, ou uma /rodada agendada.",
    ruim: "Marcador 80 commits atrás: nada garante que o SPEC ainda descreva o produto.",
  },
  {
    id: "A7",
    regra: "regra 11",
    alvo: "docs/",
    severidade: "aviso",
    promovivel: true,
    titulo: "satélites de docs/ têm ponteiro e índice, sem órfãos",
    porque:
      "A extração da regra 11 só funciona com o ponteiro de volta: sem ele o arquivo extraído vira conhecimento que ninguém encontra, e o AGENTS.md some com o assunto.",
    ok: "`docs/borda-http.md` tem um ponteiro de uma linha no AGENTS.md e entrada no `docs/README.md`.",
    ruim: "`docs/borda-http.md` existe e nenhum documento aponta para ele.",
  },
  {
    id: "A8",
    regra: "§1",
    alvo: "<pacote>/AGENTS.md",
    severidade: "aviso",
    promovivel: true,
    titulo: "o AGENTS.md de pacote tem recipe própria",
    porque:
      "AGENTS.md de pacote que repete o raiz é a cópia que diverge (regra 8) e mais um arquivo lido por sessão sem nada a acrescentar.",
    ok: "O pacote declara a regra própria dele e aponta o raiz para o resto.",
    ruim: "O `<pacote>/AGENTS.md` repete a regra de ouro e as convenções do raiz.",
  },
  {
    id: "A9",
    regra: "§1",
    alvo: "AGENTS.md e contratos locais",
    severidade: "aviso",
    promovivel: true,
    titulo: "a ponte do Claude, quando presente, importa o contrato canônico",
    porque:
      "CLAUDE.md deve carregar o AGENTS.md do mesmo diretório. Regras copiadas ou outro alvo fariam os agentes obedecer contratos diferentes.",
    ok: "CLAUDE.md contém apenas @AGENTS.md, ou é um symlink para esse arquivo.",
    ruim: "CLAUDE.md contém uma cópia das regras ou importa um arquivo diferente.",
  },
  {
    id: "S1",
    regra: "§5",
    alvo: "todos",
    severidade: "violacao",
    titulo: "supressão declara o motivo",
    porque:
      "Supressão sem motivo é a porta pela qual um linter morre: alguém silencia o achado, ninguém sabe por quê, e a regra vira decoração. Com o motivo na linha, a supressão é uma decisão auditável como qualquer outra.",
    ok: "<!-- docscheck: ignore A3 — a versão do manifest é gerada no build, não editada à mão -->",
    ruim: "<!-- docscheck: ignore A3 -->",
  },
  {
    id: "V1",
    regra: "regra 11",
    alvo: "AGENTS.md",
    severidade: "aviso",
    titulo: `volume do AGENTS.md acima de ${LIMITE_CONTRATO} linhas`,
    porque:
      "O AGENTS.md é lido no início de toda sessão; volume ali cobra atenção sempre. O corte é julgamento (teste de deleção), por isso avisa em vez de falhar.",
    ok: "Seção de área com meia página; o excedente vive em docs/<tema>.md com um ponteiro de uma linha.",
    ruim: "Uma seção de área com três páginas de detalhe de integração.",
  },
];

const REGRA = Object.fromEntries(REGRAS.map((r) => [r.id, r]));
const SEVERIDADE = { violacao: "violação", aviso: "aviso" };

function linhas(md) {
  return md.split("\n");
}

// Linhas dentro de blocos de código cercados (```), delimitadores incluídos,
// viram linhas vazias — preserva a numeração e impede que headings, bullets,
// "TBD" e marcadores de exemplo sejam lidos como gramática do documento.
function semFences(md) {
  let dentro = false;
  return linhas(md)
    .map((l) => {
      if (l.trimStart().startsWith("```")) {
        dentro = !dentro;
        return "";
      }
      return dentro ? "" : l;
    })
    .join("\n");
}

// Corpo de uma seção no texto original (fences incluídos), delimitado pelas
// seções extraídas da versão sem fences — para busca de conteúdo (a árvore da
// Estrutura vive num bloco de código), nunca de estrutura.
function corpoOriginal(md, s, todas) {
  const ls = linhas(md);
  const proxima = todas.find((x) => x.linha > s.linha);
  return ls.slice(s.linha, proxima ? proxima.linha - 1 : ls.length).join("\n");
}

// Seções de nível 2: [{titulo, linha (1-based, do heading), corpo}]
function secoes(md) {
  const out = [];
  let atual = null;
  linhas(md).forEach((l, i) => {
    const m = l.match(/^## (.+)$/);
    if (m) {
      atual = { titulo: m[1].trim(), linha: i + 1, corpo: [] };
      out.push(atual);
    } else if (atual) {
      atual.corpo.push(l);
    }
  });
  for (const s of out) s.corpo = s.corpo.join("\n");
  return out;
}

function secao(md, prefixo) {
  return secoes(md).find((s) => s.titulo.startsWith(prefixo));
}

// Blockquote de papel logo abaixo do título de nível 1 (GRAMATICA §1); null
// se ausente
function blockquoteDePapel(md) {
  const ls = linhas(md);
  const titulo = ls.findIndex((l) => /^# /.test(l));
  if (titulo === -1) return null;
  for (let i = titulo + 1; i < ls.length; i++) {
    if (ls[i].trim() === "") continue;
    if (!ls[i].startsWith(">")) return null;
    const texto = [];
    while (i < ls.length && ls[i].startsWith(">"))
      (texto.push(ls[i].slice(1).trim()), i++);
    return texto.join(" ");
  }
  return null;
}

// Bullets de topo de uma seção, com continuações coladas e linha absoluta
function bullets(s) {
  const out = [];
  linhas(s.corpo).forEach((l, i) => {
    if (/^- /.test(l)) out.push({ texto: l.slice(2), linha: s.linha + 1 + i });
    else if (out.length && /^\s+\S/.test(l))
      out[out.length - 1].texto += " " + l.trim();
  });
  return out;
}

// Linha absoluta (1-based) de um índice dentro do corpo de uma seção
function linhaEm(s, idx) {
  return s.linha + 1 + (s.corpo.slice(0, idx).match(/\n/g) || []).length;
}

// Normaliza um nome de decisão para comparação entre arquivos (J1): sem
// acento, sem caixa, sem pontuação de borda.
function chaveDeDecisao(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Marcas de cronologia proibidas no corpo (H1/H3). O marcador de rodada e as
// marcas de fonte `(fonte: … <mês/ano>)` da regra 9 são as duas exceções.
// "na rodada seguinte" é planejamento no presente e fica de fora de propósito;
// o que se acusa é o carimbo retrospectivo entre parênteses.
const DATA = [
  /\b\d{4}-\d{2}-\d{2}\b/,
  /\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\s*\/\s*\d{2,4}\b/i,
  /\(\s*rodada\b[^)]*\)/i,
];
const NARRATIVA =
  /\b(anteriormente|originalmente|historicamente|antigamente|costumava|no passado|antes era|antes disso|passou a ser|deixou de ser|feito diferente|vers[ãa]o anterior)\b/i;

// Máximo de commits entre o marcador de rodada e HEAD antes de o doc-set ser
// considerado atrasado (A6). Brando: o número certo depende do ritmo do repo.
const MAX_COMMITS_DESDE_RODADA = 30;

// Um caminho concreto o bastante para ser cobrado: tem barra, tem extensão ou
// termina em barra, e nada de placeholder, glob, URL ou caminho absoluto.
function caminhoConcreto(p) {
  if (!p || p.length > 120) return false;
  // `@` abre um alias ou um nome de pacote (`@repo/utils/lib/x.ts`), `$` uma
  // variável (`$TURBO_ROOT$/agents.md`): parecem caminhos e não são.
  if (/^(~|\/|[a-z]+:|[@$])/i.test(p)) return false;
  if (/[<>*?{}\s|]/.test(p)) return false;
  if (!p.includes("/")) return false;
  return /\.[a-z0-9]{1,6}$/i.test(p) || p.endsWith("/");
}

// Os caminhos do repositório-alvo, para o A5 resolver uma citação por sufixo.
// Na resolução por sufixo, considere arquivos rastreados e novos que existem
// no disco, excluindo os ignorados pelo git. Caminhos diretos são conferidos
// no disco. Fora do git, a caminhada pula diretórios comuns de build.
const PASTAS_FORA_DO_INDICE = new Set([
  "node_modules", ".git", ".next", "dist", "build", "coverage", ".turbo",
]);
async function caminhosDoRepositorio(dir) {
  if (existsSync(path.join(dir, ".git"))) {
    try {
      const saida = execFileSync(
        "git",
        ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      );
      return saida.split("\0").filter((p) => p && existsSync(path.join(dir, p)));
    } catch {
      // git ausente ou quebrado: a caminhada abaixo responde igual.
    }
  }
  const lista = [];
  async function andar(rel) {
    let entradas;
    try {
      entradas = await readdir(path.join(dir, rel), { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entradas) {
      if (PASTAS_FORA_DO_INDICE.has(e.name)) continue;
      const filho = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) await andar(filho);
      else lista.push(filho);
    }
  }
  await andar("");
  return lista;
}

// Um caminho citado resolve inteiro (existe no disco) ou como SUFIXO de um
// caminho do repositório: `queries/sessions.ts` por
// `packages/database/prisma/queries/sessions.ts`. Um diretório citado com a
// barra final resolve se algum caminho passa por ele.
function caminhoResolve(dir, p, indice) {
  if (existsSync(path.join(dir, p))) return true;
  if (p.endsWith("/")) {
    return indice.some((f) => f.startsWith(p) || f.includes(`/${p}`));
  }
  return indice.some((f) => f === p || f.endsWith(`/${p}`));
}

// Manifests do projeto-alvo, quando existirem. Nada aqui é obrigatório: um
// doc-set sem manifest simplesmente não exercita A2 e A3.
async function lerManifests(dir) {
  const out = { scripts: null, engines: null, deps: null, alvosMake: null };
  const pkg = path.join(dir, "package.json");
  if (existsSync(pkg)) {
    try {
      const j = JSON.parse(await readFile(pkg, "utf8"));
      out.scripts = j.scripts || {};
      out.engines = j.engines || {};
      out.deps = { ...(j.dependencies || {}), ...(j.devDependencies || {}) };
    } catch {
      /* manifest ilegível não é problema da gramática */
    }
  }
  const mk = path.join(dir, "Makefile");
  if (existsSync(mk)) {
    const txt = await readFile(mk, "utf8");
    out.alvosMake = new Set(
      [...txt.matchAll(/^([A-Za-z0-9_.-]+):(?!=)/gm)].map((m) => m[1]),
    );
  }
  return out;
}

// A2 inspeciona invocações simples, sem executar shell ou scripts do projeto.
// Fontes e limites de cobertura estão no README, seção Verificação.
const COMANDOS_NATIVOS = {
  npm: new Set("install i ci exec init create uninstall remove update audit fund outdated list ls view info pack publish version help config cache dedupe prune rebuild link unlink whoami login logout ping doctor explain root prefix search dist-tag access token owner org team profile pkg query sbom completion diff explore bugs docs repo deprecate unpublish hook set get restart stop".split(" ")),
  pnpm: new Set("install i add remove rm uninstall update up exec dlx create init audit outdated list ls why pack publish help config store fetch deploy import link unlink prune rebuild setup env patch patch-commit patch-remove approve-builds ignored-builds dedupe licenses server self-update".split(" ")),
  yarn: new Set("install add remove up upgrade exec dlx create init info why pack npm help config cache set plugin policies workspaces dedupe patch patch-commit rebuild constraints version versions link unlink node bin stage import audit outdated global autoclean generate-lock-entry check licenses list login logout owner publish team tag upgrade-interactive".split(" ")),
  bun: new Set("test install i add remove rm update outdated audit pm x exec build init create upgrade completions publish link unlink patch patch-commit info".split(" ")),
};

function problemaDeScript(cmd, dir, scripts) {
  const texto = cmd.replace(/\s+#.*$/, "").trim().replace(/^\$\s+/, "");
  if (!/\b(?:npm|pnpm|yarn|bun)\s/.test(texto)) return null;
  const simples = texto.match(/^(npm|pnpm|yarn|bun)\s+(\w[\w:-]*)(?:\s+(.*))?$/);
  const parcial = "A2 não verificou este comando: use uma invocação simples no pacote correspondente ou confira manualmente seletores, opções e shell composto";
  if (!simples || /[;&|`$\\<>]/.test(texto)) return parcial;
  const [, gerenciador, comando, resto = ""] = simples;
  const explicito = comando === "run" || (["npm", "pnpm"].includes(gerenciador) && comando === "run-script");
  if (!explicito && COMANDOS_NATIVOS[gerenciador].has(comando)) return null;
  if (/\s(?:--(?:workspace|workspaces|prefix|filter|dir|cwd)\b|-[wCr]\b)/.test(` ${resto}`)) return parcial;
  if (explicito && !resto) return null; // lista scripts
  let script = explicito ? resto.split(/\s+/)[0] : comando;
  if (script.startsWith("-") || !/^[\w:-]+$/.test(script)) return parcial;
  if (!explicito && ["npm", "pnpm"].includes(gerenciador) && ["t", "tst"].includes(script)) script = "test";
  if (typeof scripts[script] === "string" && scripts[script].trim()) return null;
  // npm e pnpm permitem start sem script quando server.js existe.
  if (script === "start" && ["npm", "pnpm"].includes(gerenciador) && existsSync(path.join(dir, "server.js"))) return null;
  // Yarn e Bun também resolvem executáveis. Sem script, declare o limite
  // da checagem em vez de afirmar que o comando não existe.
  if (["yarn", "bun"].includes(gerenciador)) {
    return `"Como rodar" usa "${script}", ausente de scripts no package.json; A2 não resolve executáveis nem scripts de outros workspaces de ${gerenciador}`;
  }
  return `"Como rodar" usa o script "${script}", ausente ou vazio em scripts no package.json`;
}

// A1..A8: o que os documentos afirmam sobre o repositório bate com o
// repositório. Tudo aqui é aviso por padrão (--strict promove): a calibração
// depende do projeto, e um falso positivo não pode quebrar o build de ninguém
// no primeiro contato.
// Manifests que A2/A3 sabem ler, e os que existem por aí. A diferença entre as
// duas listas é a cobertura que o A0 declara em voz alta.
const MANIFESTS_COBERTOS = ["package.json", "Makefile"];
const MANIFESTS_CONHECIDOS = [
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
  "Package.swift",
  "composer.json",
  "pom.xml",
  "build.gradle",
];

async function ancoragem(dir, docs, sombras, achar) {
  const contrato = sombras["AGENTS.md"];
  const manifest = await lerManifests(dir);

  // --- A0: o projeto tem manifest que a ancoragem não sabe ler? ---
  if (contrato && !MANIFESTS_COBERTOS.some((m) => existsSync(path.join(dir, m)))) {
    const presentes = MANIFESTS_CONHECIDOS.filter((m) =>
      existsSync(path.join(dir, m)),
    );
    if (presentes.length) {
      achar(
        "AGENTS.md",
        1,
        "A0",
        `o projeto usa ${presentes.join(", ")}; A2 (Como rodar) e A3 (versões da Stack) só comparam contra package.json e Makefile, então não rodaram aqui`,
      );
    }
  }

  // --- A1: as pastas e arquivos da árvore existem ---
  if (contrato && docs["AGENTS.md"]) {
    const secs = secoes(contrato);
    const est = secs.find((s) => /^Estrutura/.test(s.titulo));
    if (est) {
      const bruto = corpoOriginal(docs["AGENTS.md"], est, secs);
      const dentro = bruto.match(/```[^\n]*\n([\s\S]*?)```/);
      if (dentro) {
        const pilha = [];
        for (const linhaBruta of dentro[1].split("\n")) {
          if (!linhaBruta.trim()) continue;
          const semComentario = linhaBruta
            .replace(/\s+#.*$/, "")
            .replace(/[│├└─]/g, " ").trimEnd();
          const nome = semComentario.trim();
          if (!nome || !/^[\w.@-]+\/?$/.test(nome)) continue;
          const recuo = semComentario.length - semComentario.trimStart().length;
          while (pilha.length && pilha[pilha.length - 1].recuo >= recuo) pilha.pop();
          const prefixo = pilha.length ? pilha[pilha.length - 1].prefixo : "";
          const rel = prefixo + nome;
          if (nome.endsWith("/")) pilha.push({ recuo, prefixo: rel });
          if (!existsSync(path.join(dir, rel))) {
            achar(
              "AGENTS.md",
              est.linha,
              "A1",
              `a árvore da Estrutura cita "${rel}", que não existe no repositório`,
            );
          }
        }
      }
    }
  }

  // --- A2: os comandos de "Como rodar" existem nos scripts do manifest ---
  if (contrato && (manifest.scripts || manifest.alvosMake)) {
    const rodar = secoes(contrato).find((s) => /^Como rodar/.test(s.titulo));
    if (rodar && docs["AGENTS.md"]) {
      const secs = secoes(contrato);
      const bruto = corpoOriginal(docs["AGENTS.md"], rodar, secs);
      for (const bloco of bruto.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
        for (const cmd of bloco[1].split("\n")) {
          if (manifest.scripts) {
            const problema = problemaDeScript(cmd, dir, manifest.scripts);
            if (problema) achar("AGENTS.md", rodar.linha, "A2", problema);
          }
          const make = cmd.match(/^\s*make\s+([\w.-]+)/);
          if (make && manifest.alvosMake && !manifest.alvosMake.has(make[1])) {
            achar(
              "AGENTS.md",
              rodar.linha,
              "A2",
              `"Como rodar" usa o alvo make "${make[1]}", ausente do Makefile`,
            );
          }
        }
      }
    }
  }

  // --- A3: as versões da tabela Stack batem com o manifest ---
  if (contrato && (manifest.engines || manifest.deps)) {
    const stack = secoes(contrato).find((s) => /^Stack/.test(s.titulo));
    if (stack) {
      const maior = (v) => {
        const m = String(v).match(/(\d+)/);
        return m ? m[1] : null;
      };
      const noNode = stack.corpo.match(/\bnode[^|\n]*?(\d+)/i);
      const engNode = manifest.engines?.node && maior(manifest.engines.node);
      if (noNode && engNode && noNode[1] !== engNode) {
        achar(
          "AGENTS.md",
          stack.linha,
          "A3",
          `a tabela Stack declara Node ${noNode[1]}; o package.json exige engines.node ${manifest.engines.node}`,
        );
      }
      for (const [dep, faixa] of Object.entries(manifest.deps || {})) {
        const esc = dep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const citado = stack.corpo.match(new RegExp(`${esc}[^|\\n]*?(\\d+)`, "i"));
        const real = maior(faixa);
        if (citado && real && citado[1] !== real) {
          achar(
            "AGENTS.md",
            stack.linha,
            "A3",
            `a tabela Stack declara ${dep} ${citado[1]}; o manifest instala ${faixa}`,
          );
        }
      }
    }
  }

  // --- A4: nomes de env citados existem no .env.example (nomes, nunca valores) ---
  const envExemplo = path.join(dir, ".env.example");
  if (contrato && existsSync(envExemplo)) {
    const declarados = new Set(
      [...(await readFile(envExemplo, "utf8")).matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=/gm)].map(
        (m) => m[1],
      ),
    );
    for (const s of secoes(contrato).filter((x) => /env|segredo/i.test(x.titulo))) {
      for (const m of s.corpo.matchAll(/`([A-Z][A-Z0-9_]{2,})`/g)) {
        if (!declarados.has(m[1])) {
          achar(
            "AGENTS.md",
            linhaEm(s, m.index),
            "A4",
            `a variável \`${m[1]}\` é citada aqui e não existe no .env.example`,
          );
        }
      }
    }
  }

  // --- A5: os caminhos citados nos documentos existem ---
  const indiceDoRepositorio = await caminhosDoRepositorio(dir);
  for (const [nome, md] of Object.entries(sombras)) {
    const vistos = new Set();
    const candidatos = [
      ...md.matchAll(/`([^`\n]+)`/g),
      ...md.matchAll(/\]\(([^)\n]+)\)/g),
    ];
    for (const m of candidatos) {
      const p = m[1].replace(/#.*$/, "").trim();
      if (!caminhoConcreto(p) || vistos.has(p)) continue;
      vistos.add(p);
      if (!caminhoResolve(path.dirname(path.join(dir, nome)), p, indiceDoRepositorio)) {
        const antes = md.slice(0, m.index).split("\n").length;
        achar(nome, antes, "A5", `o caminho "${p}" não existe no repositório`);
      }
    }
  }

  // --- A6: o marcador de rodada não está atrasado ---
  const comMarcador = Object.entries(docs).find(([, md]) =>
    md.split("\n").some((l) => MARCADOR.test(l.trim())),
  );
  if (comMarcador && existsSync(path.join(dir, ".git"))) {
    const [nome, md] = comMarcador;
    const linha = md.split("\n").find((l) => MARCADOR.test(l.trim())).trim();
    const ref = linha.match(MARCADOR)[1];
    const nLinha = md.split("\n").findIndex((l) => l.trim() === linha) + 1;
    if (/^[0-9a-f]{7,40}$/.test(ref)) {
      try {
        const saida = execFileSync("git", ["log", "--oneline", `${ref}..HEAD`], {
          cwd: dir,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        });
        const n = saida.split("\n").filter(Boolean).length;
        if (n > MAX_COMMITS_DESDE_RODADA) {
          achar(
            nome,
            nLinha,
            "A6",
            `${n} commits desde a última rodada (${ref}); acima de ${MAX_COMMITS_DESDE_RODADA} nada garante que os documentos ainda descrevam o código`,
          );
        }
      } catch {
        const parcial = execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
          cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
        }).trim() === "true";
        if (parcial) {
          throw new Error(`histórico Git parcial em ${dir}: não foi possível verificar o marcador ${ref}; disponibilize o histórico (fetch-depth: 0 no actions/checkout) e rode novamente`);
        }
        achar(
          nome,
          nLinha,
          "A6",
          `o marcador aponta para "${ref}", que não está no histórico deste repositório`,
        );
      }
    }
  }

  // --- A7: satélites de docs/ com ponteiro e índice, sem órfãos ---
  const pastaDocs = path.join(dir, "docs");
  if (existsSync(pastaDocs) && !(await lstat(pastaDocs)).isSymbolicLink()) {
    let arquivos = [];
    try {
      arquivos = (await readdir(pastaDocs, { withFileTypes: true }))
        .filter((f) => f.isFile() && f.name.endsWith(".md") && f.name.toLowerCase() !== "readme.md")
        .map((f) => f.name);
    } catch {
      /* docs/ ilegível não é problema da gramática */
    }
    const indice = docs["docs/README.md"] ?? null;
    const corpos = Object.values(sombras).join("\n");
    for (const f of arquivos) {
      const rel = `docs/${f}`;
      if (!corpos.includes(rel)) {
        achar(
          "AGENTS.md",
          1,
          "A7",
          `"${rel}" existe e nenhum documento do doc-set aponta para ele (regra 11: a extração exige o ponteiro de volta)`,
        );
      }
      if (indice !== null && !indice.includes(f)) {
        achar(
          "AGENTS.md",
          1,
          "A7",
          `"${rel}" não aparece no índice docs/README.md`,
        );
      }
    }
    if (indice === null && arquivos.length > 3) {
      achar(
        "AGENTS.md",
        1,
        "A7",
        `docs/ tem ${arquivos.length} arquivos e nenhum docs/README.md que diga o que mora onde`,
      );
    }
  }

  // --- A8: AGENTS.md de pacote com recipe própria (monorepo) ---
  if (docs["AGENTS.md"]) {
    const raiz = sombras["AGENTS.md"];
    const ouroRaiz = secoes(raiz).find((s) => /^Regra de ouro/.test(s.titulo));
    const frase = ouroRaiz?.corpo.match(/\*\*([^*]+)\*\*/)?.[1]?.trim();
    for (const base of ["packages", "apps"]) {
      const raizPacotes = path.join(dir, base);
      if (!existsSync(raizPacotes)) continue;
      let pacotes = [];
      try {
        pacotes = await readdir(raizPacotes, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const p of pacotes.filter((x) => x.isDirectory())) {
        const alvo = path.join(raizPacotes, p.name, "AGENTS.md");
        if (!existsSync(alvo) || (await lstat(alvo)).isSymbolicLink()) continue;
        const md = semFences(await readFile(alvo, "utf8"));
        const rel = `${base}/${p.name}/AGENTS.md`;
        const ouro = secoes(md).find((s) => /^Regra de ouro/.test(s.titulo));
        const fraseLocal = ouro?.corpo.match(/\*\*([^*]+)\*\*/)?.[1]?.trim();
        if (frase && fraseLocal && frase === fraseLocal) {
          achar(rel, ouro.linha, "A8", "a regra de ouro é cópia literal da do AGENTS.md raiz");
        }
        const linhasRaiz = new Set(
          linhas(raiz)
            .map((l) => l.trim())
            .filter((l) => l.startsWith("- ") && l.length > 20),
        );
        const proprias = linhas(md)
          .map((l) => l.trim())
          .filter((l) => l.startsWith("- ") && l.length > 20);
        const repetidas = proprias.filter((l) => linhasRaiz.has(l));
        if (proprias.length >= 4 && repetidas.length / proprias.length >= 0.5) {
          achar(
            rel,
            1,
            "A8",
            `${repetidas.length} de ${proprias.length} convenções são cópia literal do AGENTS.md raiz; um recipe de pacote diz só o que difere`,
          );
        }
      }
    }
  }
  // A ponte é opcional para um doc-set usado só por outros agentes. Quando
  // presente, precisa apontar para a mesma fonte; não é outro contrato.
  for (const nome of Object.keys(docs).filter((n) => n === "AGENTS.md" || n.endsWith("/AGENTS.md"))) {
    const ponte = path.join(path.dirname(nome), "CLAUDE.md");
    const alvo = path.join(dir, ponte);
    let entrada;
    try { entrada = await lstat(alvo); }
    catch (e) { if (e.code === "ENOENT") continue; throw e; }
    let valida = false;
    try {
      valida = entrada.isSymbolicLink()
        ? realpathSync(alvo) === realpathSync(path.join(dir, nome))
        : entrada.isFile() && (await readFile(alvo, "utf8")).trim() === "@AGENTS.md";
    } catch { /* ponte quebrada é um achado */ }
    if (!valida) achar(nome, 1, "A9", `${ponte} deve conter apenas @AGENTS.md ou apontar por symlink para o contrato do mesmo diretório`);
  }
}

// Estado do doc-set em forma legível por máquina. O parsing já existe para as
// checagens; isto só o expõe, para que a skill e scripts do usuário
// leiam estrutura em vez de reparsear prosa.
export async function estado(dir) {
  const docs = {};
  for (const nome of ARQUIVOS) {
    const p = path.join(dir, nome);
    if (!existsSync(p)) continue;
    if ((await lstat(p)).isSymbolicLink()) continue;
    docs[nome] = semFences(await readFile(p, "utf8"));
  }
  if (Object.keys(docs).length === 0) return null;

  const out = {
    gramatica: GRAMATICA,
    arquivos: Object.keys(docs),
    fase_atual: null,
    tarefas_abertas: [],
    decisoes_pendentes: [],
    invariantes: [],
    marcador: null,
  };

  // Fase corrente = a primeira com checkbox aberto; as tarefas dela são o que
  // há para fazer agora.
  if (docs["PLAN.md"]) {
    for (const s of secoes(docs["PLAN.md"])) {
      if (!/^Fase /.test(s.titulo)) continue;
      const tarefas = [...s.corpo.matchAll(/^- \[( |x)\] (T\d+\.\d+) — ([^\n·]+)(?:· módulo:\s*(\S+))?/gm)]
        .map((m) => ({
          id: m[2],
          titulo: m[3].trim(),
          modulo: m[4] ?? null,
          aberta: m[1] === " ",
        }));
      const abertas = tarefas.filter((t) => t.aberta);
      if (abertas.length && !out.fase_atual) {
        out.fase_atual = {
          nome: s.titulo,
          abertas: abertas.length,
          fechadas: tarefas.length - abertas.length,
        };
        out.tarefas_abertas = abertas.map(({ aberta, ...t }) => t);
      }
    }
  }

  for (const [nome, md] of Object.entries(docs)) {
    for (const s of secoes(md).filter((x) => x.titulo.startsWith("Decisões em aberto"))) {
      for (const b of bullets(s).filter((b) => b.texto.startsWith("[ ]"))) {
        const t = b.texto.match(/\*\*(.+?)\*\*/);
        if (t) out.decisoes_pendentes.push({ arquivo: nome, decisao: t[1] });
      }
    }
    const m = md.split("\n").find((l) => MARCADOR.test(l.trim()));
    if (m) {
      const [, ref] = m.trim().match(MARCADOR);
      out.marcador = { arquivo: nome, ref, commits_desde: null };
    }
  }

  if (docs["DOMAIN.md"]) {
    const inv = secoes(docs["DOMAIN.md"]).find((s) => /^Invariantes/.test(s.titulo));
    if (inv) {
      out.invariantes = [...new Set([...inv.corpo.matchAll(/\bI(\d+)\b/g)].map((m) => `I${m[1]}`))];
    }
  }

  if (out.marcador && /^[0-9a-f]{7,40}$/.test(out.marcador.ref) && existsSync(path.join(dir, ".git"))) {
    try {
      out.marcador.commits_desde = execFileSync(
        "git", ["log", "--oneline", `${out.marcador.ref}..HEAD`],
        { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ).split("\n").filter(Boolean).length;
    } catch {
      out.marcador.commits_desde = null; // ref fora do histórico; A6 acusa
    }
  }

  return out;
}

export async function verificar(dir, opcoes = {}) {
  // Promoção das famílias calibráveis (H, J, A) a violação: a opção explícita
  // vence; sem ela, o .docscheck.json do repositório-alvo decide. JSON quebrado
  // é erro duro — silenciá-lo faria o strict "desligar sozinho", que é a falha
  // que ninguém percebe.
  let strict = opcoes.strict === true;
  {
    const cfg = path.join(dir, ".docscheck.json");
    if (existsSync(cfg)) {
      let parsed;
      try {
        parsed = JSON.parse(await readFile(cfg, "utf8"));
      } catch (e) {
        throw new Error(`.docscheck.json inválido em ${dir}: ${e.message}`);
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`.docscheck.json inválido em ${dir}: esperado um objeto`);
      }
      const desconhecidas = Object.keys(parsed).filter((chave) => chave !== "strict");
      if (desconhecidas.length) throw new Error(`.docscheck.json inválido em ${dir}: opções desconhecidas: ${desconhecidas.join(", ")}`);
      if (Object.hasOwn(parsed, "strict") && typeof parsed.strict !== "boolean") {
        throw new Error(`.docscheck.json inválido em ${dir}: strict deve ser booleano (true ou false, sem aspas)`);
      }
      if (opcoes.strict === undefined) strict = parsed.strict === true;
    }
  }

  const docs = {};
  for (const nome of ARQUIVOS) {
    const p = path.join(dir, nome);
    if (!existsSync(p)) continue;
    if ((await lstat(p)).isSymbolicLink()) continue; // espelho, não documento
    docs[nome] = await readFile(p, "utf8");
  }
  if (Object.keys(docs).length === 0) {
    throw new Error(
      `nenhum arquivo da gramática (${ARQUIVOS.join(", ")}) em ${dir}`,
    );
  }

  // Satélites e contratos locais recebem as regras comuns, sem herdar as
  // seções obrigatórias do contrato raiz. Não siga symlinks: espelhos não
  // devem duplicar achados nem levar a caminhada para fora do projeto.
  async function coletar(rel, contratos = false) {
    let entradas;
    try {
      const pasta = path.join(dir, rel);
      if ((await lstat(pasta)).isSymbolicLink()) return;
      entradas = await readdir(pasta, { withFileTypes: true });
    } catch (e) {
      if (e.code === "ENOENT") return;
      throw e;
    }
    for (const entrada of entradas) {
      if (PASTAS_FORA_DO_INDICE.has(entrada.name)) continue;
      const nome = `${rel}/${entrada.name}`;
      if (entrada.isDirectory()) await coletar(nome, contratos);
      else if (entrada.isFile() && (contratos ? entrada.name === "AGENTS.md" : entrada.name.endsWith(".md"))) {
        docs[nome] = await readFile(path.join(dir, nome), "utf8");
      }
    }
  }
  await coletar("docs");
  await coletar("packages", true);
  await coletar("apps", true);

  // Um achado carrega o id do catálogo; a severidade sai de REGRAS, nunca da
  // chamada — é o que impede um check novo escapar do catálogo. Sob --strict,
  // as famílias que dependem de calibração (H, J, A) sobem para violação.
  const achados = [];
  const achar = (arquivo, linha, id, msg) => {
    const r = REGRA[id];
    if (!r) throw new Error(`id fora do catálogo REGRAS: ${id}`);
    const severidade =
      strict && r.promovivel ? "violacao" : r.severidade;
    achados.push({ arquivo, linha, id, regra: r.regra, severidade, msg });
  };

  // Volume do AGENTS.md (regra 11): ele é lido em toda sessão; acima do limite
  // brando, sugerir compactação ou extração de seções de área para docs/.
  if (docs["AGENTS.md"]) {
    const n = linhas(docs["AGENTS.md"]).length;
    if (n > LIMITE_CONTRATO) {
      achar(
        "AGENTS.md",
        1,
        "V1",
        `${n} linhas (limite brando: ${LIMITE_CONTRATO}); compactar ou extrair seções de área para docs/<tema>.md (regra 11)`,
      );
    }
  }

  // As checagens estruturais rodam sobre a versão sem fences; o original só
  // serve a buscas de conteúdo (módulos na Estrutura do AGENTS.md).
  const sombras = Object.fromEntries(
    Object.entries(docs).map(([n, md]) => [n, semFences(md)]),
  );

  // --- invariantes comuns a todos os arquivos ---
  for (const [nome, md] of Object.entries(sombras)) {
    if (blockquoteDePapel(md) === null) {
      achar(
        nome,
        1,
        "E1",
        "sem blockquote de papel logo abaixo do título (§1)",
      );
    }
    linhas(md).forEach((l, i) => {
      if (/\bTBD\b/.test(l))
        achar(nome, i + 1, "E2", 'placeholder "TBD" (regra 11: escala honesta)');
      // Só o que renderiza como emoji por padrão (Emoji_Presentation) ou pede
      // isso explicitamente (+U+FE0F). Fica de fora o que é notação, ainda que
      // tenha variante emoji: `↔` em "doc↔código", `→`, `≥`, `✓`. E box-drawing
      // de árvore de pastas (`├──`) é estrutura que a própria regra 13
      // recomenda — cobrá-la seria falso positivo garantido na Estrutura.
      const emojis = [
        ...l.matchAll(/\p{Emoji_Presentation}|\p{Extended_Pictographic}️/gu),
      ].map((m) => m[0]);
      if (emojis.length) {
        achar(
          nome,
          i + 1,
          "E5",
          `emoji no documento (${[...new Set(emojis)].join(" ")}); o registro é de contrato técnico (regra 13)`,
        );
      }
      if (/<!-- rodada:/.test(l) && !MARCADOR.test(l.trim())) {
        achar(
          nome,
          i + 1,
          "E3",
          "formato esperado: <!-- rodada: <nome> @ <sha|AAAA-MM-DD> -->",
        );
      }
    });
    // Formato das decisões (regras 6 e 7), em qualquer arquivo
    for (const s of secoes(md).filter((s) =>
      s.titulo.startsWith("Decisões em aberto"),
    )) {
      linhas(s.corpo).forEach((l, i) => {
        if (!/^- \[/.test(l)) return;
        const ok =
          /^- \[ \] \*\*.+?\*\* —/.test(l) ||
          /^- \[x\] \*\*.+?\*\* — resolvido:/.test(l);
        if (!ok) {
          achar(
            nome,
            s.linha + 1 + i,
            "E4",
            'decisão fora do formato "- [ ] **<decisão>** — <contexto>" / "- [x] **<decisão>** — resolvido: <como>"',
          );
        }
      });
    }
  }

  // --- SPEC.md: fronteira presente/futuro (regra 1) ---
  const spec = sombras["SPEC.md"];
  if (spec) {
    const papel = blockquoteDePapel(spec);
    const planejado = secao(spec, "Planejado");
    if (papel !== null && (
      !/planejad/i.test(papel) || /nada fora dela deve ser lido como/i.test(papel)
    )) {
      achar(
        "SPEC.md",
        1,
        "F1",
        'o cabeçalho deve distinguir o corpo atual (ou primeira entrega) da seção "Planejado", sem inverter a fronteira (regra 1)',
      );
    }
    if (planejado) {
      const primeira = linhas(planejado.corpo).find((l) => l.trim() !== "");
      if (!primeira || !primeira.startsWith(">")) {
        achar(
          "SPEC.md",
          planejado.linha,
          "F2",
          'a seção "Planejado" não abre com o blockquote de reforço (regra 1)',
        );
      }
    } else if (papel !== null && /planejad/i.test(papel)) {
      achar(
        "SPEC.md",
        1,
        "F3",
        'o cabeçalho promete a seção "Planejado", que não existe no documento',
      );
    }
  }

  // --- AGENTS.md: regra de ouro (2), Nunca fazer (3), estado explícito (5) ---
  const contrato = sombras["AGENTS.md"];
  if (contrato) {
    const ouro = secao(contrato, "Regra de ouro");
    if (!ouro) {
      achar("AGENTS.md", 1, "C1", 'sem seção "Regra de ouro" (regra 3)');
    } else if (!/\*\*[^*]+\*\*/.test(ouro.corpo)) {
      achar(
        "AGENTS.md",
        ouro.linha,
        "C2",
        "a regra de ouro não está formulada em uma frase em negrito",
      );
    }
    const nunca = secao(contrato, "Nunca fazer");
    if (nunca) {
      const itens = bullets(nunca);
      if (itens.length === 0) {
        achar(
          "AGENTS.md",
          nunca.linha,
          "C3",
          '"Nunca fazer" vazio; registre uma proibição específica ou omita a seção (regra 4)',
        );
      }
      for (const b of itens) {
        if (!/—\s*\S/.test(b.texto)) {
          achar(
            "AGENTS.md",
            b.linha,
            "C4",
            'proibição sem justificativa na própria linha (após "—")',
          );
        }
      }
    }
    const decisoes = secao(contrato, "Decisões em aberto");
    if (
      !decisoes || (
        !/- \[ \]/.test(decisoes.corpo) &&
        !/nenhuma pendente/i.test(decisoes.corpo)
      )
    ) {
      achar(
        "AGENTS.md",
        decisoes?.linha ?? 1,
        "C5",
        'declare "Decisões em aberto" com pendências ou "Nenhuma pendente." (regra 6)',
      );
    }
  }

  // --- PLAN.md: tarefas com módulo e rastreabilidade cruzada (regra 10) ---
  // Onde um módulo conta como definido no AGENTS.md: os títulos de seção e o
  // corpo original das seções "Estrutura"/"Módulos" (a árvore vive num bloco
  // de código). Menção em prosa solta não fecha rastreabilidade.
  let modulosDoContrato = null;
  if (contrato) {
    const secs = secoes(contrato);
    modulosDoContrato = [
      ...secs.map((s) => s.titulo),
      ...secs
        .filter((s) => /^(Estrutura|Módulos)/.test(s.titulo))
        .map((s) => corpoOriginal(docs["AGENTS.md"], s, secs)),
    ].join("\n");
  }
  const plan = sombras["PLAN.md"];
  const idsDeTarefa = new Set();
  if (plan) {
    linhas(plan).forEach((l, i) => {
      const t = l.match(/^- \[( |x)\] (T\d+\.\d+) — /);
      if (!t) return;
      const id = t[2];
      if (idsDeTarefa.has(id))
        achar("PLAN.md", i + 1, "T1", `id de tarefa duplicado: ${id}`);
      idsDeTarefa.add(id);
      const mod = l.match(/· módulo:\s*(\S+)/);
      if (!mod) {
        achar(
          "PLAN.md",
          i + 1,
          "T2",
          `${id} sem "· módulo: <módulo>" (regra 10: tarefas referenciam módulos)`,
        );
      } else if (modulosDoContrato !== null) {
        const esc = mod[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const palavra = new RegExp(`(^|[^\\w-])${esc}([^\\w-]|$)`, "i");
        if (!palavra.test(modulosDoContrato)) {
          achar(
            "PLAN.md",
            i + 1,
            "T3",
            `${id} referencia o módulo "${mod[1]}", que não aparece na Estrutura nem nos títulos do AGENTS.md`,
          );
        }
      }
    });
    const riscos = secao(plan, "Riscos");
    if (riscos && spec) {
      const constraints = secao(spec, "Constraints");
      const numeros = new Set(
        constraints
          ? [...constraints.corpo.matchAll(/^(\d+)\.\s/gm)].map((m) => m[1])
          : [],
      );
      for (const m of riscos.corpo.matchAll(/constraint\s+(\d+)/gi)) {
        if (!numeros.has(m[1])) {
          achar(
            "PLAN.md",
            linhaEm(riscos, m.index),
            "T4",
            `risco cita a constraint ${m[1]}, inexistente no SPEC (regra 10)`,
          );
        }
      }
    }
  }

  // Decisões pendentes que apontam tarefas (regra 10), em qualquer arquivo.
  // Só as pendentes: referência em decisão resolvida é histórica e pode
  // apontar tarefa de fase já compactada do PLAN.
  if (plan) {
    for (const [nome, md] of Object.entries(sombras)) {
      for (const s of secoes(md).filter((s) =>
        s.titulo.startsWith("Decisões em aberto"),
      )) {
        for (const b of bullets(s).filter((b) => b.texto.startsWith("[ ]"))) {
          for (const m of b.texto.matchAll(/\b(T\d+\.\d+)\b/g)) {
            if (!idsDeTarefa.has(m[1])) {
              achar(
                nome,
                b.linha,
                "T5",
                `decisão pendente aponta ${m[1]}, inexistente no PLAN (regra 10)`,
              );
            }
          }
        }
      }
    }
  }

  // --- H: presente permanente (regra 2) · J: jurisdição (regra 8) ---
  //
  // Famílias que entram como aviso: dependem de calibração por projeto, e um
  // doc-set escrito na v4 acende várias no primeiro contato. --strict promove.

  // H2 primeiro: as linhas que ele acusa não voltam a ser acusadas por H1 —
  // uma decisão resolvida datada é um problema só, resolvido por um corte só.
  const linhasDeH2 = new Set();
  for (const [nome, md] of Object.entries(sombras)) {
    for (const s of secoes(md).filter((x) =>
      x.titulo.startsWith("Decisões em aberto"),
    )) {
      for (const b of bullets(s).filter((x) => x.texto.startsWith("[x]"))) {
        linhasDeH2.add(`${nome}:${b.linha}`);
        achar(
          nome,
          b.linha,
          "H2",
          "decisão resolvida permanece no documento; converta no que ela produziu (convenção, proibição, gap, exclusão de escopo) e corte a linha",
        );
      }
    }
  }

  for (const [nome, md] of Object.entries(sombras)) {
    linhas(md).forEach((l, i) => {
      const linha = i + 1;
      if (MARCADOR.test(l.trim())) return; // §4: o eixo do tempo autorizado
      const texto = l.replace(/\(fonte:[^)]*\)/gi, "")
        .replace(/\(vigência:\s*[^)\n]+?\s+—\s+[^)\n]+\)/gi, "");
      if (!linhasDeH2.has(`${nome}:${linha}`) && DATA.some((re) => re.test(texto))) {
        achar(
          nome,
          linha,
          "H1",
          "data de registro ou carimbo de rodada no corpo; use o git ou explicite a vigência e seu efeito (regra 2)",
        );
      }
      const n = texto.match(NARRATIVA);
      if (n) {
        achar(
          nome,
          linha,
          "H3",
          `vocabulário narrativo ("${n[1]}"): descreva o estado atual, ou corte a linha se ela não muda como um agente age`,
        );
      }
    });
  }

  if (plan) {
    for (const s of secoes(plan).filter((x) => /^Fase\b/i.test(x.titulo))) {
      const caixas = [...s.corpo.matchAll(/^- \[( |x)\] /gm)].map((m) => m[1]);
      if (caixas.length > 0 && caixas.every((c) => c === "x")) {
        achar(
          "PLAN.md",
          s.linha,
          "H4",
          `"${s.titulo}" está concluída (${caixas.length} tarefa(s), todas [x]); o que ela construiu vive no SPEC, no presente — a fase sai do plano`,
        );
      }
    }
  }

  for (const nome of ["SPEC.md", "PLAN.md"]) {
    if (!docs[nome]) continue;
    const n = linhas(docs[nome]).length;
    if (n > LIMITE_SPEC_PLAN) {
      achar(
        nome,
        1,
        "H5",
        `${n} linhas (limite brando: ${LIMITE_SPEC_PLAN}); procure fase concluída, decisão não convertida e desvio virado nota permanente`,
      );
    }
  }

  // J1: a mesma decisão em mais de um arquivo
  const porDecisao = new Map();
  for (const [nome, md] of Object.entries(sombras)) {
    for (const s of secoes(md).filter((x) =>
      x.titulo.startsWith("Decisões em aberto"),
    )) {
      for (const b of bullets(s)) {
        const m = b.texto.match(/^\[[ x]\]\s*\*\*(.+?)\*\*/);
        if (!m) continue;
        const k = chaveDeDecisao(m[1]);
        if (!k) continue;
        if (!porDecisao.has(k)) porDecisao.set(k, []);
        porDecisao.get(k).push({ nome, linha: b.linha, rotulo: m[1] });
      }
    }
  }
  for (const ocorrencias of porDecisao.values()) {
    const arquivos = new Set(ocorrencias.map((o) => o.nome));
    if (arquivos.size < 2) continue;
    for (const o of ocorrencias) {
      const outros = [...arquivos].filter((a) => a !== o.nome).join(", ");
      achar(
        o.nome,
        o.linha,
        "J1",
        `a decisão "${o.rotulo}" também aparece em ${outros}; ela mora em um arquivo só (regra 8)`,
      );
    }
  }

  // J2: fato de dono único repetido fora do dono (tabela da regra 8)
  const secaoDe = (nome, prefixo) =>
    sombras[nome] ? secao(sombras[nome], prefixo) : undefined;
  const DONOS = [
    {
      fato: "a tabela de Stack com versões",
      dono: "AGENTS.md",
      prefixo: "Stack",
      intrusos: ["SPEC.md"],
      // Stack citada sem versão no SPEC é referência legítima, não cópia.
      soComVersao: true,
    },
    {
      fato: "a árvore de pastas",
      dono: "AGENTS.md",
      prefixo: "Estrutura",
      intrusos: ["SPEC.md", "PLAN.md"],
    },
    {
      fato: "os critérios de aceitação",
      dono: "SPEC.md",
      prefixo: "Critérios de aceitação",
      intrusos: ["PLAN.md"],
    },
  ];
  for (const d of DONOS) {
    if (!secaoDe(d.dono, d.prefixo)) continue;
    for (const intruso of d.intrusos) {
      const s = secaoDe(intruso, d.prefixo);
      if (!s) continue;
      if (d.soComVersao && !/\d+\.\d+|≥\s*\d|\bv\d+\b/.test(s.corpo)) continue;
      achar(
        intruso,
        s.linha,
        "J2",
        `${d.fato} tem dono em ${d.dono} (regra 8); aqui vira a segunda cópia, e é ela que ninguém atualiza`,
      );
    }
  }

  // --- DOMAIN.md: invariantes numerados (D1), citados (D2), glossário (D3) ---
  const domain = sombras["DOMAIN.md"];
  const invariantes = new Set();
  if (domain) {
    const secInv = secoes(domain).find((s) => /^Invariantes/.test(s.titulo));
    if (secInv) {
      linhas(secInv.corpo).forEach((l, i) => {
        if (!/^\s*(\d+\.|-)\s/.test(l)) return;
        const id = l.match(/\bI(\d+)\b/);
        if (!id) {
          achar(
            "DOMAIN.md",
            secInv.linha + 1 + i,
            "D1",
            'invariante sem id: use "1. **I<n> — <a lei>** — <por que ela vale / como se verifica>"',
          );
          return;
        }
        invariantes.add(`I${id[1]}`);
      });
    }
    // O glossário define termos; comportamento de feature é do SPEC (regra 8).
    const secGloss = secoes(domain).find((s) => /^Gloss/.test(s.titulo));
    if (secGloss) {
      for (const b of bullets(secGloss)) {
        if (/\b(o usu[áa]rio clica|o sistema (envia|valida|processa)|ao clicar|endpoint|tela de)\b/i.test(b.texto)) {
          achar(
            "DOMAIN.md",
            b.linha,
            "D3",
            "a entrada do glossário descreve comportamento de feature; aqui mora o que o termo significa e o que ele não é (regra 8)",
          );
        }
      }
    }
  }
  // D2 vale mesmo sem DOMAIN.md: citar I<n> sem o arquivo é apontar para o nada.
  for (const nome of ["SPEC.md", "PLAN.md"]) {
    const md = sombras[nome];
    if (!md) continue;
    linhas(md).forEach((l, i) => {
      for (const m of l.matchAll(/\bI(\d+)\b/g)) {
        if (!invariantes.has(`I${m[1]}`)) {
          achar(
            nome,
            i + 1,
            "D2",
            `cita o invariante I${m[1]}, que não existe no DOMAIN.md`,
          );
        }
      }
    });
  }

  await ancoragem(dir, docs, sombras, achar);

  // --- supressão justificada ---
  // <!-- docscheck: ignore <ID> — <motivo> --> silencia um id naquele arquivo.
  // Escopo de arquivo, não de linha: mais simples de ler no diff, e o motivo
  // obrigatório é o que impede a supressão virar hábito.
  const suprimido = new Set();
  for (const [nome, md] of Object.entries(docs)) {
    linhas(md).forEach((l, i) => {
      const m = l.match(/<!--\s*docscheck:\s*ignore\s+([A-Z]\d+)\s*(.*?)\s*-->/);
      if (!m) return;
      const motivo = m[2].replace(/^[—–-]\s*/, "").trim();
      if (!REGRA[m[1]]) {
        achar(nome, i + 1, "S1", `supressão de "${m[1]}", que não existe no catálogo`);
      } else if (!motivo) {
        achar(nome, i + 1, "S1", `supressão de ${m[1]} sem motivo na linha`);
      } else {
        suprimido.add(`${nome}:${m[1]}`);
      }
    });
  }
  const efetivos = achados.filter((a) => !suprimido.has(`${a.arquivo}:${a.id}`));
  achados.length = 0;
  achados.push(...efetivos);

  achados.sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha);
  return {
    violacoes: achados.filter((a) => a.severidade === "violacao"),
    avisos: achados.filter((a) => a.severidade === "aviso"),
    arquivos: Object.keys(docs),
  };
}

function explicar(id) {
  const r = REGRA[id.toUpperCase()];
  if (!r) {
    console.error(
      `erro: id desconhecido "${id}". Conhecidos: ${REGRAS.map((x) => x.id).join(", ")}`,
    );
    return 2;
  }
  const indenta = (s) =>
    s
      .split("\n")
      .map((l) => `    ${l}`)
      .join("\n");
  console.log(`${r.id} — ${r.titulo}`);
  console.log(`  ${r.regra} · alvo: ${r.alvo} · ${SEVERIDADE[r.severidade]}`);
  console.log(`\n  ${r.porque}\n`);
  console.log("  bem:");
  console.log(indenta(r.ok));
  console.log("\n  mal:");
  console.log(indenta(r.ruim));
  return 0;
}

const AJUDA = [
  "uso: node docscheck.mjs [diretório]        (padrão: .)",
  "     node docscheck.mjs <dir> <dir> …      panorama de vários doc-sets",
  "     node docscheck.mjs --estado [dir]     estado do doc-set em JSON",
  "     node docscheck.mjs --explain <id>     catálogo de uma regra",
  "     node docscheck.mjs --json [dir]       achados em JSON",
  "     node docscheck.mjs --strict [dir]     promove H/J/A a violação",
  "",
  "Um diretório: a ausência de doc-set é erro de uso (você apontou para o",
  "lugar errado). Vários: diretório sem doc-set é pulado em silêncio — a",
  "pergunta ali é \"quais destes derivaram\", não \"todos são doc-set?\".",
  "",
  `regras: ${REGRAS.map((r) => r.id).join(", ")}`,
].join("\n");

function imprimir(r) {
  for (const v of r.violacoes)
    console.log(`${v.arquivo}:${v.linha} [${v.id}] ${v.msg}`);
  for (const a of r.avisos)
    console.log(`${a.arquivo}:${a.linha} [${a.id}] aviso: ${a.msg}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    console.log(AJUDA);
    process.exit(0);
  }
  const i = args.indexOf("--explain");
  if (i !== -1) process.exit(explicar(args[i + 1] || ""));

  const json = args.includes("--json");
  const FLAGS = ["--json", "--strict", "--estado"];
  const dirs = args.filter((a) => !a.startsWith("-"));
  if (args.some((a) => a.startsWith("-") && !FLAGS.includes(a))) {
    console.error(AJUDA);
    process.exit(2);
  }
  const opcoes = args.includes("--strict") ? { strict: true } : {};

  if (args.includes("--estado")) {
    const e = await estado(dirs[0] || ".");
    if (!e) {
      console.error(`erro: nenhum doc-set em ${dirs[0] || "."}`);
      process.exit(2);
    }
    console.log(JSON.stringify(e, null, 2));
    process.exit(0);
  }

  // --- um diretório: o modo de sempre ---
  if (dirs.length <= 1) {
    try {
      const r = await verificar(dirs[0] || ".", opcoes);
      if (json) {
        console.log(JSON.stringify({ gramatica: GRAMATICA, ...r }, null, 2));
        process.exit(r.violacoes.length === 0 ? 0 : 1);
      }
      imprimir(r);
      if (r.violacoes.length === 0) {
        console.log(
          `ok: gramática ${GRAMATICA} sem violações mecânicas (${r.arquivos.join(", ")})` +
            (r.avisos.length ? ` — ${r.avisos.length} aviso(s)` : ""),
        );
        process.exit(0);
      }
      console.log(`resumo: ${r.violacoes.length} violação(ões) da gramática`);
      process.exit(1);
    } catch (e) {
      console.error(`erro: ${e.message}`);
      process.exit(2);
    }
  }

  // --- vários: panorama. Sem doc-set não é erro, é "não é alvo". ---
  const linhas = [];
  let comViolacao = 0;
  let falhou = false;
  for (const d of dirs) {
    let r;
    try {
      r = await verificar(d, opcoes);
    } catch (e) {
      if (/nenhum arquivo da gramática/.test(e.message)) continue;
      linhas.push({ dir: d, erro: e.message });
      falhou = true;
      continue;
    }
    if (r.violacoes.length) comViolacao++;
    linhas.push({
      dir: d,
      violacoes: r.violacoes.length,
      avisos: r.avisos.length,
      arquivos: r.arquivos,
      achados: [...r.violacoes, ...r.avisos],
    });
  }

  if (json) {
    console.log(JSON.stringify({ gramatica: GRAMATICA, doc_sets: linhas }, null, 2));
    process.exit(falhou ? 2 : comViolacao ? 1 : 0);
  }

  if (!linhas.length) {
    console.log(`nenhum doc-set encontrado em ${dirs.length} diretório(s)`);
    process.exit(0);
  }
  const larg = Math.max(...linhas.map((l) => path.basename(l.dir).length));
  for (const l of linhas) {
    const nome = path.basename(l.dir).padEnd(larg);
    if (l.erro) {
      console.log(`${nome}  erro: ${l.erro}`);
      continue;
    }
    const estadoTxt = l.violacoes
      ? `${l.violacoes} violação(ões)`
      : l.avisos
        ? `ok — ${l.avisos} aviso(s)`
        : "ok";
    console.log(`${nome}  ${estadoTxt}`);
    for (const a of l.achados.slice(0, 3)) {
      console.log(`${" ".repeat(larg)}    ${a.arquivo}:${a.linha} [${a.id}] ${a.msg}`);
    }
    if (l.achados.length > 3) {
      // "achado(s)", não "violação(ões)": a lista mistura as duas, e repetir o
      // substantivo do cabeçalho faria o leitor somar dois universos.
      console.log(`${" ".repeat(larg)}    … mais ${l.achados.length - 3} achado(s); rode no diretório para ver todos`);
    }
  }
  console.log(
    `\nresumo: ${comViolacao} de ${linhas.length} doc-set(s) com violação`,
  );
  process.exit(falhou ? 2 : comViolacao ? 1 : 0);
}

// Entry-point por realpath, não por string de URL: em macOS `/tmp` e `/var`
// são symlinks, e symlinkar $DOCS_KIT/bin/docscheck.mjs para a cópia do repo é
// a primeira coisa que alguém faz para não reinstalar a cada edição. Comparar
// as URLs cruas faz o guard falhar nesses casos — e o CLI sai 0 sem ter
// verificado nada, que é a pior falha possível num verificador.
function ehEntryPoint() {
  if (!process.argv[1]) return false;
  const real = (p) => {
    try {
      return realpathSync(p);
    } catch {
      return p;
    }
  };
  return real(process.argv[1]) === real(fileURLToPath(import.meta.url));
}

if (ehEntryPoint()) {
  await main();
}
