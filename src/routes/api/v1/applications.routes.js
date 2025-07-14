const express = require('express');
const router = express.Router();
const ApplicationService = require('../../../services/ApplicationService');
const { authenticateJWT } = require('../../../middlewares/auth.handler');
const { validateSchema } = require('../../../middlewares/validator.handler');
const ResponseUtils = require('../../../utils/responseUtils');
const { 
  evaluateApplicationSchema, 
  approveApplicationSchema, 
  rejectApplicationSchema,
  withdrawApplicationSchema 
} = require('../../../schemas/application.schema');

/**
 * @swagger
 * components:
 *   schemas:
 *     Application:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         professional_id:
 *           type: string
 *           format: uuid
 *         project_id:
 *           type: string
 *           format: uuid
 *         cover_letter:
 *           type: string
 *         proposed_rate:
 *           type: number
 *         proposed_timeline:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [pending, under_review, accepted, rejected, withdrawn, expired]
 *         priority_score:
 *           type: number
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/applications:
 *   get:
 *     summary: Obtener aplicaciones
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under_review, accepted, rejected, withdrawn, expired]
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: professional_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: rate_min
 *         schema:
 *           type: number
 *       - in: query
 *         name: rate_max
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lista de aplicaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     applications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Application'
 *                     pagination:
 *                       type: object
 */
