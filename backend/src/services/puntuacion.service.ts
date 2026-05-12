import { Partido } from '../models/Partido';
import { Pronostico } from '../models/Pronostico';
import { ConfiguracionPuntos } from '../models/ConfiguracionPuntos';

export async function calcularPuntosPronosticos(partidoId: number): Promise<void> {
  const partidoRow = await Partido.findByPk(partidoId);
  if (!partidoRow) return;

  const partido = partidoRow.get({ plain: true });
  if (partido.golesLocal === null || partido.golesVisitante === null) return;

  const config = await ConfiguracionPuntos.findAll({ where: { activo: true } });
  const puntosMap: Record<string, number> = {};
  for (const item of config) {
    puntosMap[item.tipo] = item.puntos;
  }

  const pronosticosRows = await Pronostico.findAll({ where: { partidoId } });
  const diffReal = partido.golesLocal - partido.golesVisitante;

  for (const row of pronosticosRows) {
    const pronostico = row.get({ plain: true });
    let puntos = 0;
    const diffProno = pronostico.golesLocal - pronostico.golesVisitante;

    if (pronostico.golesLocal === partido.golesLocal && pronostico.golesVisitante === partido.golesVisitante) {
      puntos = puntosMap['exacto'] ?? 3;
    } else if (diffReal !== 0) {
      if (diffProno === diffReal) {
        puntos = puntosMap['diferencia'] ?? 2;
      } else if (Math.sign(diffProno) === Math.sign(diffReal)) {
        puntos = puntosMap['ganador'] ?? 1;
      } else {
        puntos = puntosMap['error'] ?? 0;
      }
    } else {
      if (diffProno === 0) {
        puntos = puntosMap['ganador'] ?? 1;
      } else {
        puntos = puntosMap['error'] ?? 0;
      }
    }

    await row.update({ puntosObtenidos: puntos });
  }
}
