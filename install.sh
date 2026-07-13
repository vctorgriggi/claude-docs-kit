#!/usr/bin/env bash
# Instala os comandos do claude-docs-kit em ~/.claude/commands. Rode de dentro do repo: ./install.sh
set -euo pipefail

DEST="${HOME}/.claude/commands"
SRC="$(cd "$(dirname "$0")" && pwd)/commands"

mkdir -p "$DEST"
for f in "$SRC"/*.md; do
  dest="$DEST/$(basename "$f")"
  if [ -f "$dest" ] && cmp -s "$f" "$dest"; then
    echo "sem mudança: /$(basename "${f%.md}")"
  elif [ -f "$dest" ]; then
    cp "$f" "$dest"
    echo "atualizado: /$(basename "${f%.md}")"
  else
    cp "$f" "$dest"
    echo "instalado: /$(basename "${f%.md}")"
  fi
done

echo "Pronto. Os comandos aparecem no autocomplete do Claude Code ao digitar /."
