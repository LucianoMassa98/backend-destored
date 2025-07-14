const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const morgan = require('morgan');
require('dotenv').config();

// Importar configuraciones
const { sequelize } = require('./db/config/database');
const passportConfig = require('./config/passport');
const logger = require('./utils/logger');

// Importar middlewares
const errorHandler = require('./middlewares/error.handler');
const corsHandler = require('./middlewares/cors.handler');
const railwayCorsHandler = require('./middlewares/railway-cors.handler');

// Importar rutas
const authRoutes = require('./routes/api/v1/auth.routes');
const userRoutes = require('./routes/api/v1/users.routes');
const professionalRoutes = require('./routes/api/v1/professionals.routes');
const clientRoutes = require('./routes/api/v1/clients.routes');
const projectRoutes = require('./routes/api/v1/projects.routes');
const applicationRoutes = require('./routes/api/v1/applications.routes');
const fileRoutes = require('./routes/api/v1/files.routes');
const notificationRoutes = require('./routes/api/v1/notifications.routes');
const analyticsRoutes = require('./routes/api/v1/analytics.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar trust proxy para Railway y otros servicios de hosting
// En lugar de 'true', configuramos específicamente para Railway
app.set('trust proxy', 1); // Solo confiar en el primer proxy (Railway)

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Destored API',
      version: '1.0.0',
      description: 'API para la plataforma Destored - Conectando profesionales tecnológicos con clientes',
      contact: {
        name: 'Destored Team',
        email: 'info@destored.org'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desarrollo'
      },
      {
        url: `https://api-destored.up.railway.app`,
        description: 'Servidor de producción',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'https',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/**/*.js', './src/schemas/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Rate limiting con configuración segura para Railway
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Configuración específica para obtener la IP real cuando se usa proxy
  keyGenerator: (req) => {
    // En Railway, la IP real viene en x-forwarded-for
    const forwardedFor = req.get('x-forwarded-for');
    if (forwardedFor) {
      // Tomar la primera IP de la lista (la IP real del cliente)
      return forwardedFor.split(',')[0].trim();
    }
    // Fallback a la IP de conexión
    return req.ip || req.connection.remoteAddress;
  },
  // Validar que tenemos una fuente de IP confiable
  validate: {
    trustProxy: false, // Deshabilitamos la validación automática ya que usamos keyGenerator personalizado
  }
});

// Configuración de Morgan para logging de peticiones HTTP
const morganFormat = process.env.NODE_ENV === 'production' 
  ? 'combined' 
  : ':method :url :status :res[content-length] - :response-time ms';

const morganOptions = {
  stream: {
    write: (message) => {
      // Remover el salto de línea que Morgan agrega automáticamente
      const cleanMessage = message.trim();
      logger.info(cleanMessage);
    }
  },
  skip: (req, res) => {
    // Omitir logging para rutas de health check en producción
    return process.env.NODE_ENV === 'production' && req.url === '/health';
  }
};

// También agregar Morgan directamente a la consola en desarrollo
const morganConsole = process.env.NODE_ENV !== 'production' 
  ? morgan(':method :url :status :res[content-length] - :response-time ms', {
      skip: (req, res) => req.url === '/health'
    })
  : null;

// Middlewares globales - CORS debe ir primero
// En Railway, usar middleware específico para CORS más permisivo
if (process.env.NODE_ENV === 'production') {
  app.use(railwayCorsHandler);
}
app.use(corsHandler);

// Middleware para manejar preflight requests explícitamente
app.options('*', corsHandler);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Deshabilitamos CSP para evitar problemas con CORS
}));
// Morgan para logging de peticiones - primero a consola en desarrollo
if (morganConsole) {
  app.use(morganConsole);
}
// Morgan para logging a archivos
app.use(morgan(morganFormat, morganOptions));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar Passport
passportConfig(passport);
app.use(passport.initialize());

// Documentación API
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rutas API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/professionals', professionalRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Destored API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Ruta para probar CORS
app.get('/api/v1/cors-test', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CORS funcionando correctamente',
    origin: req.get('Origin') || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para iniciar el servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida correctamente');

    // Sincronizar modelos (en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Modelos sincronizados con la base de datos');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor Destored ejecutándose en puerto ${PORT}`);
      logger.info(`📚 Documentación disponible en: http://localhost:${PORT}/api/docs`);
      logger.info(`🏥 Health check disponible en: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

// Iniciar el servidor
if (require.main === module) {
  startServer();
}

module.exports = app;
