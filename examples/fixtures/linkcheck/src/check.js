import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const IGNORADOS = new Set(["node_modules", ".git"]);

// minúsculas, NFD sem diacríticos, não-alfanumérico vira hífen (convenção
// registrada no AGENTS.md: âncoras acentuadas falhavam sem normalização)
export function slug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extrairLinks(markdown) {
  const links = [];
  let emBloco = false;
  markdown.split("\n").forEach((linha, i) => {
    if (linha.trimStart().startsWith("```")) {
      emBloco = !emBloco;
      return;
    }
    if (emBloco) return;
    for (const m of linha.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      links.push({ alvo: m[1], linha: i + 1 });
    }
  });
  return links;
}

export function extrairAncoras(markdown) {
  return new Set(
    [...markdown.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => slug(m[1])),
  );
}

async function listarMd(dir) {
  const resultado = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (IGNORADOS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) resultado.push(...(await listarMd(p)));
    else if (e.name.endsWith(".md")) resultado.push(p);
  }
  return resultado;
}

export async function verificar(dir) {
  const quebrados = [];
  for (const arquivo of await listarMd(dir)) {
    const conteudo = await readFile(arquivo, "utf8");
    for (const { alvo, linha } of extrairLinks(conteudo)) {
      if (/^[a-z]+:/.test(alvo)) continue; // externos: roadmap (SPEC, Planejado)
      const [caminho, ancora] = alvo.split("#");
      const alvoAbs = caminho
        ? path.resolve(path.dirname(arquivo), caminho)
        : arquivo;
      if (!existsSync(alvoAbs)) {
        quebrados.push({ arquivo, linha, alvo });
        continue;
      }
      if (ancora !== undefined) {
        const alvoConteudo = caminho
          ? await readFile(alvoAbs, "utf8")
          : conteudo;
        if (
          !extrairAncoras(alvoConteudo).has(slug(decodeURIComponent(ancora)))
        ) {
          quebrados.push({ arquivo, linha, alvo });
        }
      }
    }
  }
  return quebrados;
}
