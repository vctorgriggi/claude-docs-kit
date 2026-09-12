import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GRAMATICA, REGRAS, estado, verificar } from "../bin/docscheck.mjs";
import { aplicar } from "../scripts/gerar-gramatica.mjs";

const FIXTURE = fileURLToPath(
  new URL("../examples/fixtures/linkcheck", import.meta.url),
);
// Doc-set com domínio não trivial: é a referência viva do DOMAIN.md.
const FIXTURE_DOMINIO = fileURLToPath(
  new URL("../examples/fixtures/pedidos", import.meta.url),
);

async function docSet(arquivos) {
  const dir = await mkdtemp(path.join(tmpdir(), "docscheck-"));
  for (const [nome, md] of Object.entries(arquivos)) {
    await writeFile(path.join(dir, nome), md);
  }
  return dir;
}

const ids = (r) => r.violacoes.map((v) => v.id);

test("o doc-set de referência (fixtures/linkcheck) passa sem violações", async () => {
  const r = await verificar(FIXTURE);
  assert.deepEqual(r.violacoes, []);
  assert.deepEqual(r.avisos, []);
  assert.deepEqual(r.arquivos.sort(), ["AGENTS.md", "PLAN.md", "SPEC.md"]);
});

test("AGENTS.md acima do limite brando gera aviso, nunca violação", async () => {
  const recheio = Array.from(
    { length: 220 },
    (_, i) => `Linha de contexto ${i} da seção, sem nada de gramática.`,
  );
  const dir = await docSet({
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Tudo deriva disso.",
      "",
      ...recheio,
      "## Decisões em aberto",
      "",
      "Nenhuma pendente.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(r.violacoes, []);
  assert.equal(r.avisos.length, 1);
  assert.equal(r.avisos[0].id, "V1");
  assert.match(r.avisos[0].msg, /compactar ou extrair/);
});

test("diretório sem documentos da gramática é erro de uso", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "docscheck-vazio-"));
  await assert.rejects(() => verificar(dir), /nenhum arquivo da gramática/);
});

