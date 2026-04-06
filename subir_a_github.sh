#!/bin/bash
# Script para subir Boogie a GitHub
# Uso: ./subir_a_github.sh <usuario_github> <token_personal>

set -e

if [ $# -ne 2 ]; then
    echo "Uso: $0 <usuario_github> <token_personal>"
    echo "Ejemplo: $0 mi_usuario ghp_1234567890abcdef"
    exit 1
fi

USUARIO=$1
TOKEN=$2
REPO_URL="https://${USUARIO}:${TOKEN}@github.com/${USUARIO}/boogie.git"

echo "🚀 Subiendo Boogie a GitHub..."
echo "Usuario: $USUARIO"
echo "Repositorio: https://github.com/${USUARIO}/boogie"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde el directorio del proyecto."
    exit 1
fi

# Verificar que git está configurado
if ! git config user.name > /dev/null 2>&1; then
    echo "⚠️  Configurando git con información temporal..."
    git config user.name "SWM Films"
    git config user.email "swmfi@swm.local"
fi

# Verificar si ya hay un remote
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Ya existe un remote 'origin'. Actualizando URL..."
    git remote set-url origin "$REPO_URL"
else
    echo "📡 Agregando remote origin..."
    git remote add origin "$REPO_URL"
fi

# Verificar que hay commits
if ! git log --oneline > /dev/null 2>&1; then
    echo "❌ Error: No hay commits en el repositorio."
    exit 1
fi

# Subir a GitHub
echo "📤 Subiendo código a GitHub..."
git push -u origin master

echo ""
echo "✅ ¡Proyecto subido exitosamente a GitHub!"
echo "🌐 URL: https://github.com/${USUARIO}/boogie"
echo ""
echo "📋 Próximos pasos:"
echo "1. Actualizar tu información de git:"
echo "   git config user.name 'Tu Nombre'"
echo "   git config user.email 'tu@email.com'"
echo ""
echo "2. Considera hacer el repositorio privado si es necesario"
echo ""
echo "3. Configura las variables de entorno en GitHub:"
echo "   - Ve a Settings > Secrets and variables > Actions"
echo "   - Agrega: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc."