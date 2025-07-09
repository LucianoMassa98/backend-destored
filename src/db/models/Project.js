const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Project extends Model {
  /**
   * Método para verificar si el proyecto puede ser aplicado
   */
  canBeApplied() {
    return this.status === 'open' && new Date() < new Date(this.application_deadline);
  }

  /**
   * Método para calcular el progreso del proyecto
   */
  calculateProgress() {
    if (!this.milestones || this.milestones.length === 0) return 0;
    
    const completedMilestones = this.milestones.filter(m => m.status === 'completed');
    return Math.round((completedMilestones.length / this.milestones.length) * 100);
  }

  /**
   * Método para obtener el siguiente milestone
   */
  getNextMilestone() {
    if (!this.milestones) return null;
    return this.milestones.find(m => m.status === 'pending') || null;
  }

  /**
   * Método para verificar si está vencido
   */
  isOverdue() {
    return this.status === 'in_progress' && new Date() > new Date(this.deadline);
  }
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assigned_professional_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [5, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [50, 5000]
      }
    },
    category: {
      type: DataTypes.ENUM(
        'web_development',
        'mobile_development',
        'desktop_development',
        'ui_ux_design',
        'graphic_design',
        'data_science',
        'machine_learning',
        'blockchain',
        'devops',
        'cybersecurity',
        'quality_assurance',
        'project_management',
        'digital_marketing',
        'content_creation',
        'other'
      ),
      allowNull: false
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    budget_type: {
      type: DataTypes.ENUM('fixed', 'hourly'),
      allowNull: false
    },
    budget_min: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    budget_max: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    duration_estimate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duración estimada en días'
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'open',
        'in_review',
        'in_progress',
        'completed',
        'cancelled',
        'on_hold',
        'disputed'
      ),
      defaultValue: 'draft'
    },
    required_skills: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Skills requeridas para el proyecto'
    },
    preferred_experience: {
      type: DataTypes.ENUM('junior', 'mid', 'senior', 'expert'),
      allowNull: true
    },
    remote_work: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Ubicación si se requiere trabajo presencial'
    },
    timezone_preference: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    application_deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    milestones: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Hitos del proyecto con fechas y entregables'
    },
    requirements: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Requerimientos técnicos y funcionales detallados'
    },
    deliverables: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Lista de entregables esperados'
    },
    communication_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Preferencias de comunicación del cliente'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    final_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Monto final acordado'
    },
    platform_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Comisión de la plataforma'
    },
    payment_terms: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Términos de pago acordados'
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'invite_only'),
      defaultValue: 'public'
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Proyecto destacado'
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    application_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Metadatos adicionales del proyecto'
    }
  },
  {
    sequelize,
    modelName: 'Project',
    tableName: 'projects',
    indexes: [
      {
        fields: ['client_id']
      },
      {
        fields: ['assigned_professional_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['category']
      },
      {
        fields: ['budget_type']
      },
      {
        fields: ['budget_min']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['remote_work']
      },
      {
        fields: ['deadline']
      },
      {
        fields: ['application_deadline']
      },
      {
        fields: ['featured']
      },
      {
        fields: ['visibility']
      },
      {
        fields: ['created_at']
      }
    ],
    hooks: {
      beforeCreate: (project) => {
        // Establecer deadline de aplicación por defecto (7 días)
        if (!project.application_deadline) {
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 7);
          project.application_deadline = deadline;
        }
      },
      beforeUpdate: (project) => {
        // Actualizar timestamps según el estado
        if (project.changed('status')) {
          const now = new Date();
          
          switch (project.status) {
            case 'in_progress':
              if (!project.started_at) {
                project.started_at = now;
              }
              break;
            case 'completed':
              if (!project.completed_at) {
                project.completed_at = now;
              }
              break;
            case 'cancelled':
              if (!project.cancelled_at) {
                project.cancelled_at = now;
              }
              break;
          }
        }
      }
    }
  }
);

module.exports = Project;
