const passport = require('passport');
const ResponseUtils = require('../utils/responseUtils');

/**
 * Middleware de autenticación JWT
 */
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return ResponseUtils.unauthorized(res, info?.message || 'Token requerido');
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware de autenticación opcional (no falla si no hay token)
 */
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    // Si hay usuario, lo agregamos al request
    if (user) {
      req.user = user;
    }

    next();
  })(req, res, next);
};

/**
 * Middleware para verificar si el usuario está verificado
 */
const requireVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    return ResponseUtils.forbidden(res, 'Cuenta no verificada. Revisa tu email.');
  }
  next();
};

/**
 * Middleware para verificar si el usuario está activo
 */
const requireActive = (req, res, next) => {
  if (!req.user.is_active) {
    return ResponseUtils.forbidden(res, 'Cuenta desactivada. Contacta al administrador.');
  }
  next();
};

module.exports = {
  authenticateJWT,
  optionalAuth,
  requireVerified,
  requireActive
};
