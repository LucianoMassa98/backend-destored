const logger = require('../utils/logger');
const ResponseUtils = require('../utils/responseUtils');

const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Error de validación de Joi
  if (err.isJoi) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return ResponseUtils.validationError(res, errors);
  }

  // Error de Sequelize - Validación
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message
    }));
    return ResponseUtils.validationError(res, errors);
  }

  // Error de Sequelize - Registro único
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    return ResponseUtils.error(res, `Ya existe un registro con este ${field}`, 409);
  }

  // Error de Sequelize - Clave foránea
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ResponseUtils.error(res, 'Error de integridad referencial', 400);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return ResponseUtils.unauthorized(res, 'Token inválido');
  }

  if (err.name === 'TokenExpiredError') {
    return ResponseUtils.unauthorized(res, 'Token expirado');
  }

  // Error de Multer (archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return ResponseUtils.error(res, 'El archivo es demasiado grande', 413);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return ResponseUtils.error(res, 'Tipo de archivo no permitido', 400);
  }

  // Error de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ResponseUtils.error(res, 'JSON malformado', 400);
  }

  // Error personalizado con status
  if (err.status || err.statusCode) {
    return ResponseUtils.error(res, err.message, err.status || err.statusCode);
  }

  // Error por defecto
  return ResponseUtils.error(res, 'Error interno del servidor', 500, 
    process.env.NODE_ENV === 'development' ? err.stack : null
  );
};

module.exports = errorHandler;
