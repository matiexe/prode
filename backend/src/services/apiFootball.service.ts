import { Partido } from '../models/Partido';
import { Op } from 'sequelize';

const TRANSLATION_MAP: Record<string, string> = {
  'Mexico': 'México',
  'South Korea': 'Corea del Sur',
  'South Africa': 'Sudáfrica',
  'Czech Republic': 'República Checa',
  'Canada': 'Canadá',
  'Bosnia & Herzegovina': 'Bosnia y Herzegovina',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  'Qatar': 'Qatar',
  'Switzerland': 'Suiza',
  'Brasil': 'Brasil',
  'Brazil': 'Brasil',
  'Morocco': 'Marruecos',
  'Haiti': 'Haití',
  'Scotland': 'Escocia',
  'USA': 'Estados Unidos',
  'United States': 'Estados Unidos',
  'Paraguay': 'Paraguay',
  'Australia': 'Australia',
  'Turkey': 'Turquía',
  'Germany': 'Alemania',
  'Curacao': 'Curazao',
  'Ivory Coast': 'Costa de Marfil',
  'Ecuador': 'Ecuador',
  'Netherlands': 'Países Bajos',
  'Japan': 'Japón',
  'Sweden': 'Suecia',
  'Tunisia': 'Túnez',
  'Belgium': 'Bélgica',
  'Egypt': 'Egipto',
  'Iran': 'Irán',
  'New Zealand': 'Nueva Zelanda',
  'Spain': 'España',
  'Croatia': 'Croacia',
  'Iraq': 'Irak',
  'Algeria': 'Argelia',
  'Argentina': 'Argentina',
  'Uzbekistan': 'Uzbekistán',
  'Cape Verde': 'Cabo Verde',
  'Wales': 'Gales',
  'England': 'Inglaterra',
  'Mali': 'Malí',
  'Honduras': 'Honduras',
  'Saudi Arabia': 'Arabia Saudita',
  'Italy': 'Italia',
  'Cameroon': 'Camerún',
  'Jamaica': 'Jamaica',
  'Albania': 'Albania',
  'France': 'Francia',
  'Venezuela': 'Venezuela',
  'Oman': 'Omán',
  'Costa Rica': 'Costa Rica',
  'Portugal': 'Portugal',
  'Colombia': 'Colombia',
  'Angola': 'Angola',
  'Panama': 'Panamá',
  'Denmark': 'Dinamarca',
  'Uruguay': 'Uruguay',
  'Fiji': 'Fiyi',
  'Peru': 'Perú',
  'Chile': 'Chile',
  'Ghana': 'Ghana',
  'Senegal': 'Senegal',
  'Poland': 'Polonia',
  'Ukraine': 'Ucrania',
  'Austria': 'Austria'
};

const normalizeName = (name: string): string => {
  const normalized = name.trim();
  return TRANSLATION_MAP[normalized] || normalized;
};

