-- Crear base de datos
CREATE DATABASE prode_mundial_2026;
GO
USE prode_mundial_2026;
GO
-- Tabla: usuarios
CREATE TABLE usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    rol NVARCHAR(10) NOT NULL DEFAULT 'user' CHECK (rol IN ('admin', 'user')),
    activo BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO
-- Tabla: codigos_otp
CREATE TABLE codigos_otp (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL,
    codigo NVARCHAR(6) NOT NULL,
    expira_en DATETIME2 NOT NULL,
    usado BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO
-- Tabla: partidos
CREATE TABLE partidos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fase NVARCHAR(20) NOT NULL CHECK (fase IN ('grupos', '16vos', '8vos', 'cuartos', 'semis', 'final')),
    grupo NCHAR(1) NULL,
    equipo_local NVARCHAR(100) NOT NULL,
    equipo_visitante NVARCHAR(100) NOT NULL,
    fecha_hora DATETIME2 NOT NULL,
    goles_local TINYINT NULL,
    goles_visitante TINYINT NULL,
    estado NVARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'jugando', 'finalizado')),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO
-- Tabla: pronosticos
CREATE TABLE pronosticos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    partido_id INT NOT NULL,
    goles_local TINYINT NOT NULL,
    goles_visitante TINYINT NOT NULL,
    puntos_obtenidos INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT fk_pronostico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_pronostico_partido FOREIGN KEY (partido_id) REFERENCES partidos(id),
    CONSTRAINT uq_usuario_partido UNIQUE (usuario_id, partido_id)
);
GO
-- Tabla: configuracion_puntos
CREATE TABLE configuracion_puntos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tipo NVARCHAR(20) NOT NULL CHECK (tipo IN ('exacto', 'diferencia', 'ganador', 'error')),
    puntos INT NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uq_tipo UNIQUE (tipo)
);
GO
-- Seed: configuración por defecto
INSERT INTO configuracion_puntos (tipo, puntos) VALUES
    ('exacto', 3),
    ('diferencia', 2),
    ('ganador', 1),
    ('error', 0);
GO