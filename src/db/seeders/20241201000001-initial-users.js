'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insertar usuarios administradores
    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@destored.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        firstName: 'Manager',
        lastName: 'System',
        email: 'manager@destored.com',
        password: hashedPassword,
        role: 'gerencia',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Insertar perfiles de admin
    await queryInterface.bulkInsert('Admins', [
      {
        id: 1,
        userId: 1,
        accessLevel: 'super_admin',
        permissions: JSON.stringify([
          'user_management',
          'content_moderation',
          'system_settings',
          'analytics',
          'payments',
          'disputes'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        userId: 2,
        accessLevel: 'manager',
        permissions: JSON.stringify([
          'content_moderation',
          'analytics',
          'user_support'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Insertar categorías de habilidades
    const skillCategories = [
      'Desarrollo Web',
      'Desarrollo Móvil',
      'Diseño Gráfico',
      'UI/UX Design',
      'Marketing Digital',
      'Redacción',
      'Traducción',
      'Video Editing',
      'Fotografía',
      'Consultoría'
    ];

    // Insertar usuarios profesionales de ejemplo
    const professionalsData = [];
    const usersData = [];
    
    for (let i = 3; i <= 12; i++) {
      const hashedProfPassword = await bcrypt.hash('prof123', 10);
      usersData.push({
        id: i,
        firstName: `Profesional${i}`,
        lastName: `Test${i}`,
        email: `prof${i}@test.com`,
        password: hashedProfPassword,
        role: 'professional',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      professionalsData.push({
        id: i - 2,
        userId: i,
        title: `${skillCategories[(i - 3) % skillCategories.length]} Specialist`,
        description: `Profesional especializado en ${skillCategories[(i - 3) % skillCategories.length]}`,
        category: skillCategories[(i - 3) % skillCategories.length].toLowerCase().replace(/[^a-z0-9]/g, '_'),
        experienceYears: Math.floor(Math.random() * 10) + 1,
        hourlyRate: Math.floor(Math.random() * 100) + 20,
        location: 'Colombia',
        isAvailable: true,
        languages: JSON.stringify(['Español', 'Inglés']),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Users', usersData, {});
    await queryInterface.bulkInsert('Professionals', professionalsData, {});

    // Insertar clientes de ejemplo
    const clientsUsersData = [];
    const clientsData = [];
    
    for (let i = 13; i <= 17; i++) {
      const hashedClientPassword = await bcrypt.hash('client123', 10);
      clientsUsersData.push({
        id: i,
        firstName: `Cliente${i}`,
        lastName: `Test${i}`,
        email: `client${i}@test.com`,
        password: hashedClientPassword,
        role: 'client',
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      clientsData.push({
        id: i - 12,
        userId: i,
        companyName: `Empresa Test ${i}`,
        industry: 'Tecnología',
        companySize: 'mediana',
        description: `Empresa especializada en soluciones tecnológicas ${i}`,
        location: 'Colombia',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('Users', clientsUsersData, {});
    await queryInterface.bulkInsert('Clients', clientsData, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Clients', null, {});
    await queryInterface.bulkDelete('Professionals', null, {});
    await queryInterface.bulkDelete('Admins', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
