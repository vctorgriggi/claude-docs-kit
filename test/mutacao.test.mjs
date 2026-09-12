// Casos de mutação sobre doc-sets de referência: cada alteração deve acionar
// a regra esperada. Um caso por regra garante presença no corpus, não cobertura
// de todas as formas de violação; variantes e ausências ficam na suíte unitária.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { REGRAS, verificar } from "../bin/docscheck.mjs";

const LINK = fileURLToPath(
  new URL("../examples/fixtures/linkcheck", import.meta.url),
);
const PED = fileURLToPath(
  new URL("../examples/fixtures/pedidos", import.meta.url),
);

async function copia(base) {
  const dir = await mkdtemp(path.join(tmpdir(), "docscheck-mut-"));
  await cp(base, dir, { recursive: true });
  return dir;
}

const gravar = (dir, arquivo, texto) =>
  writeFile(path.join(dir, arquivo), texto);

async function editar(dir, arquivo, transformar) {
  const p = path.join(dir, arquivo);
  await writeFile(p, transformar(await readFile(p, "utf8")));
}

const recheio = (n) =>
  "\n" + Array.from({ length: n }, (_, i) => `Linha ${i}.`).join("\n");

// Cada caso: [id da regra, doc-set de partida, como quebrá-lo].
const CASOS = [
  ["E1", LINK, (d) =>
    editar(d, "SPEC.md", (s) => s.replace(/^> .*\n(> .*\n)*/m, ""))],
  ["E2", LINK, (d) =>
    editar(d, "SPEC.md", (s) => s.replace("## Problema", "## Problema\n\nTBD"))],
  ["E3", LINK, (d) =>
    editar(d, "PLAN.md", (s) => s.replace(/@ [0-9a-f]+ -->/, "-->"))],
  ["E4", LINK, (d) =>
    editar(d, "SPEC.md", (s) =>
      s.replace(/- \[ \] \*\*Timeout[^\n]*/, "- [ ] decidir o timeout"))],

  ["E5", LINK, (d) =>
    editar(d, "SPEC.md", (s) => s.replace("## Problema", "## Problema 🚀"))],

  ["F1", LINK, (d) =>
    editar(d, "SPEC.md", (s) =>
      s.replace(/O que foi planejado[\s\S]*?no app\./, "Só isso."))],
  ["F2", LINK, (d) =>
    editar(d, "SPEC.md", (s) =>
      s.replace(/(## Planejado[^\n]*\n\n)> [^\n]*\n(> [^\n]*\n)*/, "$1"))],
  ["F3", LINK, (d) =>
    editar(d, "SPEC.md", (s) => s.slice(0, s.indexOf("## Planejado")))],

  ["C1", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) => s.replace("## Regra de ouro", "## Disciplina"))],
  ["C2", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) =>
      s.replace(
        /\*\*Zero dependências de runtime[\s\S]*?Node\.\*\*/,
        "Zero dependências de runtime.",
      ))],
  ["C3", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) => {
      const i = s.indexOf("## Nunca fazer");
      const j = s.indexOf("## Gaps conhecidos");
      return s.slice(0, i) + "## Nunca fazer\n\n" + s.slice(j);
    })],
  ["C4", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) =>
      s.replace(
        /- Nunca adicionar dependência de runtime[^\n]*/,
        "- Nunca adicionar dependência de runtime.",
      ))],
  ["C5", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) =>
      s.replace(/## Decisões em aberto\n\nNenhuma pendente\./, "## Decisões em aberto\n"))],

  ["T1", LINK, (d) =>
    editar(d, "PLAN.md", (s) => s.replace("- [ ] T2.2", "- [ ] T2.1"))],
  ["T2", LINK, (d) =>
    editar(d, "PLAN.md", (s) => s.replace(" · módulo: check\n", "\n"))],
  ["T3", LINK, (d) =>
    editar(d, "PLAN.md", (s) => s.replace("· módulo: check", "· módulo: parser"))],
  ["T4", LINK, (d) =>
    editar(d, "PLAN.md", (s) => s.replace("constraint 1", "constraint 9"))],
  ["T5", LINK, (d) =>
    editar(d, "SPEC.md", (s) => s.replace("afeta T2.2", "afeta T9.9"))],

  ["D1", PED, (d) =>
    editar(d, "DOMAIN.md", (s) =>
      s.replace("2. **I2 — estado terminal", "2. **estado terminal"))],
  ["D2", PED, (d) =>
    editar(d, "SPEC.md", (s) => s.replace("garante I1", "garante I9"))],
  ["D3", PED, (d) =>
    editar(d, "DOMAIN.md", (s) =>
      s.replace("- **Item** —", "- **Item** — o usuário clica em comprar e"))],

  ["H1", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) =>
      s.replace("## Convenções", "## Convenções\n\n- Slug NFD (decidido em 2026-07-13)."))],
  ["H2", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) =>
      s.replace("Nenhuma pendente.", "- [x] **Formato** — resolvido: texto simples."))],
  ["H3", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) =>
      s.replace("## Convenções", "## Convenções\n\n- Anteriormente o core decidia o exit code."))],
  ["H4", LINK, (d) =>
    editar(d, "PLAN.md", (s) => s.replace(/- \[ \] T2\./g, "- [x] T2."))],
  ["H5", LINK, (d) => editar(d, "SPEC.md", (s) => s + recheio(320))],

  ["J1", LINK, (d) =>
    editar(d, "PLAN.md", (s) =>
      s.replace(
        "Nenhuma pendente.",
        "- [ ] **Timeout padrão dos links externos** — 5s ou 10s (afeta T2.2).",
      ))],
  ["J2", LINK, (d) =>
    editar(d, "SPEC.md", (s) =>
      s.replace("- **Node, ESM** — stdlib apenas", "- **Node ≥ 20, ESM** — stdlib apenas"))],

  ["A0", LINK, async (d) => {
    // Vira um projeto Python: a ancoragem de manifest deixa de alcançar.
    await rm(path.join(d, "package.json"));
    await gravar(d, "pyproject.toml", '[project]\nname = "linkcheck"\n');
  }],
  ["A1", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) => s.replace("  check.js", "  parser.js"))],
  ["A2", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) =>
      s.replace("node --test             # testes", "npm run cobertura"))],
  ["A3", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) => s.replace("Node ≥ 20, ESM", "Node ≥ 18, ESM"))],
  ["A4", LINK, async (d) => {
    await gravar(d, ".env.example", "LINKCHECK_TIMEOUT=5000\n");
    await editar(d, "CLAUDE.md", (s) =>
      s.replace(
        "## Gaps conhecidos",
        "## Env e segredos\n\n- `LINKCHECK_UA` define o user-agent.\n\n## Gaps conhecidos",
      ));
  }],
  ["A5", LINK, (d) =>
    editar(d, "CLAUDE.md", (s) =>
      s.replace("## Gaps conhecidos", "Ver `docs/borda-http.md`.\n\n## Gaps conhecidos"))],
  ["A6", LINK, async (d) => {
    const git = (...args) =>
      execFileSync(
        "git",
        ["-c", "user.email=t@t", "-c", "user.name=t", ...args],
        { cwd: d, encoding: "utf8" },
      );
    git("init", "-q");
    git("commit", "-q", "--allow-empty", "-m", "raiz");
    const sha = git("rev-parse", "--short", "HEAD").trim();
    for (let i = 0; i < 31; i++) git("commit", "-q", "--allow-empty", "-m", `c${i}`);
    await editar(d, "PLAN.md", (s) => s.replace(/@ [0-9a-f]+ -->/, `@ ${sha} -->`));
  }],
  ["A7", LINK, async (d) => {
    await mkdir(path.join(d, "docs"));
    await gravar(d, "docs/borda-http.md", "# Borda HTTP\n");
  }],
  ["A8", LINK, async (d) => {
    await mkdir(path.join(d, "packages/core"), { recursive: true });
    await gravar(
      d,
      "packages/core/CLAUDE.md",
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
  }],

  ["S1", LINK, (d) =>
    editar(d, "SPEC.md", (s) =>
      s.replace("## Problema", "<!-- docscheck: ignore A3 -->\n\n## Problema"))],
  ["V1", LINK, (d) => editar(d, "CLAUDE.md", (s) => s + recheio(220))],
];

test("todo caso de mutação faz a sua regra acusar", async () => {
  const mudas = [];
  for (const [id, base, mutar] of CASOS) {
    const dir = await copia(base);
    try {
      await mutar(dir);
      const r = await verificar(dir, { strict: true });
      const acusados = new Set([...r.violacoes, ...r.avisos].map((v) => v.id));
      if (!acusados.has(id)) {
        const outros = [...acusados].join(", ") || "nada";
        mudas.push(`${id} (a mutação passou; acusou: ${outros})`);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
  assert.deepEqual(
    mudas,
    [],
    `regras que não detectam a própria violação:\n  ${mudas.join("\n  ")}`,
  );
});

test("toda regra do catálogo tem um caso de mutação", () => {
  const comCaso = new Set(CASOS.map(([id]) => id));
  const semCaso = REGRAS.map((r) => r.id).filter((id) => !comCaso.has(id));
  assert.deepEqual(
    semCaso,
    [],
    `regras sem caso de mutação: ${semCaso.join(", ")} — uma regra que ninguém provou detectar nada não deveria existir`,
  );
});
