#!/usr/bin/env bash
# Smoke de regressão da gramática — ferramenta do mantenedor; não roda no CI.
#
# Executa casos baratos de examples/regressao-da-gramatica.md em headless
# (`claude -p`) contra fixtures e confere os sinais travados por grep. Custa
# tokens da sua conta e os greps são heurísticos: uma falha pede inspeção do
# log impresso, não prova deriva sozinha; uma passagem não substitui a tabela
# completa da regressão.
#
# Uso: ./scripts/regressao-smoke.sh [a|b]   (padrão: ambos)
#   a — regressão #1: /docs:fundar em diretório vazio → entrevista; nada gerado
#   b — regressões #2/#6/#13: /docs:fundar existente em notas-api → relatório em
#       três listas; 3 rotas para a doc existente; git indisponível anunciado
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
CASO="${1:-todos}"
FALHAS=0

command -v "$CLAUDE_BIN" >/dev/null || {
  echo "erro: CLI '$CLAUDE_BIN' não encontrada (defina CLAUDE_BIN para apontar outra)" >&2
  exit 2
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

preparar() { # preparar <dir> — instala comandos, gramática e templates no escopo do projeto
  mkdir -p "$1/.claude/commands/docs"
  cp "$RAIZ"/commands/docs/*.md "$1/.claude/commands/docs/"
  # Os comandos leem a gramática e os templates em runtime, de ~/.claude/docs-kit.
  # O smoke depende da instalação real: sem ela, todo comando para no passo 0 e
  # o teste mediria a ausência do arquivo, não a gramática.
  if [ ! -f "${HOME}/.claude/docs-kit/GRAMATICA.md" ]; then
    echo "erro: ~/.claude/docs-kit/GRAMATICA.md ausente — rode ./install.sh antes" >&2
    exit 2
  fi
}

checar() { # checar <log> <descrição> <padrão grep -E>
  if grep -Eqi "$3" "$1"; then
    echo "  ok: $2"
  else
    echo "  FALHA: $2 (padrão: $3)"
    FALHAS=$((FALHAS + 1))
  fi
}

rodar() { # rodar <dir> <prompt> <log>
  (cd "$1" && "$CLAUDE_BIN" -p "$2" \
    --allowedTools "Read,Glob,Grep,Bash(ls:*),Bash(cat:*),Bash(head:*),Bash(wc:*),Bash(tree:*)" \
    --max-turns 12 >"$3" 2>&1) || {
    echo "  FALHA: a execução headless terminou com erro; log abaixo"
    tail -20 "$3"
    FALHAS=$((FALHAS + 1))
    return 0
  }
}

if [ "$CASO" = "a" ] || [ "$CASO" = "todos" ]; then
  echo "caso a — /docs:fundar em diretório vazio (regressão #1)"
  DIR="$TMP/vazio" && mkdir -p "$DIR" && preparar "$DIR"
  rodar "$DIR" "/docs:fundar" "$TMP/a.log"
  checar "$TMP/a.log" "abre a entrevista em blocos" "bloco"
  if ls "$DIR"/SPEC.md "$DIR"/PLAN.md "$DIR"/CLAUDE.md >/dev/null 2>&1; then
    echo "  FALHA: gerou arquivo antes do aval da Proposta"
    FALHAS=$((FALHAS + 1))
  else
    echo "  ok: nada gerado antes do aval"
  fi
fi

if [ "$CASO" = "b" ] || [ "$CASO" = "todos" ]; then
  echo "caso b — /docs:fundar existente em notas-api (regressões #2, #6, #13)"
  DIR="$TMP/notas-api" && mkdir -p "$DIR"
  cp -R "$RAIZ/examples/fixtures/notas-api/." "$DIR/" && preparar "$DIR"
  rodar "$DIR" "/docs:fundar existente" "$TMP/b.log"
  checar "$TMP/b.log" "relatório traz a lista Observado" "observado"
  checar "$TMP/b.log" "relatório traz a lista Não determinável" "não determin"
  checar "$TMP/b.log" "oferece as 3 rotas para a doc existente" "rotas|auditar"
  checar "$TMP/b.log" "anuncia o histórico git indisponível" "git indispon|sem reposit"
fi

echo
if [ "$FALHAS" -gt 0 ]; then
  echo "resumo: $FALHAS checagem(ns) falharam — inspecione os logs acima antes de concluir deriva"
  exit 1
fi
echo "resumo: sinais travados presentes nos casos rodados"
