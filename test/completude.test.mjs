// Completude: cada superfície do kit está coberta pelas outras.
//
// As outras suítes verificam se o que existe funciona. Esta verifica se **falta
// alguma coisa** — e é a que existe porque a lacuna típica não é um bug, é uma
// peça que ninguém lembrou de ligar: um comando novo sem transcrição, uma regra
// sem caso de mutação, um arquivo de teste que o CI não roda, um fixture que
// nada exercita.
//
// A regra da casa aplicada ao próprio kit: se a completude depende de memória,
// ela falha. Cada asserção aqui é um "não esqueci de" que ninguém precisa
// lembrar de conferir.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REGRAS } from "../bin/docscheck.mjs";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const ler = (p) => readFile(path.join(RAIZ, p), "utf8");
const listar = async (d, ext = ".md") =>
  (await readdir(path.join(RAIZ, d))).filter((f) => f.endsWith(ext));

const COMANDOS = (await listar("commands/docs")).map((f) =>
  f.replace(/\.md$/, ""),
);

// O bloco cercado cujas linhas COMEÇAM com `marca` — não basta conter, porque
// o diagrama do ciclo também menciona os comandos, indentados.
function blocoDeInvocacoes(md, marca) {
  for (const m of md.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    if (m[1].split("\n").some((l) => l.startsWith(marca))) return m[1];
  }
  return null;
}
const README = await ler("README.md");
const CI = await ler(".github/workflows/ci.yml");

// Fixture que existe justamente para estar fora da gramática. O notas-api é o
// que o Modo B encontra no mundo: rodar --strict nele seria checar a ausência
// de doc-set. Declarado num lugar só, porque dois testes contam com ele — o que
// cobra fixture órfão e o que confere "os três passam --strict".
const SUJOS = {
  "notas-api": "entrada do Modo B: repositório sem doc-set, de convenções mistas",
};

test("o CI roda todo arquivo de teste do diretório test/", async () => {
  // Listar as suítes à mão no CI era correto por acidente: um arquivo novo
  // passaria a existir sem nunca rodar em lugar nenhum. O glob resolve a
  // classe inteira; a lista explícita continua aceita para quem preferir.
  const porGlob = /node --test [^\n]*test\/\*\.test\.mjs/.test(CI);
  if (porGlob) return;
  const arquivos = await listar("test", ".test.mjs");
  const esquecidos = arquivos.filter((f) => !CI.includes(`test/${f}`));
  assert.deepEqual(
    esquecidos,
    [],
    `arquivos de teste que o CI não roda: ${esquecidos.join(", ")} — ou liste, ou use o glob test/*.test.mjs`,
  );
});

test("todo comando tem transcrição em examples/", async () => {
  const transcricoes = (await listar("examples")).filter((f) => /^\d\d-/.test(f));
  const corpo = (
    await Promise.all(transcricoes.map((f) => ler(`examples/${f}`)))
  ).join("\n");
  const semExemplo = COMANDOS.filter((c) => !corpo.includes(`/docs:${c}`));
  assert.deepEqual(
    semExemplo,
    [],
    `comandos sem transcrição: ${semExemplo.join(", ")} — quem não intui o comando não tem onde ver ele funcionando`,
  );
});

