const express = require('express');
const router = express.Router();
const NotificationService = require('../../../services/NotificationService');
const { authenticateJWT } = require('../../../middlewares/auth.handler');
const { successResponse, errorResponse } = require('../../../utils/responseUtils');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Sistema de notificaciones
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Obtener notificaciones del usuario
 *     tags: [Notifications]
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
 *           maximum: 50
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [project_available, project_application, project_assigned, project_completed, payment_received, new_review, new_message]
 *     responses:
 *       200:
 *         description: Notificaciones obtenidas exitosamente
 */
router.get('/',
  authenticateJWT,
  async (req, res) => {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        unreadOnly: req.query.unreadOnly === 'true',
        type: req.query.type
      };

      const result = await NotificationService.getUserNotifications(req.user.id, options);
      successResponse(res, result, 'Notificaciones obtenidas exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Obtener conteo de notificaciones no leídas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo obtenido exitosamente
 */
router.get('/unread-count',
  authenticateJWT,
  async (req, res) => {
    try {
      const result = await NotificationService.getUnreadCount(req.user.id);
      successResponse(res, result, 'Conteo obtenido exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Marcar notificación como leída
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 *       404:
 *         description: Notificación no encontrada
 */
router.patch('/:id/read',
  authenticateJWT,
  async (req, res) => {
    try {
      const notification = await NotificationService.markAsRead(req.user.id, req.params.id);
      successResponse(res, notification, 'Notificación marcada como leída');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

/**
 * @swagger
 * /api/v1/notifications/mark-all-read:
 *   patch:
 *     summary: Marcar todas las notificaciones como leídas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas las notificaciones marcadas como leídas
 */
router.patch('/mark-all-read',
  authenticateJWT,
  async (req, res) => {
    try {
      const result = await NotificationService.markAllAsRead(req.user.id);
      successResponse(res, result, 'Todas las notificaciones marcadas como leídas');
    } catch (error) {
      errorResponse(res, error.message, 400);
    }
  }
);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Eliminar notificación
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación eliminada exitosamente
 *       404:
 *         description: Notificación no encontrada
 */
router.delete('/:id',
  authenticateJWT,
  async (req, res) => {
    try {
      const result = await NotificationService.deleteNotification(req.user.id, req.params.id);
      successResponse(res, result, 'Notificación eliminada exitosamente');
    } catch (error) {
      errorResponse(res, error.message, 404);
    }
  }
);

module.exports = router;
