const { User, Professional, Client, Project, Payment, Review, Application } = require('../db/models');
const { Op } = require('sequelize');
const { sequelize } = require('../db/config/database');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Obtener estadísticas generales de la plataforma
   */
  async getPlatformStats() {
    try {
      const [
        totalUsers,
        totalProfessionals,
        totalClients,
        totalProjects,
        completedProjects,
        totalRevenue,
        activeUsers,
        avgProjectValue
      ] = await Promise.all([
        User.count(),
        Professional.count(),
        Client.count(),
        Project.count(),
        Project.count({ where: { status: 'completed' } }),
        Payment.sum('amount', { where: { status: 'completed' } }),
        User.count({ where: { isActive: true } }),
        Project.findOne({
          attributes: [[sequelize.fn('AVG', sequelize.col('budget')), 'avgBudget']],
          where: { status: 'completed' },
          raw: true
        })
      ]);

      return {
        totalUsers,
        totalProfessionals,
        totalClients,
        totalProjects,
        completedProjects,
        totalRevenue: totalRevenue || 0,
        activeUsers,
        averageProjectValue: avgProjectValue?.avgBudget || 0,
        projectCompletionRate: totalProjects > 0 ? (completedProjects / totalProjects * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de la plataforma:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de crecimiento de usuarios
   */
  async getUserGrowthStats(period = '6months') {
    try {
      let dateFrom;
      const dateTo = new Date();
      
      switch (period) {
        case '1month':
          dateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 1, 1);
          break;
        case '3months':
          dateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 3, 1);
          break;
        case '6months':
          dateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 6, 1);
          break;
        case '1year':
          dateFrom = new Date(dateTo.getFullYear() - 1, 0, 1);
          break;
        default:
          dateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 6, 1);
      }

      const userGrowth = await User.findAll({
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'month'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          'role'
        ],
        where: {
          createdAt: {
            [Op.between]: [dateFrom, dateTo]
          }
        },
        group: [
          sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')),
          'role'
        ],
        order: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'ASC']
        ],
        raw: true
      });

      return userGrowth;
    } catch (error) {
      logger.error('Error al obtener estadísticas de crecimiento:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de proyectos por categoría
   */
  async getProjectStatsByCategory() {
    try {
      const projectsByCategory = await Project.findAll({
        attributes: [
          'category',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('budget')), 'avgBudget'],
          [sequelize.fn('SUM', 
            sequelize.case(
              sequelize.where(sequelize.col('status'), 'completed'), 1,
              0
            )
          ), 'completedCount']
        ],
        group: ['category'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        raw: true
      });

      return projectsByCategory.map(item => ({
        category: item.category,
        totalProjects: parseInt(item.count),
        completedProjects: parseInt(item.completedCount),
        averageBudget: parseFloat(item.avgBudget || 0).toFixed(2),
        completionRate: item.count > 0 ? (item.completedCount / item.count * 100).toFixed(2) : 0
      }));
    } catch (error) {
      logger.error('Error al obtener estadísticas por categoría:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de ingresos
   */
  async getRevenueStats(period = '6months') {
    try {
      let dateFrom;
      const dateTo = new Date();
      
      switch (period) {
        case '1month':
          dateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 1, 1);
          break;
        case '3months':
          dateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 3, 1);
          break;
        case '6months':
          dateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 6, 1);
          break;
        case '1year':
          dateFrom = new Date(dateTo.getFullYear() - 1, 0, 1);
          break;
        default:
          dateFrom = new Date(dateTo.getFullYear(), dateTo.getMonth() - 6, 1);
      }

      const revenueByMonth = await Payment.findAll({
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'month'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactions']
        ],
        where: {
          status: 'completed',
          createdAt: {
            [Op.between]: [dateFrom, dateTo]
          }
        },
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      return revenueByMonth.map(item => ({
        month: item.month,
        revenue: parseFloat(item.revenue || 0),
        transactions: parseInt(item.transactions)
      }));
    } catch (error) {
      logger.error('Error al obtener estadísticas de ingresos:', error);
      throw error;
    }
  }

  /**
   * Obtener top profesionales por ingresos
   */
  async getTopProfessionals(limit = 10) {
    try {
      const topProfessionals = await Professional.findAll({
        include: [
          {
            model: User,
            attributes: ['firstName', 'lastName', 'avatar']
          },
          {
            model: Project,
            attributes: [],
            where: { status: 'completed' },
            required: false
          }
        ],
        attributes: [
          'id',
          'title',
          'category',
          [sequelize.fn('SUM', sequelize.col('Projects.budget')), 'totalEarnings'],
          [sequelize.fn('COUNT', sequelize.col('Projects.id')), 'completedProjects'],
          [sequelize.fn('AVG', sequelize.col('Projects.budget')), 'avgProjectValue']
        ],
        group: ['Professional.id', 'User.id'],
        order: [[sequelize.fn('SUM', sequelize.col('Projects.budget')), 'DESC']],
        limit: parseInt(limit),
        raw: false
      });

      return topProfessionals;
    } catch (error) {
      logger.error('Error al obtener top profesionales:', error);
      throw error;
    }
  }

  /**
   * Obtener top clientes por gasto
   */
  async getTopClients(limit = 10) {
    try {
      const topClients = await Client.findAll({
        include: [
          {
            model: User,
            attributes: ['firstName', 'lastName', 'avatar']
          },
          {
            model: Project,
            attributes: [],
            where: { status: 'completed' },
            required: false
          }
        ],
        attributes: [
          'id',
          'companyName',
          'industry',
          [sequelize.fn('SUM', sequelize.col('Projects.budget')), 'totalSpent'],
          [sequelize.fn('COUNT', sequelize.col('Projects.id')), 'totalProjects'],
          [sequelize.fn('AVG', sequelize.col('Projects.budget')), 'avgProjectValue']
        ],
        group: ['Client.id', 'User.id'],
        order: [[sequelize.fn('SUM', sequelize.col('Projects.budget')), 'DESC']],
        limit: parseInt(limit),
        raw: false
      });

      return topClients;
    } catch (error) {
      logger.error('Error al obtener top clientes:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de aplicaciones a proyectos
   */
  async getApplicationStats() {
    try {
      const [
        totalApplications,
        acceptedApplications,
        avgApplicationsPerProject,
        responseTimeStats
      ] = await Promise.all([
        Application.count(),
        Application.count({ where: { status: 'accepted' } }),
        Application.findOne({
          attributes: [[sequelize.fn('AVG', sequelize.col('applications_count')), 'avg']],
          include: [{
            model: Project,
            attributes: [[sequelize.fn('COUNT', sequelize.col('Applications.id')), 'applications_count']],
            group: ['Project.id']
          }],
          raw: true
        }),
        // Estadísticas de tiempo de respuesta (días entre aplicación y respuesta)
        sequelize.query(`
          SELECT 
            AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_response_days,
            MIN(EXTRACT(DAY FROM (updated_at - created_at))) as min_response_days,
            MAX(EXTRACT(DAY FROM (updated_at - created_at))) as max_response_days
          FROM applications 
          WHERE status != 'pending' AND updated_at != created_at
        `, { type: sequelize.QueryTypes.SELECT })
      ]);

      return {
        totalApplications,
        acceptedApplications,
        rejectedApplications: totalApplications - acceptedApplications,
        acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications * 100).toFixed(2) : 0,
        averageApplicationsPerProject: avgApplicationsPerProject?.avg || 0,
        responseTime: responseTimeStats[0] || {
          avg_response_days: 0,
          min_response_days: 0,
          max_response_days: 0
        }
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de aplicaciones:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de reviews
   */
  async getReviewStats() {
    try {
      const [
        totalReviews,
        avgRating,
        ratingDistribution
      ] = await Promise.all([
        Review.count(),
        Review.findOne({
          attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
          raw: true
        }),
        Review.findAll({
          attributes: [
            'rating',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['rating'],
          order: [['rating', 'ASC']],
          raw: true
        })
      ]);

      return {
        totalReviews,
        averageRating: parseFloat(avgRating?.avgRating || 0).toFixed(2),
        ratingDistribution: ratingDistribution.map(item => ({
          rating: item.rating,
          count: parseInt(item.count),
          percentage: totalReviews > 0 ? (item.count / totalReviews * 100).toFixed(2) : 0
        }))
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas de reviews:', error);
      throw error;
    }
  }

  /**
   * Obtener dashboard completo de analytics
   */
  async getAnalyticsDashboard() {
    try {
      const [
        platformStats,
        userGrowth,
        projectsByCategory,
        revenueStats,
        applicationStats,
        reviewStats
      ] = await Promise.all([
        this.getPlatformStats(),
        this.getUserGrowthStats(),
        this.getProjectStatsByCategory(),
        this.getRevenueStats(),
        this.getApplicationStats(),
        this.getReviewStats()
      ]);

      return {
        platformStats,
        userGrowth,
        projectsByCategory,
        revenueStats,
        applicationStats,
        reviewStats
      };
    } catch (error) {
      logger.error('Error al obtener dashboard de analytics:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
