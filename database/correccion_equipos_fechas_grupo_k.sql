-- Corrección de Nombres de Equipos y Horarios Oficiales para el Grupo K
-- Este script actualiza de forma segura los equipos y fechas sin borrar
-- los pronósticos ni el estado actual de los partidos.

UPDATE "partidos" AS p
SET 
    "equipo_local" = c.local,
    "equipo_visitante" = c.visitante,
    "fecha_hora" = c.nueva_fecha::timestamptz,
    "updated_at" = NOW()
FROM (VALUES
  -- JORNADA 1 (17 de Junio)
  -- Según calendario oficial: Portugal vs RD Congo y Uzbekistán vs Colombia
  (269, 'Portugal', 'RD Congo', '2026-06-17 19:00:00+00'), 
  (270, 'Uzbekistán', 'Colombia', '2026-06-18 01:00:00+00'), -- Madrugada UTC

  -- JORNADA 2 (22 de Junio)
  -- Según calendario oficial: Portugal vs Uzbekistán y Colombia vs RD Congo
  (271, 'Portugal', 'Uzbekistán', '2026-06-22 19:00:00+00'),
  (272, 'Colombia', 'RD Congo', '2026-06-23 01:00:00+00'), -- Madrugada UTC

  -- JORNADA 3 (27 de Junio - Simultáneos)
  -- Según calendario oficial: Colombia vs Portugal y RD Congo vs Uzbekistán
  (273, 'Colombia', 'Portugal', '2026-06-27 23:30:00+00'),
  (274, 'RD Congo', 'Uzbekistán', '2026-06-27 23:30:00+00')
) AS c(id, local, visitante, nueva_fecha)
WHERE p.id = c.id;
