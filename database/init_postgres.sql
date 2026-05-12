-- Tabla: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    rol VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'user')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: codigos_otp
CREATE TABLE codigos_otp (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_en TIMESTAMP NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: partidos
CREATE TABLE partidos (
    id SERIAL PRIMARY KEY,
    fase VARCHAR(20) NOT NULL CHECK (fase IN ('grupos', '16vos', '8vos', 'cuartos', 'semis', 'final', '3er_puesto')),
    grupo CHAR(1) NULL,
    equipo_local VARCHAR(100) NOT NULL,
    equipo_visitante VARCHAR(100) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    goles_local SMALLINT NULL,
    goles_visitante SMALLINT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'jugando', 'finalizado')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: pronosticos
CREATE TABLE pronosticos (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL,
    partido_id INT NOT NULL,
    goles_local SMALLINT NOT NULL,
    goles_visitante SMALLINT NOT NULL,
    puntos_obtenidos INT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pronostico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_pronostico_partido FOREIGN KEY (partido_id) REFERENCES partidos(id),
    CONSTRAINT uq_usuario_partido UNIQUE (usuario_id, partido_id)
);

-- Tabla: configuracion_puntos
CREATE TABLE configuracion_puntos (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('exacto', 'diferencia', 'ganador', 'error')),
    puntos INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tipo UNIQUE (tipo)
);

-- Seed: configuración por defecto
INSERT INTO configuracion_puntos (tipo, puntos) VALUES
    ('exacto', 3),
    ('diferencia', 2),
    ('ganador', 1),
    ('error', 0)
ON CONFLICT (tipo) DO NOTHING;
