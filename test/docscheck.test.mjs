import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GRAMATICA, verificar } from "../bin/docscheck.mjs";

const FIXTURE = fileURLToPath(
  new URL("../examples/fixtures/linkcheck", import.meta.url),
);

async function docSet(arquivos) {
  const dir = await mkdtemp(path.join(tmpdir(), "docscheck-"));
  for (const [nome, md] of Object.entries(arquivos)) {
    await writeFile(path.join(dir, nome), md);
  }
  return dir;
}

const regras = (r) => r.violacoes.map((v) => v.regra);

test("o doc-set de referência (fixtures/linkcheck) passa sem violações", async () => {
  const r = await verificar(FIXTURE);
  assert.deepEqual(r.violacoes, []);
  assert.deepEqual(r.avisos, []);
  assert.deepEqual(r.arquivos.sort(), ["CLAUDE.md", "PLAN.md", "SPEC.md"]);
});

test("CLAUDE.md acima do limite brando gera aviso, nunca violação", async () => {
  const recheio = Array.from(
    { length: 220 },
    (_, i) => `Linha de contexto ${i} da seção, sem nada de gramática.`,
  );
  const dir = await docSet({
    "CLAUDE.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Tudo deriva disso.",
      "",
      ...recheio,
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(r.violacoes, []);
  assert.equal(r.avisos.length, 1);
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
  assert.deepEqual(regras(r).sort(), ["R1", "R6", "R9", "papel"]);
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
  assert.deepEqual(regras(r), ["R1"]);
});

test('CLAUDE sem regra de ouro, "Nunca fazer" raso e estado implícito', async () => {
  const dir = await docSet({
    "CLAUDE.md": [
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
  // R2 (sem regra de ouro), R3 ×2 (menos de 4 itens; item sem "—"),
  // R5 (resolvida sem "Nenhuma pendente")
  assert.deepEqual(regras(r).sort(), ["R2", "R3", "R3", "R5"]);
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
    "CLAUDE.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Core puro, borda fina.** Tudo abaixo deriva disso.",
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
  assert.deepEqual(regras(r).sort(), ["R8", "R8", "R8", "R8"]);
  const msgs = r.violacoes.map((v) => v.msg).join("\n");
  assert.match(msgs, /T0\.1 sem "· módulo/);
  assert.match(msgs, /módulo "inexistente"/);
  assert.match(msgs, /constraint 2, inexistente/);
  assert.match(msgs, /T9\.9, inexistente no PLAN/);
});

test("a constante GRAMATICA acompanha a versão declarada no bootstrap.md §0", async () => {
  const bootstrap = await readFile(
    new URL("../commands/bootstrap.md", import.meta.url),
    "utf8",
  );
  const m = bootstrap.match(/Versão da gramática: (v\d+)/);
  assert.ok(m, "bootstrap.md não declara a versão da gramática");
  assert.equal(GRAMATICA, m[1]);
});

test("conteúdo de bloco de código não é gramática: heading, TBD e marcador em fence são ignorados", async () => {
  const dir = await docSet({
    "CLAUDE.md": [
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
    ].join("\n"),
  });
  const r = await verificar(dir);
  assert.deepEqual(r.violacoes, []);
});

test("módulo citado apenas em prosa do CLAUDE.md não fecha a rastreabilidade", async () => {
  const dir = await docSet({
    "CLAUDE.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Este projeto expõe uma CLI simples.",
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
  assert.deepEqual(regras(r), ["R8"]);
  assert.match(r.violacoes[0].msg, /módulo "cli"/);
});

test("módulo definido na Estrutura (dentro do bloco de código) fecha a rastreabilidade", async () => {
  const dir = await docSet({
    "CLAUDE.md": [
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
    "CLAUDE.md": [
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
  assert.deepEqual(regras(r), ["R8"]);
  assert.match(r.violacoes[0].msg, /pendente aponta T0\.8/);
});

test("marcador de rodada: formato válido passa, inválido acusa", async () => {
  const base = {
    "CLAUDE.md": [
      "# projeto",
      "",
      "> Contrato de como escrevemos código aqui.",
      "",
      "## Regra de ouro",
      "",
      "**Uma disciplina.** Tudo deriva disso.",
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
  assert.deepEqual(regras(ruim), ["marcador"]);
});
