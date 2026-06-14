-- Script Definitivo de Corrección de Horarios (Diferencia Horaria UTC/Argentina)
-- Este script corrige los partidos que por jugarse de noche en EE.UU. 
-- deben registrarse en la base de datos (UTC) con la fecha del día SIGUIENTE
-- para que en Argentina se vean en el día y hora correctos.

UPDATE "partidos" AS p
SET "fecha_hora" = c.nueva_fecha::timestamptz,
    "updated_at" = NOW()
FROM (VALUES
  -- JORNADA 1
  (222, '2026-06-14 01:00:00+00'), -- Haití vs Escocia (Arg: 13 Jun 22:00)
  (228, '2026-06-14 04:00:00+00'), -- Australia vs Turquía (Arg: 14 Jun 01:00)
  (240, '2026-06-15 02:00:00+00'), -- Suecia vs Túnez (Arg: 14 Jun 23:00)
  (246, '2026-06-16 01:00:00+00'), -- Irán vs Nueva Zelanda (Arg: 15 Jun 22:00)
  (263, '2026-06-17 01:00:00+00'), -- Argentina vs Argelia (Arg: 16 Jun 22:00)
  (264, '2026-06-17 04:00:00+00'), -- Austria vs Jordania (Arg: 17 Jun 01:00)
  (270, '2026-06-18 01:00:00+00'), -- RD Congo vs Uzbekistán (Arg: 17 Jun 22:00)

  -- JORNADA 2
  (217, '2026-06-19 01:00:00+00'), -- Canadá vs Qatar (Arg: 18 Jun 22:00)
  (220, '2026-06-19 04:00:00+00'), -- Bosnia vs Qatar (Arg: 19 Jun 01:00) -> Ojo: corregido a 19 Jun Madrugada
  (229, '2026-06-20 01:00:00+00'), -- EE.UU. vs Australia (Arg: 19 Jun 22:00)
  (230, '2026-06-20 04:00:00+00'), -- Paraguay vs Turquía (Arg: 20 Jun 01:00)
  (241, '2026-06-21 02:00:00+00'), -- P. Bajos vs Suecia (Arg: 20 Jun 23:00)
  (242, '2026-06-21 02:00:00+00'), -- Japón vs Túnez (Arg: 20 Jun 23:00)
  (247, '2026-06-22 01:00:00+00'), -- Bélgica vs Irán (Arg: 21 Jun 22:00)
  (248, '2026-06-22 01:00:00+00'), -- Egipto vs N. Zelanda (Arg: 21 Jun 22:00)
  
  -- JORNADA 3 (Simultáneos - Si son nocturnos en USA, van a madrugada UTC del día siguiente)
  (261, '2026-06-29 01:00:00+00'), -- Francia vs Noruega (Arg: 28 Jun 22:00)
  (262, '2026-06-29 01:00:00+00'), -- Senegal vs Irak (Arg: 28 Jun 22:00)
  (267, '2026-06-29 04:00:00+00'), -- Argentina vs Jordania (Arg: 28 Jun 01:00 AM) -> Ojo: Si es noche del 28, es 29 01:00/04:00 UTC
  (268, '2026-06-29 04:00:00+00'), -- Argelia vs Austria
  (273, '2026-06-30 01:00:00+00'), -- Portugal vs Uzbekistán (Arg: 29 Jun 22:00)
  (274, '2026-06-30 01:00:00+00'), -- Colombia vs RD Congo (Arg: 29 Jun 22:00)
  (279, '2026-06-30 04:00:00+00'), -- Inglaterra vs Panamá (Arg: 30 Jun 01:00 AM)
  (280, '2026-06-30 04:00:00+00')  -- Croacia vs Ghana
) AS c(id, nueva_fecha)
WHERE p.id = c.id;