test("a numeração das transcrições é a ordem do ciclo, e o título confere", async () => {
  // A numeração é contrato de leitura: quem segue 01→05 percorre o ciclo na
  // ordem em que ele acontece. Renomear um arquivo sem renumerar o título (ou
  // vice-versa) deixa o leitor com dois números diferentes para a mesma coisa.
  const ORDEM = ["fundar", "fundar", "tarefa", "auditar", "rodada"];
  const transcricoes = (await listar("examples"))
    .filter((f) => /^\d\d-/.test(f))
    .sort();

  assert.equal(
    transcricoes.length,
    ORDEM.length,
    `esperava ${ORDEM.length} transcrições na ordem do ciclo, achei ${transcricoes.length}`,
  );

  for (const [i, arquivo] of transcricoes.entries()) {
    const n = Number(arquivo.slice(0, 2));
    assert.equal(n, i + 1, `numeração com buraco ou fora de ordem: ${arquivo}`);

    const md = await ler(`examples/${arquivo}`);
    const titulo = md.match(/^# Exemplo (\d+):/);
    assert.ok(titulo, `${arquivo} não abre com "# Exemplo <n>: …"`);
    assert.equal(
      Number(titulo[1]),
      n,
      `${arquivo}: o nome diz ${n} e o título diz ${titulo[1]}`,
    );

    assert.ok(
      md.includes(`/docs:${ORDEM[i]}`),
      `${arquivo} deveria demonstrar /docs:${ORDEM[i]} — a posição no ciclo e o comando não batem`,
    );
  }
});

test("o walkthrough do ciclo cobre todo comando e as partes que não são comando", async () => {
  // As transcrições são mergulhos de um comando cada; sem um mapa, quem chega
  // tem que costurar cinco arquivos para entender o uso. E um mapa que não
  // acompanha o kit é pior que nenhum — daí a cobrança aqui.
  const w = await ler("examples/ciclo-completo.md");

  const ausentes = COMANDOS.filter((c) => !w.includes(`/docs:${c}`));
  assert.deepEqual(
    ausentes,
    [],
    `o walkthrough não mostra: ${ausentes.join(", ")}`,
  );

  // O que só existe fora dos comandos, e por isso nenhuma transcrição mostra.
  for (const [oque, marca] of [
    ["o hook", "SessionStart"],
    ["o panorama entre projetos", "docscheck ~/"],
    ["a supressão justificada", "docscheck: ignore"],
    ["o CI do projeto-alvo", "--strict"],
  ]) {
    assert.ok(w.includes(marca), `o walkthrough não mostra ${oque}`);
  }

  // E aponta para o mergulho de cada comando, em vez de duplicá-lo.
  const transcricoes = (await listar("examples")).filter((f) => /^\d\d-/.test(f));
  const semPonteiro = transcricoes.filter((f) => !w.includes(f));
  assert.deepEqual(
    semPonteiro,
    [],
    `o walkthrough não aponta para: ${semPonteiro.join(", ")}`,
  );

  const indice = await ler("examples/README.md");
  assert.ok(
    indice.includes("ciclo-completo.md") && README.includes("ciclo-completo.md"),
    "o walkthrough existe e não é anunciado no índice ou no README",
  );
});

test("toda transcrição é anunciada no índice de examples/", async () => {
  const indice = await ler("examples/README.md");
  const transcricoes = (await listar("examples")).filter((f) => /^\d\d-/.test(f));
  const foraDoIndice = transcricoes.filter((f) => !indice.includes(f));
  assert.deepEqual(
    foraDoIndice,
    [],
    `transcrições ausentes do índice: ${foraDoIndice.join(", ")}`,
  );
});

test("todo comando aparece na tabela do ciclo do README", () => {
  const ausentes = COMANDOS.filter((c) => !README.includes(`/docs:${c}`));
  assert.deepEqual(
    ausentes,
    [],
    `comandos ausentes do README: ${ausentes.join(", ")}`,
  );
});

test("todo comando tem caso travado na regressão da gramática", async () => {
  const regressao = await ler("examples/regressao-da-gramatica.md");
  const ausentes = COMANDOS.filter((c) => !regressao.includes(`/docs:${c}`));
  assert.deepEqual(
    ausentes,
    [],
    `comandos sem caso de regressão: ${ausentes.join(", ")} — nada detectaria deriva de comportamento neles`,
  );
});

test("o instalador cobre tudo que é lido em runtime", async () => {
  const sh = await ler("install.sh");
  for (const alvo of [
    "commands/docs/*.md",
    "bin/docscheck.mjs",
    "grammar/GRAMATICA.md",
    "templates/*.md",
    "hooks/estado-na-sessao.mjs",
  ]) {
    assert.ok(
      sh.includes(alvo),
      `install.sh não instala ${alvo}, que alguma parte do kit espera encontrar`,
    );
  }
});

test("o hook é documentado pelo caminho que o instalador realmente cria", async () => {
  // A pior variante do problema seria esta: o README manda ligar um hook por
  // um caminho que o instalador não cria. O usuário edita settings.json, nada
  // roda, e nada avisa.
  const sh = await ler("install.sh");
  const destino = sh.match(/\$\{HOME\}\/\.claude\/(docs-kit\/hooks\/[\w.-]+)/);
  assert.ok(destino, "install.sh não instala o hook num caminho reconhecível");
  assert.ok(
    README.includes(`~/.claude/${destino[1]}`),
    `o README não documenta o hook em ~/.claude/${destino[1]}`,
  );
  assert.match(README, /"SessionStart"/, "o README não mostra o bloco que liga o hook");

  const hooks = await listar("hooks", ".mjs");
  assert.ok(hooks.length, "não há hook no repositório");
  for (const h of hooks) {
    assert.ok(
      sh.includes(`hooks/${h}`),
      `hooks/${h} existe e o install.sh não o instala`,
    );
  }
});

test("todo comando é instalado e declara o que faz", async () => {
  const sh = await ler("install.sh");
  assert.match(sh, /commands\/docs\/\*\.md/, "install.sh não instala os comandos");
  for (const c of COMANDOS) {
    const md = await ler(`commands/docs/${c}.md`);
    const fm = md.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(fm, `commands/docs/${c}.md sem frontmatter`);
    for (const campo of ["description", "allowed-tools", "disable-model-invocation"]) {
      assert.match(
        fm[1],
        new RegExp(`^${campo}:`, "m"),
        `commands/docs/${c}.md sem "${campo}" no frontmatter`,
      );
    }
  }
});

test("toda regra do catálogo aparece nas tabelas geradas", async () => {
  const normativo = await ler("grammar/GRAMATICA.md");
  for (const r of REGRAS) {
    assert.ok(
      normativo.includes(`\`${r.id}\``),
      `${r.id} não aparece na tabela de GRAMATICA §5`,
    );
    assert.ok(
      README.includes(`\`${r.id}\``),
      `${r.id} não aparece na tabela de famílias do README`,
    );
  }
});

test("toda regra da gramática é enforçada, referenciada, ou declarada como julgamento", async () => {
  // Uma regra que nenhum verificador checa e nenhum comando cita é letra morta
  // — a menos que seja deliberadamente de julgamento. Aqui isso vira um fato
  // explícito, com o motivo, em vez de um acidente.
  const SO_JULGAMENTO = {
    12: "idioma correto não é verificável sem heurística de locale; o modelo lê a regra no §2 e decide",
  };

  const normativo = await ler("grammar/GRAMATICA.md");
  const secao2 = normativo.slice(
    normativo.indexOf("## §2"),
    normativo.indexOf("## §3"),
  );
  const numeradas = [...secao2.matchAll(/^(\d+)\. \*\*/gm)].map((m) =>
    Number(m[1]),
  );
  assert.ok(numeradas.length >= 10, "§2 não parseou");

  const comMecanica = new Set(
    REGRAS.map((r) => Number(r.regra.replace("regra ", ""))).filter(Boolean),
  );
  const nosComandos = (
    await Promise.all(COMANDOS.map((c) => ler(`commands/docs/${c}.md`)))
  ).join("\n");

  const mortas = numeradas.filter(
    (n) =>
      !comMecanica.has(n) &&
      !new RegExp(`\\bregra ${n}\\b`).test(nosComandos) &&
      !SO_JULGAMENTO[n],
  );
  assert.deepEqual(
    mortas,
    [],
    `regras sem verificação, sem citação e sem justificativa: ${mortas.join(", ")} — enforce, cite num comando, ou declare em SO_JULGAMENTO com o motivo`,
  );

  // E o inverso: uma regra listada como "só julgamento" que ganhou verificação
  // deve sair da lista, senão a lista mente.
  const promovidas = Object.keys(SO_JULGAMENTO)
    .map(Number)
    .filter((n) => comMecanica.has(n));
  assert.deepEqual(
    promovidas,
    [],
    `regras em SO_JULGAMENTO que já têm verificação mecânica: ${promovidas.join(", ")} — tire da lista`,
  );
});

test("todo fixture é exercitado, ou declarado sujo de propósito", async () => {
  const fixtures = (
    await readdir(path.join(RAIZ, "examples/fixtures"), { withFileTypes: true })
  )
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const orfaos = fixtures.filter(
    (f) => !CI.includes(`fixtures/${f}`) && !SUJOS[f],
  );
  assert.deepEqual(
    orfaos,
    [],
    `fixtures que nada exercita: ${orfaos.join(", ")} — ligue ao CI ou declare em SUJOS com o motivo`,
  );

  // Fixture declarado sujo precisa ser usado em algum lugar, senão é lixo.
  const transcricoes = (await listar("examples")).filter((f) => /^\d\d-/.test(f));
  const corpo =
    (await Promise.all(transcricoes.map((f) => ler(`examples/${f}`)))).join("\n") +
    (await ler("scripts/regressao-smoke.sh"));
  for (const [f, motivo] of Object.entries(SUJOS)) {
    assert.ok(
      corpo.includes(f),
      `fixture "${f}" declarado sujo (${motivo}) e não usado por nenhuma transcrição nem pelo smoke`,
    );
  }
});

test("todo executável do repositório é documentado e exercitado", async () => {
  // Vale para scripts/ e hooks/: um executável que ninguém documenta é
  // invisível, e um que nenhuma suíte roda é uma promessa não verificada. O
  // hook passou por esta brecha — instalado, documentado, nunca executado.
  const docs = (
    await Promise.all(
      ["README.md", "examples/README.md", "examples/regressao-da-gramatica.md"].map(ler),
    )
  ).join("\n");
  // Esta suíte não conta como cobertura de nada: ela cobra o exercício, não o
  // faz. Sem essa exclusão, mencionar um executável aqui já o daria por
  // coberto — que é exatamente o buraco pelo qual o hook passou.
  const suites = (
    await Promise.all(
      (await listar("test", ".test.mjs"))
        .filter((f) => f !== "completude.test.mjs")
        .map((f) => ler(`test/${f}`)),
    )
  ).join("\n");

  // Executável que nenhuma suíte pode rodar precisa declarar por quê.
  const SEM_SUITE = {
    "regressao-smoke.sh":
      "roda `claude -p` em headless: custa tokens da conta de quem chama e depende de rede, então fica fora do CI por decisão — os sinais dele estão travados na tabela de regressão",
  };

  const semDoc = [];
  const semTeste = [];
  for (const pasta of ["scripts", "hooks"]) {
    for (const arquivo of await readdir(path.join(RAIZ, pasta))) {
      const citado = docs.includes(arquivo) || CI.includes(arquivo);
      if (!citado) semDoc.push(`${pasta}/${arquivo}`);
      // O gerador roda no CI como passo próprio; o resto precisa de suíte.
      const exercitado =
        suites.includes(arquivo) || CI.includes(arquivo) || SEM_SUITE[arquivo];
      if (!exercitado) semTeste.push(`${pasta}/${arquivo}`);
    }
  }
  assert.deepEqual(semDoc, [], `executáveis que ninguém documenta: ${semDoc.join(", ")}`);
  assert.deepEqual(
    semTeste,
    [],
    `executáveis que nenhuma suíte roda nem o CI invoca: ${semTeste.join(", ")}`,
  );
});

test("os prompts dos comandos são alcançáveis a partir do README", () => {
  // O produto do kit são os prompts. Um leitor do README precisa poder abrir
  // o comando que está lendo sobre.
  assert.match(
    README,
    /\]\(commands\/docs\//,
    "o README não linka nenhum comando; o leitor não tem como abrir o que está lendo sobre",
  );
  const naoLinkados = COMANDOS.filter(
    (c) => !README.includes(`commands/docs/${c}.md`),
  );
  assert.deepEqual(
    naoLinkados,
    [],
    `comandos não linkados no README: ${naoLinkados.join(", ")}`,
  );
});

test("comando com mais de um modo mostra os dois no bloco de Uso", async () => {
  // Um `|` no argument-hint significa formas de invocação distintas. Mostrar só
  // uma no README esconde metade do comando — foi o que aconteceu com o
  // `/docs:decidir resolver`, que o exemplo 3 demonstra e o Uso omitia.
  const uso = blocoDeInvocacoes(README, "/docs:fundar");
  assert.ok(uso, "o README não tem bloco de Uso");

  for (const c of COMANDOS) {
    const md = await ler(`commands/docs/${c}.md`);
    const hint = md.match(/^argument-hint: (.+)$/m)?.[1] ?? "";
    const linhas = uso
      .split("\n")
      .filter((l) => l.startsWith(`/docs:${c}`)).length;
    const modos = hint.includes(" | ") ? 2 : 1;
    assert.ok(
      linhas >= modos,
      `/docs:${c} tem ${modos} modo(s) no argument-hint e ${linhas} linha(s) no Uso do README`,
    );
  }
});

test("a saída de exemplo do README tem o formato que a ferramenta emite", async () => {
  // Mostrar saída concreta é o que deixa o README avaliável sem clicar em nada
  // — e é a primeira coisa que envelhece quando o formato muda.
  const bloco = blocoDeInvocacoes(README, "$ docscheck");
  assert.ok(bloco, "o README não mostra nenhuma execução do docscheck");

  const achados = bloco
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("$") && !l.startsWith("resumo:"));
  assert.ok(achados.length >= 2, "o exemplo de saída não tem achados");

  const IDS = new Set(REGRAS.map((r) => r.id));
  for (const l of achados) {
    const m = l.match(/^(\S+):(\d+)\s+\[([A-Z]\d+)\]\s+\S/);
    assert.ok(m, `linha de saída fora do formato "arquivo:linha [ID] msg": ${l}`);
    assert.ok(IDS.has(m[3]), `o exemplo cita ${m[3]}, que não existe no catálogo`);
  }
  assert.match(
    bloco,
    /^resumo: \d+ violação\(ões\)/m,
    "o exemplo não mostra a linha de resumo que a ferramenta imprime",
  );
});

