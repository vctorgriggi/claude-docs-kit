// Integridade dos recursos que a skill carrega e dos exemplos publicados.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REGRAS, verificar } from "../bin/docscheck.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const ler = (nome) => readFile(path.join(RAIZ, nome), "utf8");
const ACOES = ["fundar", "tarefa", "decidir", "auditar", "rodada"];

async function markdowns(dir = RAIZ) {
  const arquivos = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".agents", ".claude"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) arquivos.push(...await markdowns(p));
    else if (e.isFile() && e.name.endsWith(".md")) arquivos.push(p);
  }
  return arquivos;
}
const caminhos = await markdowns();
const conteudo = new Map(await Promise.all(caminhos.map(async (p) => [p, await readFile(p, "utf8")])));
const semBlocos = (md) => md.replace(/^```[^\n]*\n[\s\S]*?^```/gm, "");
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[`*_]/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

test("links locais e suas âncoras apontam para recursos existentes", () => {
  const quebrados = [];
  for (const [p, md] of conteudo) {
    for (const m of md.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      if (/^[a-z]+:/i.test(m[1])) continue;
      const [arquivo, ancora] = m[1].split("#");
      const alvo = arquivo ? path.resolve(path.dirname(p), arquivo) : p;
      if (!existsSync(alvo)) quebrados.push(`${path.relative(RAIZ, p)}: ${m[1]}`);
      else if (ancora && conteudo.has(alvo)) {
        const titulos = [...semBlocos(conteudo.get(alvo)).matchAll(/^#{1,6} (.+)$/gm)].map((h) => slug(h[1]));
        if (!titulos.includes(ancora)) quebrados.push(`${path.relative(RAIZ, p)}: #${ancora}`);
      }
    }
  }
  assert.deepEqual(quebrados, []);
});

test("a skill roteia para todos os workflows e o README os apresenta", async () => {
  const skill = await ler("SKILL.md");
  const readme = await ler("README.md");
  const nomes = (await readdir(path.join(RAIZ, "workflows"))).filter((n) => n.endsWith(".md"));
  assert.deepEqual(nomes.sort(), ACOES.map((n) => `${n}.md`).sort());
  assert.match(skill, /^---\nname: docs\ndescription: .+\n---/);
  for (const acao of ACOES) {
    for (const texto of [skill, readme]) assert.ok(texto.includes(`workflows/${acao}.md`));
  }
  assert.ok(skill.includes("grammar/GRAMATICA.md"));
  assert.ok(skill.includes("--estado"));
  assert.doesNotMatch(skill, /^allowed-tools:|^disable-model-invocation:/m);
});

test("a paleta de templates inclui um único contrato e a ponte de importação", async () => {
  const nomes = (await readdir(path.join(RAIZ, "templates"))).sort();
  assert.deepEqual(nomes, ["AGENTS.md", "CLAUDE.md", "DOMAIN.md", "PLAN.md", "ROADMAP.md", "SPEC.md"]);
  assert.equal(await ler("templates/CLAUDE.md"), "@AGENTS.md\n");
  for (const nome of nomes.filter((n) => n !== "CLAUDE.md")) {
    const md = await ler(`templates/${nome}`);
    assert.match(md, /^# .+\n\n>/);
    assert.doesNotMatch(md, /^- \[x\]|\bTBD\b/m);
  }
});

test("ids de regra e referências numeradas existem no catálogo e na gramática", async () => {
  const ids = new Set(REGRAS.map((r) => r.id));
  const normativo = await ler("grammar/GRAMATICA.md");
  const numeros = new Set([...normativo.matchAll(/^(\d+)\. \*\*/gm)].map((m) => m[1]));
  for (const [p, md] of conteudo) {
    for (const m of md.matchAll(/`([A-Z]\d+)`/g)) {
      // Invariantes e gaps pertencem ao projeto de exemplo, não ao checker.
      if (/^[IG]/.test(m[1])) continue;
      assert.ok(ids.has(m[1]), `${p}: regra ${m[1]} desconhecida`);
    }
    for (const m of md.matchAll(/\bregra (\d+)\b/g)) {
      assert.ok(numeros.has(m[1]), `${p}: regra ${m[1]} desconhecida`);
    }
  }
});

test("os três doc-sets completos passam em modo estrito com pontes válidas", async () => {
  for (const nome of ["linkcheck", "pedidos", "monorepo"]) {
    const dir = path.join(RAIZ, "examples/fixtures", nome);
    const r = await verificar(dir, { strict: true });
    assert.deepEqual(r.violacoes, [], nome);
    assert.deepEqual(r.avisos, [], nome);
    for (const arquivo of r.arquivos.filter((a) => path.basename(a) === "AGENTS.md")) {
      const ponte = path.join(dir, path.dirname(arquivo), "CLAUDE.md");
      assert.equal(await readFile(ponte, "utf8"), "@AGENTS.md\n");
    }
  }
});

test("cada workflow tem exemplo e o CI executa a suíte e os fixtures", async () => {
  const ci = await ler(".github/workflows/ci.yml");
  assert.match(ci, /node --test test\/\*\.test\.mjs/);
  const exemplos = (await Promise.all((await readdir(path.join(RAIZ, "examples")))
    .filter((n) => /^\d\d-.*\.md$/.test(n)).map((n) => ler(`examples/${n}`)))).join("\n");
  for (const acao of ACOES) assert.ok(exemplos.includes(`/docs ${acao}`));
  for (const nome of ["linkcheck", "pedidos", "monorepo"]) assert.ok(ci.includes(`fixtures/${nome}`));
});
