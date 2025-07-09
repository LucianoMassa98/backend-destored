const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Skill extends Model {}

Skill.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'Skill',
    tableName: 'skills',
    indexes: [
      { fields: ['category'] },
      { fields: ['is_active'] },
      { fields: ['usage_count'] }
    ]
  }
);

module.exports = Skill;
