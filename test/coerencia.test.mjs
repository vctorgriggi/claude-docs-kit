// Coerência do repositório: as referências cruzadas entre gramática,
// comandos, templates, exemplos e README apontam para coisas que existem.
//
// Separado de docscheck.test.mjs de propósito: aquele testa o verificador,
// este testa o próprio kit. Uma renomeação de comando, uma regra removida ou
// um link quebrado num exemplo falham aqui — que é o tipo de deriva que só
// aparece meses depois, na hora em que alguém tenta seguir a documentação.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REGRAS } from "../bin/docscheck.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));

const IGNORAR = new Set([".git", "node_modules", ".github"]);

async function markdowns(dir = RAIZ, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (IGNORAR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await markdowns(p, acc);
    else if (e.name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

const rel = (p) => path.relative(RAIZ, p);

// Corpo de uma seção `## Título`, sem o cabeçalho e sem a seção seguinte.
function corpoDaSecao(md, titulo) {
  const i = md.indexOf(titulo);
  if (i === -1) return "";
  const resto = md.slice(i + titulo.length);
  const fim = resto.search(/^## /m);
  return fim === -1 ? resto : resto.slice(0, fim);
}
const MDS = await markdowns();
const conteudo = new Map(
  await Promise.all(MDS.map(async (p) => [p, await readFile(p, "utf8")])),
);

const NORMATIVO = conteudo.get(path.join(RAIZ, "grammar/GRAMATICA.md"));
const REGRAS_NUMERADAS = new Set(
  [
    ...NORMATIVO.slice(
      NORMATIVO.indexOf("## §2"),
      NORMATIVO.indexOf("## §3"),
    ).matchAll(/^(\d+)\. \*\*/gm),
  ].map((m) => m[1]),
);
const IDS = new Set(REGRAS.map((r) => r.id));

// Os documentos citam, em crase, dois tipos de caminho: os deste repositório
// e os do projeto-alvo que os comandos descrevem (`src/`, `docs/<tema>.md`,
// `.claude/commands/docs/`). Distinguir por allowlist envelheceria; o critério
// é estrutural — só é cobrado o caminho cujo primeiro segmento é um diretório
// real na raiz daqui.
const TOPO = new Set(
  (await readdir(RAIZ, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && !IGNORAR.has(e.name))
    .map((e) => e.name),
);

test("todo link markdown do repositório resolve", async () => {
  const quebrados = [];
  for (const [p, md] of conteudo) {
    const base = path.dirname(p);
    for (const m of md.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const alvo = m[1].replace(/#.*$/, "");
      if (!alvo || /^([a-z]+:|#|mailto:)/i.test(alvo)) continue;
      if (!existsSync(path.join(base, alvo))) {
        quebrados.push(`${rel(p)} → ${alvo}`);
      }
    }
  }
  assert.deepEqual(quebrados, [], `links quebrados:\n  ${quebrados.join("\n  ")}`);
});

test("toda âncora de link resolve para um heading que existe", async () => {
  // O teste de links acima ignora o `#âncora` e só confere o arquivo. Um
  // `](README.md#secao-que-nao-existe)` levava o leitor para o topo da página
  // sem erro nenhum — e acento na âncora é o caso que mais engana, porque o
  // GitHub os remove ao gerar o id.
  const slug = (titulo) =>
    titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/`|\*\*|_/g, "")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  // Sem descontar as cercas, um `## Regra de ouro` dentro de um exemplo de
  // código vira âncora fantasma — e o teste passaria a aprovar link que o
  // GitHub não resolve. Mesma disciplina do `semFences` do docscheck.
  const foraDeFence = (md) => {
    let dentro = false;
    return md
      .split("\n")
      .map((l) => {
        if (l.trimStart().startsWith("```")) {
          dentro = !dentro;
          return "";
        }
        return dentro ? "" : l;
      })
      .join("\n");
  };

  const headings = new Map();
  for (const [p, md] of conteudo) {
    headings.set(
      p,
      new Set(
        [...foraDeFence(md).matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1])),
      ),
    );
  }

  const quebradas = [];
  for (const [p, md] of conteudo) {
    for (const m of md.matchAll(/\[[^\]]*\]\(([^)\s]*)#([^)\s]+)\)/g)) {
      const [, arquivo, ancora] = m;
      if (/^[a-z]+:/i.test(arquivo)) continue; // link externo
      const alvo = arquivo
        ? path.resolve(path.dirname(p), arquivo)
        : p; // `(#secao)` aponta para o próprio arquivo
      const doAlvo = headings.get(alvo);
      if (!doAlvo) continue; // arquivo inexistente já é pego pelo teste de links
      if (!doAlvo.has(decodeURIComponent(ancora))) {
        quebradas.push(`${rel(p)} → ${arquivo || "(este arquivo)"}#${ancora}`);
      }
    }
  }
  assert.deepEqual(
    quebradas,
    [],
    `âncoras que não resolvem:\n  ${quebradas.join("\n  ")}`,
  );
});

test("todo caminho deste repositório citado em crase existe", async () => {
  const faltando = [];
  for (const [p, md] of conteudo) {
    // Os templates descrevem o doc-set de outro projeto; nada neles resolve aqui.
    if (rel(p).startsWith("templates/")) continue;
    for (const m of md.matchAll(/`([^`\n]+)`/g)) {
      const alvo = m[1].trim();
      if (!alvo.includes("/") || /^(~|\/|[a-z]+:)/i.test(alvo)) continue;
      if (/[<>*?{}\s|]/.test(alvo)) continue;
      if (!TOPO.has(alvo.split("/")[0])) continue;
      if (!existsSync(path.join(RAIZ, alvo))) faltando.push(`${rel(p)} → ${alvo}`);
    }
  }
  assert.deepEqual(faltando, [], `caminhos inexistentes:\n  ${faltando.join("\n  ")}`);
});

test("todo id de regra citado no repositório existe no catálogo", async () => {
  // Três formas de citar um id, e só elas — varrer prosa solta confundiria
  // `T1` (regra) com `T1.1` (tarefa) e `I1` (invariante de domínio).
  const FORMAS = [
    /`([EFCTDHJASV]\d+)`/g, // crase envolvendo só o id
    /--explain\s+([EFCTDHJASV]\d+)/g, // dentro de um comando
    /\(([EFCTDHJASV]\d+)\)/g, // entre parênteses, na prosa
  ];
  const orfaos = [];
  for (const [p, md] of conteudo) {
    for (const forma of FORMAS) {
      for (const m of md.matchAll(forma)) {
        if (!IDS.has(m[1])) orfaos.push(`${rel(p)} → ${m[1]}`);
      }
    }
  }
  assert.deepEqual(orfaos, [], `ids inexistentes:\n  ${orfaos.join("\n  ")}`);
});

test('toda "regra N" citada no repositório existe no §2 da gramática', async () => {
  const orfas = [];
  for (const [p, md] of conteudo) {
    for (const m of md.matchAll(/\bregra (\d+)\b/g)) {
      if (!REGRAS_NUMERADAS.has(m[1])) orfas.push(`${rel(p)} → regra ${m[1]}`);
    }
  }
  assert.deepEqual(orfas, [], `regras inexistentes:\n  ${orfas.join("\n  ")}`);
});

test("todo comando /docs:<nome> citado existe em commands/docs/", async () => {
  const existentes = new Set(
    (await readdir(path.join(RAIZ, "commands/docs")))
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, "")),
  );
  const orfaos = [];
  for (const [p, md] of conteudo) {
    for (const m of md.matchAll(/\/docs:([a-z-]+)/g)) {
      if (!existentes.has(m[1])) orfaos.push(`${rel(p)} → /docs:${m[1]}`);
    }
  }
  assert.deepEqual(orfaos, [], `comandos inexistentes:\n  ${orfaos.join("\n  ")}`);
});

test("toda GRAMATICA §N citada aponta para uma seção que existe", async () => {
  const secoes = new Set(
    [...NORMATIVO.matchAll(/^## §(\d+)/gm)].map((m) => m[1]),
  );
  const orfas = [];
  for (const [p, md] of conteudo) {
    for (const m of md.matchAll(/GRAMATICA §(\d+)/g)) {
      if (!secoes.has(m[1])) orfas.push(`${rel(p)} → GRAMATICA §${m[1]}`);
    }
  }
  assert.deepEqual(orfas, [], `seções inexistentes:\n  ${orfas.join("\n  ")}`);
});

test("toda §N citada dentro de um comando aponta para uma seção dele", async () => {
  const orfas = [];
  const dir = path.join(RAIZ, "commands/docs");
  for (const nome of (await readdir(dir)).filter((f) => f.endsWith(".md"))) {
    const md = await readFile(path.join(dir, nome), "utf8");
    const proprias = new Set(
      [...md.matchAll(/^## (\d+)\./gm)].map((m) => m[1]),
    );
    // "§3.3" e "§3.4" referenciam subseções; conta o nível de cima.
    for (const m of md.matchAll(/(?<!GRAMATICA )§(\d+)(?:\.\d+)?/g)) {
      if (!proprias.has(m[1])) orfas.push(`commands/docs/${nome} → §${m[1]}`);
    }
  }
  assert.deepEqual(orfas, [], `seções inexistentes:\n  ${orfas.join("\n  ")}`);
});

test("os templates existem, um por documento da paleta que os usa", async () => {
  const paleta = ["SPEC.md", "PLAN.md", "CLAUDE.md", "DOMAIN.md", "ROADMAP.md"];
  for (const nome of paleta) {
    const p = path.join(RAIZ, "templates", nome);
    assert.ok(existsSync(p), `templates/${nome} não existe`);
    assert.ok((await stat(p)).size > 200, `templates/${nome} está vazio demais`);
  }
  const extras = (await readdir(path.join(RAIZ, "templates"))).filter(
    (f) => !paleta.includes(f),
  );
  assert.deepEqual(extras, [], `template sem lugar na paleta: ${extras.join(", ")}`);
});

test("os templates não ensinam nada que a gramática proíbe", async () => {
  const dir = path.join(RAIZ, "templates");
  const problemas = [];
  for (const nome of await readdir(dir)) {
    const md = await readFile(path.join(dir, nome), "utf8");
    const acusar = (cond, msg) => cond && problemas.push(`templates/${nome}: ${msg}`);

    // regra 7: resolver é remover a linha, não marcá-la
    acusar(/^- \[x\]/m.test(md), "traz linha de decisão resolvida (regra 7)");
    // regra 2: nenhum template carimba data ou rodada no corpo
    acusar(/\(\s*rodada\b[^)]*\)/i.test(md), "carimba rodada no corpo (regra 2)");
    acusar(/\b\d{4}-\d{2}-\d{2}\b/.test(md), "traz data no corpo (regra 2)");
    // regra 11: "TBD" é o placeholder que a gramática proíbe nos gerados
    acusar(/\bTBD\b/.test(md), 'usa o placeholder "TBD" (regra 11)');
    // GRAMATICA §1: todo documento declara o papel em blockquote
    acusar(
      !/^#[^\n]*\n\n>/m.test(md),
      "não abre com o blockquote de papel (GRAMATICA §1)",
    );
  }
  // regra 8: só o CLAUDE.md é dono de versão de stack
  const spec = await readFile(path.join(dir, "SPEC.md"), "utf8");
  if (/\d+\.\d+|≥\s*\d|\bv\d+\b/.test(corpoDaSecao(spec, "## Stack"))) {
    problemas.push(
      "templates/SPEC.md: Stack com versão; o dono é o CLAUDE.md (regra 8)",
    );
  }
  assert.deepEqual(problemas, [], `templates fora da gramática:\n  ${problemas.join("\n  ")}`);
});

test("o CLI roda por symlink e por caminho com symlink no meio", async () => {
  // Regressão: a guarda de entry-point comparava strings de URL. Em macOS
  // `/tmp` e `/var` são symlinks, e symlinkar o docscheck para a cópia do repo
  // é o atalho óbvio para não reinstalar a cada edição — nos dois casos o
  // processo saía 0 sem ter verificado nada. Falso negativo silencioso é a
  // pior falha possível num verificador: o CI fica verde sem olhar nada.
  const bagunçado = fileURLToPath(
    new URL("../examples/fixtures/notas-api", import.meta.url),
  );
  const bin = path.join(RAIZ, "bin/docscheck.mjs");

  const rodar = (executavel) => {
    try {
      return {
        code: 0,
        out: execFileSync("node", [executavel, bagunçado], { encoding: "utf8" }),
      };
    } catch (e) {
      return { code: e.status, out: e.stdout ?? "" };
    }
  };

  const direto = rodar(bin);
  assert.equal(direto.code, 1, "o fixture bagunçado deveria acusar violações");
  assert.match(direto.out, /violação/);

  const tmp = await mkdtemp(path.join(tmpdir(), "docscheck-link-"));
  try {
    // (a) symlink apontando para o arquivo
    const link = path.join(tmp, "docscheck.mjs");
    await symlink(bin, link);
    const porLink = rodar(link);
    assert.equal(porLink.code, 1, "invocado por symlink, o CLI não verificou nada");
    assert.equal(porLink.out, direto.out, "saída diverge quando invocado por symlink");

    // (b) caminho com symlink no meio — o caso de /tmp e /var no macOS
    const real = realpathSync(tmp);
    if (real !== tmp) {
      const porCaminho = rodar(path.join(tmp, "docscheck.mjs"));
      assert.equal(porCaminho.code, 1);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test("o hook de SessionStart se comporta nos três cenários que importam", async () => {
  // Executar, não só conferir que existe: um hook silencioso quando deveria
  // falar — ou falante onde deveria calar — não quebra nada e ninguém percebe.
  const hook = path.join(RAIZ, "hooks/estado-na-sessao.mjs");
  const rodar = (cwd) => {
    const out = execFileSync("node", [hook], {
      cwd,
      encoding: "utf8",
      input: "{}",
      env: { ...process.env, HOME: process.env.HOME },
    });
    return out.trim();
  };

  // (a) doc-set limpo: contexto para o agente, nenhum aviso na tela.
  const limpo = JSON.parse(
    rodar(path.join(RAIZ, "examples/fixtures/linkcheck")),
  );
  assert.equal(limpo.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(limpo.hookSpecificOutput.additionalContext, /Fase 2/);
  assert.match(limpo.hookSpecificOutput.additionalContext, /T2\.1/);
  assert.match(limpo.hookSpecificOutput.additionalContext, /docscheck limpo/);
  assert.equal(
    limpo.systemMessage,
    undefined,
    "doc-set limpo não deveria interromper o usuário",
  );

  // (b) doc-set com violação: aí sim vai para a tela.
  const sujo = JSON.parse(
    rodar(path.join(RAIZ, "examples/fixtures/notas-api")),
  );
  assert.match(sujo.systemMessage, /violação/);
  assert.match(sujo.systemMessage, /\/docs:auditar/);

  // (c) diretório que não é doc-set: silêncio absoluto. Sem isto, toda sessão
  // aberta em qualquer pasta ganharia ruído.
  assert.equal(rodar(path.join(RAIZ, "bin")), "");
  assert.equal(rodar(path.join(RAIZ, "scripts")), "");
});

test("a saída de hook mostrada no walkthrough é a saída real", async () => {
  // Exemplo de saída é a primeira coisa que vira ficção quando o formato muda.
  // O walkthrough mostra o hook rodando no fixture linkcheck — então roda de
  // verdade e compara.
  const hook = path.join(RAIZ, "hooks/estado-na-sessao.mjs");
  const real = JSON.parse(
    execFileSync("node", [hook], {
      cwd: path.join(RAIZ, "examples/fixtures/linkcheck"),
      encoding: "utf8",
      input: "{}",
    }),
  ).hookSpecificOutput.additionalContext;

  const w = await readFile(path.join(RAIZ, "examples/ciclo-completo.md"), "utf8");
  const bloco = w.match(/```\nDocumentação-de-agente[\s\S]*?```/);
  assert.ok(bloco, "o walkthrough não mostra a saída do hook");

  const norm = (t) => t.replace(/```/g, "").replace(/\s+/g, " ").trim();
  assert.ok(
    norm(real).startsWith(norm(bloco[0]).replace(/\.$/, "")),
    `o walkthrough mostra uma saída que o hook não produz.\n  mostrado: ${norm(bloco[0])}\n  real:     ${norm(real)}`,
  );
});

test("o hook nunca derruba a sessão, mesmo com o kit quebrado", async () => {
  const hook = path.join(RAIZ, "hooks/estado-na-sessao.mjs");
  const dir = await mkdtemp(path.join(tmpdir(), "hook-quebrado-"));
  try {
    // Doc-set válido, mas .docscheck.json inválido: verificar() lança.
    await writeFile(
      path.join(dir, "CLAUDE.md"),
      "# p\n\n> Papel.\n\n## Regra de ouro\n\n**Uma disciplina.** Deriva disso.\n",
    );
    await writeFile(path.join(dir, ".docscheck.json"), "{ não é json }");
    const r = execFileSync("node", [hook], {
      cwd: dir,
      encoding: "utf8",
      input: "{}",
    });
    // Ainda entrega contexto; a checagem que falhou apenas não aparece.
    const j = JSON.parse(r);
    assert.equal(j.hookSpecificOutput.hookEventName, "SessionStart");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("install.sh instala tudo que os comandos leem em runtime", async () => {
  const sh = await readFile(path.join(RAIZ, "install.sh"), "utf8");
  for (const alvo of [
    "commands/docs/*.md",
    "bin/docscheck.mjs",
    "grammar/GRAMATICA.md",
    "templates/*.md",
  ]) {
    assert.ok(
      sh.includes(alvo),
      `install.sh não instala ${alvo}, que os comandos esperam encontrar`,
    );
  }
});

test("a paleta da gramática e a tabela do README listam os mesmos arquivos", async () => {
  const daTabela = (md, secao) => {
    const corpo = corpoDaSecao(md, secao);
    assert.notEqual(corpo, "", `seção "${secao}" não encontrada`);
    return new Set(
      [...corpo.matchAll(/^\| `([^`]+)`\s*\|/gm)].map((m) => m[1]),
    );
  };
  const naGramatica = daTabela(NORMATIVO, "## §1 Papéis dos arquivos");
  const noReadme = daTabela(
    conteudo.get(path.join(RAIZ, "README.md")),
    "## O que ele gera",
  );
  // O README também lista AGENTS.md, que a gramática cobre no §4 da paleta do
  // comando; a checagem é de inclusão, não de igualdade.
  const faltando = [...naGramatica].filter((a) => !noReadme.has(a));
  assert.deepEqual(
    faltando,
    [],
    `arquivos na gramática e ausentes do README: ${faltando.join(", ")}`,
  );
});

test("os doc-sets de referência são exatamente os anunciados no README", async () => {
  const fixtures = (
    await readdir(path.join(RAIZ, "examples/fixtures"), { withFileTypes: true })
  )
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const readme = conteudo.get(path.join(RAIZ, "examples/README.md"));
  for (const f of fixtures) {
    assert.ok(
      readme.includes(`fixtures/${f}/`),
      `examples/README.md não descreve o fixture "${f}"`,
    );
  }
});
