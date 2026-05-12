export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'user';
  activo: boolean;
  createdAt?: string;
}

export interface Partido {
  id: number;
  fase: 'grupos' | '16vos' | '8vos' | 'cuartos' | 'semis' | '3er_puesto' | 'final';
  grupo: string | null;
  equipoLocal: string;
  equipoVisitante: string;
  fechaHora: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  estado: 'pendiente' | 'jugando' | 'finalizado';
}

export interface Pronostico {
  id: number;
  partidoId: number;
  partido?: Partido;
  golesLocal: number;
  golesVisitante: number;
  puntosObtenidos: number | null;
}

export interface RankingEntry {
  posicion: number;
  usuarioId: number;
  nombre: string;
  puntos: number;
  pronosticos: number;
}

export interface ConfiguracionPuntos {
  exacto: number;
  diferencia: number;
  ganador: number;
  error: number;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}
