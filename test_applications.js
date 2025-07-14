const ApplicationService = require('./src/services/ApplicationService');
const { Application, User, Professional, Project } = require('./src/db/models');

async function testApplications() {
  try {
    console.log('=== Test de Aplicaciones ===');
    
    // 1. Verificar que hay aplicaciones en la base de datos
    const totalApplications = await Application.count();
    console.log(`Total de aplicaciones en BD: ${totalApplications}`);
    
    // 2. Mostrar todas las aplicaciones con sus IDs de profesional
    const allApplications = await Application.findAll({
      attributes: ['id', 'professional_id', 'project_id', 'status'],
      limit: 10
    });
    
    console.log('\nPrimeras 10 aplicaciones:');
    allApplications.forEach(app => {
      console.log(`- ID: ${app.id}, Professional ID: ${app.professional_id}, Project ID: ${app.project_id}, Status: ${app.status}`);
    });
    
    // 3. Verificar que hay usuarios profesionales
    const professionals = await User.findAll({
      where: { role: 'professional' },
      attributes: ['id', 'first_name', 'last_name', 'role'],
      limit: 5
    });
    
    console.log('\nProfesionales en BD:');
    professionals.forEach(prof => {
      console.log(`- ID: ${prof.id}, Nombre: ${prof.first_name} ${prof.last_name}, Role: ${prof.role}`);
    });
    
    // 4. Test del servicio con filtro de professional_id
    if (allApplications.length > 0 && professionals.length > 0) {
      const testProfessionalId = allApplications[0].professional_id;
      console.log(`\n=== Probando con professional_id: ${testProfessionalId} ===`);
      
      // Test como admin
      const resultAdmin = await ApplicationService.getApplications(
        { professional_id: testProfessionalId },
        { page: 1, limit: 10 },
        'admin',
        'some-admin-id'
      );
      
      console.log(`Resultado como admin: ${resultAdmin.applications.length} aplicaciones encontradas`);
      
      // Test como client
      const resultClient = await ApplicationService.getApplications(
        { professional_id: testProfessionalId },
        { page: 1, limit: 10 },
        'client',
        'some-client-id'
      );
      
      console.log(`Resultado como client: ${resultClient.applications.length} aplicaciones encontradas`);
      
      // Test directo con Sequelize
      const directResult = await Application.findAll({
        where: { professional_id: testProfessionalId },
        limit: 5
      });
      
      console.log(`Consulta directa: ${directResult.length} aplicaciones encontradas`);
    }
    
  } catch (error) {
    console.error('Error en test:', error);
  }
}

testApplications();
