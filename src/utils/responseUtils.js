class ResponseUtils {
  /**
   * Respuesta exitosa estándar
   * @param {object} res - Objeto response de Express
   * @param {any} data - Datos a enviar
   * @param {string} message - Mensaje de éxito
   * @param {number} statusCode - Código de estado HTTP
   */
  static success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de error estándar
   * @param {object} res - Objeto response de Express
   * @param {string} message - Mensaje de error
   * @param {number} statusCode - Código de estado HTTP
   * @param {any} error - Detalles del error (solo en desarrollo)
   */
  static error(res, message = 'Error interno del servidor', statusCode = 500, error = null) {
    const response = {
      status: 'error',
      message,
      timestamp: new Date().toISOString()
    };

    // Solo incluir detalles del error en desarrollo
    if (process.env.NODE_ENV === 'development' && error) {
      response.error = error;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Respuesta de validación fallida
   * @param {object} res - Objeto response de Express
   * @param {array} errors - Array de errores de validación
   */
  static validationError(res, errors) {
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de no autorizado
   * @param {object} res - Objeto response de Express
   * @param {string} message - Mensaje personalizado
   */
  static unauthorized(res, message = 'No autorizado') {
    return res.status(401).json({
      status: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de acceso prohibido
   * @param {object} res - Objeto response de Express
   * @param {string} message - Mensaje personalizado
   */
  static forbidden(res, message = 'Acceso prohibido') {
    return res.status(403).json({
      status: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de recurso no encontrado
   * @param {object} res - Objeto response de Express
   * @param {string} message - Mensaje personalizado
   */
  static notFound(res, message = 'Recurso no encontrado') {
    return res.status(404).json({
      status: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta paginada
   * @param {object} res - Objeto response de Express
   * @param {array} data - Datos paginados
   * @param {object} pagination - Información de paginación
   * @param {string} message - Mensaje de éxito
   */
  static paginated(res, data, pagination, message = 'Datos obtenidos exitosamente') {
    return res.status(200).json({
      status: 'success',
      message,
      data,
      pagination: {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        itemsPerPage: pagination.limit,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1
      },
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ResponseUtils;