test("SPEC sem blockquote de papel, sem reforço no Planejado, com TBD e decisão mal formada", async () => {
  const dir = await docSet({
    "SPEC.md": [
      "# SPEC.md",
      "",
      "Descrição solta, sem blockquote.",
      "",
      "## Funcionalidades",
      "",
      "- coisa TBD",
      "",
      "## Planejado / fases posteriores",
      "",
      "Sem blockquote de reforço aqui.",
      "",
      "## Decisões em aberto (a confirmar)",
      "",
      "- [ ] decisão sem negrito nem travessão",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(ids(r).sort(), ["E1", "E2", "E4", "F2"]);
});

test("SPEC cujo cabeçalho não declara a fronteira presente/futuro", async () => {
  const dir = await docSet({
    "SPEC.md": [
      "# SPEC.md",
      "",
      "> Descreve o produto atual, sem falar da fronteira.",
      "",
      "## Funcionalidades",
      "",
      "- coisa que existe.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(ids(r), ["F1"]);
});

test('AGENTS sem regra de ouro, proibição sem justificativa e estado implícito', async () => {
  const dir = await docSet({
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Nunca fazer",
      "",
      "- Nunca usar var — legado de ES5.",
      "- Nunca comitar segredo sem justificativa na linha",
      "",
      "## Decisões em aberto",
      "",
      "- [x] **Formato** — resolvido: texto simples (rodada x).",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  // C1 (sem regra de ouro), C4 (item sem "—"),
  // C5 (resolvida sem "Nenhuma pendente")
  assert.deepEqual(ids(r).sort(), ["C1", "C4", "C5"]);
});

test("PLAN com tarefa sem módulo, módulo fantasma, constraint e tarefa inexistentes", async () => {
  const dir = await docSet({
    "SPEC.md": [
      "# SPEC.md",
      "",
      '> Descreve o produto atual; o futuro vive na seção "Planejado".',
      "",
      "## Constraints técnicas",
      "",
      "1. **Única constraint** — fato duro.",
      "",
      "## Planejado / fases posteriores",
      "",
      "> O que está abaixo é planejado.",
      "",
    ].join("\n"),
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Core puro, borda fina.** Tudo abaixo deriva disso.",
      "",
      "## Decisões em aberto",
      "",
      "Nenhuma pendente.",
      "",
    ].join("\n"),
    "PLAN.md": [
      "# PLAN.md",
      "",
      "> Plano de execução, fatiado em fases.",
      "",
      "## Fase 0 — Fundação",
      "",
      "- [ ] T0.1 — tarefa sem módulo declarado",
      "- [ ] T0.2 — tarefa de módulo fantasma · módulo: inexistente",
      "",
      "## Riscos e dependências",
      "",
      "- **Risco** (SPEC, constraint 2) → mitigação.",
      "",
      "## Decisões em aberto",
      "",
      "- [ ] **Pendência** — afeta T9.9.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(ids(r).sort(), ["T2", "T3", "T4", "T5"]);
  const msgs = r.violacoes.map((v) => v.msg).join("\n");
  assert.match(msgs, /T0\.1 sem "· módulo/);
  assert.match(msgs, /módulo "inexistente"/);
  assert.match(msgs, /constraint 2, inexistente/);
  assert.match(msgs, /T9\.9, inexistente no PLAN/);
});

test("conteúdo de bloco de código não é gramática: heading, TBD e marcador em fence são ignorados", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Tudo deriva disso.",
      "",
      "## Convenções",
      "",
      "- Exemplo de doc que o kit gera:",
      "",
      "```md",
      "## Nunca fazer",
      "",
      "- Nunca usar var — legado.",
      "algo TBD",
      "<!-- rodada: exemplo sem ref -->",
      "```",
      "",
      "## Decisões em aberto",
      "",
      "Nenhuma pendente.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(r.violacoes, []);
});

test("módulo citado apenas em prosa do AGENTS.md não fecha a rastreabilidade", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Este projeto expõe uma CLI simples.",
      "",
      "## Decisões em aberto",
      "",
      "Nenhuma pendente.",
      "",
    ].join("\n"),
    "PLAN.md": [
      "# PLAN.md",
      "",
      "> Plano de execução.",
      "",
      "## Fase 0 — Fundação",
      "",
      "- [ ] T0.1 — borda de linha de comando · módulo: cli",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(ids(r), ["T3"]);
  assert.match(r.violacoes[0].msg, /módulo "cli"/);
});

test("módulo definido na Estrutura (dentro do bloco de código) fecha a rastreabilidade", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Tudo deriva disso.",
      "",
      "## Estrutura",
      "",
      "```",
      "src/",
      "  cli.js   # borda: argv, relatório e exit code",
      "```",
      "",
      "## Decisões em aberto",
      "",
      "Nenhuma pendente.",
      "",
    ].join("\n"),
    "PLAN.md": [
      "# PLAN.md",
      "",
      "> Plano de execução.",
      "",
      "## Fase 0 — Fundação",
      "",
      "- [ ] T0.1 — borda de linha de comando · módulo: cli",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(r.violacoes, []);
});

test("decisão resolvida pode apontar tarefa já compactada; pendente não pode", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Tudo deriva disso.",
      "",
      "## Estrutura",
      "",
      "```",
      "src/",
      "  core.js  # núcleo",
      "```",
      "",
      "## Decisões em aberto",
      "",
      "Nenhuma pendente.",
      "",
    ].join("\n"),
    "PLAN.md": [
      "# PLAN.md",
      "",
      "> Plano de execução.",
      "",
      "## Fase 1 — Atual",
      "",
      "- [ ] T1.1 — tarefa viva · módulo: core",
      "",
      "## Decisões em aberto",
      "",
      "- [x] **Antiga** — resolvido: feito (rodada x); afetava T0.9.",
      "- [ ] **Pendente** — afeta T0.8.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(ids(r), ["T5"]);
  assert.match(r.violacoes[0].msg, /pendente aponta T0\.8/);
});

test("marcador de rodada: formato válido passa, inválido acusa", async () => {
  const base = {
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Tudo deriva disso.",
      "",
      "## Decisões em aberto",
      "",
      "Nenhuma pendente.",
      "",
    ].join("\n"),
  };
  const ok = await verificar(
    await docSet({
      ...base,
      "PLAN.md": "# PLAN.md\n\n> Plano.\n\n<!-- rodada: fase-1 @ b7e4d21 -->\n",
    }),
  );
  assert.deepEqual(ok.violacoes, []);

  const semGit = await verificar(
    await docSet({
      ...base,
      "PLAN.md":
        "# PLAN.md\n\n> Plano.\n\n<!-- rodada: fase-1 @ 2026-07-16 -->\n",
    }),
  );
  assert.deepEqual(semGit.violacoes, []);

  const ruim = await verificar(
    await docSet({
      ...base,
      "PLAN.md": "# PLAN.md\n\n> Plano.\n\n<!-- rodada: fase-1 -->\n",
    }),
  );
  assert.deepEqual(ids(ruim), ["E3"]);
});

// --- H: presente permanente (regra 2) e J: jurisdição (regra 8) ---

const CONTRATO_MINIMO = [
  // Contrato mínimo válido para isolar as regras nos testes abaixo.
  "# projeto",
  "",
  "> Contrato de como escrevemos código aqui.",
  "",
  "## Regra de ouro",
  "",
  "**Uma disciplina.** Tudo deriva disso.",
  "",
  "## Decisões em aberto",
  "",
  "Nenhuma pendente.",
  "",
].join("\n");

const avisos = (r) => r.avisos.map((v) => v.id);
// Doc-set de teste vive em diretório temporário sem código: as checagens de
// ancoragem (A*) acendem de propósito. Quem testa H e J filtra a família.
const avisosDe = (r, familia) =>
  r.avisos.map((v) => v.id).filter((id) => id.startsWith(familia));

test("H1: data e carimbo de rodada no corpo acendem; o marcador e a marca de fonte não", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Convenções",
      "",
      "- Slug NFD (decidido em 2026-07-13).",
      "- Router por arquivos (fonte: docs oficiais Next 15, jan/2026).",
      "- Erros com Result (rodada fase-2).",
      "- Core puro sem process.exit.",
      "",
      "<!-- rodada: fase-2 @ b7e4d21 -->",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(r.violacoes, []);
  // a linha da data e a do carimbo; a marca de fonte e o marcador ficam de fora
  assert.deepEqual(avisos(r), ["H1", "H1"]);
  assert.match(r.avisos[0].msg, /vigência e seu efeito/);
});

test("H2: decisão resolvida que permanece acende; a linha não é acusada duas vezes por H1", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Decisões em aberto",
      "",
      "- [x] **Formato** — resolvido: texto simples (rodada fase-1).",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  // H2 na linha da decisão; H1 não repete nela, mesmo com "(rodada fase-1)"
  assert.deepEqual(avisos(r), ["H2"]);
});

test("H3: vocabulário narrativo acende e nomeia o termo encontrado", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Convenções",
      "",
      "- Anteriormente o core decidia o exit code; hoje quem decide é a CLI.",
      "- Core puro sem process.exit.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(avisos(r), ["H3"]);
  assert.match(r.avisos[0].msg, /Anteriormente/);
});

test("H4: fase com todos os checkboxes fechados acende; fase mista e fase vazia não", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Estrutura",
      "",
      "```",
      "src/",
      "  core.js  # núcleo",
      "```",
      "",
    ].join("\n"),
    "PLAN.md": [
      "# PLAN.md",
      "",
      "> Plano de execução.",
      "",
      "## Fase 0 — Fundação",
      "",
      "- [x] T0.1 — pronta · módulo: core",
      "- [x] T0.2 — pronta também · módulo: core",
      "",
      "## Fase 1 — Atual",
      "",
      "- [x] T1.1 — pronta · módulo: core",
      "- [ ] T1.2 — em andamento · módulo: core",
      "",
      "## Fase 2 — Futura",
      "",
      "Objetivo: detalhada quando a Fase 1 fechar.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "H"), ["H4"]);
  assert.match(
    r.avisos.find((a) => a.id === "H4").msg,
    /Fase 0 — Fundação.*2 tarefa/s,
  );
});

test("H5: SPEC ou PLAN acima do limite brando acende, sem virar violação", async () => {
  const recheio = Array.from({ length: 320 }, (_, i) => `Linha ${i}.`);
  const dir = await docSet({
    "SPEC.md": [
      "# SPEC.md",
      "",
      '> Descreve o produto atual; o futuro vive na seção "Planejado".',
      "",
      "## Planejado / fases posteriores",
      "",
      "> Nada planejado no momento.",
      "",
      ...recheio,
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(r.violacoes, []);
  assert.deepEqual(avisos(r), ["H5"]);
});

test("J1: a mesma decisão em dois arquivos acende nos dois e nomeia o outro", async () => {
  const decisao = "- [ ] **Formato do relatório** — texto ou JSON.";
  const dir = await docSet({
    "SPEC.md": [
      "# SPEC.md",
      "",
      '> Descreve o produto atual; o futuro vive na seção "Planejado".',
      "",
      "## Planejado / fases posteriores",
      "",
      "> Nada planejado no momento.",
      "",
      "## Decisões em aberto (a confirmar)",
      "",
      decisao,
      "",
    ].join("\n"),
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Decisões em aberto",
      "",
      // acento e caixa diferentes: a comparação é por chave normalizada
      "- [ ] **formato do relatorio** — texto ou JSON.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(avisos(r), ["J1", "J1"]);
  assert.match(r.avisos[0].msg, /também aparece em SPEC\.md/);
});

test("J2: Stack com versão fora do AGENTS acende; Stack sem versão é referência legítima", async () => {
  const contrato = [
    CONTRATO_MINIMO,
    "## Stack",
    "",
    "| Camada  | Tecnologia     |",
    "| ------- | -------------- |",
    "| Runtime | Node ≥ 20, ESM |",
    "",
  ].join("\n");
  const spec = (linhaDaStack) =>
    [
      "# SPEC.md",
      "",
      '> Descreve o produto atual; o futuro vive na seção "Planejado".',
      "",
      "## Stack",
      "",
      linhaDaStack,
      "",
      "## Planejado / fases posteriores",
      "",
      "> Nada planejado no momento.",
      "",
    ].join("\n");

  const copia = await verificar(
    await docSet({
      "AGENTS.md": contrato,
      "SPEC.md": spec("- **Node ≥ 20, ESM** — stdlib apenas."),
    }),
  );
  assert.deepEqual(avisos(copia), ["J2"]);
  assert.match(copia.avisos[0].msg, /dono em AGENTS\.md/);

  const referencia = await verificar(
    await docSet({
      "AGENTS.md": contrato,
      "SPEC.md": spec("- **Node, ESM** — stdlib apenas; versões no AGENTS.md."),
    }),
  );
  assert.deepEqual(referencia.avisos, []);
});

test("--strict promove H e J a violação; V1 (volume) nunca é promovida", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Convenções",
      "",
      "- Slug NFD (decidido em 2026-07-13).",
      "",
      ...Array.from({ length: 220 }, (_, i) => `Linha ${i}.`),
    ].join("\n"),
  });

  const brando = await verificar(dir);
  assert.deepEqual(brando.violacoes, []);
  assert.deepEqual(avisos(brando).sort(), ["H1", "V1"]);

  // H1 é promovível; V1 continua aviso — volume é julgamento, nunca quebra build
  const estrito = await verificar(dir, { strict: true });
  assert.deepEqual(
    estrito.violacoes.map((v) => v.id),
    ["H1"],
  );
  assert.deepEqual(avisos(estrito), ["V1"]);
});

test("E5: emoji acusa; árvore de pastas com box-drawing não", async () => {
  const comEmoji = await verificar(
    await docSet({
      "AGENTS.md": [CONTRATO_MINIMO, "## Convenções 🚀", "", "- Core puro.", ""].join("\n"),
    }),
  );
  assert.deepEqual(ids(comEmoji), ["E5"]);
  assert.match(comEmoji.violacoes[0].msg, /🚀/);

  // Árvore com box-drawing é estrutura legítima (regra 13 proíbe decoração,
  // não a árvore comentada que ela própria recomenda), e notação com variante
  // emoji é notação: `↔` em "doc↔código" não é enfeite.
  const semDecoracao = await verificar(
    await docSet({
      "AGENTS.md": [
        CONTRATO_MINIMO,
        "## Convenções",
        "",
        "- Ancoragem doc↔código conferida no CI; exit ≥ 1 falha o build ✓.",
        "",
        "## Estrutura",
        "",
        "```",
        "src/",
        "├── check.js   # core puro",
        "└── cli.js     # borda",
        "```",
        "",
      ].join("\n"),
    }),
  );
  assert.deepEqual(semDecoracao.violacoes, []);
});

test("F3: cabeçalho que promete a seção Planejado sem ela existir acusa", async () => {
  const dir = await docSet({
    "SPEC.md": [
      "# SPEC.md",
      "",
      '> Descreve o produto atual; o planejado vive na seção final "Planejado".',
      "",
      "## Funcionalidades",
      "",
      "- coisa que existe.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(ids(r), ["F3"]);
  assert.match(r.violacoes[0].msg, /promete a seção "Planejado"/);
});

test("C2: regra de ouro sem negrito acusa; a seção existir não basta", async () => {
  const dir = await docSet({
    "AGENTS.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "Evitamos dependências externas sempre que dá.",
      "",
      "## Decisões em aberto",
      "",
      "Nenhuma pendente.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(ids(r), ["C2"]);
});

test("T1: id de tarefa repetido no PLAN acusa", async () => {
  const dir = await docSet({
    "PLAN.md": [
      "# PLAN.md",
      "",
      "> Plano de execução.",
      "",
      "## Fase 1 — Atual",
      "",
      "- [ ] T1.1 — primeira · módulo: core",
      "- [ ] T1.1 — segunda com o mesmo id · módulo: core",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(ids(r), ["T1"]);
  assert.match(r.violacoes[0].msg, /duplicado: T1\.1/);
});

// --- S: supressão justificada ---

test("S1: supressão com motivo silencia o id; sem motivo, acusa", async () => {
  const PLAN = [
    "# PLAN.md",
    "",
    "> Plano de execução.",
    "",
    "## Fase 1 — Atual",
    "",
    "- [ ] T1.1 — tarefa viva · módulo: core",
    "",
  ].join("\n");
  const docs = (comentario) => ({
    "PLAN.md": PLAN,
    "SPEC.md": [
      "# SPEC.md",
      "",
      '> Descreve o produto atual; o futuro vive na seção "Planejado".',
      "",
      comentario,
      "",
      "## Planejado / fases posteriores",
      "",
      "> Nada planejado no momento.",
      "",
      "## Decisões em aberto (a confirmar)",
      "",
      "- [ ] **Escopo do relatório** — a definir (afeta T9.9).",
      "",
    ].join("\n"),
  });

  const semSupressao = await verificar(await docSet(docs("")));
  assert.deepEqual(ids(semSupressao), ["T5"]);

  const comMotivo = await verificar(
    await docSet(
      docs("<!-- docscheck: ignore T5 — o PLAN vive em outro repositório -->"),
    ),
  );
  assert.deepEqual(ids(comMotivo), []);

  const semMotivo = await verificar(
    await docSet(docs("<!-- docscheck: ignore T5 -->")),
  );
  assert.deepEqual(ids(semMotivo).sort(), ["S1", "T5"]);

  const idInventado = await verificar(
    await docSet(docs("<!-- docscheck: ignore Z9 — sei lá -->")),
  );
  assert.ok(idInventado.violacoes.some((v) => v.id === "S1"));
});

test("S1: a supressão vale só no arquivo em que está escrita", async () => {
  const decisao = "- [ ] **Formato do relatório** — texto ou JSON.";
  const dir = await docSet({
    "SPEC.md": [
      "# SPEC.md",
      "",
      '> Descreve o produto atual; o futuro vive na seção "Planejado".',
      "",
      "<!-- docscheck: ignore J1 — espelhada de propósito enquanto o time migra -->",
      "",
      "## Planejado / fases posteriores",
      "",
      "> Nada planejado no momento.",
      "",
      "## Decisões em aberto (a confirmar)",
      "",
      decisao,
      "",
    ].join("\n"),
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Decisões em aberto",
      "",
      decisao,
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  // suprimida no SPEC, ainda acusada no AGENTS
  assert.deepEqual(avisosDe(r, "J"), ["J1"]);
  assert.equal(r.avisos.find((a) => a.id === "J1").arquivo, "AGENTS.md");
});

// --- D: DOMAIN.md (glossário e invariantes) ---

test("D1: invariante sem id acende; numerado com I<n> passa", async () => {
  const dir = await docSet({
    "DOMAIN.md": [
      "# DOMAIN.md",
      "",
      "> O vocabulário e as leis do domínio de pedidos.",
      "",
      "## Invariantes",
      "",
      "1. **I1 — pedido cancelado nunca volta a pago** — a transição não existe.",
      "2. **O estoque precisa ser consistente** — sem id, sem forma verificável.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(
    r.violacoes.map((v) => v.id),
    ["D1"],
  );
  assert.match(r.violacoes[0].msg, /invariante sem id/);
});

test("D2: SPEC ou PLAN citando invariante inexistente acende", async () => {
  const dir = await docSet({
    "DOMAIN.md": [
      "# DOMAIN.md",
      "",
      "> O vocabulário e as leis do domínio de pedidos.",
      "",
      "## Invariantes",
      "",
      "1. **I1 — pedido cancelado nunca volta a pago** — a transição não existe.",
      "",
    ].join("\n"),
    "SPEC.md": [
      "# SPEC.md",
      "",
      '> Descreve o produto atual; o futuro vive na seção "Planejado".',
      "",
      "## Critérios de aceitação",
      "",
      "1. Cancelar e tentar pagar → recusado (garante I1).",
      "2. Reembolso parcial não zera o saldo (garante I7).",
      "",
      "## Planejado / fases posteriores",
      "",
      "> Nada planejado no momento.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(
    r.violacoes.map((v) => v.id),
    ["D2"],
  );
  assert.match(r.violacoes[0].msg, /I7/);
});

test("D3: entrada de glossário que descreve feature acende; definição não", async () => {
  const dir = await docSet({
    "DOMAIN.md": [
      "# DOMAIN.md",
      "",
      "> O vocabulário e as leis do domínio de pedidos.",
      "",
      "## Glossário",
      "",
      "- **Pedido** — intenção de compra confirmada. Não é carrinho: carrinho não reserva estoque.",
      "- **Checkout** — o usuário clica em comprar e o sistema valida o estoque.",
      "",
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "D"), ["D3"]);
  assert.match(r.avisos.find((a) => a.id === "D3").msg, /comportamento de feature/);
});

// --- A: ancoragem doc↔código ---
//
// O fixture linkcheck é o único doc-set do repo com código real por baixo;
// é contra ele que a ancoragem se calibra. Os casos negativos abaixo copiam
// o fixture e quebram um vínculo de cada vez.

async function copiaDoFixture(mutacoes = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "docscheck-anc-"));
  await cp(FIXTURE, dir, { recursive: true });
  for (const [nome, transformar] of Object.entries(mutacoes)) {
    const p = path.join(dir, nome);
    await writeFile(p, transformar(await readFile(p, "utf8")));
  }
  return dir;
}

test("A0: ecossistema fora do alcance da ancoragem é declarado, não silenciado", async () => {
  const dir = await copiaDoFixture();
  await rm(path.join(dir, "package.json"));
  await writeFile(path.join(dir, "pyproject.toml"), '[project]\nname = "x"\n');
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "A0"), ["A0"]);
  assert.match(r.avisos.find((a) => a.id === "A0").msg, /pyproject\.toml/);

  // Projeto Node: a ancoragem alcança, e A0 não tem o que declarar.
  const node = await verificar(FIXTURE);
  assert.deepEqual(avisosDe(node, "A0"), []);

  // Sem manifest nenhum não é lacuna de cobertura — é projeto sem manifest.
  const nu = await copiaDoFixture();
  await rm(path.join(nu, "package.json"));
  assert.deepEqual(avisosDe(await verificar(nu), "A0"), []);
});

test("A1: pasta citada na árvore da Estrutura e ausente do disco acende", async () => {
  const dir = await copiaDoFixture({
    "AGENTS.md": (md) => md.replace("  check.js", "  parser.js"),
  });
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "A1"), ["A1"]);
  assert.match(r.avisos[0].msg, /src\/parser\.js/);
});

test("A2: comando de Como rodar ausente dos scripts do manifest acende", async () => {
  const dir = await copiaDoFixture({
    "AGENTS.md": (md) => md.replace("node --test             # testes", "npm run cobertura"),
  });
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "A2"), ["A2"]);
  assert.match(r.avisos[0].msg, /"cobertura"/);
});

test("A3: versão da tabela Stack divergente do engines do manifest acende", async () => {
  const dir = await copiaDoFixture({
    "AGENTS.md": (md) => md.replace("Node ≥ 20, ESM", "Node ≥ 18, ESM"),
  });
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "A3"), ["A3"]);
  assert.match(r.avisos[0].msg, /Node 18/);
});

test("A5: caminho citado que não existe acende; caminho válido e placeholder não", async () => {
  const dir = await copiaDoFixture({
    "AGENTS.md": (md) =>
      md.replace(
        "## Gaps conhecidos",
        "Detalhe da borda em `docs/borda-http.md`; exemplo em `<pacote>/AGENTS.md`.\n\n## Gaps conhecidos",
      ),
  });
  const r = await verificar(dir);
  // só o caminho concreto inexistente; o placeholder entre <> fica de fora
  assert.deepEqual(avisosDe(r, "A5"), ["A5"]);
  assert.match(r.avisos[0].msg, /docs\/borda-http\.md/);
});

test("A5: um atalho que é sufixo de um caminho do repositório resolve; um alias e uma variável não são caminhos", async () => {
  const dir = await copiaDoFixture({
    "AGENTS.md": (md) =>
      md.replace(
        "## Gaps conhecidos",
        [
          "A regra vive em `nested/util.js`; o alias é `@repo/utils/lib/x.ts` e o",
          "turbo lê `$TURBO_ROOT$/agents.md`; o que não existe é `nested/other.js`.",
          "",
          "## Gaps conhecidos",
        ].join("\n"),
      ),
  });
  await mkdir(path.join(dir, "src", "deep", "nested"), { recursive: true });
  await writeFile(path.join(dir, "src", "deep", "nested", "util.js"), "export {};\n");
  const r = await verificar(dir);
  // só o sufixo que não casa com arquivo nenhum; o atalho válido, o alias e a
  // variável ficam de fora
  assert.deepEqual(avisosDe(r, "A5"), ["A5"]);
  assert.match(r.avisos[0].msg, /nested\/other\.js/);
});

test("A5: num repositório git o índice é o que o git enxerga — um arquivo ignorado não faz um atalho resolver", async () => {
  const dir = await copiaDoFixture({
    "AGENTS.md": (md) =>
      md.replace(
        "## Gaps conhecidos",
        "Rastreado em `nested/util.js`; ignorado em `deep/out.js`; pasta em `nested/`.\n\n## Gaps conhecidos",
      ),
  });
  await mkdir(path.join(dir, "src", "deep", "nested"), { recursive: true });
  await writeFile(path.join(dir, "src", "deep", "nested", "util.js"), "export {};\n");
  await mkdir(path.join(dir, "build", "deep"), { recursive: true });
  await writeFile(path.join(dir, "build", "deep", "out.js"), "// gerado\n");
  await writeFile(path.join(dir, ".gitignore"), "build/\n");
  execFileSync("git", ["init", "-q"], { cwd: dir });
  const r = await verificar(dir);
  // `nested/util.js` é novo e não ignorado (o git o enxerga); `build/deep/out.js`
  // está no disco mas é ignorado, então `deep/out.js` não resolve por sufixo
  assert.deepEqual(avisosDe(r, "A5"), ["A5"]);
  assert.match(r.avisos[0].msg, /deep\/out\.js/);
});

test("A4: nome de env citado e ausente do .env.example acende; só nomes são lidos", async () => {
  const dir = await copiaDoFixture({
    "AGENTS.md": (md) =>
      md.replace(
        "## Gaps conhecidos",
        [
          "## Env e segredos",
          "",
          "- `LINKCHECK_TIMEOUT` controla o timeout dos externos.",
          "- `LINKCHECK_UA` define o user-agent.",
          "",
          "## Gaps conhecidos",
        ].join("\n"),
      ),
  });
  await writeFile(
    path.join(dir, ".env.example"),
    "LINKCHECK_TIMEOUT=5000\nSEGREDO_NAO_CITADO=nunca-lido\n",
  );
  const r = await verificar(dir);
  // LINKCHECK_UA não existe no exemplo; LINKCHECK_TIMEOUT existe e não acende
  assert.deepEqual(avisosDe(r, "A4"), ["A4"]);
  assert.match(r.avisos.find((a) => a.id === "A4").msg, /LINKCHECK_UA/);
});

test("A6: marcador muito atrás de HEAD acende com a contagem", async () => {
  const dir = await copiaDoFixture();
  const git = (...args) =>
    execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], {
      cwd: dir,
      encoding: "utf8",
    });
  git("init", "-q");
  git("commit", "-q", "--allow-empty", "-m", "raiz");
  const sha = git("rev-parse", "--short", "HEAD").trim();
  for (let i = 0; i < 31; i++) git("commit", "-q", "--allow-empty", "-m", `c${i}`);
  const p = path.join(dir, "PLAN.md");
  await writeFile(
    p,
    (await readFile(p, "utf8")).replace(/@ [0-9a-f]+ -->/, `@ ${sha} -->`),
  );
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "A6"), ["A6"]);
  assert.match(r.avisos.find((a) => a.id === "A6").msg, /31 commits desde a última rodada/);
});

test("A6: marcador apontando para um ref fora do histórico acende", async () => {
  const dir = await copiaDoFixture();
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit",
    "-q", "--allow-empty", "-m", "raiz"], { cwd: dir });
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "A6"), ["A6"]);
  assert.match(r.avisos[0].msg, /não está no histórico/);
});

