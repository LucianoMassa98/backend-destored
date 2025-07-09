const express = require('express');
const passport = require('passport');
const router = express.Router();

// Importar servicios y middlewares
const AuthService = require('../../../services/AuthService');
const ResponseUtils = require('../../../utils/responseUtils');
const { validateSchema } = require('../../../middlewares/validator.handler');
const { authenticateJWT } = require('../../../middlewares/auth.handler');

// Importar esquemas de validación
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  changePasswordSchema,
  refreshTokenSchema
} = require('../../../schemas/auth.schema');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Endpoints de autenticación y gestión de usuarios
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *               - firstName
 *               - lastName
 *               - role
 *               - acceptTerms
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [client, professional]
 *               phone:
 *                 type: string
 *               acceptTerms:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: El usuario ya existe
 */
router.post('/register', validateSchema(registerSchema), async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    ResponseUtils.success(res, result.user, result.message, 201);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 *       423:
 *         description: Cuenta bloqueada
 */
router.post('/login', validateSchema(loginSchema), async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;
    const result = await AuthService.login(email, password, rememberMe);
    ResponseUtils.success(res, result, 'Login exitoso');
  } catch (error) {
    if (error.message.includes('bloqueada')) {
      return ResponseUtils.error(res, error.message, 423);
    }
    if (error.message.includes('Credenciales') || error.message.includes('desactivada')) {
      return ResponseUtils.unauthorized(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refrescar token de acceso
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       401:
 *         description: Refresh token inválido
 */
router.post('/refresh', validateSchema(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    ResponseUtils.success(res, result, 'Token refrescado exitosamente');
  } catch (error) {
    ResponseUtils.unauthorized(res, error.message);
  }
});

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Verificar email con token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verificado exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/verify-email', validateSchema(verifyEmailSchema), async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await AuthService.verifyEmail(token);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    ResponseUtils.error(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     summary: Reenviar email de verificación
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email reenviado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/resend-verification', validateSchema(resendVerificationSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await AuthService.resendVerification(email);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    ResponseUtils.error(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Solicitar reset de contraseña
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Instrucciones enviadas por email
 */
router.post('/forgot-password', validateSchema(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Resetear contraseña con token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Token inválido o expirado
 */
router.post('/reset-password', validateSchema(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await AuthService.resetPassword(token, password);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    ResponseUtils.error(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Cambiar contraseña (usuario autenticado)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *       400:
 *         description: Contraseña actual incorrecta
 *       401:
 *         description: Token requerido
 */
router.post('/change-password', authenticateJWT, validateSchema(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    if (error.message.includes('incorrecta')) {
      return ResponseUtils.error(res, error.message, 400);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       401:
 *         description: Token requerido
 */
router.post('/logout', authenticateJWT, async (req, res, next) => {
  try {
    const result = await AuthService.logout(req.user.id);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: Token requerido
 */
router.get('/me', authenticateJWT, async (req, res, next) => {
  try {
    ResponseUtils.success(res, req.user.getPublicData(), 'Datos del usuario obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
});

// Rutas OAuth

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Iniciar autenticación con Google
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirección a Google OAuth
 */
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Callback de autenticación Google
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirección después de autenticación
 */
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res, next) => {
    try {
      // Generar tokens para el usuario OAuth
      const tokenPayload = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      };

      const AuthUtils = require('../../utils/authUtils');
      const accessToken = AuthUtils.generateToken(tokenPayload);
      const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

      // Guardar refresh token
      await req.user.update({
        metadata: {
          ...req.user.metadata,
          refreshToken: refreshToken,
          refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Redireccionar al frontend con los tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/auth/linkedin:
 *   get:
 *     summary: Iniciar autenticación con LinkedIn
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirección a LinkedIn OAuth
 */
router.get('/linkedin', passport.authenticate('linkedin'));

/**
 * @swagger
 * /api/v1/auth/linkedin/callback:
 *   get:
 *     summary: Callback de autenticación LinkedIn
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirección después de autenticación
 */
router.get('/linkedin/callback',
  passport.authenticate('linkedin', { session: false }),
  async (req, res, next) => {
    try {
      // Similar al callback de Google
      const tokenPayload = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      };

      const AuthUtils = require('../../utils/authUtils');
      const accessToken = AuthUtils.generateToken(tokenPayload);
      const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

      await req.user.update({
        metadata: {
          ...req.user.metadata,
          refreshToken: refreshToken,
          refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
