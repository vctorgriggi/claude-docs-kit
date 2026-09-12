import { test } from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REGRAS, estado, verificar } from "../bin/docscheck.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const BIN = path.join(RAIZ, "bin/docscheck.mjs");
const contrato = "# projeto\n\n> Contrato de implementação.\n\n## Regra de ouro\n\n**Core puro.**\n\n## Decisões em aberto\n\nNenhuma pendente.\n";
const rodar = (cmd) => `\n## Como rodar\n\n\`\`\`bash\n${cmd}\n\`\`\`\n`;
async function preparar(t, arquivos = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "docs-cobertura-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const [nome, texto] of Object.entries({ "AGENTS.md": contrato, ...arquivos })) {
    await mkdir(path.dirname(path.join(dir, nome)), { recursive: true });
    await writeFile(path.join(dir, nome), texto);
  }
  return dir;
}
const regra = (r, id) => r.cobertura.find((c) => c.id === id);

test("cobertura lista todas as regras e distingue zero achados de checagem não executada", async (t) => {
  const dir = await preparar(t);
  const r = await verificar(dir, { strict: true });
  assert.deepEqual(r.violacoes, []);
  assert.deepEqual(r.cobertura.map((c) => c.id), REGRAS.map((c) => c.id));
  assert.equal(regra(r, "E1").status, "executada");
  assert.equal(regra(r, "C1").status, "executada");
  for (const id of ["F1", "D1", "A2", "A3", "A4", "A6", "A7", "A8", "A9"]) {
    assert.equal(regra(r, id).status, "nao_executada", id);
    assert.ok(regra(r, id).motivos.length, id);
  }
});

test("cobertura A2 registra mistura de comandos verificáveis e fora de alcance", async (t) => {
  const dir = await preparar(t, {
    "AGENTS.md": contrato + rodar('npm run build\npython app.py'),
    "package.json": JSON.stringify({ scripts: { build: "node build.js" } }),
  });
  const r = await verificar(dir, { strict: true });
  assert.deepEqual(r.violacoes, []);
  assert.equal(regra(r, "A2").status, "parcial");
  assert.match(regra(r, "A2").motivos.join(" "), /python app.py/);
  await writeFile(path.join(dir, "AGENTS.md"), contrato + rodar('npm run build'));
  assert.equal(regra(await verificar(dir), "A2").status, "executada");
});

test("supressão remove o achado sem esconder a cobertura parcial ou a justificativa", async (t) => {
  const motivo = "o comando é conferido pelo CI do pacote";
  const dir = await preparar(t, {
    "AGENTS.md": contrato + rodar('pnpm --filter core test') + `\n<!-- docscheck: ignore A2 — ${motivo} -->\n`,
    "package.json": '{}',
  });
  const r = await verificar(dir, { strict: true });
  assert.deepEqual(r.violacoes, []);
  assert.equal(regra(r, "A2").status, "parcial");
  assert.deepEqual(regra(r, "A2").supressoes, [{ arquivo: "AGENTS.md", motivo }]);
  assert.match(regra(r, "A2").motivos.join(" "), /não verificou/);
});

test("A2 usa o manifest do pacote, sem aceitar por engano um script da raiz", async (t) => {
  const local = "packages/core/AGENTS.md";
  const dir = await preparar(t, {
    "package.json": JSON.stringify({ scripts: { testeLocal: "node --test" } }),
    [local]: '# core\n\n> Contrato local.\n' + rodar('npm run testeLocal'),
    "packages/core/package.json": '{}',
  });
  let r = await verificar(dir, { strict: true });
  assert.equal(r.violacoes.filter((a) => a.id === "A2").length, 1);
  assert.equal(r.violacoes.find((a) => a.id === "A2").arquivo, local);
  assert.deepEqual(regra(r, "A2").arquivos, [local]);
  await writeFile(path.join(dir, "package.json"), '{}');
  await writeFile(path.join(dir, "packages/core/package.json"), JSON.stringify({ scripts: { testeLocal: "node --test" } }));
  r = await verificar(dir, { strict: true });
  assert.deepEqual(r.violacoes, []);
  assert.equal(regra(r, "A2").status, "executada");
});

test("estado inclui pendências locais e satélites sem duplicar symlinks nem trocar marcador raiz", async (t) => {
  const dir = await preparar(t);
  await cp(path.join(RAIZ, "examples/fixtures/linkcheck"), dir, { recursive: true });
  const antes = await estado(dir);
  const decisao = (nome) => `# ${nome}\n\n> Contrato específico.\n\n## Decisões em aberto\n\n- [ ] **${nome}** — requer definição.\n\n<!-- rodada: local @ abcdef0 -->\n`;
  for (const [arquivo, nome] of [
    ["packages/core/AGENTS.md", "Formato local"],
    ["apps/web/src/AGENTS.md", "Validação da UI"],
    ["docs/arquitetura/filas.md", "Política de filas"],
  ]) {
    await mkdir(path.dirname(path.join(dir, arquivo)), { recursive: true });
    await writeFile(path.join(dir, arquivo), decisao(nome));
  }
  await symlink("arquitetura/filas.md", path.join(dir, "docs/espelho.md"));
  const depois = await estado(dir);
  const conferido = await verificar(dir);
  assert.deepEqual(depois.arquivos, conferido.arquivos);
  assert.deepEqual(depois.fase_atual, antes.fase_atual);
  assert.deepEqual(depois.tarefas_abertas, antes.tarefas_abertas);
  assert.deepEqual(depois.marcador, antes.marcador);
  assert.equal(depois.decisoes_pendentes.length, antes.decisoes_pendentes.length + 3);
  assert.ok(depois.decisoes_pendentes.some((d) => d.arquivo === "apps/web/src/AGENTS.md" && d.decisao === "Validação da UI"));
  assert.equal(depois.arquivos.includes("docs/espelho.md"), false);
});

test("JSON simples e panorama expõem cobertura sem mudar exit code", async (t) => {
  const dir = await preparar(t);
  const outro = await preparar(t, { "AGENTS.md": contrato + '\nTBD\n' });
  const unico = spawnSync(process.execPath, [BIN, "--json", dir], { encoding: "utf8" });
  assert.equal(unico.status, 0);
  assert.equal(JSON.parse(unico.stdout).cobertura.length, REGRAS.length);
  const panorama = spawnSync(process.execPath, [BIN, "--json", dir, outro], { encoding: "utf8" });
  assert.equal(panorama.status, 1);
  for (const r of JSON.parse(panorama.stdout).doc_sets) {
    assert.equal(r.cobertura.length, REGRAS.length);
    for (const achado of r.achados) assert.notEqual(regra(r, achado.id).status, "nao_executada");
  }
});
