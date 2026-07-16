#!/usr/bin/env bash
# Instala os comandos do claude-docs-kit em ~/.claude/commands e o docscheck
# em ~/.claude/bin. Rode de dentro do repo: ./install.sh
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")" && pwd)"

instalar() { # instalar <origem> <destino> <rótulo>
  local origem="$1" destino="$2" rotulo="$3"
  mkdir -p "$(dirname "$destino")"
  if [ -f "$destino" ] && cmp -s "$origem" "$destino"; then
    echo "sem mudança: $rotulo"
  elif [ -f "$destino" ]; then
    cp "$origem" "$destino"
    echo "atualizado: $rotulo"
  else
    cp "$origem" "$destino"
    echo "instalado: $rotulo"
  fi
}

for f in "$RAIZ"/commands/*.md; do
  instalar "$f" "${HOME}/.claude/commands/$(basename "$f")" "/$(basename "${f%.md}")"
done

instalar "$RAIZ/bin/docscheck.mjs" "${HOME}/.claude/bin/docscheck.mjs" \
  "docscheck (~/.claude/bin/docscheck.mjs)"

echo "Pronto. Os comandos aparecem no autocomplete do Claude Code ao digitar /."