test("A7: satélite em docs/ sem ponteiro no doc-set acende", async () => {
  const dir = await copiaDoFixture();
  await mkdir(path.join(dir, "docs"));
  await writeFile(path.join(dir, "docs", "borda-http.md"), "# Borda HTTP\n");
  const orfao = await verificar(dir);
  assert.deepEqual(avisosDe(orfao, "A7"), ["A7"]);
  assert.match(orfao.avisos[0].msg, /nenhum documento do doc-set aponta/);

  // com o ponteiro de volta no AGENTS.md, o satélite deixa de ser órfão
  const p = path.join(dir, "AGENTS.md");
  await writeFile(
    p,
    (await readFile(p, "utf8")).replace(
      "## Gaps conhecidos",
      "Detalhe da borda de rede em `docs/borda-http.md`.\n\n## Gaps conhecidos",
    ),
  );
  const ligado = await verificar(dir);
  assert.deepEqual(avisosDe(ligado, "A7"), []);
  assert.deepEqual(avisosDe(ligado, "A5"), []);
});

test("A8: AGENTS.md de pacote que copia a regra de ouro do raiz acende", async () => {
  const dir = await copiaDoFixture();
  await mkdir(path.join(dir, "packages", "core"), { recursive: true });
  await writeFile(
    path.join(dir, "packages", "core", "AGENTS.md"),
    [
      "# core",
      "",
      "> Recipe local do pacote core.",
      "",
      "## Regra de ouro",
      "",
      "**Zero dependências de runtime: toda funcionalidade usa apenas a stdlib do",
      "Node.** Tudo abaixo é desdobramento disso.",
      "",
    ].join("\n"),
  );
  const r = await verificar(dir);
  assert.deepEqual(avisosDe(r, "A8"), ["A8"]);
  assert.match(r.avisos[0].msg, /cópia literal/);
});

