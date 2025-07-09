const ResponseUtils = require('../utils/responseUtils');

/**
 * Middleware para verificar roles específicos
 * @param {Array} allowedRoles - Array de roles permitidos
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseUtils.unauthorized(res, 'Autenticación requerida');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ResponseUtils.forbidden(res, 'No tienes permisos para realizar esta acción');
    }

    next();
  };
};

/**
 * Middleware para verificar si es administrador
 */
const requireAdmin = requireRole(['admin', 'super_admin']);

/**
 * Middleware para verificar si es gerencia
 */
const requireGerencia = requireRole(['admin', 'super_admin', 'gerencia']);

/**
 * Middleware para verificar si es profesional
 */
const requireProfessional = requireRole(['professional']);

/**
 * Middleware para verificar si es cliente
 */
const requireClient = requireRole(['client']);

/**
 * Middleware para verificar si es profesional o cliente
 */
const requireUserRole = requireRole(['professional', 'client']);

/**
 * Middleware para verificar si el usuario puede acceder a sus propios recursos
 * @param {string} paramName - Nombre del parámetro que contiene el ID del usuario
 */
const requireOwnershipOrAdmin = (paramName = 'userId') => {
  return (req, res, next) => {
    const requestedUserId = req.params[paramName];
    
    // Los admins pueden acceder a cualquier recurso
    if (['admin', 'super_admin', 'gerencia'].includes(req.user.role)) {
      return next();
    }

    // Los usuarios solo pueden acceder a sus propios recursos
    if (req.user.id.toString() !== requestedUserId.toString()) {
      return ResponseUtils.forbidden(res, 'Solo puedes acceder a tus propios recursos');
    }

    next();
  };
};

/**
 * Middleware para verificar si el usuario puede modificar un proyecto
 */
const requireProjectOwnership = () => {
  return async (req, res, next) => {
    try {
      const { Project } = require('../db/models');
      const projectId = req.params.projectId || req.params.id;
      
      const project = await Project.findByPk(projectId);
      
      if (!project) {
        return ResponseUtils.notFound(res, 'Proyecto no encontrado');
      }

      // Los admins pueden modificar cualquier proyecto
      if (['admin', 'super_admin', 'gerencia'].includes(req.user.role)) {
        req.project = project;
        return next();
      }

      // El propietario del proyecto puede modificarlo
      if (project.client_id === req.user.id) {
        req.project = project;
        return next();
      }

      return ResponseUtils.forbidden(res, 'No tienes permisos para modificar este proyecto');
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar múltiples condiciones de roles
 * @param {Object} conditions - Objeto con condiciones
 */
const requireConditions = (conditions) => {
  return (req, res, next) => {
    const { roles, verified, active, ownership } = conditions;

    // Verificar roles
    if (roles && !roles.includes(req.user.role)) {
      return ResponseUtils.forbidden(res, 'No tienes permisos para realizar esta acción');
    }

    // Verificar si debe estar verificado
    if (verified && !req.user.is_verified) {
      return ResponseUtils.forbidden(res, 'Cuenta no verificada');
    }

    // Verificar si debe estar activo
    if (active && !req.user.is_active) {
      return ResponseUtils.forbidden(res, 'Cuenta desactivada');
    }

    // Verificar propiedad del recurso
    if (ownership && ownership.param) {
      const resourceUserId = req.params[ownership.param];
      if (req.user.id.toString() !== resourceUserId.toString() && 
          !['admin', 'super_admin'].includes(req.user.role)) {
        return ResponseUtils.forbidden(res, 'Solo puedes acceder a tus propios recursos');
      }
    }

    next();
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireGerencia,
  requireProfessional,
  requireClient,
  requireUserRole,
  requireOwnershipOrAdmin,
  requireProjectOwnership,
  requireConditions
};
