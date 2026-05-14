import { Router, Request, Response } from 'express';
import { Usuario } from '../models/Usuario';
import { Partido } from '../models/Partido';
import { ConfiguracionPuntos } from '../models/ConfiguracionPuntos';
import { FIXTURE_DATA } from '../data/fixture';

const router = Router();

// Endpoint para inicializar TODO el sistema (Solo para pruebas/setup inicial)
router.post('/full-reset', async (req: Request, res: Response): Promise<void> => {
  const { secret } = req.body;
  
  // Seguridad simple: requiere un secreto para no resetear por error
  if (secret !== process.env.ADMIN_SECRET && process.env.NODE_ENV === 'production') {
    res.status(401).json({ error: 'No autorizado para resetear producción' });
    return;
  }

  try {
    // 1. Limpiar datos existentes (Opcional, ten cuidado)
    await Partido.destroy({ where: {} });
    
    // 2. Cargar Fixture de Grupos
    let partidosCreados = 0;
    for (const [grupo, data] of Object.entries(FIXTURE_DATA.grupos)) {
      for (const p of data.partidos) {
        await Partido.create({
          fase: 'grupos',
          grupo,
          equipoLocal: p.local,
          equipoVisitante: p.visitante,
          fechaHora: new Date(p.fecha),
          estado: 'pendiente'
        });
        partidosCreados++;
      }
    }

    // 3. Crear Admin si no existe
    const [admin, created] = await Usuario.findOrCreate({
      where: { email: 'admin@prode2026.com' },
      defaults: {
        nombre: 'Administrador',
        email: 'admin@prode2026.com',
        rol: 'admin'
      }
    });

    // 4. Asegurar configuración de puntos
    const configs = [
      { tipo: 'exacto' as const, puntos: 3 },
      { tipo: 'diferencia' as const, puntos: 2 },
      { tipo: 'ganador' as const, puntos: 1 },
      { tipo: 'error' as const, puntos: 0 }
    ];

    for (const c of configs) {
      await ConfiguracionPuntos.findOrCreate({
        where: { tipo: c.tipo },
        defaults: { 
          tipo: c.tipo,
          puntos: c.puntos, 
          activo: true 
        }
      });
    }

    res.json({
      mensaje: 'Sistema inicializado correctamente',
      partidos: partidosCreados,
      adminCreated: created
    });
  } catch (error) {
    console.error('Error en seed:', error);
    res.status(500).json({ error: 'Error al poblar la base de datos' });
  }
});

export default router;
