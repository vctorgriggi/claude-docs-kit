#!/usr/bin/env node
// Hook de SessionStart: leva o estado do doc-set até a sessão, em vez de
// esperar ser procurado.
//
// O kit inteiro é pull — você precisa lembrar de rodar /docs:auditar. Este hook
// inverte isso para o único momento em que importa: quando alguém abre uma
// sessão para mexer no código. Se a documentação estiver atrás, o agente sabe
// antes da primeira edição.
//
// Silencioso onde não é alvo: diretório sem doc-set não imprime nada, e o
// custo é uma leitura de três arquivos markdown.
//
// Instalação: ver README (bloco de settings.json). Este script não escreve
// nada e não falha a sessão — erro aqui vira silêncio, nunca prompt travado.

import path from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync, realpathSync } from "node:fs";

const LIMITE_COMMITS = 30; // acima disso, o marcador é notícia

// O docscheck instalado ao lado, ou o do repo quando rodando de dentro dele.
async function carregar() {
  const candidatos = [
    path.join(path.dirname(realpathSync(process.argv[1])), "..", "bin", "docscheck.mjs"),
    path.join(process.env.HOME ?? "", ".claude", "bin", "docscheck.mjs"),
  ];
  for (const c of candidatos) {
    if (existsSync(c)) return import(pathToFileURL(c).href);
  }
  return null;
}

function resumir(e, r) {
  const partes = [];
  if (e.fase_atual) {
    const ids = e.tarefas_abertas.map((t) => t.id).join(", ");
    partes.push(`${e.fase_atual.nome} — ${e.fase_atual.abertas} aberta(s)${ids ? ` (${ids})` : ""}`);
  }
  if (e.decisoes_pendentes.length) {
    partes.push(
      `${e.decisoes_pendentes.length} decisão(ões) pendente(s): ` +
        e.decisoes_pendentes.map((d) => d.decisao).join("; "),
    );
  }
  if (e.marcador?.commits_desde != null) {
    partes.push(`${e.marcador.commits_desde} commit(s) desde a última rodada`);
  }
  if (r) {
    const v = r.violacoes.length;
    const a = r.avisos.length;
    partes.push(v || a ? `docscheck: ${v} violação(ões), ${a} aviso(s)` : "docscheck limpo");
  }
  return partes.join(" · ");
}

// Vale interromper o usuário? Só quando o documento afirma algo falso ou está
// visivelmente atrás — o resto é contexto para o agente, não notícia para você.
function vaiPraTela(e, r) {
  if (r?.violacoes.length) return `doc-set com ${r.violacoes.length} violação(ões) — /docs:auditar`;
  if ((e.marcador?.commits_desde ?? 0) > LIMITE_COMMITS) {
    return `doc-set ${e.marcador.commits_desde} commits atrás — /docs:rodada`;
  }
  return null;
}

try {
  const mod = await carregar();
  if (!mod) process.exit(0); // docscheck não instalado: silêncio

  const dir = process.cwd();
  const e = await mod.estado(dir);
  if (!e) process.exit(0); // não é um doc-set: silêncio

  let r = null;
  try {
    r = await mod.verificar(dir);
  } catch {
    /* config quebrada não pode travar a sessão */
  }

  const resumo = resumir(e, r);
  const saida = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        `Documentação-de-agente deste repositório (gramática ${e.gramatica}, ` +
        `arquivos: ${e.arquivos.join(", ")}).` +
        // Sem resumo (doc-set mínimo, ou checagem que não rodou) a frase
        // termina aqui — em vez de virar ". ." e parecer saída truncada.
        (resumo ? ` ${resumo}.` : "") +
        ` Comandos: /docs:tarefa <id> para o briefing, /docs:decidir ao decidir, ` +
        `/docs:auditar para o relatório de drift, /docs:rodada ao fechar marco.`,
    },
  };
  const aviso = vaiPraTela(e, r);
  if (aviso) saida.systemMessage = aviso;

  console.log(JSON.stringify(saida));
} catch {
  process.exit(0); // um hook nunca é motivo para a sessão não abrir
}
