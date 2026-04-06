#!/bin/bash
# Verificar configuración de GitHub

echo "🔍 Verificando configuración de GitHub..."
echo ""

# Verificar git
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado"
    exit 1
fi
echo "✅ Git instalado: $(git --version)"

# Verificar GitHub CLI
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI instalado: $(gh --version | head -1)"
    
    # Verificar autenticación
    if gh auth status &> /dev/null; then
        echo "✅ Autenticado en GitHub CLI"
        gh auth status
    else
        echo "⚠️  No autenticado en GitHub CLI"
        echo "   Ejecuta: gh auth login"
    fi
else
    echo "⚠️  GitHub CLI no instalado"
    echo "   Instala con: sudo apt install gh"
fi

echo ""

# Verificar configuración de git
echo "📋 Configuración de git:"
if git config user.name &> /dev/null; then
    echo "   Nombre: $(git config user.name)"
else
    echo "   Nombre: No configurado"
fi

if git config user.email &> /dev/null; then
    echo "   Email: $(git config user.email)"
else
    echo "   Email: No configurado"
fi

echo ""

# Verificar repositorio
if [ -d ".git" ]; then
    echo "✅ Repositorio git encontrado"
    
    # Verificar remote
    if git remote get-url origin &> /dev/null; then
        echo "✅ Remote configurado: $(git remote get-url origin)"
    else
        echo "⚠️  No hay remote configurado"
    fi
    
    # Verificar commits
    COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    echo "   Commits: $COMMIT_COUNT"
    
    # Verificar estado
    if git status --porcelain | grep -q .; then
        echo "⚠️  Hay cambios sin commit"
    else
        echo "✅ Todos los cambios están en commits"
    fi
else
    echo "❌ No es un repositorio git"
fi

echo ""
echo "📁 Archivos del proyecto:"
TOTAL_FILES=$(find . -type f -not -path "./.git/*" | wc -l)
echo "   Total de archivos: $TOTAL_FILES"

# Verificar archivos clave
if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
else
    echo "❌ package.json no encontrado"
fi

if [ -f "README.md" ]; then
    echo "✅ README.md encontrado"
else
    echo "❌ README.md no encontrado"
fi

if [ -f "prisma/schema.prisma" ]; then
    echo "✅ schema.prisma encontrado"
else
    echo "❌ schema.prisma no encontrado"
fi

echo ""
echo "🚀 Estado: Listo para subir a GitHub"
echo ""
echo "Opciones:"
echo "1. Si tienes credenciales, ejecuta: ./subir_a_github.sh <usuario> <token>"
echo "2. Si prefieres hacerlo manualmente, sigue las instrucciones en SUBIR_A_GITHUB.md"
echo "3. Para más información, lee CREDENCIALES_NECESARIAS.md"