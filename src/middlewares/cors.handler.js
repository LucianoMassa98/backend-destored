const cors = require('cors');

const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://api-destored.up.railway.app',
      process.env.FRONTEND_URL,
      process.env.ADMIN_PANEL_URL,
      // Permitir Swagger UI y herramientas de desarrollo
      'https://petstore.swagger.io',
      'http://petstore.swagger.io',
    ].filter(Boolean);

    // En desarrollo, permitir cualquier origen localhost
    if (process.env.NODE_ENV === 'development') {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // Permitir requests sin origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // En producción, permitir herramientas de testing y documentación
    if (process.env.NODE_ENV === 'production') {
      // Permitir Swagger UI, Postman, y herramientas similares
      if (origin.includes('swagger') || origin.includes('postman') || 
          origin.includes('railway.app') || origin.includes('destored')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // En lugar de rechazar completamente, log el origen y permitir en desarrollo
      console.log(`CORS: Origen no permitido: ${origin}`);
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'User-Agent',
    'Referer'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Total-Pages'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
