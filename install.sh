#!/usr/bin/env bash
# Instala o claude-docs-kit:
#   comandos   → ~/.claude/commands/docs/   (viram /docs:<nome> no autocomplete)
#   docscheck  → ~/.claude/bin/
#   gramática  → ~/.claude/docs-kit/GRAMATICA.md
#   templates  → ~/.claude/docs-kit/templates/
# Rode de dentro do repo: ./install.sh
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

for f in "$RAIZ"/commands/docs/*.md; do
  instalar "$f" "${HOME}/.claude/commands/docs/$(basename "$f")" \
    "/docs:$(basename "${f%.md}")"
done

instalar "$RAIZ/bin/docscheck.mjs" "${HOME}/.claude/bin/docscheck.mjs" \
  "docscheck (~/.claude/bin/docscheck.mjs)"

# A gramática e os templates são lidos em runtime pelos comandos (fonte única;
# nenhum comando os parafraseia). Ausentes, os comandos param e mandam rodar
# este script.
instalar "$RAIZ/grammar/GRAMATICA.md" "${HOME}/.claude/docs-kit/GRAMATICA.md" \
  "gramática (~/.claude/docs-kit/GRAMATICA.md)"

for f in "$RAIZ"/templates/*.md; do
  instalar "$f" "${HOME}/.claude/docs-kit/templates/$(basename "$f")" \
    "template $(basename "$f")"
done

# O hook é copiado mas não é ativado: ligar exige editar settings.json, e isso
# é decisão de quem instala. O README traz o bloco.
instalar "$RAIZ/hooks/estado-na-sessao.mjs" \
  "${HOME}/.claude/docs-kit/hooks/estado-na-sessao.mjs" \
  "hook de SessionStart (inativo até você ligar; ver README)"
chmod +x "${HOME}/.claude/docs-kit/hooks/estado-na-sessao.mjs"

# Comandos da v4 viviam soltos em ~/.claude/commands/; sem remoção, /bootstrap
# e /rodada continuam no autocomplete servindo a gramática antiga.
for antigo in bootstrap rodada; do
  alvo="${HOME}/.claude/commands/${antigo}.md"
  if [ -f "$alvo" ]; then
    echo "aviso: ${alvo} é da v4 e ainda responde por /${antigo};"
    echo "       remova com: rm ${alvo}"
  fi
done

echo "Pronto. Os comandos aparecem ao digitar /docs no Claude Code."