test("a ancoragem não acende sozinha: os doc-sets de referência têm código real por baixo", async () => {
  for (const f of [FIXTURE, FIXTURE_DOMINIO]) {
    const r = await verificar(f, { strict: true });
    assert.deepEqual(r.violacoes, [], `${path.basename(f)}: violações`);
    assert.deepEqual(r.avisos, [], `${path.basename(f)}: avisos`);
  }
});

test("o doc-set com domínio exercita DOMAIN.md de ponta a ponta", async () => {
  const r = await verificar(FIXTURE_DOMINIO, { strict: true });
  assert.ok(r.arquivos.includes("DOMAIN.md"));
  // os invariantes citados no SPEC e no PLAN resolvem contra o DOMAIN (D2)
  const spec = await readFile(path.join(FIXTURE_DOMINIO, "SPEC.md"), "utf8");
  assert.match(spec, /garante I1/);
  assert.deepEqual(r.violacoes, []);
});

test("--estado devolve o resumo que a skill e scripts consomem", async () => {
  const e = await estado(FIXTURE);
  assert.deepEqual(Object.keys(e).sort(), [
    "arquivos",
    "decisoes_pendentes",
    "fase_atual",
    "gramatica",
    "invariantes",
    "marcador",
    "tarefas_abertas",
  ]);

  // Fase corrente = a primeira com tarefa aberta, e as tarefas dela.
  assert.match(e.fase_atual.nome, /^Fase 2/);
  assert.equal(e.fase_atual.abertas, e.tarefas_abertas.length);
  assert.deepEqual(
    e.tarefas_abertas.map((t) => t.id),
    ["T2.1", "T2.2", "T2.3"],
  );
  for (const t of e.tarefas_abertas) assert.ok(t.modulo, `${t.id} sem módulo`);

  assert.deepEqual(
    e.decisoes_pendentes.map((d) => d.decisao),
    ["Timeout padrão dos links externos"],
  );
  assert.equal(e.marcador.arquivo, "PLAN.md");
  assert.match(e.marcador.ref, /^[0-9a-f]{7,}$/);

  // Doc-set com domínio expõe os invariantes; o sem domínio devolve lista vazia.
  const dominio = await estado(FIXTURE_DOMINIO);
  assert.deepEqual(dominio.invariantes, ["I1", "I2", "I3", "I4"]);
  assert.deepEqual(e.invariantes, []);

  // Fora de um doc-set: null, não exceção — o hook depende disso para ficar
  // em silêncio em vez de sujar toda sessão que abre num diretório qualquer.
  const vazio = await mkdtemp(path.join(tmpdir(), "docscheck-estado-"));
  assert.equal(await estado(vazio), null);

  // E pela CLI.
  const bin = fileURLToPath(new URL("../bin/docscheck.mjs", import.meta.url));
  const viaCli = JSON.parse(
    execFileSync("node", [bin, "--estado", FIXTURE], { encoding: "utf8" }),
  );
  assert.deepEqual(viaCli, e);
});

