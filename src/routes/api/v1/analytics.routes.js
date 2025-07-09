const express = require('express');
const router = express.Router();
const AnalyticsService = require('../../../services/AnalyticsService');
const { authenticateJWT } = require('../../../middlewares/auth.handler');
const { requireRole } = require('../../../middlewares/roles.handler');
const { successResponse, errorResponse } = require('../../../utils/responseUtils');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics y estadísticas de la plataforma
 */

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Obtener dashboard completo de analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard de analytics obtenido exitosamente
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 */
router.get('/dashboard',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const dashboard = await AnalyticsService.getAnalyticsDashboard();
      successResponse(res, dashboard, 'Dashboard de analytics obtenido exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/platform-stats:
 *   get:
 *     summary: Obtener estadísticas generales de la plataforma
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/platform-stats',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const stats = await AnalyticsService.getPlatformStats();
      successResponse(res, stats, 'Estadísticas de la plataforma obtenidas exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/user-growth:
 *   get:
 *     summary: Obtener estadísticas de crecimiento de usuarios
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1month, 3months, 6months, 1year]
 *           default: 6months
 *         description: Período de tiempo para las estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas de crecimiento obtenidas exitosamente
 */
router.get('/user-growth',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const { period = '6months' } = req.query;
      const stats = await AnalyticsService.getUserGrowthStats(period);
      successResponse(res, stats, 'Estadísticas de crecimiento obtenidas exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/projects-by-category:
 *   get:
 *     summary: Obtener estadísticas de proyectos por categoría
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas por categoría obtenidas exitosamente
 */
router.get('/projects-by-category',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const stats = await AnalyticsService.getProjectStatsByCategory();
      successResponse(res, stats, 'Estadísticas por categoría obtenidas exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/revenue:
 *   get:
 *     summary: Obtener estadísticas de ingresos
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1month, 3months, 6months, 1year]
 *           default: 6months
 *         description: Período de tiempo para las estadísticas
 *     responses:
 *       200:
 *         description: Estadísticas de ingresos obtenidas exitosamente
 */
router.get('/revenue',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const { period = '6months' } = req.query;
      const stats = await AnalyticsService.getRevenueStats(period);
      successResponse(res, stats, 'Estadísticas de ingresos obtenidas exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/top-professionals:
 *   get:
 *     summary: Obtener top profesionales por ingresos
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Número de profesionales a mostrar
 *     responses:
 *       200:
 *         description: Top profesionales obtenidos exitosamente
 */
router.get('/top-professionals',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const topProfessionals = await AnalyticsService.getTopProfessionals(limit);
      successResponse(res, topProfessionals, 'Top profesionales obtenidos exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/top-clients:
 *   get:
 *     summary: Obtener top clientes por gasto
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Número de clientes a mostrar
 *     responses:
 *       200:
 *         description: Top clientes obtenidos exitosamente
 */
router.get('/top-clients',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const topClients = await AnalyticsService.getTopClients(limit);
      successResponse(res, topClients, 'Top clientes obtenidos exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/applications:
 *   get:
 *     summary: Obtener estadísticas de aplicaciones a proyectos
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de aplicaciones obtenidas exitosamente
 */
router.get('/applications',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const stats = await AnalyticsService.getApplicationStats();
      successResponse(res, stats, 'Estadísticas de aplicaciones obtenidas exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/analytics/reviews:
 *   get:
 *     summary: Obtener estadísticas de reviews
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de reviews obtenidas exitosamente
 */
router.get('/reviews',
  authenticateJWT,
  requireRole(['admin', 'gerencia']),
  async (req, res) => {
    try {
      const stats = await AnalyticsService.getReviewStats();
      successResponse(res, stats, 'Estadísticas de reviews obtenidas exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 500);
    }
  }
);

module.exports = router;
