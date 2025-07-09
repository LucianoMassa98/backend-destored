const ResponseUtils = require('../utils/responseUtils');

/**
 * Middleware para validar datos usando esquemas Joi
 * @param {Object} schema - Esquema de validación Joi
 * @param {string} source - Fuente de datos ('body', 'params', 'query')
 */
const validateSchema = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
        value: detail.context?.value
      }));
      
      return ResponseUtils.validationError(res, errors);
    }

    // Reemplazar los datos originales con los datos validados y sanitizados
    req[source] = value;
    next();
  };
};

/**
 * Middleware para validar múltiples fuentes de datos
 * @param {Object} schemas - Objeto con esquemas para cada fuente
 */
const validateMultiple = (schemas) => {
  return (req, res, next) => {
    const errors = [];

    // Validar cada fuente especificada
    for (const [source, schema] of Object.entries(schemas)) {
      const data = req[source];
      
      const { error, value } = schema.validate(data, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const sourceErrors = error.details.map(detail => ({
          source,
          field: detail.path.join('.'),
          message: detail.message.replace(/"/g, ''),
          value: detail.context?.value
        }));
        
        errors.push(...sourceErrors);
      } else {
        // Actualizar con datos validados
        req[source] = value;
      }
    }

    if (errors.length > 0) {
      return ResponseUtils.validationError(res, errors);
    }

    next();
  };
};

/**
 * Middleware para validar parámetros de paginación
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const maxLimit = 100;

  // Validar que los valores sean positivos
  if (page < 1) {
    return ResponseUtils.error(res, 'El número de página debe ser mayor a 0', 400);
  }

  if (limit < 1) {
    return ResponseUtils.error(res, 'El límite debe ser mayor a 0', 400);
  }

  if (limit > maxLimit) {
    return ResponseUtils.error(res, `El límite máximo es ${maxLimit}`, 400);
  }

  // Agregar valores validados al request
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };

  next();
};

/**
 * Middleware para validar filtros de búsqueda
 */
const validateFilters = (allowedFilters = []) => {
  return (req, res, next) => {
    const filters = {};
    
    // Solo permitir filtros específicos
    for (const filter of allowedFilters) {
      if (req.query[filter] !== undefined) {
        filters[filter] = req.query[filter];
      }
    }

    req.filters = filters;
    next();
  };
};

/**
 * Middleware para validar ordenamiento
 */
const validateSorting = (allowedFields = []) => {
  return (req, res, next) => {
    const { sortBy, sortOrder } = req.query;
    
    const sorting = {
      field: 'created_at',
      order: 'DESC'
    };

    if (sortBy) {
      if (!allowedFields.includes(sortBy)) {
        return ResponseUtils.error(res, 
          `Campo de ordenamiento no válido. Campos permitidos: ${allowedFields.join(', ')}`, 
          400
        );
      }
      sorting.field = sortBy;
    }

    if (sortOrder) {
      const validOrders = ['ASC', 'DESC', 'asc', 'desc'];
      if (!validOrders.includes(sortOrder)) {
        return ResponseUtils.error(res, 
          'Orden no válido. Valores permitidos: ASC, DESC', 
          400
        );
      }
      sorting.order = sortOrder.toUpperCase();
    }

    req.sorting = sorting;
    next();
  };
};

module.exports = {
  validateSchema,
  validateMultiple,
  validatePagination,
  validateFilters,
  validateSorting
};