export async function sincronizarResultadosEnVivo(): Promise<{
  procesados: number;
  actualizados: number;
  errores: string[];
  detalles: string[];
}> {
  const apiKey = process.env.API_FOOTBALL_KEY || process.env.NEXT_PUBLIC_API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno API_FOOTBALL_KEY no está configurada.');
  }

  // 1. Obtener los partidos no finalizados de la base de datos
  const partidosPendientes = await Partido.findAll({
    where: {
      estado: {
        [Op.in]: ['pendiente', 'jugando']
      }
    }
  });

  if (partidosPendientes.length === 0) {
    return { procesados: 0, actualizados: 0, errores: [], detalles: ['No hay partidos pendientes en la base de datos.'] };
  }

  // 2. Determinar si hay algún partido programado para hoy (o dentro de +/- 24 horas del momento actual)
  const ahora = new Date();
  const unDiaMs = 24 * 60 * 60 * 1000;
  const partidosHoy = partidosPendientes.filter(p => {
    const pFecha = new Date(p.fechaHora);
    return Math.abs(pFecha.getTime() - ahora.getTime()) <= unDiaMs;
  });

  if (partidosHoy.length === 0) {
    return {
      procesados: 0,
      actualizados: 0,
      errores: [],
      detalles: ['No hay partidos programados para hoy en el rango de 24 horas. No se consume cuota de API.']
    };
  }

  // 3. Obtener ayer, hoy y mañana para cubrir cualquier diferencia horaria
  const fechasLlamar = new Set<string>();
  [new Date(ahora.getTime() - unDiaMs), ahora, new Date(ahora.getTime() + unDiaMs)].forEach(d => {
    fechasLlamar.add(d.toISOString().split('T')[0]);
  });

  let apiFixtures: any[] = [];
  const erroresLlamadas: string[] = [];

  for (const dateStr of fechasLlamar) {
    try {
      console.log(`[API-FOOTBALL] Fetching fixtures for date: ${dateStr}`);
      const url = `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${dateStr}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-apisports-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resData: any = await response.json();
      if (resData && resData.response) {
        apiFixtures = apiFixtures.concat(resData.response);
      }
    } catch (err: any) {
      console.error(`Error al llamar a API-Football para la fecha ${dateStr}:`, err.message);
      erroresLlamadas.push(`Fecha ${dateStr}: ${err.message}`);
    }
  }

  if (apiFixtures.length === 0) {
    return {
      procesados: 0,
      actualizados: 0,
      errores: erroresLlamadas,
      detalles: ['No se obtuvieron partidos de la API de fútbol.']
    };
  }

  let actualizadosCount = 0;
  const detalles: string[] = [];

  for (const apiFix of apiFixtures) {
    const homeName = apiFix.teams.home.name;
    const awayName = apiFix.teams.away.name;
    const statusShort = apiFix.fixture.status.short;
    const goalsHome = apiFix.goals.home;
    const goalsAway = apiFix.goals.away;

    const normHome = normalizeName(homeName);
    const normAway = normalizeName(awayName);

    // Buscar en nuestros partidos pendientes
    const partidoDb = partidosPendientes.find(p => {
      if (p.equipoLocal === 'Por definir' || p.equipoVisitante === 'Por definir') return false;
      
      return (p.equipoLocal === normHome && p.equipoVisitante === normAway) ||
             (p.equipoLocal === normAway && p.equipoVisitante === normHome);
    });

    if (partidoDb) {
      let modificado = false;
      const updates: any = {};

      const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE'];
      const finishedStatuses = ['FT', 'AET', 'PEN'];

      if (liveStatuses.includes(statusShort)) {
        if (partidoDb.estado !== 'jugando') {
          updates.estado = 'jugando';
          modificado = true;
        }
        if (partidoDb.golesLocal !== goalsHome || partidoDb.golesVisitante !== goalsAway) {
          updates.golesLocal = goalsHome;
          updates.golesVisitante = goalsAway;
          modificado = true;
        }
      } else if (finishedStatuses.includes(statusShort)) {
        updates.estado = 'finalizado';
        updates.golesLocal = goalsHome;
        updates.golesVisitante = goalsAway;

        // Determinar ganador
        let ganador = null;
        if (goalsHome > goalsAway) {
          ganador = normHome === partidoDb.equipoLocal ? partidoDb.equipoLocal : partidoDb.equipoVisitante;
        } else if (goalsAway > goalsHome) {
          ganador = normAway === partidoDb.equipoVisitante ? partidoDb.equipoVisitante : partidoDb.equipoLocal;
        } else {
          // Fase eliminatoria con penales
          if (partidoDb.fase !== 'grupos') {
            const apiPenaltyHome = apiFix.score?.penalty?.home;
            const apiPenaltyAway = apiFix.score?.penalty?.away;
            if (apiPenaltyHome !== null && apiPenaltyAway !== null && apiPenaltyHome !== undefined) {
              if (apiPenaltyHome > apiPenaltyAway) {
                ganador = normHome === partidoDb.equipoLocal ? partidoDb.equipoLocal : partidoDb.equipoVisitante;
              } else if (apiPenaltyAway > apiPenaltyHome) {
                ganador = normAway === partidoDb.equipoVisitante ? partidoDb.equipoVisitante : partidoDb.equipoLocal;
              }
            }
            if (!ganador) {
              ganador = partidoDb.equipoLocal;
            }
          }
        }
        updates.ganadorNombre = ganador;
        modificado = true;
      }

      if (modificado) {
        console.log(`[API-FOOTBALL] Actualizando partido ${partidoDb.id} (${partidoDb.equipoLocal} vs ${partidoDb.equipoVisitante}). Goles: ${goalsHome}-${goalsAway}, Estado: ${updates.estado || partidoDb.estado}`);
        await partidoDb.update(updates);
        actualizadosCount++;
        detalles.push(`Partido ${partidoDb.id} (${partidoDb.equipoLocal} vs ${partidoDb.equipoVisitante}) actualizado a goles: ${goalsHome}-${goalsAway}, estado: ${updates.estado || partidoDb.estado}`);

        // Si ha finalizado, calculamos puntos
        if (updates.estado === 'finalizado') {
          try {
            const { calcularPuntosPronosticos } = await import('./puntuacion.service');
            await calcularPuntosPronosticos(partidoDb.id);
            detalles.push(`Calculados los puntos de pronósticos para el partido ${partidoDb.id}.`);
          } catch (calcErr: any) {
            console.error(`Error al calcular puntos para el partido ${partidoDb.id}:`, calcErr.message);
            erroresLlamadas.push(`Calculador puntos P${partidoDb.id}: ${calcErr.message}`);
          }
        }
      }
    }
  }

  return {
    procesados: apiFixtures.length,
    actualizados: actualizadosCount,
    errores: erroresLlamadas,
    detalles
  };
}