test("todo panorama documentado é a saída real, não uma lembrança dela", async () => {
  // A guarda acima confere formato; esta confere verdade. O panorama roda sobre
  // os fixtures de verdade, então dá para exigir igualdade byte a byte — e é o
  // único jeito de pegar o exemplo que estava certo quando foi escrito e
  // envelheceu junto com o fixture. Vale para todo arquivo que mostra o
  // panorama, não só o README: o mesmo bloco estava em dois lugares, e os dois
  // tinham envelhecido de formas diferentes.
  const comPanorama = [];
  for (const rel of ["README.md", ...(await listar("examples")).map((f) => `examples/${f}`)]) {
    const bloco = blocoDeInvocacoes(await ler(rel), "$ docscheck ~/");
    if (bloco) comPanorama.push([rel, bloco]);
  }
  assert.ok(comPanorama.length, "nenhum arquivo mostra o panorama entre projetos");

  // Exit 1 é o esperado: o `notas-api` viola de propósito. O que interessa é o
  // stdout, que o execFileSync entrega no erro.
  const argv = [
    path.join(RAIZ, "bin/docscheck.mjs"),
    // Ordenado: o panorama respeita a ordem dos argumentos, e o README mostra
    // o resultado de um glob do shell, que vem ordenado. O readdir não vem.
    ...(await listar("examples/fixtures", ""))
      .sort()
      .map((f) => path.join(RAIZ, "examples/fixtures", f)),
  ];
  let real;
  try {
    real = execFileSync("node", argv, { encoding: "utf8" });
  } catch (e) {
    real = e.stdout ?? "";
  }

  const limpar = (s) =>
    s
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("$"))
      .map((l) => l.trimEnd())
      .join("\n");

  for (const [rel, bloco] of comPanorama) {
    assert.equal(
      limpar(bloco),
      limpar(real),
      `o panorama de ${rel} diverge do que o docscheck emite hoje sobre os fixtures`,
    );
  }
});

