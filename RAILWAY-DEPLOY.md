# 🚀 Deployment Railway - Destored Backend

## 🔧 Solución de problemas de CORS

### Problema identificado
El error de CORS en Railway se debe a una configuración restrictiva que no permite requests desde herramientas como Swagger UI, Postman o curl.

### ✅ Cambios realizados

1. **Configuración de CORS mejorada** (`src/middlewares/cors.handler.js`):
   - Permitir requests sin origin (Postman, curl, mobile apps)
   - Configuración específica para desarrollo y producción
   - Soporte para herramientas de documentación (Swagger UI)

2. **Middleware específico para Railway** (`src/middlewares/railway-cors.handler.js`):
   - Headers CORS más permisivos en producción
   - Manejo explícito de preflight requests
   - Configuración optimizada para Railway

3. **Configuración de Helmet actualizada**:
   - Cross-Origin Resource Policy configurado como "cross-origin"
   - Content Security Policy deshabilitado para evitar conflictos

4. **Orden de middlewares optimizado**:
   - CORS se aplica antes que cualquier otro middleware
   - Manejo explícito de OPTIONS requests

### 🧪 Testing

Puedes probar la configuración CORS con:

```bash
# Test local
npm run test:cors

# Test en Railway
API_URL=https://api-destored.up.railway.app npm run test:cors
```

### 🔍 Endpoints de verificación

- **Health check**: `GET /health`
- **CORS test**: `GET /api/v1/cors-test`
- **Documentación**: `GET /api/docs`

### 📋 Variables de entorno requeridas en Railway

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your_secure_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret
FRONTEND_URL=https://your-frontend.com
ADMIN_PANEL_URL=https://your-admin.com
```

### 🔧 Comandos útiles

```bash
# Verificar deployment
npm run deploy:check

# Test CORS
npm run test:cors

# Logs en Railway
railway logs --follow
```

### 🐛 Debugging CORS

Si sigues teniendo problemas:

1. Verifica que la variable `NODE_ENV=production` esté configurada en Railway
2. Revisa los logs de Railway: `railway logs`
3. Prueba el endpoint de CORS test: `https://api-destored.up.railway.app/api/v1/cors-test`
4. Usa el health check: `https://api-destored.up.railway.app/health`

### 📞 Test con curl

```bash
# Test basic CORS
curl -X 'GET' \
  'https://api-destored.up.railway.app/api/v1/cors-test' \
  -H 'accept: */*'

# Test login (debería funcionar ahora)
curl -X 'POST' \
  'https://api-destored.up.railway.app/api/v1/auth/login' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "lucianomassa@destored.org",
    "password": "Septus2025.",
    "rememberMe": true
  }'
```
