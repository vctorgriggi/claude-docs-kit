import { test } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { verificar } from "../bin/docscheck.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const BIN = path.join(RAIZ, "bin/docscheck.mjs");
async function projeto(t) {
  const tmp = await mkdtemp(path.join(tmpdir(), "docs-confiabilidade-"));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const dir = path.join(tmp, "projeto");
  await cp(path.join(RAIZ, "examples/fixtures/linkcheck"), dir, { recursive: true });
  return { dir, tmp };
}

test("A2 distingue scripts obrigatórios, comandos nativos e fallback de start", async (t) => {
  const { dir } = await projeto(t);
  const contrato = await readFile(path.join(dir, "AGENTS.md"), "utf8");
  const casos = [
    ["npm test", true], ["npm t", true], ["npm run test", true],
    ["npm run-script test", true], ["pnpm test", true],
    ["yarn test", true], ["bun run test", true], ["bun test", false],
    ["npm start", true], ["pnpm start", true], ["yarn start", true],
    ["npm install", false], ["npm ci", false], ["pnpm install", false],
    ["yarn install", false], ["bun install", false],
    ["npm run install", true], ["bun run build", true],
    ["npm run", false], ["pnpm exec eslint", false], ["yarn dlx eslint", false],
  ];
  await writeFile(path.join(dir, "package.json"), '{}');
  for (const [comando, falha] of casos) {
    await writeFile(path.join(dir, "AGENTS.md"), contrato.replace("node --test             # testes", comando));
    const r = await verificar(dir, { strict: true });
    assert.equal(r.violacoes.some((a) => a.id === "A2"), falha, comando);
  }
  await writeFile(path.join(dir, "server.js"), "// fallback de start\n");
  for (const comando of ["npm start", "npm run start", "pnpm start", "pnpm run start"]) {
    await writeFile(path.join(dir, "AGENTS.md"), contrato.replace("node --test             # testes", comando));
    assert.deepEqual((await verificar(dir, { strict: true })).violacoes, [], comando);
  }
  await writeFile(path.join(dir, "package.json"), JSON.stringify({ scripts: { test: "node --test", build: "node build.js" } }));
  for (const comando of ["npm test", "pnpm test", "yarn test", "bun run test", "npm run build -- --watch"]) {
    await writeFile(path.join(dir, "AGENTS.md"), contrato.replace("node --test             # testes", comando));
    assert.deepEqual((await verificar(dir, { strict: true })).violacoes, [], comando);
  }
});

test("A2 declara cobertura parcial para seletores e shell composto", async (t) => {
  const { dir } = await projeto(t);
  const contrato = await readFile(path.join(dir, "AGENTS.md"), "utf8");
  for (const cmd of ["pnpm --filter core test", "npm test --workspace core", "npm run --if-present test", "cd packages/core && npm test"]) {
    await writeFile(path.join(dir, "AGENTS.md"), contrato.replace("node --test             # testes", cmd));
    const r = await verificar(dir);
    assert.match(r.avisos.find((a) => a.id === "A2")?.msg ?? "", /não verificou/, cmd);
  }
});

test("configuração rejeita tipos e chaves inválidos, inclusive com --strict", async (t) => {
  const { dir } = await projeto(t);
  for (const config of [null, [], true, 1, { strict: "true" }, { strict: 1 }, { strict: null }, { strcit: true }]) {
    await writeFile(path.join(dir, ".docscheck.json"), JSON.stringify(config));
    for (const opcoes of [{}, { strict: true }]) {
      await assert.rejects(() => verificar(dir, opcoes), /\.docscheck\.json inválido/);
    }
    const cli = spawnSync(process.execPath, [BIN, "--strict", dir], { encoding: "utf8" });
    assert.equal(cli.status, 2);
    assert.match(cli.stderr, /\.docscheck\.json inválido/);
  }
  for (const config of [{}, { strict: true }, { strict: false }]) {
    await writeFile(path.join(dir, ".docscheck.json"), JSON.stringify(config));
    assert.deepEqual((await verificar(dir)).violacoes, []);
  }
});

test("A6 distingue clone raso de referência inválida e funciona após obter histórico", async (t) => {
  const { dir, tmp } = await projeto(t);
  const git = (cwd, ...args) => execFileSync("git", ["-c", "user.email=test@example.invalid", "-c", "user.name=Test", ...args], {
    cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  git(dir, "init", "-q"); git(dir, "add", "."); git(dir, "commit", "-qm", "initial");
  const ref = git(dir, "rev-parse", "--short", "HEAD");
  const plan = path.join(dir, "PLAN.md");
  await writeFile(plan, (await readFile(plan, "utf8")).replace(/<!-- rodada: .* -->/, `<!-- rodada: teste @ ${ref} -->`));
  git(dir, "add", "."); git(dir, "commit", "-qm", "docs");
  assert.deepEqual((await verificar(dir, { strict: true })).violacoes, []);
  const clone = path.join(tmp, "clone raso");
  git(tmp, "clone", "--depth=1", pathToFileURL(dir).href, clone);
  await assert.rejects(() => verificar(clone, { strict: true }), /histórico Git parcial.*fetch-depth: 0/);
  const cli = spawnSync(process.execPath, [BIN, "--strict", clone], { encoding: "utf8" });
  assert.equal(cli.status, 2);
  assert.match(cli.stderr, /histórico Git parcial/);
  const panorama = spawnSync(process.execPath, [BIN, "--strict", "--json", clone, dir], { encoding: "utf8" });
  assert.equal(panorama.status, 2);
  assert.match(JSON.parse(panorama.stdout).doc_sets[0].erro, /histórico Git parcial/);
  git(clone, "fetch", "--unshallow");
  assert.deepEqual((await verificar(clone, { strict: true })).violacoes, []);
});
