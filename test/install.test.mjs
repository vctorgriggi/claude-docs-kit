// Instalações reais em homes temporários: nenhum arquivo do usuário é tocado.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, readlink, rename, rm, writeFile } from "node:fs/promises";
import { realpathSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = realpathSync(fileURLToPath(new URL("..", import.meta.url)));
const ALVOS = [".agents/skills/docs", ".claude/skills/docs", ".local/bin/docscheck"];
async function temporario(t) {
  const d = await mkdtemp(path.join(tmpdir(), "agent-docs-install-"));
  t.after(() => rm(d, { recursive: true, force: true }));
  return realpathSync(d);
}
const instalar = (repo, home) => execFileSync("bash", [path.join(repo, "install.sh"), "--home", home], { encoding: "utf8" });

test("instala a mesma skill nos dois agentes, funciona fora do checkout e é idempotente", async (t) => {
  const tmp = await temporario(t);
  const home = path.join(tmp, "home com espaços");
  instalar(RAIZ, home);
  for (const destino of ALVOS.slice(0, 2)) {
    const dir = path.join(home, destino);
    assert.equal(await readlink(dir), RAIZ);
    assert.equal(await readFile(path.join(dir, "SKILL.md"), "utf8"), await readFile(path.join(RAIZ, "SKILL.md"), "utf8"));
    for (const arquivo of ["grammar/GRAMATICA.md", "workflows/fundar.md", "templates/AGENTS.md", "templates/CLAUDE.md"]) {
      assert.ok(existsSync(path.join(dir, arquivo)));
    }
    // O caminho pelo diretório de skill deve executar o mesmo binário.
    const raw = execFileSync("node", [path.join(dir, "bin/docscheck.mjs"), "--estado", path.join(RAIZ, "examples/fixtures/linkcheck")], { cwd: tmp, encoding: "utf8" });
    assert.equal(JSON.parse(raw).tarefas_abertas[0].id, "T2.1");
  }
  const cli = path.join(home, ".local/bin/docscheck");
  const alvo = path.join(RAIZ, "examples/fixtures/linkcheck");
  const r = JSON.parse(execFileSync(cli, ["--strict", "--json", alvo], { cwd: tmp, encoding: "utf8" }));
  assert.deepEqual(r.violacoes, []);
  assert.match(instalar(RAIZ, home), /sem mudança/);
  const ruim = spawnSync(cli, [path.join(RAIZ, "examples/fixtures/notas-api")], { encoding: "utf8" });
  assert.equal(ruim.status, 1);
});

test("conflito em qualquer destino é detectado antes de criar os links", async (t) => {
  for (const destino of ALVOS) {
    const tmp = await temporario(t);
    const home = path.join(tmp, "home");
    const ocupado = path.join(home, destino);
    await mkdir(path.dirname(ocupado), { recursive: true });
    if (destino.endsWith("docs")) await mkdir(ocupado);
    else await writeFile(ocupado, "arquivo do usuário");
    const r = spawnSync("bash", [path.join(RAIZ, "install.sh"), "--home", home], { encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /já existe e não é symlink/);
    for (const outro of ALVOS.filter((a) => a !== destino)) assert.equal(existsSync(path.join(home, outro)), false);
    if (destino.endsWith("docscheck")) assert.equal(await readFile(ocupado, "utf8"), "arquivo do usuário");
  }
});

test("renomear o checkout exige apenas reinstalar os links", async (t) => {
  const tmp = await temporario(t);
  const repo = path.join(tmp, "checkout antigo");
  await mkdir(repo);
  for (const nome of ["SKILL.md", "install.sh", "bin", "grammar", "templates", "workflows"]) {
    await cp(path.join(RAIZ, nome), path.join(repo, nome), { recursive: true });
  }
  const home = path.join(tmp, "home");
  instalar(repo, home);
  const novo = path.join(tmp, "agent-docs-kit");
  await rename(repo, novo);
  instalar(novo, home);
  for (const destino of ALVOS.slice(0, 2)) assert.equal(await readlink(path.join(home, destino)), novo);
  assert.equal(await readlink(path.join(home, ALVOS[2])), path.join(novo, "bin/docscheck.mjs"));
  // Atualizar a fonte chega aos dois pontos de entrada sem uma nova instalação.
  await writeFile(path.join(novo, "workflows/tarefa.md"), "nova versão");
  for (const destino of ALVOS.slice(0, 2)) {
    assert.equal(await readFile(path.join(home, destino, "workflows/tarefa.md"), "utf8"), "nova versão");
  }
});

test("argumentos inválidos não escrevem instalação", () => {
  for (const args of [["--home"], ["--home", "relativo"], ["--desconhecido"]]) {
    const r = spawnSync("bash", [path.join(RAIZ, "install.sh"), ...args], { encoding: "utf8" });
    assert.equal(r.status, 2);
  }
});