test("o README aponta para o kit irmão", () => {
  // A relação entre os dois kits é o argumento mais forte de cada um, e existia
  // só de um lado: o code-kit citava este, este não citava aquele. Quem chegasse
  // por aqui nunca descobria que o contrato gerado tem quem o cobre.
  assert.match(
    README,
    /claude-code-kit/,
    "o README não menciona o kit irmão que cobra o contrato gerado",
  );
  assert.match(
    README,
    /\[claude-code-kit\]\(https:\/\/github\.com\/[^)]+\)/,
    "o kit irmão é citado sem link — a menção precisa levar a algum lugar",
  );
});

test("as famílias do catálogo são contíguas e todas têm nome", async () => {
  // Contíguas porque a ordem do catálogo é a ordem das duas tabelas geradas —
  // família picotada vira tabela picotada. E o mapa de nomes do gerador tem que
  // cobrir toda letra que aparecer, senão a família some da tabela do README em
  // silêncio. Antes disto o mapa mandava numa tabela e o catálogo na outra, e
  // as duas listavam as mesmas 39 regras em ordens diferentes.
  const { familias } = await import("../scripts/gerar-gramatica.mjs");
  const prefixos = REGRAS.map((r) => r.id[0]);
  const unicos = familias();

  assert.equal(
    unicos.length,
    new Set(prefixos).size,
    "alguma família aparece em dois blocos do catálogo",
  );
  for (const [i, p] of prefixos.entries()) {
    if (i === 0) continue;
    const anterior = prefixos[i - 1];
    if (p === anterior) continue;
    assert.ok(
      !prefixos.slice(0, i - 1).includes(p),
      `a família ${p} está picotada no catálogo: ${REGRAS[i].id} reabre um bloco já fechado`,
    );
  }

  const tabela = (await ler("README.md")).match(/REGRAS:início[\s\S]*?REGRAS:fim/)[0];
  const naTabela = [...tabela.matchAll(/\| \*\*[^*]+\*\*[^|]*\| ((?:`[A-Z]\d` ?)+)/g)].map(
    (m) => m[1].trim()[1],
  );
  assert.deepEqual(
    naTabela,
    unicos,
    "a ordem das famílias na tabela do README não é a do catálogo",
  );
});

