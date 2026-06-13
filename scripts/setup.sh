#!/usr/bin/env bash
# Realtor Pro CRM — local setup.
# Installs dependencies and prepares a .env so the app runs in demo mode.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Realtor Pro CRM — setup"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "✖ pnpm no está instalado. Instálalo con: npm i -g pnpm@10"
  exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$node_major" -lt 22 ]; then
  echo "✖ Se requiere Node 22+. Versión actual: $(node -v 2>/dev/null || echo desconocida)"
  exit 1
fi

echo "▶ Instalando dependencias (pnpm install)…"
pnpm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "▶ .env creado desde .env.example (modo demo: DEMO_MODE=true)."
else
  echo "▶ .env ya existe, no se sobrescribe."
fi

echo "✔ Listo. Arranca con: pnpm dev"
