#!/usr/bin/env node
// docscheck: verifica os invariantes mecânicos da gramática do claude-docs-kit
// em SPEC.md, PLAN.md e CLAUDE.md de um diretório. Zero dependências
// (Node ≥ 20); instalação por cópia, como o restante do kit.
//
// Uso: node docscheck.mjs [diretório]
// Exit: 0 sem violações; 1 com violações; 2 erro de uso. Avisos (volume)
// não mudam o exit.
//
// Cobre apenas o verificável por máquina. As checagens de julgamento da
// gramática (teste do terceiro nos critérios de aceitação, teste de deleção)
// permanecem com o agente nas checagens de entrega.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ARQUIVOS = ["SPEC.md", "PLAN.md", "CLAUDE.md"];

// Versão da gramática que este verificador implementa. Deve acompanhar a
// declaração "Versão da gramática" no §0 de commands/bootstrap.md; o teste
// do kit acusa divergência.
export const GRAMATICA = "v4";

// Limite brando de volume do CLAUDE.md (regra 9): acima disso vira aviso —
// nunca violação; o critério de corte segue sendo o teste de deleção.
const LIMITE_CLAUDE = 200;

// <!-- rodada: <nome> @ <sha curto | AAAA-MM-DD (sem git)> -->
const MARCADOR = /^<!-- rodada: .+ @ ([0-9a-f]{7,40}|\d{4}-\d{2}-\d{2}) -->$/;

function linhas(md) {
  return md.split("\n");
}

// Linhas dentro de blocos de código cercados (```), delimitadores incluídos,
// viram linhas vazias — preserva a numeração e impede que headings, bullets,
// "TBD" e marcadores de exemplo sejam lidos como gramática do documento.
function semFences(md) {
  let dentro = false;
  return linhas(md)
    .map((l) => {
      if (l.trimStart().startsWith("```")) {
        dentro = !dentro;
        return "";
      }
      return dentro ? "" : l;
    })
    .join("\n");
}

// Corpo de uma seção no texto original (fences incluídos), delimitado pelas
// seções extraídas da versão sem fences — para busca de conteúdo (a árvore da
// Estrutura vive num bloco de código), nunca de estrutura.
function corpoOriginal(md, s, todas) {
  const ls = linhas(md);
  const proxima = todas.find((x) => x.linha > s.linha);
  return ls.slice(s.linha, proxima ? proxima.linha - 1 : ls.length).join("\n");
}

