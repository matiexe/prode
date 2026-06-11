import { sequelize, testConnection } from './config/database';
import { Usuario } from './models/Usuario';

async function verify() {
  try {
    console.log('--- Verificando Configuración de Base de Datos ---');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Definida (oculta)' : 'No definida');
    
    await testConnection();
    
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tablas encontradas en el esquema público:', results.map((r: any) => r.table_name));
    
    if (results.length === 0) {
      console.warn('¡ADVERTENCIA!: No se encontraron tablas. Intentando sincronizar...');
      await sequelize.sync();
      console.log('Sincronización completada.');
    } else {
      console.log('Conexión y tablas verificadas exitosamente.');
    }

  } catch (error: any) {
    console.error('Error durante la verificación:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

verify();