test("vários diretórios: panorama que pula o que não é doc-set", async () => {
  const bin = fileURLToPath(new URL("../bin/docscheck.mjs", import.meta.url));
  const raiz = fileURLToPath(new URL("..", import.meta.url));
  const args = [
    FIXTURE,
    FIXTURE_DOMINIO,
    path.join(raiz, "bin"), // não é doc-set: some da saída
    path.join(raiz, "scripts"), // idem
  ];

  const saida = execFileSync("node", [bin, ...args], { encoding: "utf8" });
  assert.match(saida, /linkcheck\s+ok/);
  assert.match(saida, /pedidos\s+ok/);
  assert.doesNotMatch(saida, /\bbin\b/, "diretório sem doc-set poluiu o panorama");
  assert.doesNotMatch(saida, /nenhum arquivo da gramática/);
  assert.match(saida, /resumo: 0 de 2 doc-set\(s\) com violação/);

  // Com um doc-set sujo na lista, o exit agrega.
  let code = 0;
  try {
    execFileSync("node", [bin, ...args, path.join(raiz, "examples/fixtures/notas-api")], {
      encoding: "utf8",
    });
  } catch (e) {
    code = e.status;
  }
  assert.equal(code, 1, "um doc-set com violação precisa reprovar o panorama");

  // Nenhum alvo é doc-set: exit 0 e uma linha dizendo isso.
  const nada = execFileSync("node", [bin, path.join(raiz, "bin"), path.join(raiz, "scripts")], {
    encoding: "utf8",
  });
  assert.match(nada, /nenhum doc-set encontrado/);
});

