#!/bin/bash

# Script de despliegue para Railway
echo "🚀 Preparando despliegue para Railway..."

# Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Rama actual: $CURRENT_BRANCH"

# Verificar archivos importantes
echo "📋 Verificando archivos críticos..."

if [ ! -f "package.json" ]; then
    echo "❌ package.json no encontrado"
    exit 1
fi

if [ ! -f "src/index.js" ]; then
    echo "❌ src/index.js no encontrado"
    exit 1
fi

if [ ! -f "src/middlewares/cors.handler.js" ]; then
    echo "❌ CORS handler no encontrado"
    exit 1
fi

echo "✅ Archivos críticos verificados"

# Instalar dependencias para verificar
echo "📦 Verificando dependencias..."
npm install

# Ejecutar tests si existen
if [ -f "jest.config.js" ]; then
    echo "🧪 Ejecutando tests..."
    npm test
fi

# Verificar que el servidor se inicie correctamente
echo "🔍 Verificando inicio del servidor..."
timeout 10s npm start &
SERVER_PID=$!
sleep 5

# Verificar si el proceso sigue ejecutándose
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Servidor inicia correctamente"
    kill $SERVER_PID
else
    echo "❌ Error al iniciar el servidor"
    exit 1
fi

echo "🎉 Verificaciones completadas. Listo para desplegar a Railway"
echo ""
echo "📝 Recordatorios para Railway:"
echo "   1. Configurar las variables de entorno desde .env.production"
echo "   2. Asegurar que DATABASE_URL esté configurada"
echo "   3. Configurar JWT_SECRET y JWT_REFRESH_SECRET"
echo "   4. Configurar las credenciales de email y servicios externos"
echo ""
echo "🔗 URL de la API en Railway: https://api-destored.up.railway.app"
echo "📚 Documentación: https://api-destored.up.railway.app/api/docs"
echo "🏥 Health check: https://api-destored.up.railway.app/health"
