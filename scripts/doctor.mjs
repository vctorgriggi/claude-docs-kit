#!/usr/bin/env node
// Diagnóstico somente leitura da instalação por links, usado por install.sh.
import { access, lstat, realpath, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = await realpath(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== "--home" || !path.isAbsolute(args[1]))) {
  console.error("Uso: node scripts/doctor.mjs [--home <diretório absoluto>]");
  process.exit(2);
}
const home = args[1] ?? homedir();
let falhas = 0;
function resultado(ok, mensagem) {
  console.log(`${ok ? "ok" : "falha"}: ${mensagem}`);
  if (!ok) falhas++;
}
resultado(Number(process.versions.node.split(".")[0]) >= 20, `Node ${process.versions.node} (mínimo 20)`);

const recursos = [
  "SKILL.md", "install.sh", "bin/docscheck.mjs", "grammar/GRAMATICA.md",
  ...["fundar", "tarefa", "decidir", "auditar", "rodada"].map((n) => `workflows/${n}.md`),
  ...["AGENTS", "CLAUDE", "SPEC", "PLAN", "DOMAIN", "ROADMAP"].map((n) => `templates/${n}.md`),
];
for (const rel of recursos) {
  try {
    const arquivo = path.join(raiz, rel);
    if (!(await stat(arquivo)).isFile()) throw new Error("não é arquivo");
    await access(arquivo, constants.R_OK);
    resultado(true, rel);
  } catch {
    resultado(false, `${rel} ausente ou ilegível; restaure esse recurso no checkout`);
  }
}

const links = [
  [".agents/skills/docs", raiz],
  [".claude/skills/docs", raiz],
  [".local/bin/docscheck", path.join(raiz, "bin/docscheck.mjs")],
];
for (const [rel, esperado] of links) {
  const destino = path.join(home, rel);
  try {
    if (!(await lstat(destino)).isSymbolicLink()) {
      resultado(false, `${destino} é um arquivo ou diretório comum; mova-o antes de instalar`);
      continue;
    }
    const correto = await realpath(destino) === await realpath(esperado);
    resultado(correto, correto ? destino : `${destino} aponta para outra cópia; rode install.sh neste checkout`);
  } catch {
    resultado(false, `${destino} ausente, quebrado ou inacessível; rode install.sh neste checkout`);
  }
}

try {
  await access(path.join(raiz, "bin/docscheck.mjs"), constants.X_OK);
  resultado(true, "docscheck.mjs executável");
} catch {
  resultado(false, "docscheck.mjs sem permissão de execução; restaure com chmod +x bin/docscheck.mjs");
}
let encontrado = null;
for (const entrada of (process.env.PATH ?? "").split(path.delimiter)) {
  const candidato = path.resolve(entrada || ".", "docscheck");
  try {
    if (!(await stat(candidato)).isFile()) continue;
    await access(candidato, constants.X_OK);
    encontrado = candidato;
    break;
  } catch { /* procure o próximo executável do PATH */ }
}
let correto = false;
if (encontrado) {
  try { correto = await realpath(encontrado) === await realpath(path.join(raiz, "bin/docscheck.mjs")); }
  catch { /* recurso ausente já aparece acima */ }
}
resultado(correto, correto ? `PATH resolve ${encontrado}` : encontrado
  ? `PATH resolve outra cópia: ${encontrado}; priorize ${path.join(home, ".local/bin")}`
  : `docscheck ausente do PATH; inclua ${path.join(home, ".local/bin")}`);
console.log(falhas ? `${falhas} problema(s) na instalação; nenhum arquivo foi alterado.`
  : "Instalação íntegra. Abra uma nova sessão de cada agente para confirmar a descoberta da skill.");
process.exitCode = falhas ? 1 : 0;
