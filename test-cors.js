const axios = require('axios');

// Test de CORS para la API
async function testCORS() {
  const baseURL = process.env.API_URL || 'https://api-destored.up.railway.app';
  
  console.log(`🧪 Probando CORS en: ${baseURL}`);
  
  try {
    // Test 1: Health check
    console.log('\n1. Probando health check...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check exitoso:', healthResponse.data);
    
    // Test 2: CORS test endpoint
    console.log('\n2. Probando endpoint de CORS...');
    const corsResponse = await axios.get(`${baseURL}/api/v1/cors-test`);
    console.log('✅ CORS test exitoso:', corsResponse.data);
    
    // Test 3: Login endpoint (debería fallar por credenciales, pero no por CORS)
    console.log('\n3. Probando endpoint de login...');
    try {
      const loginResponse = await axios.post(`${baseURL}/api/v1/auth/login`, {
        email: 'test@test.com',
        password: 'wrongpassword',
        rememberMe: false
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Login endpoint responde (error 401 esperado)');
      } else if (error.code === 'ECONNREFUSED') {
        console.log('❌ Conexión rechazada - servidor no disponible');
      } else {
        console.log('❌ Error inesperado:', error.message);
      }
    }
    
    console.log('\n🎉 Todos los tests de CORS completados');
    
  } catch (error) {
    console.error('❌ Error en test de CORS:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Asegúrate de que el servidor esté ejecutándose');
    }
  }
}

// Ejecutar test si es llamado directamente
if (require.main === module) {
  testCORS();
}

module.exports = testCORS;
