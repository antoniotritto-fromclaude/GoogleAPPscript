#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#  CRM Antonio Tritto - Script di Installazione
#  Private Banking Dashboard
# ═══════════════════════════════════════════════════════════════

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🎯 CRM Antonio Tritto - Installazione                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato!"
    echo ""
    echo "Per installare Node.js:"
    echo "  - Windows: https://nodejs.org/en/download/"
    echo "  - Mac: brew install node"
    echo "  - Linux: sudo apt install nodejs npm"
    echo ""
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js versione $NODE_VERSION trovata. Richiesta v18 o superiore."
    exit 1
fi

echo "✅ Node.js $(node -v) trovato"

# Installa dipendenze
echo ""
echo "📦 Installazione dipendenze..."
npm install

# Inizializza database
echo ""
echo "🗄️  Inizializzazione database..."
npm run seed

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     ✅ Installazione completata!                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Per avviare l'applicazione:"
echo ""
echo "  npm start"
echo ""
echo "Poi apri nel browser: http://localhost:3000"
echo ""
