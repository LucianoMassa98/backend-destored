const { Client, User, Project, Review, Payment } = require('../db/models');
const { Op } = require('sequelize');
const { sequelize } = require('../db/config/database');
const logger = require('../utils/logger');

class ClientService {
  /**
   * Obtener perfil completo del cliente
   */
  async getProfile(userId) {
    try {
      const client = await Client.findOne({
        where: { userId },
        include: [
          {
            model: User,
            attributes: ['id', 'email', 'firstName', 'lastName', 'avatar', 'isActive', 'createdAt']
          }
        ]
      });

      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      // Calcular estadísticas del cliente
      const stats = await this.getClientStats(client.id);
      
      return {
        ...client.toJSON(),
        stats
      };
    } catch (error) {
      logger.error('Error al obtener perfil de cliente:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil del cliente
   */
  async updateProfile(userId, updateData) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      // Actualizar datos del cliente
      await client.update(updateData);

      // Obtener perfil actualizado
      return await this.getProfile(userId);
    } catch (error) {
      logger.error('Error al actualizar perfil de cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del cliente
   */
  async getClientStats(clientId) {
    try {
      const [totalProjects, activeProjects, completedProjects, totalSpent, avgRating] = await Promise.all([
        Project.count({
          where: { clientId }
        }),
        Project.count({
          where: { 
            clientId,
            status: 'in_progress'
          }
        }),
        Project.count({
          where: { 
            clientId,
            status: 'completed'
          }
        }),
        Payment.sum('amount', {
          where: { 
            clientId,
            status: 'completed'
          }
        }),
        this.getAverageRatingGiven(clientId)
      ]);

      return {
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        completedProjects: completedProjects || 0,
        totalSpent: totalSpent || 0,
        averageRatingGiven: avgRating
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas del cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener rating promedio dado por el cliente
   */
  async getAverageRatingGiven(clientId) {
    try {
      const result = await Review.findOne({
        where: { clientId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
        ],
        raw: true
      });

      return result?.avgRating ? parseFloat(result.avgRating).toFixed(1) : 0;
    } catch (error) {
      logger.error('Error al calcular rating promedio dado:', error);
      return 0;
    }
  }

  /**
   * Obtener proyectos del cliente
   */
  async getClientProjects(userId, status = null, page = 1, limit = 10) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      const offset = (page - 1) * limit;
      const whereConditions = { clientId: client.id };
      
      if (status) {
        whereConditions.status = status;
      }

      const { count, rows } = await Project.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'professional',
            attributes: ['id', 'firstName', 'lastName', 'avatar'],
            include: [
              {
                model: Professional,
                attributes: ['title', 'hourlyRate', 'category']
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        projects: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error al obtener proyectos del cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de pagos del cliente
   */
  async getPaymentHistory(userId, page = 1, limit = 10) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Payment.findAndCountAll({
        where: { clientId: client.id },
        include: [
          {
            model: Project,
            attributes: ['id', 'title', 'description'],
            include: [
              {
                model: User,
                as: 'professional',
                attributes: ['firstName', 'lastName']
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        payments: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error al obtener historial de pagos:', error);
      throw error;
    }
  }

  /**
   * Obtener reviews escritas por el cliente
   */
  async getClientReviews(userId, page = 1, limit = 10) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Review.findAndCountAll({
        where: { clientId: client.id },
        include: [
          {
            model: Project,
            attributes: ['id', 'title']
          },
          {
            model: User,
            as: 'professional',
            attributes: ['firstName', 'lastName', 'avatar']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        reviews: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error al obtener reviews del cliente:', error);
      throw error;
    }
  }

  /**
   * Crear review para un profesional
   */
  async createReview(userId, projectId, reviewData) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      // Verificar que el proyecto pertenece al cliente y está completado
      const project = await Project.findOne({
        where: { 
          id: projectId,
          clientId: client.id,
          status: 'completed'
        }
      });

      if (!project) {
        throw new Error('Proyecto no encontrado o no está completado');
      }

      // Verificar que no existe una review previa para este proyecto
      const existingReview = await Review.findOne({
        where: { 
          projectId,
          clientId: client.id
        }
      });

      if (existingReview) {
        throw new Error('Ya existe una review para este proyecto');
      }

      const review = await Review.create({
        ...reviewData,
        projectId,
        clientId: client.id,
        professionalId: project.professionalId
      });

      return review;
    } catch (error) {
      logger.error('Error al crear review:', error);
      throw error;
    }
  }

  /**
   * Actualizar review
   */
  async updateReview(userId, reviewId, updateData) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      const review = await Review.findOne({
        where: { 
          id: reviewId,
          clientId: client.id
        }
      });

      if (!review) {
        throw new Error('Review no encontrada');
      }

      await review.update(updateData);
      return review;
    } catch (error) {
      logger.error('Error al actualizar review:', error);
      throw error;
    }
  }

  /**
   * Eliminar review
   */
  async deleteReview(userId, reviewId) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      const deleted = await Review.destroy({
        where: { 
          id: reviewId,
          clientId: client.id
        }
      });

      if (!deleted) {
        throw new Error('Review no encontrada');
      }

      return { message: 'Review eliminada exitosamente' };
    } catch (error) {
      logger.error('Error al eliminar review:', error);
      throw error;
    }
  }

  /**
   * Obtener profesionales favoritos del cliente
   */
  async getFavoriteProfessionals(userId) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      // Obtener profesionales con los que ha trabajado más
      const professionals = await Project.findAll({
        where: { 
          clientId: client.id,
          status: 'completed'
        },
        include: [
          {
            model: User,
            as: 'professional',
            attributes: ['id', 'firstName', 'lastName', 'avatar'],
            include: [
              {
                model: Professional,
                attributes: ['title', 'category', 'hourlyRate']
              }
            ]
          }
        ],
        attributes: [
          'professionalId',
          [sequelize.fn('COUNT', sequelize.col('Project.id')), 'projectCount']
        ],
        group: ['professionalId', 'professional.id', 'professional.Professional.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('Project.id')), 'DESC']],
        limit: 10
      });

      return professionals;
    } catch (error) {
      logger.error('Error al obtener profesionales favoritos:', error);
      throw error;
    }
  }

  /**
   * Obtener dashboard del cliente
   */
  async getDashboard(userId) {
    try {
      const client = await Client.findOne({ where: { userId } });
      
      if (!client) {
        throw new Error('Perfil de cliente no encontrado');
      }

      const [stats, recentProjects, recentPayments] = await Promise.all([
        this.getClientStats(client.id),
        this.getClientProjects(userId, null, 1, 5),
        this.getPaymentHistory(userId, 1, 5)
      ]);

      return {
        stats,
        recentProjects: recentProjects.projects,
        recentPayments: recentPayments.payments
      };
    } catch (error) {
      logger.error('Error al obtener dashboard del cliente:', error);
      throw error;
    }
  }
}

module.exports = new ClientService();
