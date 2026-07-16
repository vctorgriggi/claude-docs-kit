#!/usr/bin/env node
import { existsSync } from "node:fs";
import { verificar } from "./check.js";

const dir = process.argv[2];
if (!dir) {
  console.error("uso: linkcheck <diretório>");
  process.exit(2);
}
if (!existsSync(dir)) {
  console.error(`diretório não encontrado: ${dir}`);
  process.exit(2);
}

const quebrados = await verificar(dir);
for (const q of quebrados) {
  console.error(`${q.arquivo}:${q.linha} → ${q.alvo}`);
}
console.error(`${quebrados.length} quebrado(s)`);
process.exit(quebrados.length === 0 ? 0 : 1);
