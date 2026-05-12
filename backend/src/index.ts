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
app.use('/api/partidos', partidosRouter);
app.use('/api/admin/partidos', partidosAdminRouter);
app.use('/api/pronosticos', pronosticosRoutes);
app.use('/api/admin/configuracion', configuracionRoutes);
app.use('/api/seed', seedRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start(): Promise<void> {
  try {
    await testConnection();
    await sequelize.sync();
    console.log('Modelos sincronizados con la base de datos.');

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

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
      console.log(`Documentacion API: http://0.0.0.0:${PORT}/api/docs`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

start();
