-- Script de actualización de horarios oficiales FIFA 2026 para la Fecha 3 (Jornada 3)
-- Alinea los partidos de la última fecha de la fase de grupos para que se jueguen en simultáneo por grupo.
-- Las horas se guardan en UTC (+00) y se detallan las equivalencias locales de EE.UU. y Argentina (UTC-3).

UPDATE "partidos" AS p
SET "fecha_hora" = c.nueva_fecha::timestamptz,
    "updated_at" = NOW()
FROM (VALUES
  -- ==========================================
  -- MIÉRCOLES 24 DE JUNIO
  -- ==========================================
  -- GRUPO B: 3:00 PM ET / 12:00 PM local Vancouver-Seattle = 19:00 UTC
  (219, '2026-06-24 19:00:00+00'), -- Canadá vs Suiza (Arg: 16:00)
  (220, '2026-06-24 19:00:00+00'), -- Bosnia y Herzegovina vs Qatar (Arg: 16:00)

  -- GRUPO C: 6:00 PM ET / 6:00 PM local Miami-Atlanta = 22:00 UTC
  (225, '2026-06-24 22:00:00+00'), -- Brasil vs Escocia (Arg: 19:00)
  (226, '2026-06-24 22:00:00+00'), -- Marruecos vs Haití (Arg: 19:00)

  -- GRUPO A: 9:00 PM ET / 7:00 PM local Monterrey-Gdl = 25 Jun 01:00 UTC (Madrugada)
  (213, '2026-06-25 01:00:00+00'), -- México vs República Checa (Arg: 24 Jun 22:00)
  (214, '2026-06-25 01:00:00+00'), -- Corea del Sur vs Sudáfrica (Arg: 24 Jun 22:00)

  -- ==========================================
  -- JUEVES 25 DE JUNIO
  -- ==========================================
  -- GRUPO E: 4:00 PM ET / 4:00 PM local Philadelphia-NY = 20:00 UTC
  (237, '2026-06-25 20:00:00+00'), -- Alemania vs Ecuador (Arg: 17:00)
  (238, '2026-06-25 20:00:00+00'), -- Curazao vs Costa de Marfil (Arg: 17:00)

  -- GRUPO F: 7:00 PM ET / 6:00 PM local Dallas-Kansas City = 23:00 UTC
  (243, '2026-06-25 23:00:00+00'), -- Países Bajos vs Túnez (Arg: 20:00)
  (244, '2026-06-25 23:00:00+00'), -- Japón vs Suecia (Arg: 20:00)

  -- GRUPO D: 10:00 PM ET / 7:00 PM local Los Angeles = 26 Jun 02:00 UTC (Madrugada)
  (231, '2026-06-26 02:00:00+00'), -- Estados Unidos vs Turquía (Arg: 25 Jun 23:00)
  (232, '2026-06-26 02:00:00+00'), -- Paraguay vs Australia (Arg: 25 Jun 23:00)

  -- ==========================================
  -- VIERNES 26 DE JUNIO
  -- ==========================================
  -- GRUPO I: 3:00 PM ET / 3:00 PM local Boston = 19:00 UTC
  (261, '2026-06-26 19:00:00+00'), -- Francia vs Noruega (Arg: 16:00)
  (262, '2026-06-26 19:00:00+00'), -- Senegal vs Irak (Arg: 16:00)

  -- GRUPO H: 8:00 PM ET / 6:00 PM local Guadalajara = 27 Jun 00:00 UTC (Madrugada)
  (255, '2026-06-27 00:00:00+00'), -- España vs Uruguay (Arg: 26 Jun 21:00)
  (256, '2026-06-27 00:00:00+00'), -- Cabo Verde vs Arabia Saudita (Arg: 26 Jun 21:00)

  -- GRUPO G: 11:00 PM ET / 8:00 PM local Vancouver-Seattle = 27 Jun 03:00 UTC (Madrugada)
  (249, '2026-06-27 03:00:00+00'), -- Bélgica vs Nueva Zelanda (Arg: 27 Jun 00:00)
  (250, '2026-06-27 03:00:00+00'), -- Egipto vs Irán (Arg: 27 Jun 00:00)

  -- ==========================================
  -- SÁBADO 27 DE JUNIO
  -- ==========================================
  -- GRUPO L: 5:00 PM ET / 5:00 PM local NY-NJ = 21:00 UTC
  (279, '2026-06-27 21:00:00+00'), -- Inglaterra vs Panamá (Arg: 18:00)
  (280, '2026-06-27 21:00:00+00'), -- Croacia vs Ghana (Arg: 18:00)

  -- GRUPO K: 7:30 PM ET / 7:30 PM local Miami = 23:30 UTC
  (273, '2026-06-27 23:30:00+00'), -- Colombia vs Portugal (Arg: 20:30)
  (274, '2026-06-27 23:30:00+00'), -- RD Congo vs Uzbekistán (Arg: 20:30)

  -- GRUPO J: 10:00 PM ET / 9:00 PM local Dallas = 28 Jun 02:00 UTC (Madrugada)
  (267, '2026-06-28 02:00:00+00'), -- Argentina vs Jordania (Arg: 27 Jun 23:00)
  (268, '2026-06-28 02:00:00+00')  -- Argelia vs Austria (Arg: 27 Jun 23:00)
) AS c(id, nueva_fecha)
WHERE p.id = c.id;
