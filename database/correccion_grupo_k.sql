-- Corrección DEFINITIVA de Horarios para el Grupo K (FIFA World Cup 2026)
-- Basado en el calendario oficial de la FIFA (partidos los días 17, 22 y 27 de junio).
-- Las horas están en UTC para correcta conversión a hora local (Argentina UTC-3).

UPDATE "partidos" AS p
SET "fecha_hora" = c.nueva_fecha::timestamptz,
    "updated_at" = NOW()
FROM (VALUES
  -- JORNADA 1 (17 de Junio)
  -- Portugal vs Colombia (Arg: 17 Jun 16:00 -> UTC: 19:00)
  (269, '2026-06-17 19:00:00+00'), 
  -- RD Congo vs Uzbekistán (Arg: 17 Jun 22:00 -> UTC: 18 Jun 01:00 AM)
  (270, '2026-06-18 01:00:00+00'), 

  -- JORNADA 2 (22 de Junio - Oficial FIFA)
  -- Portugal vs RD Congo (Arg: 22 Jun 16:00 -> UTC: 19:00)
  (271, '2026-06-22 19:00:00+00'),
  -- Colombia vs Uzbekistán (Arg: 22 Jun 22:00 -> UTC: 23 Jun 01:00 AM)
  (272, '2026-06-23 01:00:00+00'),

  -- JORNADA 3 (27 de Junio - Simultáneos en Miami y Atlanta - 7:30 PM ET)
  -- 7:30 PM ET (USA) = 23:30 UTC = 20:30 Argentina
  -- Portugal vs Uzbekistán 
  (273, '2026-06-27 23:30:00+00'),
  -- Colombia vs RD Congo
  (274, '2026-06-27 23:30:00+00')
) AS c(id, nueva_fecha)
WHERE p.id = c.id;