// Seções de nível 2: [{titulo, linha (1-based, do heading), corpo}]
function secoes(md) {
  const out = [];
  let atual = null;
  linhas(md).forEach((l, i) => {
    const m = l.match(/^## (.+)$/);
    if (m) {
      atual = { titulo: m[1].trim(), linha: i + 1, corpo: [] };
      out.push(atual);
    } else if (atual) {
      atual.corpo.push(l);
    }
  });
  for (const s of out) s.corpo = s.corpo.join("\n");
  return out;
}

function secao(md, prefixo) {
  return secoes(md).find((s) => s.titulo.startsWith(prefixo));
}

// Blockquote de papel logo abaixo do título de nível 1 (§0.1); null se ausente
function blockquoteDePapel(md) {
  const ls = linhas(md);
  const titulo = ls.findIndex((l) => /^# /.test(l));
  if (titulo === -1) return null;
  for (let i = titulo + 1; i < ls.length; i++) {
    if (ls[i].trim() === "") continue;
    if (!ls[i].startsWith(">")) return null;
    const texto = [];
    while (i < ls.length && ls[i].startsWith(">"))
      (texto.push(ls[i].slice(1).trim()), i++);
    return texto.join(" ");
  }
  return null;
}

// Bullets de topo de uma seção, com continuações coladas e linha absoluta
function bullets(s) {
  const out = [];
  linhas(s.corpo).forEach((l, i) => {
    if (/^- /.test(l)) out.push({ texto: l.slice(2), linha: s.linha + 1 + i });
    else if (out.length && /^\s+\S/.test(l))
      out[out.length - 1].texto += " " + l.trim();
  });
  return out;
}

// Linha absoluta (1-based) de um índice dentro do corpo de uma seção
function linhaEm(s, idx) {
  return s.linha + 1 + (s.corpo.slice(0, idx).match(/\n/g) || []).length;
}

export async function verificar(dir) {
  const docs = {};
  for (const nome of ARQUIVOS) {
    const p = path.join(dir, nome);
    if (existsSync(p)) docs[nome] = await readFile(p, "utf8");
  }
  if (Object.keys(docs).length === 0) {
    throw new Error(
      `nenhum arquivo da gramática (${ARQUIVOS.join(", ")}) em ${dir}`,
    );
  }

  const violacoes = [];
  const viol = (arquivo, linha, regra, msg) =>
    violacoes.push({ arquivo, linha, regra, msg });
  const avisos = [];

  // Volume do CLAUDE.md (regra 9): ele é lido em toda sessão; acima do limite
  // brando, sugerir compactação ou extração de seções de área para docs/.
  if (docs["CLAUDE.md"]) {
    const n = linhas(docs["CLAUDE.md"]).length;
    if (n > LIMITE_CLAUDE) {
      avisos.push({
        arquivo: "CLAUDE.md",
        linha: 1,
        msg: `${n} linhas (limite brando: ${LIMITE_CLAUDE}); compactar ou extrair seções de área para docs/<tema>.md (regra 9)`,
      });
    }
  }

  // As checagens estruturais rodam sobre a versão sem fences; o original só
  // serve a buscas de conteúdo (módulos na Estrutura do CLAUDE.md).
  const sombras = Object.fromEntries(
    Object.entries(docs).map(([n, md]) => [n, semFences(md)]),
  );

  // --- invariantes comuns a todos os arquivos ---
  for (const [nome, md] of Object.entries(sombras)) {
    if (blockquoteDePapel(md) === null) {
      viol(
        nome,
        1,
        "papel",
        "sem blockquote de papel logo abaixo do título (§0.1)",
      );
    }
    linhas(md).forEach((l, i) => {
      if (/\bTBD\b/.test(l))
        viol(nome, i + 1, "R9", 'placeholder "TBD" (regra 9: escala honesta)');
      if (/<!-- rodada:/.test(l) && !MARCADOR.test(l.trim())) {
        viol(
          nome,
          i + 1,
          "marcador",
          "formato esperado: <!-- rodada: <nome> @ <sha|AAAA-MM-DD> -->",
        );
      }
    });
    // Formato das decisões (regras 5 e 6), em qualquer arquivo
    for (const s of secoes(md).filter((s) =>
      s.titulo.startsWith("Decisões em aberto"),
    )) {
      linhas(s.corpo).forEach((l, i) => {
        if (!/^- \[/.test(l)) return;
        const ok =
          /^- \[ \] \*\*.+?\*\* —/.test(l) ||
          /^- \[x\] \*\*.+?\*\* — resolvido:/.test(l);
        if (!ok) {
          viol(
            nome,
            s.linha + 1 + i,
            "R6",
            'decisão fora do formato "- [ ] **<decisão>** — <contexto>" / "- [x] **<decisão>** — resolvido: <como>"',
          );
        }
      });
    }
  }

  // --- SPEC.md: fronteira presente/futuro (regra 1) ---
  const spec = sombras["SPEC.md"];
  if (spec) {
    const papel = blockquoteDePapel(spec);
    const planejado = secao(spec, "Planejado");
    if (papel !== null && !/planejad/i.test(papel)) {
      viol(
        "SPEC.md",
        1,
        "R1",
        'o blockquote de cabeçalho não declara a seção "Planejado" (regra 1)',
      );
    }
    if (planejado) {
      const primeira = linhas(planejado.corpo).find((l) => l.trim() !== "");
      if (!primeira || !primeira.startsWith(">")) {
        viol(
          "SPEC.md",
          planejado.linha,
          "R1",
          'a seção "Planejado" não abre com o blockquote de reforço (regra 1)',
        );
      }
    } else if (papel !== null && /planejad/i.test(papel)) {
      viol(
        "SPEC.md",
        1,
        "R1",
        'o cabeçalho promete a seção "Planejado", que não existe no documento',
      );
    }
  }

  // --- CLAUDE.md: regra de ouro (2), Nunca fazer (3), estado explícito (5) ---
  const claude = sombras["CLAUDE.md"];
  if (claude) {
    const ouro = secao(claude, "Regra de ouro");
    if (!ouro) {
      viol("CLAUDE.md", 1, "R2", 'sem seção "Regra de ouro" (regra 2)');
    } else if (!/\*\*[^*]+\*\*/.test(ouro.corpo)) {
      viol(
        "CLAUDE.md",
        ouro.linha,
        "R2",
        "a regra de ouro não está formulada em uma frase em negrito",
      );
    }
    const nunca = secao(claude, "Nunca fazer");
    if (nunca) {
      const itens = bullets(nunca);
      if (itens.length < 4) {
        viol(
          "CLAUDE.md",
          nunca.linha,
          "R3",
          `"Nunca fazer" com ${itens.length} item(ns); com menos de 4 proibições específicas a seção não deve existir (regra 3)`,
        );
      }
      for (const b of itens) {
        if (!/—\s*\S/.test(b.texto)) {
          viol(
            "CLAUDE.md",
            b.linha,
            "R3",
            'proibição sem justificativa na própria linha (após "—")',
          );
        }
      }
    }
    const decisoes = secao(claude, "Decisões em aberto");
    if (
      decisoes &&
      !/- \[ \]/.test(decisoes.corpo) &&
      !/nenhuma pendente/i.test(decisoes.corpo)
    ) {
      viol(
        "CLAUDE.md",
        decisoes.linha,
        "R5",
        'seção sem pendências deve declarar "Nenhuma pendente." (regra 5)',
      );
    }
  }

  // --- PLAN.md: tarefas com módulo e rastreabilidade cruzada (regra 8) ---
  // Onde um módulo conta como definido no CLAUDE.md: os títulos de seção e o
  // corpo original das seções "Estrutura"/"Módulos" (a árvore vive num bloco
  // de código). Menção em prosa solta não fecha rastreabilidade.
  let modulosDoClaude = null;
  if (claude) {
    const secs = secoes(claude);
    modulosDoClaude = [
      ...secs.map((s) => s.titulo),
      ...secs
        .filter((s) => /^(Estrutura|Módulos)/.test(s.titulo))
        .map((s) => corpoOriginal(docs["CLAUDE.md"], s, secs)),
    ].join("\n");
  }
  const plan = sombras["PLAN.md"];
  const idsDeTarefa = new Set();
  if (plan) {
    linhas(plan).forEach((l, i) => {
      const t = l.match(/^- \[( |x)\] (T\d+\.\d+) — /);
      if (!t) return;
      const id = t[2];
      if (idsDeTarefa.has(id))
        viol("PLAN.md", i + 1, "R8", `id de tarefa duplicado: ${id}`);
      idsDeTarefa.add(id);
      const mod = l.match(/· módulo:\s*(\S+)/);
      if (!mod) {
        viol(
          "PLAN.md",
          i + 1,
          "R8",
          `${id} sem "· módulo: <módulo>" (regra 8: tarefas referenciam módulos)`,
        );
      } else if (modulosDoClaude !== null) {
        const esc = mod[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const palavra = new RegExp(`(^|[^\\w-])${esc}([^\\w-]|$)`, "i");
        if (!palavra.test(modulosDoClaude)) {
          viol(
            "PLAN.md",
            i + 1,
            "R8",
            `${id} referencia o módulo "${mod[1]}", que não aparece na Estrutura nem nos títulos do CLAUDE.md`,
          );
        }
      }
    });
    const riscos = secao(plan, "Riscos");
    if (riscos && spec) {
      const constraints = secao(spec, "Constraints");
      const numeros = new Set(
        constraints
          ? [...constraints.corpo.matchAll(/^(\d+)\.\s/gm)].map((m) => m[1])
          : [],
      );
      for (const m of riscos.corpo.matchAll(/constraint\s+(\d+)/gi)) {
        if (!numeros.has(m[1])) {
          viol(
            "PLAN.md",
            linhaEm(riscos, m.index),
            "R8",
            `risco cita a constraint ${m[1]}, inexistente no SPEC (regra 8)`,
          );
        }
      }
    }
  }

  // Decisões pendentes que apontam tarefas (regra 8), em qualquer arquivo.
  // Só as pendentes: referência em decisão resolvida é histórica e pode
  // apontar tarefa de fase já compactada do PLAN.
  if (plan) {
    for (const [nome, md] of Object.entries(sombras)) {
      for (const s of secoes(md).filter((s) =>
        s.titulo.startsWith("Decisões em aberto"),
      )) {
        for (const b of bullets(s).filter((b) => b.texto.startsWith("[ ]"))) {
          for (const m of b.texto.matchAll(/\b(T\d+\.\d+)\b/g)) {
            if (!idsDeTarefa.has(m[1])) {
              viol(
                nome,
                b.linha,
                "R8",
                `decisão pendente aponta ${m[1]}, inexistente no PLAN (regra 8)`,
              );
            }
          }
        }
      }
    }
  }

  violacoes.sort(
    (a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha,
  );
  return { violacoes, avisos, arquivos: Object.keys(docs) };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    console.log("uso: node docscheck.mjs [diretório]  (padrão: .)");
    process.exit(0);
  }
  if (args.length > 1 || (args[0] || "").startsWith("-")) {
    console.error("uso: node docscheck.mjs [diretório]");
    process.exit(2);
  }
  try {
    const { violacoes, avisos, arquivos } = await verificar(args[0] || ".");
    for (const v of violacoes)
      console.log(`${v.arquivo}:${v.linha} [${v.regra}] ${v.msg}`);
    for (const a of avisos)
      console.log(`${a.arquivo}:${a.linha} [aviso] ${a.msg}`);
    if (violacoes.length === 0) {
      console.log(
        `ok: gramática ${GRAMATICA} sem violações mecânicas (${arquivos.join(", ")})` +
          (avisos.length ? ` — ${avisos.length} aviso(s)` : ""),
      );
      process.exit(0);
    }
    console.log(`resumo: ${violacoes.length} violação(ões) da gramática`);
    process.exit(1);
  } catch (e) {
    console.error(`erro: ${e.message}`);
    process.exit(2);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
