const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Admin extends Model {}

Admin.init(
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
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Permisos específicos del administrador'
    },
    department: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Admin',
    tableName: 'admins'
  }
);

module.exports = Admin;