test("os casos de regressão são numerados 1..N na ordem do arquivo", async () => {
  // A tabela é dividida em seções por comando, e caso novo entra na seção do
  // comando dele, não no fim do arquivo. Sem esta guarda a numeração vira ordem
  // de escrita, e o leitor perde a referência estável de "o caso 12".
  const numeros = (await ler("examples/regressao-da-gramatica.md"))
    .split("\n")
    .filter((l) => /^\| *\d+ *\|/.test(l))
    .map((l) => Number(l.match(/^\| *(\d+)/)[1]));

  assert.ok(numeros.length > 0, "a tabela de regressão não tem casos numerados");
  assert.deepEqual(
    numeros,
    numeros.map((_, i) => i + 1),
    "numeração fora de ordem ou com buraco na tabela de regressão",
  );
});

test("a ordem das seções do README leva à instalação, não parte dela", async () => {
  // Instalar é o pedido mais caro da página. Ele vem depois da prova (o que sai
  // disso, o que ele gera) e depois da pergunta que decide (isto serve para o
  // meu projeto?) — nunca antes. Sem esta guarda a ordem volta a ser a de
  // escrita, que foi como ela nasceu nos dois kits.
  let dentro = false;
  const secoes = [];
  for (const l of README.split("\n")) {
    if (l.trimStart().startsWith("```")) dentro = !dentro;
    else if (!dentro && l.startsWith("## ")) secoes.push(l.slice(3).trim());
  }

  const pos = (t) => secoes.findIndex((s) => s === t);
  const antes = (a, b) => {
    assert.notEqual(pos(a), -1, `o README não tem a seção "${a}"`);
    assert.notEqual(pos(b), -1, `o README não tem a seção "${b}"`);
    assert.ok(pos(a) < pos(b), `"${a}" precisa vir antes de "${b}" no README`);
  };

  antes("Por quê", "O ciclo");
  antes("O ciclo", "O que sai disso");
  antes("O que sai disso", "O que ele gera");
  antes("O que ele gera", "Em que projetos isso funciona");
  antes("Em que projetos isso funciona", "Instalação");
  antes("Instalação", "Uso");
  antes("Uso", "A gramática");
  antes("A gramática", "Verificação");
  antes("Verificação", "Veja funcionando");
  antes("Veja funcionando", "Limitações conhecidas");
  antes("Limitações conhecidas", "Personalização");
});

