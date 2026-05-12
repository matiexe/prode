export interface PartidoFixture {
  jornada: number;
  fecha: string;
  local: string;
  visitante: string;
}

export interface GrupoFixture {
  equipos: string[];
  partidos: PartidoFixture[];
}

export interface FixtureData {
  grupos: Record<string, GrupoFixture>;
}

function g(jornada: number, fecha: string, local: string, visitante: string): PartidoFixture {
  return { jornada, fecha, local, visitante };
}

export const FIXTURE_DATA: FixtureData = {
  grupos: {
    A: {
      equipos: ['Mexico', 'Sudafrica', 'Corea del Sur', 'Republica Checa'],
      partidos: [
        g(1, '2026-06-11T19:00:00Z', 'Mexico', 'Sudafrica'),
        g(1, '2026-06-11T22:00:00Z', 'Corea del Sur', 'Republica Checa'),
        g(2, '2026-06-18T17:00:00Z', 'Republica Checa', 'Sudafrica'),
        g(2, '2026-06-18T21:00:00Z', 'Mexico', 'Corea del Sur'),
        g(3, '2026-06-24T17:00:00Z', 'Sudafrica', 'Corea del Sur'),
        g(3, '2026-06-24T21:00:00Z', 'Republica Checa', 'Mexico'),
      ],
    },
    B: {
      equipos: ['Canada', 'Bosnia y Herzegovina', 'Catar', 'Suiza'],
      partidos: [
        g(1, '2026-06-12T19:00:00Z', 'Canada', 'Bosnia y Herzegovina'),
        g(1, '2026-06-12T22:00:00Z', 'Catar', 'Suiza'),
        g(2, '2026-06-18T17:00:00Z', 'Catar', 'Canada'),
        g(2, '2026-06-18T21:00:00Z', 'Bosnia y Herzegovina', 'Suiza'),
        g(3, '2026-06-24T17:00:00Z', 'Suiza', 'Canada'),
        g(3, '2026-06-24T21:00:00Z', 'Bosnia y Herzegovina', 'Catar'),
      ],
    },
    C: {
      equipos: ['Brasil', 'Marruecos', 'Haiti', 'Nueva Zelanda'],
      partidos: [
        g(1, '2026-06-13T19:00:00Z', 'Brasil', 'Marruecos'),
        g(1, '2026-06-13T22:00:00Z', 'Haiti', 'Nueva Zelanda'),
        g(2, '2026-06-19T17:00:00Z', 'Haiti', 'Brasil'),
        g(2, '2026-06-19T21:00:00Z', 'Marruecos', 'Nueva Zelanda'),
        g(3, '2026-06-25T17:00:00Z', 'Nueva Zelanda', 'Brasil'),
        g(3, '2026-06-25T21:00:00Z', 'Marruecos', 'Haiti'),
      ],
    },
    D: {
      equipos: ['Estados Unidos', 'Paraguay', 'Australia', 'Tunez'],
      partidos: [
        g(1, '2026-06-12T19:00:00Z', 'Estados Unidos', 'Paraguay'),
        g(1, '2026-06-12T22:00:00Z', 'Australia', 'Tunez'),
        g(2, '2026-06-19T17:00:00Z', 'Estados Unidos', 'Australia'),
        g(2, '2026-06-19T21:00:00Z', 'Paraguay', 'Tunez'),
        g(3, '2026-06-25T17:00:00Z', 'Tunez', 'Estados Unidos'),
        g(3, '2026-06-25T21:00:00Z', 'Paraguay', 'Australia'),
      ],
    },
    E: {
      equipos: ['Portugal', 'Croacia', 'Nigeria', 'Japon'],
      partidos: [
        g(1, '2026-06-14T17:00:00Z', 'Portugal', 'Croacia'),
        g(1, '2026-06-14T21:00:00Z', 'Nigeria', 'Japon'),
        g(2, '2026-06-20T17:00:00Z', 'Portugal', 'Nigeria'),
        g(2, '2026-06-20T21:00:00Z', 'Croacia', 'Japon'),
        g(3, '2026-06-26T17:00:00Z', 'Japon', 'Portugal'),
        g(3, '2026-06-26T21:00:00Z', 'Croacia', 'Nigeria'),
      ],
    },
    F: {
      equipos: ['Francia', 'Paises Bajos', 'Senegal', 'Ghana'],
      partidos: [
        g(1, '2026-06-14T17:00:00Z', 'Francia', 'Paises Bajos'),
        g(1, '2026-06-14T21:00:00Z', 'Senegal', 'Ghana'),
        g(2, '2026-06-20T17:00:00Z', 'Francia', 'Senegal'),
        g(2, '2026-06-20T21:00:00Z', 'Paises Bajos', 'Ghana'),
        g(3, '2026-06-26T17:00:00Z', 'Ghana', 'Francia'),
        g(3, '2026-06-26T21:00:00Z', 'Paises Bajos', 'Senegal'),
      ],
    },
    G: {
      equipos: ['Alemania', 'Dinamarca', 'Serbia', 'Camerun'],
      partidos: [
        g(1, '2026-06-15T17:00:00Z', 'Alemania', 'Dinamarca'),
        g(1, '2026-06-15T21:00:00Z', 'Serbia', 'Camerun'),
        g(2, '2026-06-21T17:00:00Z', 'Alemania', 'Serbia'),
        g(2, '2026-06-21T21:00:00Z', 'Dinamarca', 'Camerun'),
        g(3, '2026-06-27T17:00:00Z', 'Camerun', 'Alemania'),
        g(3, '2026-06-27T21:00:00Z', 'Dinamarca', 'Serbia'),
      ],
    },
    H: {
      equipos: ['Espana', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
      partidos: [
        g(1, '2026-06-15T17:00:00Z', 'Espana', 'Cabo Verde'),
        g(1, '2026-06-15T21:00:00Z', 'Arabia Saudita', 'Uruguay'),
        g(2, '2026-06-21T17:00:00Z', 'Espana', 'Arabia Saudita'),
        g(2, '2026-06-21T21:00:00Z', 'Uruguay', 'Cabo Verde'),
        g(3, '2026-06-26T17:00:00Z', 'Cabo Verde', 'Arabia Saudita'),
        g(3, '2026-06-26T21:00:00Z', 'Uruguay', 'Espana'),
      ],
    },
    I: {
      equipos: ['Italia', 'Polonia', 'Ecuador', 'Costa de Marfil'],
      partidos: [
        g(1, '2026-06-16T17:00:00Z', 'Italia', 'Polonia'),
        g(1, '2026-06-16T21:00:00Z', 'Ecuador', 'Costa de Marfil'),
        g(2, '2026-06-22T17:00:00Z', 'Italia', 'Ecuador'),
        g(2, '2026-06-22T21:00:00Z', 'Polonia', 'Costa de Marfil'),
        g(3, '2026-06-27T17:00:00Z', 'Costa de Marfil', 'Italia'),
        g(3, '2026-06-27T21:00:00Z', 'Polonia', 'Ecuador'),
      ],
    },
    J: {
      equipos: ['Argentina', 'Argelia', 'Austria', 'Iran'],
      partidos: [
        g(1, '2026-06-16T19:00:00Z', 'Argentina', 'Argelia'),
        g(1, '2026-06-16T22:00:00Z', 'Austria', 'Iran'),
        g(2, '2026-06-22T17:00:00Z', 'Argentina', 'Austria'),
        g(2, '2026-06-22T21:00:00Z', 'Argelia', 'Iran'),
        g(3, '2026-06-28T17:00:00Z', 'Iran', 'Argentina'),
        g(3, '2026-06-28T21:00:00Z', 'Argelia', 'Austria'),
      ],
    },
    K: {
      equipos: ['Inglaterra', 'Belgica', 'Colombia', 'Mali'],
      partidos: [
        g(1, '2026-06-17T17:00:00Z', 'Inglaterra', 'Belgica'),
        g(1, '2026-06-17T21:00:00Z', 'Colombia', 'Mali'),
        g(2, '2026-06-23T17:00:00Z', 'Inglaterra', 'Colombia'),
        g(2, '2026-06-23T21:00:00Z', 'Belgica', 'Mali'),
        g(3, '2026-06-28T17:00:00Z', 'Mali', 'Inglaterra'),
        g(3, '2026-06-28T21:00:00Z', 'Belgica', 'Colombia'),
      ],
    },
    L: {
      equipos: ['Suecia', 'Turquia', 'Ucrania', 'Panama'],
      partidos: [
        g(1, '2026-06-17T17:00:00Z', 'Suecia', 'Turquia'),
        g(1, '2026-06-17T21:00:00Z', 'Ucrania', 'Panama'),
        g(2, '2026-06-23T17:00:00Z', 'Suecia', 'Ucrania'),
        g(2, '2026-06-23T21:00:00Z', 'Turquia', 'Panama'),
        g(3, '2026-06-29T17:00:00Z', 'Panama', 'Suecia'),
        g(3, '2026-06-29T21:00:00Z', 'Turquia', 'Ucrania'),
      ],
    },
  },
};
