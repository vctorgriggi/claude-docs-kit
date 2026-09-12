#!/usr/bin/env bash
# Uma fonte no checkout; links para os dois agentes e para o CLI.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")" && pwd -P)"
DESTINO_HOME="${HOME}"
CHECAR=false
while [ "$#" -gt 0 ]; do
  case "$1" in
    --check) CHECAR=true; shift ;;
    --home)
      if [ "$#" -lt 2 ] || [ -z "$2" ]; then
        echo 'Uso: ./install.sh [--check] [--home <diretório>]' >&2; exit 2
      fi
      DESTINO_HOME="$2"; shift 2 ;;
    *) echo 'Uso: ./install.sh [--check] [--home <diretório>]' >&2; exit 2 ;;
  esac
done
case "$DESTINO_HOME" in
  /*) ;;
  *) echo 'erro: --home deve ser um caminho absoluto' >&2; exit 2 ;;
esac

command -v node >/dev/null || { echo 'erro: Node ≥ 20 é necessário' >&2; exit 2; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) { console.error("erro: Node ≥ 20 é necessário"); process.exit(2); }'

if [ "$CHECAR" = true ]; then
  exec node "$RAIZ/scripts/doctor.mjs" --home "$DESTINO_HOME"
fi

alvos=(
  "$DESTINO_HOME/.agents/skills/docs"
  "$DESTINO_HOME/.claude/skills/docs"
  "$DESTINO_HOME/.local/bin/docscheck"
)
origens=("$RAIZ" "$RAIZ" "$RAIZ/bin/docscheck.mjs")

# Confira todos os conflitos antes de criar qualquer link. Um diretório de
# outra skill ou um executável existente não deve ser substituído.
for alvo in "${alvos[@]}"; do
  if [ -e "$alvo" ] && [ ! -L "$alvo" ]; then
    echo "erro: $alvo já existe e não é symlink; mova-o antes de instalar" >&2
    exit 1
  fi
done
for i in 0 1 2; do
  alvo="${alvos[$i]}"
  origem="${origens[$i]}"
  if [ -L "$alvo" ] && [ "$(readlink "$alvo")" = "$origem" ]; then
    echo "sem mudança: $alvo"
    continue
  fi
  mkdir -p "$(dirname "$alvo")"
  # Remover apenas o link permite atualizar depois de mover o checkout.
  if [ -L "$alvo" ]; then rm "$alvo"; fi
  ln -s "$origem" "$alvo"
  echo "instalado: $alvo -> $origem"
done

echo 'Pronto. Codex: $docs fundar · Claude Code: /docs fundar'
echo 'Para usar docscheck diretamente, inclua ~/.local/bin no PATH.'
echo 'Abra uma nova sessão para descobrir a skill. Se mover o checkout, rode install.sh novamente.'
