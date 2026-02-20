#!/bin/bash
set -euo pipefail

# Solo in ambienti remoti (Claude Code sul web)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "🔧 Installazione dipendenze CRM..."

# Usa CLAUDE_PROJECT_DIR o fallback alla directory corrente
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Installa dipendenze Node.js per crm-web-app
if [ -f "$PROJECT_DIR/crm-web-app/package.json" ]; then
  echo "📦 Installazione npm packages..."
  cd "$PROJECT_DIR/crm-web-app"
  npm install
  echo "✅ Dipendenze installate"
fi

echo "✅ Setup completato"