test("toda feature de CLI documentada existe e tem teste", async () => {
  // O `.docscheck.json` passou por este buraco: implementado, documentado no
  // README e sem uma linha de teste. Uma feature que a documentação promete e
  // nada exercita é uma promessa que ninguém está segurando.
  const suites = (
    await Promise.all(
      (await listar("test", ".test.mjs")).map((f) => ler(`test/${f}`)),
    )
  ).join("\n");
  const fonte = await ler("bin/docscheck.mjs");

  const flags = new Set(
    [...README.matchAll(/docscheck[^\n`]*\s(--[a-z-]+)/g)].map((m) => m[1]),
  );
  assert.ok(flags.size >= 3, "o README não documenta as flags do docscheck");

  for (const flag of flags) {
    assert.ok(
      fonte.includes(`"${flag}"`),
      `o README documenta ${flag} e a implementação não a conhece`,
    );
    assert.ok(
      suites.includes(flag),
      `${flag} é documentada e nenhuma suíte a exercita`,
    );
  }

  // Arquivos de configuração prometidos ao usuário seguem a mesma regra.
  for (const arquivo of [".docscheck.json"]) {
    if (!README.includes(arquivo)) continue;
    assert.ok(
      fonte.includes(arquivo),
      `o README promete ${arquivo} e a implementação não o lê`,
    );
    assert.ok(
      suites.includes(arquivo),
      `${arquivo} é documentado e nenhuma suíte prova que funciona`,
    );
  }

  // E a sintaxe de supressão, que é contrato com quem usa o kit.
  if (README.includes("docscheck: ignore")) {
    assert.ok(fonte.includes("docscheck:"), "a supressão documentada não existe");
    assert.ok(
      suites.includes("docscheck: ignore"),
      "a supressão é documentada e nenhuma suíte a exercita",
    );
  }
});

test("as contagens escritas à mão na documentação batem com a realidade", async () => {
  // Número em prosa é a coisa que deriva primeiro: alguém acrescenta uma regra
  // e o "quatorze" continua lá. Onde a tabela é gerada isso não acontece; onde
  // a prosa conta, este teste conta junto.
  const PALAVRAS = {
    um: 1, dois: 2, três: 3, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7,
    oito: 8, nove: 9,
    dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14,
    quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20,
  };

  // "Os dois passam --strict" sobreviveu à chegada do terceiro doc-set de
  // referência. Quantos são sai da contagem de fixtures que não estão
  // declarados sujos, e não da memória de quem escreveu a frase.
  const limpos = (
    await readdir(path.join(RAIZ, "examples/fixtures"), { withFileTypes: true })
  ).filter((e) => e.isDirectory() && !SUJOS[e.name]).length;

  for (const [arq, texto] of [
    ["README.md", README],
    ["examples/README.md", await ler("examples/README.md")],
  ]) {
    const m = texto.match(/Os (\p{L}+) passam `docscheck --strict`/u);
    assert.ok(m, `${arq} não declara quantos doc-sets passam no --strict`);
    assert.equal(
      PALAVRAS[m[1].toLowerCase()],
      limpos,
      `${arq} diz "os ${m[1]}" e há ${limpos} doc-set(s) de referência`,
    );
  }

  const normativo = await ler("grammar/GRAMATICA.md");
  const regrasDoSecao2 = [
    ...normativo
      .slice(normativo.indexOf("## §2"), normativo.indexOf("## §3"))
      .matchAll(/^(\d+)\. \*\*/gm),
  ].length;

  const naProsa = README.match(/As (\p{L}+) regras, em resumo/u);
  assert.ok(naProsa, 'o README não declara quantas regras a gramática tem ("As <n> regras, em resumo")');
  assert.equal(
    PALAVRAS[naProsa[1].toLowerCase()],
    regrasDoSecao2,
    `o README diz "${naProsa[1]}" regras; o §2 da GRAMATICA tem ${regrasDoSecao2}`,
  );

  const indice = await ler("examples/README.md");
  const casos = (
    await ler("examples/regressao-da-gramatica.md")
  ).match(/^\| \d+ {2,}\|/gm)?.length;
  assert.ok(casos > 0, "a tabela de regressão não parseou");
  const declarado = indice.match(/(\d+) casos com resultado travado/);
  assert.ok(declarado, "o índice de examples/ não declara quantos casos a regressão tem");
  assert.equal(
    Number(declarado[1]),
    casos,
    `o índice diz ${declarado[1]} casos de regressão; a tabela tem ${casos}`,
  );
});

test("a tabela de camadas do CI cobre todo passo que o CI roda", async () => {
  // O README explica as camadas; o ci.yml as executa. Um step novo sem linha na
  // tabela é uma garantia que ninguém sabe que existe.
  const alvos = [
    ["test/*.test.mjs", "test/docscheck.test.mjs"],
    ["gerar-gramatica.mjs --check", "scripts/gerar-gramatica.mjs --check"],
    ["working-directory: examples/fixtures", "node --test` em cada fixture"],
    ["docscheck.mjs --strict", "--strict` nos dois fixtures"],
  ];
  for (const [noCi, noReadme] of alvos) {
    if (!CI.includes(noCi)) continue;
    assert.ok(
      README.includes(noReadme),
      `o CI roda "${noCi}" e a tabela de camadas do README não descreve isso`,
    );
  }
});

test("a action de CI para projeto-alvo existe e é citada", async () => {
  const action = await ler(".github/actions/docscheck/action.yml");
  assert.match(action, /docscheck/);
  assert.ok(
    README.includes(".github/actions/docscheck"),
    "o README promete a action e não aponta para ela",
  );
});
