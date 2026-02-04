// Script para probar la creación de usuarios
// Copiar y pegar en la consola del navegador

async function testUserCreation() {
  const testData = [
    {
      username: '123456789',
      email: 'test@example.com',
      name: 'Usuario de Prueba',
      password: 'password123',
      role: 'OPERARIO'
    },
    {
      username: '987654321',
      email: '',
      name: 'Usuario Sin Email',
      password: 'password123',
      role: 'OPERARIO'
    },
    {
      username: '111111111',
      email: 'invalid-email',
      name: 'Usuario Email Invalido',
      password: 'password123',
      role: 'OPERARIO'
    }
  ];

  for (const data of testData) {
    console.log('🧪 Probando creación de usuario:', data);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Usuario creado exitosamente:', result);
      } else {
        console.log('❌ Error al crear usuario:', result);
      }
    } catch (error) {
      console.log('💥 Error de red:', error);
    }
    
    console.log('---');
  }
}

// Ejecutar prueba
console.log('🚀 Iniciando pruebas de creación de usuarios...');
testUserCreation();
