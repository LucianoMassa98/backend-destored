const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Application extends Model {
  /**
   * Método para verificar si la aplicación puede ser retirada
   */
  canBeWithdrawn() {
    return ['pending', 'under_review'].includes(this.status);
  }

  /**
   * Método para verificar si la aplicación puede ser aceptada
   */
  canBeAccepted() {
    return ['pending', 'under_review'].includes(this.status);
  }

  /**
   * Método para verificar si la aplicación puede ser evaluada
   */
  canBeEvaluated() {
    return this.status === 'pending';
  }

  /**
   * Método para verificar si es una aplicación activa
   */
  isActive() {
    return ['pending', 'under_review'].includes(this.status);
  }

  /**
   * Método para verificar si la aplicación está finalizada
   */
  isFinalized() {
    return ['accepted', 'rejected', 'withdrawn', 'expired'].includes(this.status);
  }

  /**
   * Método para calcular días desde la aplicación
   */
  getDaysOld() {
    const now = new Date();
    const created = new Date(this.created_at);
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }
}

Application.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    professional_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    convocatoria_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'convocatorias',
        key: 'id'
      }
    },
    cover_letter: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [50, 2000]
      }
    },
    proposed_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    proposed_timeline: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Cronograma propuesto en días'
    },
    availability_start: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'under_review',
        'accepted',
        'rejected',
        'withdrawn',
        'expired'
      ),
      defaultValue: 'pending'
    },
    portfolio_items: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Items del portafolio relevantes para esta aplicación'
    },
    relevant_experience: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Experiencia relevante específica para este proyecto'
    },
    questions_responses: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Respuestas a preguntas específicas del cliente'
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Archivos adjuntos (CV, portafolio, etc.)'
    },
    rating_explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Explicación de por qué merece la tarifa propuesta'
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    client_feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    response_time_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tiempo que tomó el profesional en responder'
    },
    priority_score: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: 'Puntuación de prioridad basada en algoritmo'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Application',
    tableName: 'applications',
    indexes: [
      {
        fields: ['professional_id']
      },
      {
        fields: ['project_id']
      },
      {
        fields: ['convocatoria_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['reviewed_at']
      },
      {
        fields: ['priority_score']
      },
      {
        unique: true,
        fields: ['professional_id', 'project_id'],
        where: { project_id: { [sequelize.Sequelize.Op.ne]: null } }
      },
      {
        unique: true,
        fields: ['professional_id', 'convocatoria_id'],
        where: { convocatoria_id: { [sequelize.Sequelize.Op.ne]: null } }
      }
    ],
    hooks: {
      beforeCreate: (application) => {
        // Calcular prioridad inicial basada en datos del profesional
        // Esto se puede mejorar con un algoritmo más complejo
        application.priority_score = 50; // Valor base
      },
      beforeUpdate: (application) => {
        if (application.changed('status') && 
            ['accepted', 'rejected'].includes(application.status)) {
          application.reviewed_at = new Date();
        }
      }
    }
  }
);

// Definir asociaciones
Application.associate = function(models) {
  // Una aplicación pertenece a un profesional
  Application.belongsTo(models.User, {
    foreignKey: 'professional_id',
    as: 'professional'
  });

  // Una aplicación pertenece a un proyecto
  Application.belongsTo(models.Project, {
    foreignKey: 'project_id',
    as: 'project'
  });

  // Una aplicación puede tener un revisor (cliente que la revisó)
  Application.belongsTo(models.User, {
    foreignKey: 'reviewed_by',
    as: 'reviewer'
  });
};

module.exports = Application;
