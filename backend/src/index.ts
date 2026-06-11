import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { sequelize, testConnection } from './config/database';
import { ConfiguracionPuntos } from './models/ConfiguracionPuntos';
import { Usuario } from './models/Usuario';
import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import { partidosRouter, partidosAdminRouter } from './routes/partidos.routes';
import pronosticosRoutes from './routes/pronosticos.routes';
import configuracionRoutes from './routes/configuracion.routes';
import adminRoutes from './routes/admin.routes';
import seedRoutes from './routes/seed.routes';

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

let dbInitializationPromise: Promise<void> | null = null;

async function initializeDb() {
  try {
    await testConnection();
    
    // Forzamos la creación/actualización del esquema
    await sequelize.sync({ alter: true });
    
    // Intento manual de agregar la columna por si alter:true falla en Vercel Postgres
    try {
      console.log('[DB] Verificando columna "ganador_nombre" manualmente...');
      await sequelize.query('ALTER TABLE "partidos" ADD COLUMN IF NOT EXISTS "ganador_nombre" VARCHAR(255)');
      console.log('[DB] Columna "ganador_nombre" asegurada.');
    } catch (sqlErr) {
      console.warn('[DB] Nota: No se pudo ejecutar ALTER TABLE manual (puede que ya exista):', (sqlErr as any).message);
    }

    console.log('Modelos sincronizados y esquema actualizado con la base de datos.');

    const configCount = await ConfiguracionPuntos.count();
    if (configCount === 0) {
      await ConfiguracionPuntos.bulkCreate([
        { tipo: 'exacto', puntos: 3, activo: true },
        { tipo: 'diferencia', puntos: 2, activo: true },
        { tipo: 'ganador', puntos: 1, activo: true },
        { tipo: 'error', puntos: 0, activo: true },
      ]);
      console.log('Configuracion de puntos por defecto creada.');
    }

    const adminCount = await Usuario.count({ where: { rol: 'admin' } });
    if (adminCount === 0) {
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@prode2026.com',
        rol: 'admin',
      });
      console.log('Usuario administrador creado (admin@prode2026.com).');
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    dbInitializationPromise = null; // Permitir reintento en la siguiente petición si falla
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
