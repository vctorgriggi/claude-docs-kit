#!/usr/bin/env node
// Gera a tabela de invariantes mecânicos do §5 de grammar/GRAMATICA.md a
// partir do catálogo REGRAS de bin/docscheck.mjs. O catálogo é a fonte; o
// texto normativo é derivado — nunca o contrário.
//
// Uso: node scripts/gerar-gramatica.mjs           reescreve a tabela
//      node scripts/gerar-gramatica.mjs --check   falha se estiver fora de dia
// Exit: 0 em dia (ou reescrito); 1 fora de dia com --check; 2 erro de uso.

import { readFile, writeFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { REGRAS } from "../bin/docscheck.mjs";

const INICIO =
  "<!-- REGRAS:início — tabela gerada por scripts/gerar-gramatica.mjs; não editar à mão -->";
const FIM = "<!-- REGRAS:fim -->";

const SEVERIDADE = { violacao: "violação", aviso: "aviso" };

// Os dois destinos da tabela: o texto normativo, com a lista completa, e o
// README, com a mesma lista agrupada por família — para quem só quer saber o
// que o verificador cobre sem ler a gramática inteira.
const DESTINOS = [
  { url: new URL("../grammar/GRAMATICA.md", import.meta.url), formato: "completa" },
  { url: new URL("../README.md", import.meta.url), formato: "familias" },
];

// O mapa dá o **nome** de cada família; a **ordem** sai do catálogo, nunca
// daqui. Duas listas de ordem divergem — e divergiram: a tabela do README saía
// nesta ordem e a da gramática na do catálogo, com as mesmas 39 regras.
const NOMES = {
  E: "Estrutura comum",
  F: "Fronteira presente/futuro",
  C: "Contrato (CLAUDE.md)",
  T: "Rastreabilidade cruzada",
  D: "Domínio",
  H: "Presente permanente",
  J: "Jurisdição",
  A: "Ancoragem doc↔código",
  S: "Supressão",
  V: "Volume",
};

// Ordem de primeira aparição no catálogo. A regra da casa é que as famílias são
// contíguas ali — o teste de coerência cobra isso.
export const familias = () => [...new Set(REGRAS.map((r) => r.id[0]))];

export function tabela(formato = "completa") {
  if (formato === "familias") {
    const linhas = ["| família | regras | o que cobre |", "| ------- | ------ | ----------- |"];
    for (const prefixo of familias()) {
      const nome = NOMES[prefixo];
      if (!nome) throw new Error(`família "${prefixo}" está no catálogo e não tem nome`);
      const doGrupo = REGRAS.filter((r) => r.id.startsWith(prefixo));
      const ids = doGrupo.map((r) => `\`${r.id}\``).join(" ");
      const brandas = doGrupo.every((r) => r.severidade === "aviso");
      linhas.push(
        `| **${nome}**${brandas ? " *(aviso)*" : ""} | ${ids} | ${doGrupo[0].titulo}${doGrupo.length > 1 ? "; …" : ""} |`,
      );
    }
    return linhas.join("\n");
  }
  const linhas = [
    "| id | regra | alvo | severidade | verifica |",
    "| -- | ----- | ---- | ---------- | -------- |",
  ];
  for (const r of REGRAS) {
    linhas.push(
      `| \`${r.id}\` | ${r.regra} | ${r.alvo} | ${SEVERIDADE[r.severidade]} | ${r.titulo} |`,
    );
  }
  return linhas.join("\n");
}

export function aplicar(md, formato = "completa") {
  const i = md.indexOf(INICIO);
  const f = md.indexOf(FIM);
  if (i === -1 || f === -1 || f < i) {
    throw new Error(
      "marcadores REGRAS:início/REGRAS:fim ausentes ou fora de ordem no arquivo",
    );
  }
  return (
    md.slice(0, i + INICIO.length) + "\n\n" + tabela(formato) + "\n\n" + md.slice(f)
  );
}

async function main() {
  const checar = process.argv.includes("--check");
  let desatualizados = 0;
  for (const { url, formato } of DESTINOS) {
    const nome = url.pathname.split("/").slice(-2).join("/");
    const md = await readFile(url, "utf8");
    const novo = aplicar(md, formato);
    if (novo === md) {
      if (!checar) console.log(`sem mudança: ${nome}`);
      continue;
    }
    if (checar) {
      console.error(`erro: a tabela de ${nome} está fora de dia com o catálogo REGRAS.`);
      desatualizados++;
      continue;
    }
    await writeFile(url, novo);
    console.log(`${nome}: tabela regerada com ${REGRAS.length} regras`);
  }
  if (checar) {
    if (desatualizados) {
      console.error("      rode: node scripts/gerar-gramatica.mjs");
      process.exit(1);
    }
    console.log(`ok: tabelas em dia com REGRAS (${REGRAS.length} regras)`);
  }
}

// Comparação por realpath, não por nome de arquivo: em macOS `/tmp` e `/var`
// são symlinks, e comparar só o basename faz o script sair 0 sem gerar nada.
const ehEntryPoint = () => {
  try {
    return (
      process.argv[1] &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
};

if (ehEntryPoint()) {
  await main().catch((e) => {
    console.error(`erro: ${e.message}`);
    process.exit(2);
  });
}