router.get('/', authenticateJWT, async (req, res, next) => {
  try {
    // Filtrar valores undefined y vacíos
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.project_id) filters.project_id = req.query.project_id;
    if (req.query.professional_id) filters.professional_id = req.query.professional_id;
    if (req.query.date_from) filters.date_from = req.query.date_from;
    if (req.query.date_to) filters.date_to = req.query.date_to;
    if (req.query.rate_min) filters.rate_min = req.query.rate_min;
    if (req.query.rate_max) filters.rate_max = req.query.rate_max;

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 10, 50)
    };

    const result = await ApplicationService.getApplications(
      filters, 
      pagination, 
      req.user.role, 
      req.user.id
    );

    ResponseUtils.success(res, result, 'Aplicaciones obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/applications/stats:
 *   get:
 *     summary: Obtener estadísticas de aplicaciones
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de aplicaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     by_status:
 *                       type: object
 *                     avg_response_time_hours:
 *                       type: number
 */
router.get('/stats', authenticateJWT, async (req, res, next) => {
  try {
    const stats = await ApplicationService.getApplicationStats(
      {},
      req.user.id,
      req.user.role
    );

    ResponseUtils.success(res, stats, 'Estadísticas obtenidas exitosamente');
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/applications/{applicationId}:
 *   get:
 *     summary: Obtener aplicación específica
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalles de la aplicación
 *       403:
 *         description: Sin permisos para ver esta aplicación
 *       404:
 *         description: Aplicación no encontrada
 */
router.get('/:applicationId', authenticateJWT, async (req, res, next) => {
  try {
    const application = await ApplicationService.getApplicationById(
      req.params.applicationId,
      req.user.id,
      req.user.role
    );

    ResponseUtils.success(res, application, 'Aplicación obtenida exitosamente');
  } catch (error) {
    if (error.message.includes('no encontrada')) {
      return ResponseUtils.notFound(res, error.message);
    }
    if (error.message.includes('permisos')) {
      return ResponseUtils.forbidden(res, error.message);
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/applications/{applicationId}/evaluate:
 *   put:
 *     summary: Evaluar aplicación (cambiar prioridad y agregar comentarios)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priority_score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               client_feedback:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Aplicación evaluada exitosamente
 *       403:
 *         description: Sin permisos o aplicación no puede ser evaluada
 *       404:
 *         description: Aplicación no encontrada
 */
router.put('/:applicationId/evaluate', 
  authenticateJWT, 
  validateSchema(evaluateApplicationSchema), 
  async (req, res, next) => {
    try {
      // Solo clientes pueden evaluar aplicaciones
      if (req.user.role !== 'client') {
        return ResponseUtils.forbidden(res, 'Solo los clientes pueden evaluar aplicaciones');
      }

      const application = await ApplicationService.evaluateApplication(
        req.params.applicationId,
        req.body,
        req.user.id
      );

      ResponseUtils.success(res, application, 'Aplicación evaluada exitosamente');
    } catch (error) {
      if (error.message.includes('no encontrada') || error.message.includes('permisos')) {
        return ResponseUtils.notFound(res, error.message);
      }
      if (error.message.includes('no puede ser evaluada')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/applications/{applicationId}/approve:
 *   put:
 *     summary: Aprobar aplicación
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_feedback:
 *                 type: string
 *               final_rate:
 *                 type: number
 *               rate_negotiation_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Aplicación aprobada exitosamente
 *       403:
 *         description: Sin permisos o aplicación no puede ser aprobada
 *       404:
 *         description: Aplicación no encontrada
 */
router.put('/:applicationId/approve', 
  authenticateJWT, 
  validateSchema(approveApplicationSchema), 
  async (req, res, next) => {
    try {
      // Solo clientes pueden aprobar aplicaciones
      if (req.user.role !== 'client') {
        return ResponseUtils.forbidden(res, 'Solo los clientes pueden aprobar aplicaciones');
      }

      const application = await ApplicationService.approveApplication(
        req.params.applicationId,
        req.body,
        req.user.id
      );

      ResponseUtils.success(res, application, 'Aplicación aprobada exitosamente');
    } catch (error) {
      if (error.message.includes('no encontrada') || error.message.includes('permisos')) {
        return ResponseUtils.notFound(res, error.message);
      }
      if (error.message.includes('no puede ser aprobada')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/applications/{applicationId}/reject:
 *   put:
 *     summary: Rechazar aplicación
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 10
 *               client_feedback:
 *                 type: string
 *               send_feedback_email:
 *                 type: boolean
 *             required:
 *               - reason
 *     responses:
 *       200:
 *         description: Aplicación rechazada exitosamente
 *       403:
 *         description: Sin permisos o aplicación no puede ser rechazada
 *       404:
 *         description: Aplicación no encontrada
 */
router.put('/:applicationId/reject', 
  authenticateJWT, 
  validateSchema(rejectApplicationSchema), 
  async (req, res, next) => {
    try {
      // Solo clientes pueden rechazar aplicaciones
      if (req.user.role !== 'client') {
        return ResponseUtils.forbidden(res, 'Solo los clientes pueden rechazar aplicaciones');
      }

      const application = await ApplicationService.rejectApplication(
        req.params.applicationId,
        req.body,
        req.user.id
      );

      ResponseUtils.success(res, application, 'Aplicación rechazada exitosamente');
    } catch (error) {
      if (error.message.includes('no encontrada') || error.message.includes('permisos')) {
        return ResponseUtils.notFound(res, error.message);
      }
      if (error.message.includes('no puede ser rechazada')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/applications/{applicationId}/withdraw:
 *   put:
 *     summary: Retirar aplicación (solo profesionales)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Aplicación retirada exitosamente
 *       403:
 *         description: Sin permisos o aplicación no puede ser retirada
 *       404:
 *         description: Aplicación no encontrada
 */
router.put('/:applicationId/withdraw', 
  authenticateJWT, 
  validateSchema(withdrawApplicationSchema), 
  async (req, res, next) => {
    try {
      // Solo profesionales pueden retirar aplicaciones
      if (req.user.role !== 'professional') {
        return ResponseUtils.forbidden(res, 'Solo los profesionales pueden retirar aplicaciones');
      }

      const application = await ApplicationService.withdrawApplication(
        req.params.applicationId,
        req.body,
        req.user.id
      );

      ResponseUtils.success(res, application, 'Aplicación retirada exitosamente');
    } catch (error) {
      if (error.message.includes('no encontrada') || error.message.includes('propias')) {
        return ResponseUtils.notFound(res, error.message);
      }
      if (error.message.includes('no puede ser retirada')) {
        return ResponseUtils.error(res, error.message, 400);
      }
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/v1/applications/{applicationId}/calculate-priority:
 *   post:
 *     summary: Recalcular prioridad de aplicación
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Prioridad recalculada exitosamente
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Aplicación no encontrada
 */
router.post('/:applicationId/calculate-priority', authenticateJWT, async (req, res, next) => {
  try {
    // Solo administradores y clientes pueden recalcular prioridades
    if (!['admin', 'client'].includes(req.user.role)) {
      return ResponseUtils.forbidden(res, 'Sin permisos para esta acción');
    }

    const priorityScore = await ApplicationService.calculatePriorityScore(req.params.applicationId);
    
    if (priorityScore === null) {
      return ResponseUtils.notFound(res, 'Aplicación no encontrada');
    }

    ResponseUtils.success(res, { priority_score: priorityScore }, 'Prioridad recalculada exitosamente');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
