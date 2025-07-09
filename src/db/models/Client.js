const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Client extends Model {}

Client.init(
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
    company_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    company_size: {
      type: DataTypes.ENUM('1-10', '11-50', '51-200', '201-500', '500+'),
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    website_url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    total_spent: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0
    },
    projects_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    preferred_budget_range: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Rango de presupuesto preferido'
    },
    preferred_communication: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Métodos de comunicación preferidos'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    verification_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      defaultValue: 'pending'
    },
    payment_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    stripe_customer_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    billing_address: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Dirección de facturación'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Client',
    tableName: 'clients',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['verification_status'] },
      { fields: ['payment_verified'] }
    ]
  }
);

module.exports = Client;
