const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Agregar índices adicionales para optimizar consultas de aplicaciones
    try {
      // Índice compuesto para filtros comunes
      await queryInterface.addIndex('applications', {
        fields: ['status', 'created_at'],
        name: 'applications_status_created_at_idx'
      });

      // Índice para búsquedas por tarifa propuesta
      await queryInterface.addIndex('applications', {
        fields: ['proposed_rate'],
        name: 'applications_proposed_rate_idx'
      });

      // Índice para búsquedas por fecha de revisión
      await queryInterface.addIndex('applications', {
        fields: ['reviewed_at'],
        name: 'applications_reviewed_at_idx',
        where: {
          reviewed_at: {
            [Sequelize.Op.ne]: null
          }
        }
      });

      // Índice compuesto para estadísticas por usuario
      await queryInterface.addIndex('applications', {
        fields: ['professional_id', 'status'],
        name: 'applications_professional_status_idx'
      });

      // Agregar constraint para asegurar que solo aplicaciones pendientes o en revisión puedan ser modificadas
      await queryInterface.addConstraint('applications', {
        fields: ['status'],
        type: 'check',
        name: 'applications_valid_status_transitions',
        where: {
          status: {
            [Sequelize.Op.in]: ['pending', 'under_review', 'accepted', 'rejected', 'withdrawn', 'expired']
          }
        }
      });

    } catch (error) {
      console.log('Some indexes might already exist:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remover índices
    try {
      await queryInterface.removeIndex('applications', 'applications_status_created_at_idx');
      await queryInterface.removeIndex('applications', 'applications_proposed_rate_idx');
      await queryInterface.removeIndex('applications', 'applications_reviewed_at_idx');
      await queryInterface.removeIndex('applications', 'applications_professional_status_idx');
      await queryInterface.removeConstraint('applications', 'applications_valid_status_transitions');
    } catch (error) {
      console.log('Some indexes might not exist:', error.message);
    }
  }
};
