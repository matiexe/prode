-- ============================================================
-- Prode Mundial 2026 - Script de creación de base de datos
-- SQL Server
-- ============================================================

-- Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'prode_mundial_2026')
BEGIN
    CREATE DATABASE prode_mundial_2026;
END
GO

USE prode_mundial_2026;
GO

-- ============================================================
-- Tabla: usuarios
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[usuarios]') AND type = 'U')
BEGIN
    CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        rol NVARCHAR(10) NOT NULL DEFAULT 'user',
        activo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_usuarios_email UNIQUE (email),
        CONSTRAINT ck_usuarios_rol CHECK (rol IN ('admin', 'user'))
    );
END
GO

-- ============================================================
-- Tabla: codigos_otp
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[codigos_otp]') AND type = 'U')
BEGIN
    CREATE TABLE codigos_otp (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL,
        codigo NVARCHAR(6) NOT NULL,
        expira_en DATETIME2 NOT NULL,
        usado BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ============================================================
-- Tabla: partidos
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[partidos]') AND type = 'U')
BEGIN
    CREATE TABLE partidos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        fase NVARCHAR(20) NOT NULL,
        grupo NCHAR(1) NULL,
        equipo_local NVARCHAR(100) NOT NULL,
        equipo_visitante NVARCHAR(100) NOT NULL,
        fecha_hora DATETIME2 NOT NULL,
        goles_local TINYINT NULL,
        goles_visitante TINYINT NULL,
        estado NVARCHAR(20) NOT NULL DEFAULT 'pendiente',
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT ck_partidos_fase CHECK (fase IN ('grupos', '16vos', '8vos', 'cuartos', 'semis', 'final')),
        CONSTRAINT ck_partidos_estado CHECK (estado IN ('pendiente', 'jugando', 'finalizado'))
    );
END
GO

-- ============================================================
-- Tabla: pronosticos
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pronosticos]') AND type = 'U')
BEGIN
    CREATE TABLE pronosticos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        usuario_id INT NOT NULL,
        partido_id INT NOT NULL,
        goles_local TINYINT NOT NULL,
        goles_visitante TINYINT NOT NULL,
        puntos_obtenidos INT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_pronosticos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        CONSTRAINT fk_pronosticos_partido FOREIGN KEY (partido_id) REFERENCES partidos(id),
        CONSTRAINT uq_pronosticos_usuario_partido UNIQUE (usuario_id, partido_id)
    );
END
GO

-- ============================================================
-- Tabla: configuracion_puntos
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[configuracion_puntos]') AND type = 'U')
BEGIN
    CREATE TABLE configuracion_puntos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tipo NVARCHAR(20) NOT NULL,
        puntos INT NOT NULL,
        activo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT uq_configuracion_puntos_tipo UNIQUE (tipo),
        CONSTRAINT ck_configuracion_puntos_tipo CHECK (tipo IN ('exacto', 'diferencia', 'ganador', 'error'))
    );
END
GO

-- ============================================================
-- Seed: configuración de puntos por defecto
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM configuracion_puntos WHERE tipo = 'exacto')
BEGIN
    INSERT INTO configuracion_puntos (tipo, puntos) VALUES
        ('exacto', 3),
        ('diferencia', 2),
        ('ganador', 1),
        ('error', 0);
END
GO

-- ============================================================
-- Seed: usuario administrador por defecto
-- email: admin@prode2026.com
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@prode2026.com')
BEGIN
    INSERT INTO usuarios (nombre, email, rol) VALUES
        ('Administrador', 'admin@prode2026.com', 'admin');
END
GO

-- ============================================================
-- Índices adicionales para performance
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_codigos_otp_email_codigo')
    CREATE INDEX idx_codigos_otp_email_codigo ON codigos_otp (email, codigo);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_codigos_otp_email_usado')
    CREATE INDEX idx_codigos_otp_email_usado ON codigos_otp (email, usado);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pronosticos_usuario_id')
    CREATE INDEX idx_pronosticos_usuario_id ON pronosticos (usuario_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pronosticos_partido_id')
    CREATE INDEX idx_pronosticos_partido_id ON pronosticos (partido_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_partidos_fase')
    CREATE INDEX idx_partidos_fase ON partidos (fase);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_partidos_fecha_hora')
    CREATE INDEX idx_partidos_fecha_hora ON partidos (fecha_hora);
GO

PRINT 'Base de datos inicializada correctamente.';
GO
