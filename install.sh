#!/usr/bin/env bash
# Instala os comandos do claude-docs-kit em ~/.claude/commands. Rode de dentro do repo: ./install.sh
set -euo pipefail

DEST="${HOME}/.claude/commands"
SRC="$(cd "$(dirname "$0")" && pwd)/commands"

mkdir -p "$DEST"
for f in "$SRC"/*.md; do
  cp "$f" "$DEST/"
  echo "instalado: /$(basename "${f%.md}")"
done

echo "Pronto. Os comandos aparecem no autocomplete do Claude Code ao digitar /."
