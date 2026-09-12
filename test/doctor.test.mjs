import { test } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, readlink, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
async function preparar(t) {
  const tmp = await mkdtemp(path.join(tmpdir(), "docs-doctor-"));
  t.after(() => rm(tmp, { recursive: true, force: true }));
  const home = path.join(tmp, "home com espaços");
  const repo = path.join(tmp, "checkout");
  await mkdir(repo);
  for (const nome of ["SKILL.md", "install.sh", "bin", "grammar", "templates", "workflows", "scripts"]) {
    await cp(path.join(RAIZ, nome), path.join(repo, nome), { recursive: true });
  }
  const env = { ...process.env, PATH: `${path.join(home, ".local/bin")}${path.delimiter}${path.dirname(process.execPath)}${path.delimiter}/usr/bin:/bin` };
  const instalar = () => execFileSync("/bin/bash", [path.join(repo, "install.sh"), "--home", home], { env, encoding: "utf8" });
  const checar = (extraEnv = {}) => spawnSync("/bin/bash", [path.join(repo, "install.sh"), "--check", "--home", home], {
    env: { ...env, ...extraEnv }, encoding: "utf8",
  });
  return { tmp, repo, home, env, instalar, checar };
}

test("doctor confere instalação íntegra e não cria links em um home vazio", async (t) => {
  const { home, instalar, checar } = await preparar(t);
  let r = checar();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ausente.*rode install.sh/);
  assert.equal(existsSync(home), false);
  instalar();
  r = checar();
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Instalação íntegra/);
});

test("doctor reporta recursos ausentes e links errados sem repará-los", async (t) => {
  const { repo, home, instalar, checar } = await preparar(t);
  instalar();
  const destino = path.join(home, ".agents/skills/docs");
  await rm(destino);
  await symlink("/caminho/ausente", destino);
  await rm(path.join(repo, "workflows/tarefa.md"));
  const r = checar();
  assert.equal(r.status, 1);
  assert.match(r.stdout, /workflows\/tarefa.md ausente/);
  assert.match(r.stdout, /quebrado/);
  assert.equal(await readlink(destino), "/caminho/ausente");
  assert.equal(existsSync(path.join(repo, "workflows/tarefa.md")), false);
});

test("doctor preserva arquivos comuns e detecta outro executável no PATH", async (t) => {
  const { tmp, home, env, instalar, checar } = await preparar(t);
  instalar();
  const link = path.join(home, ".claude/skills/docs");
  await rm(link); await writeFile(link, "conteúdo do usuário");
  const outro = path.join(tmp, "outro-bin"); await mkdir(outro);
  await writeFile(path.join(outro, "docscheck"), '#!/bin/sh\nexit 99\n', { mode: 0o755 });
  const r = checar({ PATH: `${outro}${path.delimiter}${env.PATH}` });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /arquivo ou diretório comum/);
  assert.match(r.stdout, /PATH resolve outra cópia/);
  assert.equal(await readFile(link, "utf8"), "conteúdo do usuário");
});
