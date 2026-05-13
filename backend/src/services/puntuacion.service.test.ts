import { Partido } from '../models/Partido';
import { Pronostico } from '../models/Pronostico';
import { ConfiguracionPuntos } from '../models/ConfiguracionPuntos';

// Mock de los modelos de Sequelize antes de importar el servicio
jest.mock('../models/Partido', () => ({
  Partido: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    hasMany: jest.fn(),
  }
}));

jest.mock('../models/Pronostico', () => ({
  Pronostico: {
    findAll: jest.fn(),
    belongsTo: jest.fn(),
  }
}));

jest.mock('../models/Usuario', () => ({
  Usuario: {
    hasMany: jest.fn(),
  }
}));

jest.mock('../models/ConfiguracionPuntos', () => ({
  ConfiguracionPuntos: {
    findAll: jest.fn(),
  }
}));

// Importar el servicio después de los mocks
import { calcularPuntosPronosticos } from './puntuacion.service';

describe('puntuacion.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deberia calcular puntos exactos (3 puntos)', async () => {
    (Partido.findByPk as jest.Mock).mockResolvedValue({
      get: () => ({ id: 1, golesLocal: 2, golesVisitante: 1 })
    });

    (ConfiguracionPuntos.findAll as jest.Mock).mockResolvedValue([
      { tipo: 'exacto', puntos: 3, activo: true },
      { tipo: 'diferencia', puntos: 2, activo: true },
      { tipo: 'ganador', puntos: 1, activo: true },
      { tipo: 'error', puntos: 0, activo: true }
    ]);

    const mockUpdate = jest.fn();
    (Pronostico.findAll as jest.Mock).mockResolvedValue([
      { 
        get: () => ({ id: 10, partidoId: 1, golesLocal: 2, golesVisitante: 1 }),
        update: mockUpdate
      }
    ]);

    await calcularPuntosPronosticos(1);

    expect(mockUpdate).toHaveBeenCalledWith({ puntosObtenidos: 3 });
  });

  it('deberia calcular puntos por diferencia de gol (2 puntos)', async () => {
    (Partido.findByPk as jest.Mock).mockResolvedValue({
      get: () => ({ id: 1, golesLocal: 2, golesVisitante: 1 })
    });

    (ConfiguracionPuntos.findAll as jest.Mock).mockResolvedValue([
      { tipo: 'exacto', puntos: 3, activo: true },
      { tipo: 'diferencia', puntos: 2, activo: true },
      { tipo: 'ganador', puntos: 1, activo: true }
    ]);

    const mockUpdate = jest.fn();
    (Pronostico.findAll as jest.Mock).mockResolvedValue([
      { 
        get: () => ({ id: 11, partidoId: 1, golesLocal: 1, golesVisitante: 0 }),
        update: mockUpdate
      }
    ]);

    await calcularPuntosPronosticos(1);

    expect(mockUpdate).toHaveBeenCalledWith({ puntosObtenidos: 2 });
  });

  it('deberia calcular puntos solo por ganador (1 punto)', async () => {
    (Partido.findByPk as jest.Mock).mockResolvedValue({
      get: () => ({ id: 1, golesLocal: 3, golesVisitante: 0 })
    });

    (ConfiguracionPuntos.findAll as jest.Mock).mockResolvedValue([
      { tipo: 'exacto', puntos: 3, activo: true },
      { tipo: 'diferencia', puntos: 2, activo: true },
      { tipo: 'ganador', puntos: 1, activo: true }
    ]);

    const mockUpdate = jest.fn();
    (Pronostico.findAll as jest.Mock).mockResolvedValue([
      { 
        get: () => ({ id: 12, partidoId: 1, golesLocal: 1, golesVisitante: 0 }),
        update: mockUpdate
      }
    ]);

    await calcularPuntosPronosticos(1);

    expect(mockUpdate).toHaveBeenCalledWith({ puntosObtenidos: 1 });
  });

  it('deberia asignar 0 puntos si no acerto nada', async () => {
    (Partido.findByPk as jest.Mock).mockResolvedValue({
      get: () => ({ id: 1, golesLocal: 1, golesVisitante: 1 })
    });

    (ConfiguracionPuntos.findAll as jest.Mock).mockResolvedValue([
      { tipo: 'exacto', puntos: 3, activo: true },
      { tipo: 'ganador', puntos: 1, activo: true },
      { tipo: 'error', puntos: 0, activo: true }
    ]);

    const mockUpdate = jest.fn();
    (Pronostico.findAll as jest.Mock).mockResolvedValue([
      { 
        get: () => ({ id: 13, partidoId: 1, golesLocal: 2, golesVisitante: 0 }),
        update: mockUpdate
      }
    ]);

    await calcularPuntosPronosticos(1);

    expect(mockUpdate).toHaveBeenCalledWith({ puntosObtenidos: 0 });
  });
});

