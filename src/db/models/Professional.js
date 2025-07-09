const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Professional extends Model {
  /**
   * Método para calcular el rating promedio
   */
  async getAverageRating() {
    const { Review } = require('./index');
    const reviews = await Review.findAll({
      where: { reviewed_id: this.user_id },
      attributes: ['rating']
    });

    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }

  /**
   * Método para obtener el número total de proyectos completados
   */
  async getCompletedProjectsCount() {
    const { Project } = require('./index');
    return await Project.count({
      where: { 
        assigned_professional_id: this.user_id,
        status: 'completed'
      }
    });
  }

  /**
   * Método para verificar disponibilidad
   */
  isAvailable() {
    return this.is_available && this.is_verified;
  }
}

Professional.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Título profesional (ej: Senior Developer, UI/UX Designer)'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Biografía profesional'
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 50
      }
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Tarifa por hora en USD'
    },
    project_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Tarifa por proyecto en USD'
    },
    consultation_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      },
      comment: 'Tarifa por consulta en USD'
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Disponible para nuevos proyectos'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Perfil verificado por administración'
    },
    verification_documents: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'URLs de documentos de verificación'
    },
    languages: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Idiomas que maneja el profesional'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Zona horaria del profesional'
    },
    availability_schedule: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Horarios de disponibilidad por día de la semana'
    },
    portfolio_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    linkedin_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    github_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    website_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    specializations: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Áreas de especialización'
    },
    education: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Información educativa'
    },
    work_experience: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Experiencia laboral'
    },
    preferred_project_types: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Tipos de proyectos preferidos'
    },
    minimum_project_budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    response_time_hours: {
      type: DataTypes.INTEGER,
      defaultValue: 24,
      comment: 'Tiempo de respuesta promedio en horas'
    },
    completion_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Porcentaje de proyectos completados exitosamente'
    },
    total_earnings: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      comment: 'Total ganado en la plataforma'
    },
    stripe_account_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID de cuenta de Stripe para pagos'
    },
    last_activity: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última actividad en la plataforma'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Metadatos adicionales del profesional'
    }
  },
  {
    sequelize,
    modelName: 'Professional',
    tableName: 'professionals',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['is_available']
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['hourly_rate']
      },
      {
        fields: ['experience_years']
      },
      {
        fields: ['completion_rate']
      },
      {
        fields: ['last_activity']
      }
    ]
  }
);

module.exports = Professional;
