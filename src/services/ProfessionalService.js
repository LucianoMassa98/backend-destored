const { Professional, User, Skill, Portfolio, Certification, Project, Review, Service } = require('../db/models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ProfessionalService {
  /**
   * Obtener perfil completo de profesional
   */
  async getProfile(userId) {
    try {
      const professional = await Professional.findOne({
        where: { userId },
        include: [
          {
            model: User,
            attributes: ['id', 'email', 'firstName', 'lastName', 'avatar', 'isActive', 'createdAt']
          },
          {
            model: Skill,
            attributes: ['id', 'name', 'level', 'category']
          },
          {
            model: Portfolio,
            attributes: ['id', 'title', 'description', 'imageUrl', 'projectUrl', 'technologies', 'category']
          },
          {
            model: Certification,
            attributes: ['id', 'name', 'institution', 'dateObtained', 'expirationDate', 'credentialUrl']
          },
          {
            model: Service,
            attributes: ['id', 'name', 'description', 'price', 'duration', 'category', 'isActive']
          }
        ]
      });

      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      // Calcular estadísticas
      const stats = await this.getProfessionalStats(professional.id);
      
      return {
        ...professional.toJSON(),
        stats
      };
    } catch (error) {
      logger.error('Error al obtener perfil de profesional:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil de profesional
   */
  async updateProfile(userId, updateData) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      // Actualizar datos del profesional
      await professional.update(updateData);

      // Obtener perfil actualizado
      return await this.getProfile(userId);
    } catch (error) {
      logger.error('Error al actualizar perfil de profesional:', error);
      throw error;
    }
  }

  /**
   * Buscar profesionales con filtros
   */
  async searchProfessionals(filters = {}) {
    try {
      const {
        skills,
        category,
        experience,
        location,
        priceRange,
        rating,
        availability,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = filters;

      const offset = (page - 1) * limit;
      const whereConditions = { isActive: true };
      const includeConditions = [];

      // Filtro por habilidades
      if (skills && skills.length > 0) {
        includeConditions.push({
          model: Skill,
          where: { name: { [Op.in]: skills } },
          required: true
        });
      } else {
        includeConditions.push({
          model: Skill,
          required: false
        });
      }

      // Filtro por categoría
      if (category) {
        whereConditions.category = category;
      }

      // Filtro por experiencia
      if (experience) {
        whereConditions.experienceYears = { [Op.gte]: experience };
      }

      // Filtro por ubicación
      if (location) {
        whereConditions.location = { [Op.iLike]: `%${location}%` };
      }

      // Filtro por rango de precios
      if (priceRange) {
        whereConditions.hourlyRate = {
          [Op.between]: [priceRange.min, priceRange.max]
        };
      }

      // Filtro por disponibilidad
      if (availability) {
        whereConditions.isAvailable = availability;
      }

      const { count, rows } = await Professional.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          },
          ...includeConditions,
          {
            model: Portfolio,
            limit: 3,
            order: [['createdAt', 'DESC']]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sortBy, sortOrder.toUpperCase()]],
        distinct: true
      });

      // Calcular rating promedio para cada profesional
      const professionalsWithRating = await Promise.all(
        rows.map(async (professional) => {
          const avgRating = await this.getAverageRating(professional.id);
          return {
            ...professional.toJSON(),
            averageRating: avgRating
          };
        })
      );

      // Filtrar por rating si se especifica
      let filteredProfessionals = professionalsWithRating;
      if (rating) {
        filteredProfessionals = professionalsWithRating.filter(
          p => p.averageRating >= rating
        );
      }

      return {
        professionals: filteredProfessionals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      logger.error('Error al buscar profesionales:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas del profesional
   */
  async getProfessionalStats(professionalId) {
    try {
      const [projectsCompleted, totalEarnings, avgRating, reviewsCount] = await Promise.all([
        Project.count({
          where: { 
            professionalId,
            status: 'completed'
          }
        }),
        Project.sum('budget', {
          where: { 
            professionalId,
            status: 'completed'
          }
        }),
        this.getAverageRating(professionalId),
        Review.count({
          where: { professionalId }
        })
      ]);

      return {
        projectsCompleted: projectsCompleted || 0,
        totalEarnings: totalEarnings || 0,
        averageRating: avgRating,
        reviewsCount: reviewsCount || 0
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas del profesional:', error);
      throw error;
    }
  }

  /**
   * Obtener rating promedio
   */
  async getAverageRating(professionalId) {
    try {
      const result = await Review.findOne({
        where: { professionalId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
        ],
        raw: true
      });

      return result?.avgRating ? parseFloat(result.avgRating).toFixed(1) : 0;
    } catch (error) {
      logger.error('Error al calcular rating promedio:', error);
      return 0;
    }
  }

  /**
   * Agregar habilidad a profesional
   */
  async addSkill(userId, skillData) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      const skill = await Skill.create({
        ...skillData,
        professionalId: professional.id
      });

      return skill;
    } catch (error) {
      logger.error('Error al agregar habilidad:', error);
      throw error;
    }
  }

  /**
   * Actualizar habilidad
   */
  async updateSkill(userId, skillId, updateData) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      const skill = await Skill.findOne({
        where: { 
          id: skillId,
          professionalId: professional.id
        }
      });

      if (!skill) {
        throw new Error('Habilidad no encontrada');
      }

      await skill.update(updateData);
      return skill;
    } catch (error) {
      logger.error('Error al actualizar habilidad:', error);
      throw error;
    }
  }

  /**
   * Eliminar habilidad
   */
  async removeSkill(userId, skillId) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      const deleted = await Skill.destroy({
        where: { 
          id: skillId,
          professionalId: professional.id
        }
      });

      if (!deleted) {
        throw new Error('Habilidad no encontrada');
      }

      return { message: 'Habilidad eliminada exitosamente' };
    } catch (error) {
      logger.error('Error al eliminar habilidad:', error);
      throw error;
    }
  }

  /**
   * Agregar proyecto al portafolio
   */
  async addPortfolioProject(userId, portfolioData) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      const portfolio = await Portfolio.create({
        ...portfolioData,
        professionalId: professional.id
      });

      return portfolio;
    } catch (error) {
      logger.error('Error al agregar proyecto al portafolio:', error);
      throw error;
    }
  }

  /**
   * Actualizar proyecto del portafolio
   */
  async updatePortfolioProject(userId, portfolioId, updateData) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      const portfolio = await Portfolio.findOne({
        where: { 
          id: portfolioId,
          professionalId: professional.id
        }
      });

      if (!portfolio) {
        throw new Error('Proyecto del portafolio no encontrado');
      }

      await portfolio.update(updateData);
      return portfolio;
    } catch (error) {
      logger.error('Error al actualizar proyecto del portafolio:', error);
      throw error;
    }
  }

  /**
   * Eliminar proyecto del portafolio
   */
  async removePortfolioProject(userId, portfolioId) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      const deleted = await Portfolio.destroy({
        where: { 
          id: portfolioId,
          professionalId: professional.id
        }
      });

      if (!deleted) {
        throw new Error('Proyecto del portafolio no encontrado');
      }

      return { message: 'Proyecto eliminado del portafolio exitosamente' };
    } catch (error) {
      logger.error('Error al eliminar proyecto del portafolio:', error);
      throw error;
    }
  }

  /**
   * Obtener proyectos asignados al profesional
   */
  async getAssignedProjects(userId, status = null) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      const whereConditions = { professionalId: professional.id };
      if (status) {
        whereConditions.status = status;
      }

      const projects = await Project.findAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return projects;
    } catch (error) {
      logger.error('Error al obtener proyectos asignados:', error);
      throw error;
    }
  }

  /**
   * Cambiar disponibilidad del profesional
   */
  async toggleAvailability(userId) {
    try {
      const professional = await Professional.findOne({ where: { userId } });
      
      if (!professional) {
        throw new Error('Perfil de profesional no encontrado');
      }

      await professional.update({
        isAvailable: !professional.isAvailable
      });

      return {
        isAvailable: professional.isAvailable,
        message: `Disponibilidad ${professional.isAvailable ? 'activada' : 'desactivada'} exitosamente`
      };
    } catch (error) {
      logger.error('Error al cambiar disponibilidad:', error);
      throw error;
    }
  }
}

module.exports = new ProfessionalService();
