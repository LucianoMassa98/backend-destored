const express = require('express');
const router = express.Router();

// Importar middlewares y servicios
const { authenticateJWT } = require('../../../middlewares/auth.handler');
const { requireOwnershipOrAdmin, requireAdmin } = require('../../../middlewares/roles.handler');
const { validateSchema, validatePagination } = require('../../../middlewares/validator.handler');
const ResponseUtils = require('../../../utils/responseUtils');

// Importar servicios
const UserService = require('../../../services/UserService');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: Token requerido
 */
router.get('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const profile = await UserService.getProfile(req.user.id);
    ResponseUtils.success(res, profile, 'Perfil obtenido exitosamente');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Token requerido
 */
router.put('/profile', authenticateJWT, async (req, res, next) => {
  try {
    const updatedProfile = await UserService.updateProfile(req.user.id, req.body);
    ResponseUtils.success(res, updatedProfile, 'Perfil actualizado exitosamente');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       403:
 *         description: Acceso prohibido
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:userId', authenticateJWT, requireOwnershipOrAdmin('userId'), async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.params.userId);
    ResponseUtils.success(res, user, 'Usuario obtenido exitosamente');
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return ResponseUtils.notFound(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Obtener lista de usuarios (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [client, professional, admin, gerencia]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Acceso prohibido (solo administradores)
 */
router.get('/', authenticateJWT, requireAdmin, validatePagination, async (req, res, next) => {
  try {
    const { page, limit, offset } = req.pagination;
    const filters = {
      role: req.query.role,
      isActive: req.query.isActive,
      isVerified: req.query.isVerified,
      search: req.query.search
    };

    const result = await UserService.getUsers(filters, { page, limit, offset });
    ResponseUtils.paginated(res, result.users, result.pagination, 'Usuarios obtenidos exitosamente');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/activate:
 *   patch:
 *     summary: Activar usuario (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario activado exitosamente
 *       403:
 *         description: Acceso prohibido
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/:userId/activate', authenticateJWT, requireAdmin, async (req, res, next) => {
  try {
    const result = await UserService.activateUser(req.params.userId);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return ResponseUtils.notFound(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/deactivate:
 *   patch:
 *     summary: Desactivar usuario (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente
 *       403:
 *         description: Acceso prohibido
 *       404:
 *         description: Usuario no encontrado
 */
router.patch('/:userId/deactivate', authenticateJWT, requireAdmin, async (req, res, next) => {
  try {
    const result = await UserService.deactivateUser(req.params.userId);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return ResponseUtils.notFound(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   delete:
 *     summary: Eliminar usuario (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
 *       403:
 *         description: Acceso prohibido
 *       404:
 *         description: Usuario no encontrado
 */
router.delete('/:userId', authenticateJWT, requireAdmin, async (req, res, next) => {
  try {
    const result = await UserService.deleteUser(req.params.userId);
    ResponseUtils.success(res, null, result.message);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return ResponseUtils.notFound(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Obtener estadísticas de usuarios (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de usuarios
 *       403:
 *         description: Acceso prohibido
 */
router.get('/stats', authenticateJWT, requireAdmin, async (req, res, next) => {
  try {
    const stats = await UserService.getUserStats();
    ResponseUtils.success(res, stats, 'Estadísticas obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
