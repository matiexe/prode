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
      equipos: ['México', 'Corea del Sur', 'Sudáfrica', 'República Checa'],
      partidos: [
        g(1, '2026-06-11T19:00:00Z', 'México', 'Sudáfrica'),
        g(1, '2026-06-11T22:00:00Z', 'Corea del Sur', 'República Checa'),
        g(2, '2026-06-18T17:00:00Z', 'México', 'Corea del Sur'),
        g(2, '2026-06-18T21:00:00Z', 'Sudáfrica', 'República Checa'),
        g(3, '2026-06-24T17:00:00Z', 'México', 'República Checa'),
        g(3, '2026-06-24T21:00:00Z', 'Corea del Sur', 'Sudáfrica'),
      ],
    },
    B: {
      equipos: ['Canadá', 'Bosnia y Herzegovina', 'Qatar', 'Suiza'],
      partidos: [
        g(1, '2026-06-12T19:00:00Z', 'Canadá', 'Bosnia y Herzegovina'),
        g(1, '2026-06-13T17:00:00Z', 'Qatar', 'Suiza'),
        g(2, '2026-06-18T17:00:00Z', 'Canadá', 'Qatar'),
        g(2, '2026-06-18T21:00:00Z', 'Bosnia y Herzegovina', 'Suiza'),
        g(3, '2026-06-24T17:00:00Z', 'Canadá', 'Suiza'),
        g(3, '2026-06-24T21:00:00Z', 'Bosnia y Herzegovina', 'Qatar'),
      ],
    },
    C: {
      equipos: ['Brasil', 'Marruecos', 'Haití', 'Escocia'],
      partidos: [
        g(1, '2026-06-13T19:00:00Z', 'Brasil', 'Marruecos'),
        g(1, '2026-06-13T22:00:00Z', 'Haití', 'Escocia'),
        g(2, '2026-06-19T17:00:00Z', 'Brasil', 'Haití'),
        g(2, '2026-06-19T21:00:00Z', 'Marruecos', 'Escocia'),
        g(3, '2026-06-25T17:00:00Z', 'Brasil', 'Escocia'),
        g(3, '2026-06-25T21:00:00Z', 'Marruecos', 'Haití'),
      ],
    },
    D: {
      equipos: ['Estados Unidos', 'Paraguay', 'Australia', 'Turquía'],
      partidos: [
        g(1, '2026-06-12T22:00:00Z', 'Estados Unidos', 'Paraguay'),
        g(1, '2026-06-14T17:00:00Z', 'Australia', 'Turquía'),
        g(2, '2026-06-19T17:00:00Z', 'Estados Unidos', 'Australia'),
        g(2, '2026-06-19T21:00:00Z', 'Paraguay', 'Turquía'),
        g(3, '2026-06-25T17:00:00Z', 'Estados Unidos', 'Turquía'),
        g(3, '2026-06-25T21:00:00Z', 'Paraguay', 'Australia'),
      ],
    },
    E: {
      equipos: ['Alemania', 'Curazao', 'Costa de Marfil', 'Ecuador'],
      partidos: [
        g(1, '2026-06-14T19:00:00Z', 'Alemania', 'Curazao'),
        g(1, '2026-06-14T22:00:00Z', 'Costa de Marfil', 'Ecuador'),
        g(2, '2026-06-20T17:00:00Z', 'Alemania', 'Costa de Marfil'),
        g(2, '2026-06-20T21:00:00Z', 'Curazao', 'Ecuador'),
        g(3, '2026-06-26T17:00:00Z', 'Alemania', 'Ecuador'),
        g(3, '2026-06-26T21:00:00Z', 'Curazao', 'Costa de Marfil'),
      ],
    },
    F: {
      equipos: ['Países Bajos', 'Japón', 'Suecia', 'Túnez'],
      partidos: [
        g(1, '2026-06-14T17:00:00Z', 'Países Bajos', 'Japón'),
        g(1, '2026-06-14T21:00:00Z', 'Suecia', 'Túnez'),
        g(2, '2026-06-20T17:00:00Z', 'Países Bajos', 'Suecia'),
        g(2, '2026-06-20T21:00:00Z', 'Japón', 'Túnez'),
        g(3, '2026-06-26T17:00:00Z', 'Países Bajos', 'Túnez'),
        g(3, '2026-06-26T21:00:00Z', 'Japón', 'Suecia'),
      ],
    },
    G: {
      equipos: ['Bélgica', 'Egipto', 'Irán', 'Nueva Zelanda'],
      partidos: [
        g(1, '2026-06-15T17:00:00Z', 'Bélgica', 'Egipto'),
        g(1, '2026-06-15T21:00:00Z', 'Irán', 'Nueva Zelanda'),
        g(2, '2026-06-21T17:00:00Z', 'Bélgica', 'Irán'),
        g(2, '2026-06-21T21:00:00Z', 'Egipto', 'Nueva Zelanda'),
        g(3, '2026-06-27T17:00:00Z', 'Bélgica', 'Nueva Zelanda'),
        g(3, '2026-06-27T21:00:00Z', 'Egipto', 'Irán'),
      ],
    },
    H: {
      equipos: ['España', 'Cabo Verde', 'Arabia Saudita', 'Uruguay'],
      partidos: [
        g(1, '2026-06-15T17:00:00Z', 'España', 'Cabo Verde'),
        g(1, '2026-06-15T21:00:00Z', 'Arabia Saudita', 'Uruguay'),
        g(2, '2026-06-21T17:00:00Z', 'España', 'Arabia Saudita'),
        g(2, '2026-06-21T21:00:00Z', 'Cabo Verde', 'Uruguay'),
        g(3, '2026-06-27T17:00:00Z', 'España', 'Uruguay'),
        g(3, '2026-06-27T21:00:00Z', 'Cabo Verde', 'Arabia Saudita'),
      ],
    },
    I: {
      equipos: ['Francia', 'Senegal', 'Irak', 'Noruega'],
      partidos: [
        g(1, '2026-06-16T17:00:00Z', 'Francia', 'Senegal'),
        g(1, '2026-06-16T21:00:00Z', 'Irak', 'Noruega'),
        g(2, '2026-06-22T17:00:00Z', 'Francia', 'Irak'),
        g(2, '2026-06-22T21:00:00Z', 'Senegal', 'Noruega'),
        g(3, '2026-06-28T17:00:00Z', 'Francia', 'Noruega'),
        g(3, '2026-06-28T21:00:00Z', 'Senegal', 'Irak'),
      ],
    },
    J: {
      equipos: ['Argentina', 'Argelia', 'Austria', 'Jordania'],
      partidos: [
        g(1, '2026-06-16T19:00:00Z', 'Argentina', 'Argelia'),
        g(1, '2026-06-17T17:00:00Z', 'Austria', 'Jordania'),
        g(2, '2026-06-22T17:00:00Z', 'Argentina', 'Austria'),
        g(2, '2026-06-22T21:00:00Z', 'Argelia', 'Jordania'),
        g(3, '2026-06-28T17:00:00Z', 'Argentina', 'Jordania'),
        g(3, '2026-06-28T21:00:00Z', 'Argelia', 'Austria'),
      ],
    },
    K: {
      equipos: ['Portugal', 'Colombia', 'RD Congo', 'Uzbekistán'],
      partidos: [
        g(1, '2026-06-17T17:00:00Z', 'Portugal', 'Colombia'),
        g(1, '2026-06-17T21:00:00Z', 'RD Congo', 'Uzbekistán'),
        g(2, '2026-06-23T17:00:00Z', 'Portugal', 'RD Congo'),
        g(2, '2026-06-23T21:00:00Z', 'Colombia', 'Uzbekistán'),
        g(3, '2026-06-29T17:00:00Z', 'Portugal', 'Uzbekistán'),
        g(3, '2026-06-29T21:00:00Z', 'Colombia', 'RD Congo'),
      ],
    },
    L: {
      equipos: ['Inglaterra', 'Croacia', 'Ghana', 'Panamá'],
      partidos: [
        g(1, '2026-06-17T17:00:00Z', 'Inglaterra', 'Croacia'),
        g(1, '2026-06-17T21:00:00Z', 'Ghana', 'Panamá'),
        g(2, '2026-06-23T17:00:00Z', 'Inglaterra', 'Ghana'),
        g(2, '2026-06-23T21:00:00Z', 'Croacia', 'Panamá'),
        g(3, '2026-06-29T17:00:00Z', 'Inglaterra', 'Panamá'),
        g(3, '2026-06-29T21:00:00Z', 'Croacia', 'Ghana'),
      ],
    },
  },
};
