import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { sequelize, testConnection } from './config/database';
import { DataTypes } from 'sequelize';
import { ConfiguracionPuntos } from './models/ConfiguracionPuntos';
import { Usuario } from './models/Usuario';
import { CodigoOTP } from './models/CodigoOTP';
import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import { partidosRouter, partidosAdminRouter } from './routes/partidos.routes';
import pronosticosRoutes from './routes/pronosticos.routes';
import configuracionRoutes from './routes/configuracion.routes';
import adminRoutes from './routes/admin.routes';
import seedRoutes from './routes/seed.routes';
import notificacionesRoutes from './routes/notificaciones.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}));
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/admin/usuarios', usuariosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/partidos', partidosRouter);
app.use('/api/admin/partidos', partidosAdminRouter);
app.use('/api/pronosticos', pronosticosRoutes);
app.use('/api/admin/configuracion', configuracionRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/notificaciones', notificacionesRoutes);


let dbInitializationPromise: Promise<void> | null = null;

async function initializeDb() {
  try {
    await testConnection();
    console.log('[DB] Conexión verificada exitosamente.');
    
    // Solo realizamos conteos básicos si es necesario, 
    // pero evitamos sync({alter: true}) y parches SQL pesados aquí.
  } catch (error) {
    console.error('Error al verificar la base de datos:', error);
    dbInitializationPromise = null;
    throw error;
  }
}

// Middleware para asegurar inicialización de DB en la primera petición (Warm start)
app.use(async (_req, _res, next) => {
  if (!dbInitializationPromise) {
    dbInitializationPromise = initializeDb();
  }
  
  try {
    await dbInitializationPromise;
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    const [results]: any = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = Array.isArray(results) ? results.map((r: any) => r.table_name) : [];
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: sequelize.getDatabaseName(),
      host: (sequelize.connectionManager as any).config.host,
      tables,
      env: process.env.NODE_ENV
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      database: sequelize.getDatabaseName(),
      host: (sequelize.connectionManager as any).config.host,
      env: process.env.NODE_ENV
    });
  }
});

// En desarrollo local arrancamos el servidor manualmente
if (process.env.NODE_ENV !== 'production') {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

// Exportamos para que Vercel pueda manejar el servidor express
export default app;
