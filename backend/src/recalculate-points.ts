import { sequelize } from './config/database';
import { Partido } from './models/Partido';
import { calcularPuntosPronosticos } from './services/puntuacion.service';

async function main() {
  try {
    const args = process.argv.slice(2);
    const partidoIdArg = args[0];

    if (partidoIdArg) {
      const partidoId = parseInt(partidoIdArg, 10);
      if (isNaN(partidoId)) {
        console.error('Error: El ID del partido provisto no es un número válido.');
        process.exit(1);
      }

      const partido = await Partido.findByPk(partidoId);
      if (!partido) {
        console.error(`Error: No se encontró el partido con ID ${partidoId}.`);
        process.exit(1);
      }

      console.log(`Recalculando puntos para el partido ID ${partidoId}: ${partido.equipoLocal} vs ${partido.equipoVisitante} (Goles: ${partido.golesLocal}-${partido.golesVisitante})...`);
      await calcularPuntosPronosticos(partidoId);
      console.log('¡Recalculación completada con éxito!');
    } else {
      console.log('Iniciando la recalculación de puntos para todos los partidos finalizados...');
      const partidos = await Partido.findAll({
        where: { estado: 'finalizado' }
      });

      console.log(`Se encontraron ${partidos.length} partidos finalizados.`);

      for (const partido of partidos) {
        console.log(`Recalculando puntos para el partido: ${partido.equipoLocal} vs ${partido.equipoVisitante} (ID: ${partido.id}) - Goles: ${partido.golesLocal}-${partido.golesVisitante}`);
        await calcularPuntosPronosticos(partido.id);
      }
      console.log('¡Recalculación de todos los partidos completada con éxito!');
    }
  } catch (error) {
    console.error('Error al recalcular los puntos:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

main();