test("--json emite o contrato que o /docs auditar consome", async () => {
  // A forma desta saída é contrato: o comando lê JSON em vez de parsear texto.
  // Mudar um nome de campo aqui quebra o relatório sem quebrar nada visível.
  const dir = await docSet({
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Nunca fazer",
      "",
      "- Nunca usar var.",
      "",
    ].join("\n"),
  });

  const bin = fileURLToPath(new URL("../bin/docscheck.mjs", import.meta.url));
  let saida, code = 0;
  try {
    saida = execFileSync("node", [bin, "--json", dir], { encoding: "utf8" });
  } catch (e) {
    saida = e.stdout;
    code = e.status;
  }

  const r = JSON.parse(saida);
  assert.equal(code, 1, "com violação, --json ainda precisa sair 1");
  assert.equal(r.gramatica, GRAMATICA);
  assert.deepEqual(Object.keys(r).sort(), [
    "arquivos",
    "avisos",
    "gramatica",
    "violacoes",
  ]);
  assert.ok(r.violacoes.length > 0);
  for (const v of r.violacoes) {
    assert.deepEqual(Object.keys(v).sort(), [
      "arquivo",
      "id",
      "linha",
      "msg",
      "regra",
      "severidade",
    ]);
    assert.equal(typeof v.linha, "number");
  }

  // Doc-set limpo: JSON válido, listas vazias, exit 0.
  let limpo;
  try {
    limpo = JSON.parse(
      execFileSync("node", [bin, "--json", FIXTURE], { encoding: "utf8" }),
    );
  } catch (e) {
    assert.fail(`--json falhou num doc-set limpo: ${e.stdout}`);
  }
  assert.deepEqual(limpo.violacoes, []);
  assert.deepEqual(limpo.avisos, []);
});

test('.docscheck.json com {"strict": true} promove como a flag; inválido é erro de uso', async () => {
  const doc = {
    "AGENTS.md": [
      CONTRATO_MINIMO,
      "## Convenções",
      "",
      "- Slug NFD (decidido em 2026-07-13).",
      "",
    ].join("\n"),
  };

  const semConfig = await verificar(await docSet(doc));
  assert.deepEqual(semConfig.violacoes, []);
  assert.deepEqual(avisosDe(semConfig, "H"), ["H1"]);

  const dir = await docSet(doc);
  await writeFile(path.join(dir, ".docscheck.json"), '{"strict": true}\n');
  const comConfig = await verificar(dir);
  assert.deepEqual(
    comConfig.violacoes.map((v) => v.id),
    ["H1"],
    "o .docscheck.json não promoveu o aviso a violação",
  );

  // Config sem strict não promove nada — ausência de chave não é `false` implícito
  // que muda comportamento, é simplesmente o padrão.
  const dirNeutro = await docSet(doc);
  await writeFile(path.join(dirNeutro, ".docscheck.json"), '{"outra": 1}\n');
  const neutro = await verificar(dirNeutro);
  assert.deepEqual(neutro.violacoes, []);

  // JSON quebrado precisa falhar alto: silenciar viraria "strict desligou sozinho".
  const dirRuim = await docSet(doc);
  await writeFile(path.join(dirRuim, ".docscheck.json"), "{ não é json }");
  await assert.rejects(() => verificar(dirRuim), /docscheck\.json/);
});

// --- acoplamento: catálogo ↔ implementação ↔ texto normativo ---
//
// Estes quatro testes substituem a comparação de string que existia até a v4
// (GRAMATICA === a versão declarada no bootstrap.md). Aquela comparação
// deixava passar exatamente o caso perigoso: editar uma regra sem tocar no
// verificador.

const FONTE = await readFile(new URL("../bin/docscheck.mjs", import.meta.url), "utf8");
const NORMATIVO = await readFile(
  new URL("../grammar/GRAMATICA.md", import.meta.url),
  "utf8",
);
// A metade do arquivo depois do catálogo: onde os checks realmente rodam.
const IMPLEMENTACAO = FONTE.slice(FONTE.indexOf("const REGRA = Object.fromEntries"));

test("o catálogo REGRAS é bem formado: ids únicos e nenhum campo vazio", () => {
  const vistos = new Set();
  for (const r of REGRAS) {
    assert.match(r.id, /^[A-Z]\d+$/, `id fora do padrão: ${r.id}`);
    assert.ok(!vistos.has(r.id), `id duplicado no catálogo: ${r.id}`);
    vistos.add(r.id);
    for (const campo of ["regra", "alvo", "titulo", "porque", "ok", "ruim"]) {
      assert.ok(
        typeof r[campo] === "string" && r[campo].trim() !== "",
        `${r.id}: campo "${campo}" vazio`,
      );
    }
    assert.ok(
      ["violacao", "aviso"].includes(r.severidade),
      `${r.id}: severidade inválida "${r.severidade}"`,
    );
  }
});

test("toda regra do catálogo tem implementação (nenhuma entrada órfã)", () => {
  for (const r of REGRAS) {
    assert.ok(
      IMPLEMENTACAO.includes(`"${r.id}"`),
      `${r.id} está no catálogo mas nenhum achar() a emite — regra órfã`,
    );
  }
});

