const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
const AuthUtils = require('../../utils/authUtils');

class User extends Model {
  /**
   * Método para crear hash de la contraseña antes de guardar
   */
  async setPassword(password) {
    this.password = await AuthUtils.hashPassword(password);
  }

  /**
   * Método para verificar contraseña
   */
  async checkPassword(password) {
    return await AuthUtils.comparePassword(password, this.password);
  }

  /**
   * Método para obtener el nombre completo
   */
  getFullName() {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  /**
   * Método para obtener datos públicos del usuario
   */
  getPublicData() {
    const userData = this.toJSON();
    delete userData.password;
    delete userData.verification_token;
    delete userData.reset_password_token;
    delete userData.reset_password_expires;
    delete userData.google_id;
    delete userData.linkedin_id;
    return userData;
  }

  /**
   * Método para verificar si el usuario puede realizar una acción
   */
  can(action) {
    const permissions = {
      admin: [
        'manage_users',
        'manage_projects',
        'manage_payments',
        'view_analytics',
        'manage_content'
      ],
      super_admin: [
        'manage_users',
        'manage_projects',
        'manage_payments',
        'view_analytics',
        'manage_content',
        'manage_admins',
        'system_settings'
      ],
      gerencia: [
        'view_analytics',
        'manage_content',
        'view_reports'
      ],
      professional: [
        'create_portfolio',
        'apply_projects',
        'offer_mentorships',
        'offer_consultations'
      ],
      client: [
        'create_projects',
        'hire_professionals',
        'request_mentorships',
        'request_consultations'
      ]
    };

    return permissions[this.role]?.includes(action) || false;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Debe ser un email válido'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Puede ser null para usuarios OAuth
      validate: {
        len: {
          args: [8, 255],
          msg: 'La contraseña debe tener al menos 8 caracteres'
        }
      }
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'El nombre debe tener entre 2 y 50 caracteres'
        }
      }
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: {
          args: [2, 50],
          msg: 'El apellido debe tener entre 2 y 50 caracteres'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isPhoneNumber(value) {
          if (value && !/^\+?[1-9]\d{1,14}$/.test(value)) {
            throw new Error('Formato de teléfono inválido');
          }
        }
      }
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('client', 'professional', 'admin', 'super_admin', 'gerencia'),
      allowNull: false,
      defaultValue: 'client'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    verification_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verification_token_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    google_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    linkedin_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Preferencias del usuario (notificaciones, idioma, etc.)'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Metadatos adicionales del usuario'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['verification_token']
      },
      {
        fields: ['reset_password_token']
      },
      {
        unique: true,
        fields: ['google_id'],
        where: { google_id: { [sequelize.Sequelize.Op.ne]: null } }
      },
      {
        unique: true,
        fields: ['linkedin_id'],
        where: { linkedin_id: { [sequelize.Sequelize.Op.ne]: null } }
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        // Hashear contraseña si se proporciona
        if (user.password) {
          user.password = await AuthUtils.hashPassword(user.password);
        }
        // Convertir email a minúsculas
        if (user.email) {
          user.email = user.email.toLowerCase();
        }
      },
      beforeUpdate: async (user) => {
        // Hashear contraseña si se modifica
        if (user.changed('password') && user.password) {
          user.password = await AuthUtils.hashPassword(user.password);
        }
        // Convertir email a minúsculas si se modifica
        if (user.changed('email') && user.email) {
          user.email = user.email.toLowerCase();
        }
      }
    }
  }
);

module.exports = User;
