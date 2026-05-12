-- ============================================================
-- Limpieza completa de la base de datos
-- Uso: Ejecutar ANTES de init.sql si hay tablas existentes
-- ============================================================

USE prode_mundial_2026;
GO

-- Eliminar constraints primero (orden inverso)
IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fk_pronosticos_partido')
    ALTER TABLE pronosticos DROP CONSTRAINT fk_pronosticos_partido;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE name = 'fk_pronosticos_usuario')
    ALTER TABLE pronosticos DROP CONSTRAINT fk_pronosticos_usuario;
GO

-- Eliminar tablas (orden inverso a creación)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pronosticos]') AND type = 'U')
    DROP TABLE pronosticos;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[codigos_otp]') AND type = 'U')
    DROP TABLE codigos_otp;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[configuracion_puntos]') AND type = 'U')
    DROP TABLE configuracion_puntos;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[partidos]') AND type = 'U')
    DROP TABLE partidos;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[usuarios]') AND type = 'U')
    DROP TABLE usuarios;
GO

PRINT 'Base de datos limpiada correctamente.';
GO