test("todo id emitido pela implementação existe no catálogo", async () => {
  const conhecidos = new Set(REGRAS.map((r) => r.id));
  for (const m of IMPLEMENTACAO.matchAll(/,\s*"([A-Z]\d+)",/g)) {
    assert.ok(
      conhecidos.has(m[1]),
      `a implementação emite "${m[1]}", que não está no catálogo REGRAS`,
    );
  }
  // E em runtime: um id fora do catálogo é erro duro, não violação silenciosa.
  const dir = await docSet({ "SPEC.md": "# SPEC.md\n\n> Papel.\n" });
  const r = await verificar(dir);
  for (const v of [...r.violacoes, ...r.avisos]) {
    assert.ok(conhecidos.has(v.id));
  }
});

test("a tabela do §5 de GRAMATICA.md está em dia com o catálogo", () => {
  assert.equal(
    aplicar(NORMATIVO),
    NORMATIVO,
    "rode: node scripts/gerar-gramatica.mjs",
  );
});

test("todo id citado em GRAMATICA.md existe no catálogo", () => {
  const conhecidos = new Set(REGRAS.map((r) => r.id));
  for (const m of NORMATIVO.matchAll(/`([A-Z]\d+)`/g)) {
    assert.ok(
      conhecidos.has(m[1]),
      `GRAMATICA.md cita \`${m[1]}\`, que não existe no catálogo REGRAS`,
    );
  }
});

test("toda regra do catálogo é exercitada por um teste que a nomeia", async () => {
  // Guarda de cobertura: uma regra nova sem teste falha aqui. Substitui um
  // corpus de diretórios por arquivo — mesma garantia, sem 56 doc-sets no repo.
  const suite = await readFile(new URL(import.meta.url), "utf8");
  // O próprio corpo deste teste não conta como exercício de nada.
  const corpo = suite.replace(
    /test\("toda regra do catálogo é exercitada[\s\S]*?\n}\);\n/,
    "",
  );
  const semTeste = REGRAS.filter((r) => !corpo.includes(`"${r.id}"`)).map(
    (r) => r.id,
  );
  assert.deepEqual(
    semTeste,
    [],
    `regras sem teste que as nomeie: ${semTeste.join(", ")}`,
  );
});

test("a constante GRAMATICA acompanha a versão declarada em GRAMATICA.md", () => {
  const m = NORMATIVO.match(/Versão da gramática: (v\d+)/);
  assert.ok(m, "grammar/GRAMATICA.md não declara a versão da gramática");
  assert.equal(GRAMATICA, m[1]);
});

test('toda referência "regra N" / "§N" do catálogo aponta para algo que existe', () => {
  // Sem esta rede, renumerar o §2 deixa o catálogo apontando para a regra
  // errada em silêncio — o campo `regra` é texto livre e não quebra nada.
  const secao2 = NORMATIVO.slice(
    NORMATIVO.indexOf("## §2"),
    NORMATIVO.indexOf("## §3"),
  );
  const numeradas = new Set(
    [...secao2.matchAll(/^(\d+)\. \*\*/gm)].map((m) => Number(m[1])),
  );
  const secoes = new Set(
    [...NORMATIVO.matchAll(/^## §(\d+)/gm)].map((m) => Number(m[1])),
  );
  assert.ok(numeradas.size >= 10, "§2 não parseou: nenhuma regra numerada");

  for (const r of REGRAS) {
    const n = r.regra.match(/^regra (\d+)$/);
    const s = r.regra.match(/^§(\d+)$/);
    assert.ok(n || s, `${r.id}: referência "${r.regra}" fora do formato`);
    if (n) {
      assert.ok(
        numeradas.has(Number(n[1])),
        `${r.id} aponta para a "regra ${n[1]}", que não existe no §2 da GRAMATICA`,
      );
    } else {
      assert.ok(
        secoes.has(Number(s[1])),
        `${r.id} aponta para o "§${s[1]}", que não existe na GRAMATICA`,
      );
    }
  }
});

test("as referências cruzadas dentro da GRAMATICA apontam para regras existentes", () => {
  const secao2 = NORMATIVO.slice(
    NORMATIVO.indexOf("## §2"),
    NORMATIVO.indexOf("## §3"),
  );
  const numeradas = new Set(
    [...secao2.matchAll(/^(\d+)\. \*\*/gm)].map((m) => m[1]),
  );
  for (const m of NORMATIVO.matchAll(/\bregra (\d+)\b/g)) {
    assert.ok(
      numeradas.has(m[1]),
      `a GRAMATICA cita a "regra ${m[1]}", que não existe no seu próprio §2`,
    );
  }
});

test("as referências numeradas dos comandos existem na gramática", async () => {
  const secao2 = NORMATIVO.slice(
    NORMATIVO.indexOf("## §2"),
    NORMATIVO.indexOf("## §3"),
  );
  const numeradas = new Set(
    [...secao2.matchAll(/^(\d+)\. \*\*/gm)].map((m) => m[1]),
  );
  const dir = fileURLToPath(new URL("../workflows", import.meta.url));
  const arquivos = (await readdir(dir)).filter((f) => f.endsWith(".md"));
  assert.ok(arquivos.length >= 5, "esperava os cinco comandos do ciclo");
  for (const nome of arquivos) {
    const md = await readFile(path.join(dir, nome), "utf8");
    for (const m of md.matchAll(/\bregra (\d+)\b/g)) {
      assert.ok(
        numeradas.has(m[1]),
        `workflows/${nome} cita a "regra ${m[1]}", inexistente na GRAMATICA`,
      );
    }
  }
});

// Regressões de ausência e formatos equivalentes descobertas na revisão.
test('C3: uma proibição basta; seção vazia falha; seção ausente é válida', async (t) => {
  for (const [corpo, esperado] of [
    ['', []],
    ['\n## Nunca fazer\n\n- Nunca expor tokens — permite acesso indevido.\n', []],
    ['\n## Nunca fazer\n', ["C3"]],
  ]) {
    const dir = await docSet({ 'AGENTS.md': CONTRATO_MINIMO + corpo });
    t.after(() => rm(dir, { recursive: true, force: true }));
    assert.deepEqual(ids(await verificar(dir, { strict: true })), esperado);
  }
});

test('C5: remover a seção de decisões não apaga a obrigação de declarar o estado', async (t) => {
  const dir = await docSet({
    'AGENTS.md': CONTRATO_MINIMO.replace(/## Decisões em aberto\n\nNenhuma pendente\.\n/, ''),
  });
  t.after(() => rm(dir, { recursive: true, force: true }));
  assert.deepEqual(ids(await verificar(dir)), ['C5']);
});

test('F1: rejeita a fronteira invertida; distingue presente e primeira entrega', async (t) => {
  for (const [papel, esperado] of [
    ['O corpo descreve o produto atual; Planejado contém o futuro.', []],
    ['O corpo descreve a primeira entrega ainda não implementada; Planejado contém fases posteriores.', []],
    ['O planejado fica na seção Planejado; nada fora dela deve ser lido como já existente.', ['F1']],
  ]) {
    const dir = await docSet({
      'SPEC.md': `# SPEC.md\n\n> ${papel}\n\n## Planejado\n\n> Ainda não implementado.\n`,
    });
    t.after(() => rm(dir, { recursive: true, force: true }));
    assert.deepEqual(ids(await verificar(dir)), esperado);
  }
});

test('H1: vigência exige efeito explícito; datas de registro continuam acusadas', async (t) => {
  const dir = await docSet({ 'AGENTS.md': CONTRATO_MINIMO + [
    '', '## Convenções', '',
    '- Migrar o protocolo (vigência: até 2027-01-01 — endpoint será desativado).',
    '- Usar a API estável (fonte: docs oficiais API 2, jan/2026).',
    '- Decidido em 2026-01-01.',
    '- Protocolo temporário (vigência: 2027-01-01).',
  ].join('\n') });
  t.after(() => rm(dir, { recursive: true, force: true }));
  const r = await verificar(dir, { strict: true });
  assert.deepEqual(ids(r), ['H1', 'H1']);
});

test('E1/E2/E5/A5: satélites aninhados e contratos locais recebem regras comuns', async (t) => {
  const dir = await docSet({ 'AGENTS.md': CONTRATO_MINIMO });
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const nome of ['docs/area/guia.md', 'packages/core/AGENTS.md']) {
    await mkdir(path.dirname(path.join(dir, nome)), { recursive: true });
    await writeFile(path.join(dir, nome), '# Guia\n\nTBD 🚀\n\nVeja `src/inexistente.js`.\n');
  }
  const r = await verificar(dir, { strict: true });
  for (const nome of ['docs/area/guia.md', 'packages/core/AGENTS.md']) {
    assert.deepEqual(r.violacoes.filter((a) => a.arquivo === nome).map((a) => a.id).sort(),
      ['A5', 'E1', 'E2', 'E5']);
    assert.ok(r.arquivos.includes(nome));
  }
});

test('A5: links de satélites resolvem a partir do arquivo que os contém', async (t) => {
  const dir = await docSet({ 'AGENTS.md': CONTRATO_MINIMO + '\nLeia [guia](docs/guia.md).\n' });
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'docs'));
  await writeFile(path.join(dir, 'docs/guia.md'), '# Guia\n\n> Referência.\n\nLeia [contrato](../AGENTS.md).\n');
  assert.deepEqual(ids(await verificar(dir, { strict: true })), []);
});

test('A1: árvores simples e com conectores validam caminhos e hierarquia', async (t) => {
  for (const arvore of [
    'src/\n  interno/\n    real.js\n  ausente.js\n',
    'src/\n├── interno/\n│   └── real.js\n└── ausente.js\n',
  ]) {
    const dir = await docSet({ 'AGENTS.md': CONTRATO_MINIMO + `\n## Estrutura\n\n\`\`\`\n${arvore}\`\`\`\n` });
    t.after(() => rm(dir, { recursive: true, force: true }));
    await mkdir(path.join(dir, 'src/interno'), { recursive: true });
    await writeFile(path.join(dir, 'src/interno/real.js'), '');
    const r = await verificar(dir, { strict: true });
    assert.deepEqual(ids(r), ['A1']);
    assert.match(r.violacoes[0].msg, /src\/ausente\.js/);
  }
});

test('A5: arquivo removido do disco não resolve pelo índice Git, nem por sufixo', async (t) => {
  const dir = await docSet({ 'AGENTS.md': CONTRATO_MINIMO + '\nVeja `notes/alvo.txt` e `alvo-local/alvo.txt`.\n' });
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const pasta of ['notes', 'packages/core/alvo-local']) {
    await mkdir(path.join(dir, pasta), { recursive: true });
    await writeFile(path.join(dir, pasta, 'alvo.txt'), 'conteúdo');
  }
  execFileSync('git', ['init', '-q'], { cwd: dir });
  execFileSync('git', ['add', '.'], { cwd: dir });
  assert.deepEqual(ids(await verificar(dir, { strict: true })), []);
  for (const pasta of ['notes', 'packages/core/alvo-local']) {
    await rm(path.join(dir, pasta, 'alvo.txt'));
  }
  const r = await verificar(dir, { strict: true });
  assert.deepEqual(ids(r), ['A5', 'A5']);
});

