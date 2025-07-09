const { Notification, User } = require('../db/models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Crear una notificación
   */
  async createNotification(userId, data) {
    try {
      const notification = await Notification.create({
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data,
        isRead: false
      });

      logger.info(`Notificación creada para usuario ${userId}: ${data.title}`);
      return notification;
    } catch (error) {
      logger.error('Error al crear notificación:', error);
      throw error;
    }
  }

  /**
   * Obtener notificaciones del usuario
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false,
        type = null
      } = options;

      const offset = (page - 1) * limit;
      const whereConditions = { userId };

      if (unreadOnly) {
        whereConditions.isRead = false;
      }

      if (type) {
        whereConditions.type = type;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        notifications: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error al obtener notificaciones:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOne({
        where: { 
          id: notificationId,
          userId 
        }
      });

      if (!notification) {
        throw new Error('Notificación no encontrada');
      }

      await notification.update({ isRead: true });
      return notification;
    } catch (error) {
      logger.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId) {
    try {
      const updated = await Notification.update(
        { isRead: true },
        { 
          where: { 
            userId,
            isRead: false
          }
        }
      );

      return { updated: updated[0] };
    } catch (error) {
      logger.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(userId, notificationId) {
    try {
      const deleted = await Notification.destroy({
        where: { 
          id: notificationId,
          userId 
        }
      });

      if (!deleted) {
        throw new Error('Notificación no encontrada');
      }

      return { message: 'Notificación eliminada exitosamente' };
    } catch (error) {
      logger.error('Error al eliminar notificación:', error);
      throw error;
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { 
          userId,
          isRead: false 
        }
      });

      return { unreadCount: count };
    } catch (error) {
      logger.error('Error al obtener conteo de notificaciones no leídas:', error);
      throw error;
    }
  }

  /**
   * Crear notificación de nuevo proyecto
   */
  async notifyNewProject(professionalId, project) {
    try {
      await this.createNotification(professionalId, {
        title: 'Nuevo proyecto disponible',
        message: `Hay un nuevo proyecto "${project.title}" que coincide con tu perfil`,
        type: 'project_available',
        data: { projectId: project.id }
      });
    } catch (error) {
      logger.error('Error al crear notificación de nuevo proyecto:', error);
    }
  }

  /**
   * Crear notificación de aplicación a proyecto
   */
  async notifyProjectApplication(clientId, application) {
    try {
      await this.createNotification(clientId, {
        title: 'Nueva aplicación a tu proyecto',
        message: `Un profesional ha aplicado a tu proyecto "${application.Project.title}"`,
        type: 'project_application',
        data: { 
          projectId: application.projectId,
          applicationId: application.id 
        }
      });
    } catch (error) {
      logger.error('Error al crear notificación de aplicación:', error);
    }
  }

  /**
   * Crear notificación de proyecto asignado
   */
  async notifyProjectAssigned(professionalId, project) {
    try {
      await this.createNotification(professionalId, {
        title: 'Proyecto asignado',
        message: `Te han asignado el proyecto "${project.title}"`,
        type: 'project_assigned',
        data: { projectId: project.id }
      });
    } catch (error) {
      logger.error('Error al crear notificación de proyecto asignado:', error);
    }
  }

  /**
   * Crear notificación de proyecto completado
   */
  async notifyProjectCompleted(clientId, project) {
    try {
      await this.createNotification(clientId, {
        title: 'Proyecto completado',
        message: `El proyecto "${project.title}" ha sido marcado como completado`,
        type: 'project_completed',
        data: { projectId: project.id }
      });
    } catch (error) {
      logger.error('Error al crear notificación de proyecto completado:', error);
    }
  }

  /**
   * Crear notificación de pago recibido
   */
  async notifyPaymentReceived(professionalId, payment) {
    try {
      await this.createNotification(professionalId, {
        title: 'Pago recibido',
        message: `Has recibido un pago de $${payment.amount}`,
        type: 'payment_received',
        data: { paymentId: payment.id }
      });
    } catch (error) {
      logger.error('Error al crear notificación de pago:', error);
    }
  }

  /**
   * Crear notificación de nueva review
   */
  async notifyNewReview(professionalId, review) {
    try {
      await this.createNotification(professionalId, {
        title: 'Nueva review recibida',
        message: `Has recibido una nueva review con ${review.rating} estrellas`,
        type: 'new_review',
        data: { reviewId: review.id }
      });
    } catch (error) {
      logger.error('Error al crear notificación de review:', error);
    }
  }

  /**
   * Crear notificación de mensaje
   */
  async notifyNewMessage(userId, message) {
    try {
      await this.createNotification(userId, {
        title: 'Nuevo mensaje',
        message: `Has recibido un nuevo mensaje de ${message.sender.firstName}`,
        type: 'new_message',
        data: { messageId: message.id }
      });
    } catch (error) {
      logger.error('Error al crear notificación de mensaje:', error);
    }
  }

  /**
   * Limpiar notificaciones antiguas
   */
  async cleanOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await Notification.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate
          },
          isRead: true
        }
      });

      logger.info(`${deleted} notificaciones antiguas eliminadas`);
      return { deleted };
    } catch (error) {
      logger.error('Error al limpiar notificaciones antiguas:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
