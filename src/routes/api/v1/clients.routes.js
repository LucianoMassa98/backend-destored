const express = require('express');
const router = express.Router();
const ClientService = require('../../../services/ClientService');
const { authenticateJWT } = require('../../../middlewares/auth.handler');
const { requireRole } = require('../../../middlewares/roles.handler');
const { validateSchema } = require('../../../middlewares/validator.handler');
const {
  updateClientProfileSchema,
  createReviewSchema,
  updateReviewSchema,
  getProjectsSchema,
  getPaymentsSchema,
  getReviewsSchema
} = require('../../../schemas/client.schema');
const { successResponse, errorResponse } = require('../../../utils/responseUtils');

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestión de clientes
 */

/**
 * @swagger
 * /api/v1/clients/profile:
 *   get:
 *     summary: Obtener perfil del cliente autenticado
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del cliente obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Perfil no encontrado
 */
router.get('/profile',
  authenticateJWT,
  requireRole(['client']),
  async (req, res) => {
    try {
      const profile = await ClientService.getProfile(req.user.id);
      successResponse(res, profile, 'Perfil obtenido exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/profile:
 *   put:
 *     summary: Actualizar perfil del cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyName:
 *                 type: string
 *                 maxLength: 100
 *               industry:
 *                 type: string
 *                 maxLength: 50
 *               companySize:
 *                 type: string
 *                 enum: [startup, pequena, mediana, grande, enterprise]
 *               website:
 *                 type: string
 *                 format: uri
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               location:
 *                 type: string
 *                 maxLength: 100
 *               timezone:
 *                 type: string
 *               preferredCommunication:
 *                 type: string
 *                 enum: [email, phone, chat, video]
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 */
router.put('/profile',
  authenticateJWT,
  requireRole(['client']),
  validateSchema(updateClientProfileSchema),
  async (req, res) => {
    try {
      const updatedProfile = await ClientService.updateProfile(req.user.id, req.body);
      successResponse(res, updatedProfile, 'Perfil actualizado exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/dashboard:
 *   get:
 *     summary: Obtener dashboard del cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard obtenido exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/dashboard',
  authenticateJWT,
  requireRole(['client']),
  async (req, res) => {
    try {
      const dashboard = await ClientService.getDashboard(req.user.id);
      successResponse(res, dashboard, 'Dashboard obtenido exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/projects:
 *   get:
 *     summary: Obtener proyectos del cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filtrar por estado del proyecto
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Elementos por página
 *     responses:
 *       200:
 *         description: Proyectos obtenidos exitosamente
 *       401:
 *         description: No autorizado
 */
router.get('/projects',
  authenticateJWT,
  requireRole(['client']),
  validateSchema(getProjectsSchema, 'query'),
  async (req, res) => {
    try {
      const { status, page, limit } = req.query;
      const result = await ClientService.getClientProjects(req.user.id, status, page, limit);
      successResponse(res, result, 'Proyectos obtenidos exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/payments:
 *   get:
 *     summary: Obtener historial de pagos del cliente
 *     tags: [Clients]
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
 *     responses:
 *       200:
 *         description: Historial de pagos obtenido exitosamente
 */
router.get('/payments',
  authenticateJWT,
  requireRole(['client']),
  validateSchema(getPaymentsSchema, 'query'),
  async (req, res) => {
    try {
      const { page, limit } = req.query;
      const result = await ClientService.getPaymentHistory(req.user.id, page, limit);
      successResponse(res, result, 'Historial de pagos obtenido exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/reviews:
 *   get:
 *     summary: Obtener reviews escritas por el cliente
 *     tags: [Clients]
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
 *     responses:
 *       200:
 *         description: Reviews obtenidas exitosamente
 */
router.get('/reviews',
  authenticateJWT,
  requireRole(['client']),
  validateSchema(getReviewsSchema, 'query'),
  async (req, res) => {
    try {
      const { page, limit } = req.query;
      const result = await ClientService.getClientReviews(req.user.id, page, limit);
      successResponse(res, result, 'Reviews obtenidas exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/reviews:
 *   post:
 *     summary: Crear review para un profesional
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - rating
 *               - comment
 *             properties:
 *               projectId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *               workQuality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               communication:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               timeliness:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               professionalism:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               wouldRecommend:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Review creada exitosamente
 *       400:
 *         description: Datos inválidos o proyecto no válido
 */
router.post('/reviews',
  authenticateJWT,
  requireRole(['client']),
  validateSchema(createReviewSchema),
  async (req, res) => {
    try {
      const { projectId, ...reviewData } = req.body;
      const review = await ClientService.createReview(req.user.id, projectId, reviewData);
      successResponse(res, review, 'Review creada exitosamente', 201);
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/reviews/{reviewId}:
 *   put:
 *     summary: Actualizar review
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               workQuality:
 *                 type: integer
 *               communication:
 *                 type: integer
 *               timeliness:
 *                 type: integer
 *               professionalism:
 *                 type: integer
 *               wouldRecommend:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Review actualizada exitosamente
 *       404:
 *         description: Review no encontrada
 */
router.put('/reviews/:reviewId',
  authenticateJWT,
  requireRole(['client']),
  validateSchema(updateReviewSchema),
  async (req, res) => {
    try {
      const review = await ClientService.updateReview(req.user.id, req.params.reviewId, req.body);
      successResponse(res, review, 'Review actualizada exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/reviews/{reviewId}:
 *   delete:
 *     summary: Eliminar review
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review eliminada exitosamente
 *       404:
 *         description: Review no encontrada
 */
router.delete('/reviews/:reviewId',
  authenticateJWT,
  requireRole(['client']),
  async (req, res) => {
    try {
      const result = await ClientService.deleteReview(req.user.id, req.params.reviewId);
      successResponse(res, result, 'Review eliminada exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/clients/favorites:
 *   get:
 *     summary: Obtener profesionales favoritos del cliente
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profesionales favoritos obtenidos exitosamente
 */
router.get('/favorites',
  authenticateJWT,
  requireRole(['client']),
  async (req, res) => {
    try {
      const favorites = await ClientService.getFavoriteProfessionals(req.user.id);
      successResponse(res, favorites, 'Profesionales favoritos obtenidos exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

module.exports = router;