test("satélites e contratos por symlink não duplicam achados nem seguem diretórios externos", async (t) => {
  const dir = await docSet({ "AGENTS.md": CONTRATO_MINIMO });
  const externo = await mkdtemp(path.join(tmpdir(), "docscheck-externo-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  t.after(() => rm(externo, { recursive: true, force: true }));
  await writeFile(path.join(externo, "guia.md"), "# Guia\n\nTBD 🚀\n");
  await symlink(externo, path.join(dir, "docs"));
  await mkdir(path.join(dir, "packages/core"), { recursive: true });
  await symlink(path.join(dir, "AGENTS.md"), path.join(dir, "packages/core/AGENTS.md"));
  let r = await verificar(dir, { strict: true });
  assert.deepEqual(ids(r), []);
  assert.deepEqual(r.arquivos, ["AGENTS.md"]);
  await rm(path.join(dir, "docs"));
  await mkdir(path.join(dir, "docs"));
  await symlink(path.join(externo, "guia.md"), path.join(dir, "docs/guia.md"));
  r = await verificar(dir, { strict: true });
  assert.deepEqual(ids(r), []);
  assert.deepEqual(r.arquivos, ["AGENTS.md"]);
});

test("A9: ponte comum e symlink leem o mesmo contrato; conteúdo independente ou alvo quebrado acusa", async (t) => {
  const dir = await docSet({ "AGENTS.md": CONTRATO_MINIMO });
  t.after(() => rm(dir, { recursive: true, force: true }));
  const ponte = path.join(dir, "CLAUDE.md");
  assert.deepEqual(ids(await verificar(dir, { strict: true })), []);
  await writeFile(ponte, "@AGENTS.md\n");
  assert.deepEqual(ids(await verificar(dir, { strict: true })), []);
  await writeFile(ponte, "@AGENTS.md\n\nRegra independente.\n");
  assert.deepEqual(ids(await verificar(dir, { strict: true })), ["A9"]);
  await rm(ponte);
  await symlink("AGENTS.md", ponte);
  assert.deepEqual(ids(await verificar(dir, { strict: true })), []);
  await rm(ponte);
  await symlink("ausente.md", ponte);
  assert.deepEqual(ids(await verificar(dir, { strict: true })), ["A9"]);
});

test("A9: ponte de pacote não pode importar o contrato de outro diretório", async (t) => {
  const dir = await docSet({ "AGENTS.md": CONTRATO_MINIMO });
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, "packages/core"), { recursive: true });
  await writeFile(path.join(dir, "packages/core/AGENTS.md"), "# Core\n\n> Regras locais.\n");
  await writeFile(path.join(dir, "packages/core/CLAUDE.md"), "@../../AGENTS.md\n");
  const r = await verificar(dir, { strict: true });
  assert.deepEqual(ids(r), ["A9"]);
  assert.equal(r.violacoes[0].arquivo, "packages/core/AGENTS.md");
});
