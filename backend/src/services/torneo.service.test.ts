import { Partido } from '../models/Partido';
import { cerrarFaseEliminatoria, calcularTablaGrupo } from './torneo.service';
import { sequelize } from '../config/database';

// Mock de los modelos de Sequelize si es necesario, 
// pero preferimos usar una DB en memoria o transacciones para tests de integración reales.

describe('Torneo Service - Integración', () => {
  beforeAll(async () => {
    // Aseguramos que la DB esté limpia/sincronizada para el test
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('cerrarFaseEliminatoria', () => {
    it('debe avanzar ganadores de 16vos a 8vos correctamente', async () => {
      // 1. Crear 16 partidos de 16vos finalizados
      const partidos16vos: any[] = [];
      for (let i = 0; i < 16; i++) {
        partidos16vos.push({
          fase: '16vos',
          equipoLocal: `Equipo L${i}`,
          equipoVisitante: `Equipo V${i}`,
          golesLocal: 2,
          golesVisitante: 1,
          ganadorNombre: `Equipo L${i}`,
          estado: 'finalizado',
          fechaHora: new Date(2026, 5, 20, 12 + i)
        });
      }
      await Partido.bulkCreate(partidos16vos);

      // 2. Crear 8 partidos de 8vos pendientes
      const partidos8vos: any[] = [];
      for (let i = 0; i < 8; i++) {
        partidos8vos.push({
          fase: '8vos',
          equipoLocal: 'Por definir',
          equipoVisitante: 'Por definir',
          estado: 'pendiente',
          fechaHora: new Date(2026, 5, 25, 12 + i)
        });
      }
      await Partido.bulkCreate(partidos8vos);

      // 3. Ejecutar el cierre de fase
      await cerrarFaseEliminatoria('16vos');

      // 4. Verificar que los 8vos tengan los ganadores correctos
      const actualizados = await Partido.findAll({
        where: { fase: '8vos' },
        order: [['fechaHora', 'ASC']]
      });

      expect(actualizados[0].equipoLocal).toBe('Equipo L0');
      expect(actualizados[0].equipoVisitante).toBe('Equipo L1');
      expect(actualizados[7].equipoLocal).toBe('Equipo L14');
      expect(actualizados[7].equipoVisitante).toBe('Equipo L15');
    });

    it('debe generar Final y 3er Puesto correctamente al cerrar Semis', async () => {
      // Limpiar y preparar
      await Partido.destroy({ where: {} });

      // Crear 2 semis
      await Partido.bulkCreate([
        { 
          fase: 'semis', equipoLocal: 'Argentina', equipoVisitante: 'Francia', 
          golesLocal: 3, golesVisitante: 2, ganadorNombre: 'Argentina', estado: 'finalizado',
          fechaHora: new Date(2026, 6, 10) 
        },
        { 
          fase: 'semis', equipoLocal: 'Brasil', equipoVisitante: 'España', 
          golesLocal: 1, golesVisitante: 1, ganadorNombre: 'España', estado: 'finalizado', // Gana España por penales
          fechaHora: new Date(2026, 6, 11) 
        }
      ]);

      // Crear Final y 3er Puesto vacíos
      await Partido.create({ fase: 'final', equipoLocal: 'TBD', equipoVisitante: 'TBD', estado: 'pendiente', fechaHora: new Date(2026, 6, 15) });
      await Partido.create({ fase: '3er_puesto', equipoLocal: 'TBD', equipoVisitante: 'TBD', estado: 'pendiente', fechaHora: new Date(2026, 6, 14) });

      // Ejecutar
      await cerrarFaseEliminatoria('semis');

      // Verificar Final
      const final = await Partido.findOne({ where: { fase: 'final' } });
      expect(final?.equipoLocal).toBe('Argentina');
      expect(final?.equipoVisitante).toBe('España');

      // Verificar 3er Puesto
      const tercerPuesto = await Partido.findOne({ where: { fase: '3er_puesto' } });
      expect(tercerPuesto?.equipoLocal).toBe('Francia');
      expect(tercerPuesto?.equipoVisitante).toBe('Brasil');
    });
  });

  describe('calcularTablaGrupo', () => {
    it('debe calcular puntos y diferencia de goles correctamente', async () => {
      await Partido.destroy({ where: {} });
      await Partido.bulkCreate([
        { fase: 'grupos', grupo: 'A', equipoLocal: 'A1', equipoVisitante: 'A2', golesLocal: 2, golesVisitante: 0, estado: 'finalizado', fechaHora: new Date() },
        { fase: 'grupos', grupo: 'A', equipoLocal: 'A3', equipoVisitante: 'A4', golesLocal: 1, golesVisitante: 1, estado: 'finalizado', fechaHora: new Date() },
      ]);

      const tabla = await calcularTablaGrupo('grupos', 'A');
      
      expect(tabla[0].equipo).toBe('A1');
      expect(tabla[0].pts).toBe(3);
      expect(tabla[0].dg).toBe(2);
      
      expect(tabla[1].pts).toBe(1); // A3 o A4 (empate)
      expect(tabla[2].pts).toBe(1);
      expect(tabla[3].pts).toBe(0); // A2 perdió
    });
  });
});
