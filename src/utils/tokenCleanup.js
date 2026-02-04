// Script para limpiar tokens inválidos del localStorage
// Ejecutar en la consola del navegador: clearInvalidTokens()

function clearInvalidTokens() {
  console.log('🧹 Limpiando tokens inválidos...');
  
  // Lista de posibles claves de tokens
  const tokenKeys = [
    'naxos_auth_token',
    'token',
    'auth_token',
    'jwt_token',
    'access_token',
    'user_token'
  ];
  
  // Lista de posibles claves de usuario
  const userKeys = [
    'naxos_user',
    'user',
    'auth_user',
    'current_user'
  ];
  
  let clearedTokens = 0;
  let clearedUsers = 0;
  
  // Limpiar tokens
  tokenKeys.forEach(key => {
    const token = localStorage.getItem(key);
    if (token) {
      console.log(`🗑️ Eliminando token: ${key}`);
      localStorage.removeItem(key);
      clearedTokens++;
      
      // Verificar si el token está expirado
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : false;
        console.log(`   Token expirado: ${isExpired}`);
        if (payload.exp) {
          const expiryDate = new Date(payload.exp * 1000);
          console.log(`   Fecha de expiración: ${expiryDate.toLocaleString()}`);
        }
      } catch (e) {
        console.log(`   Token inválido o malformado`);
      }
    }
  });
  
  // Limpiar datos de usuario
  userKeys.forEach(key => {
    const userData = localStorage.getItem(key);
    if (userData) {
      console.log(`🗑️ Eliminando datos de usuario: ${key}`);
      localStorage.removeItem(key);
      clearedUsers++;
    }
  });
  
  // Limpiar cualquier otra clave que pueda contener información sensible
  const allKeys = Object.keys(localStorage);
  const suspiciousKeys = allKeys.filter(key => 
    key.toLowerCase().includes('token') || 
    key.toLowerCase().includes('auth') ||
    key.toLowerCase().includes('user') ||
    key.toLowerCase().includes('session')
  );
  
  suspiciousKeys.forEach(key => {
    if (!tokenKeys.includes(key) && !userKeys.includes(key)) {
      console.log(`🗑️ Eliminando clave sospechosa: ${key}`);
      localStorage.removeItem(key);
      clearedTokens++;
    }
  });
  
  console.log(`✅ Limpieza completada:`);
  console.log(`   - Tokens eliminados: ${clearedTokens}`);
  console.log(`   - Usuarios eliminados: ${clearedUsers}`);
  console.log(`   - Total de claves eliminadas: ${clearedTokens + clearedUsers}`);
  
  // Verificar que no quedaron tokens
  const remainingTokens = allKeys.filter(key => 
    key.toLowerCase().includes('token') || 
    key.toLowerCase().includes('auth')
  );
  
  if (remainingTokens.length > 0) {
    console.log(`⚠️ Quedan claves sospechosas: ${remainingTokens.join(', ')}`);
  } else {
    console.log(`✅ No quedan tokens o claves de autenticación`);
  }
  
  // Redirigir al login
  console.log(`🔄 Redirigiendo al login en 2 segundos...`);
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
}

// Función para validar el token actual
function validateCurrentToken() {
  const token = localStorage.getItem('naxos_auth_token') || localStorage.getItem('token');
  
  if (!token) {
    console.log('❌ No hay token almacenado');
    return false;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log('📋 Información del token:');
    console.log(`   Usuario: ${payload.username || payload.userId || 'N/A'}`);
    console.log(`   Rol: ${payload.role || 'N/A'}`);
    
    if (payload.exp) {
      const expiryDate = new Date(payload.exp * 1000);
      const isExpired = payload.exp < currentTime;
      const remainingTime = payload.exp - currentTime;
      
      console.log(`   Expirado: ${isExpired ? 'Sí' : 'No'}`);
      console.log(`   Fecha de expiración: ${expiryDate.toLocaleString()}`);
      console.log(`   Tiempo restante: ${Math.floor(remainingTime / 60)} minutos`);
      
      if (isExpired) {
        console.log('❌ El token ha expirado');
        return false;
      } else if (remainingTime < 3600) {
        console.log('⚠️ El token expirará en menos de 1 hora');
      }
    } else {
      console.log('⚠️ El token no tiene fecha de expiración');
    }
    
    console.log('✅ Token válido');
    return true;
  } catch (error) {
    console.log('❌ Error al validar el token:', error.message);
    return false;
  }
}

// Hacer las funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.clearInvalidTokens = clearInvalidTokens;
  window.validateCurrentToken = validateCurrentToken;
  
  console.log('🔧 Funciones disponibles:');
  console.log('   - clearInvalidTokens() - Limpia todos los tokens inválidos');
  console.log('   - validateCurrentToken() - Valida el token actual');
  console.log('');
  console.log('📊 Estado actual:');
  validateCurrentToken();
}
