-- Corrección Quirúrgica de la Jornada 2 (FIFA World Cup 2026)
-- Este script distribuye los partidos de la Jornada 2 entre el 18 y el 24 de junio,
-- alineándolos con el calendario oficial sin borrar pronósticos.
-- Las horas están en UTC (+3 horas respecto a Argentina).

UPDATE "partidos" AS p
SET "fecha_hora" = c.nueva_fecha::timestamptz,
    "updated_at" = NOW()
FROM (VALUES
  -- 18 DE JUNIO
  (212, '2026-06-18 16:00:00+00'), -- Sudáfrica vs Rep. Checa (Arg: 13:00)
  (218, '2026-06-18 19:00:00+00'), -- Bosnia vs Suiza (Arg: 16:00)
  (217, '2026-06-18 22:00:00+00'), -- Canadá vs Qatar (Arg: 19:00)
  (211, '2026-06-19 01:00:00+00'), -- México vs Corea del Sur (Arg: 18 Jun 22:00) -> Madrugada UTC

  -- 19 DE JUNIO
  (229, '2026-06-19 19:00:00+00'), -- EE.UU. vs Australia (Arg: 16:00)
  (230, '2026-06-19 22:00:00+00'), -- Paraguay vs Turquía (Arg: 19:00)
  (223, '2026-06-20 01:00:00+00'), -- Brasil vs Haití (Arg: 19 Jun 22:00) -> Madrugada UTC

  -- 20 DE JUNIO
  (224, '2026-06-20 16:00:00+00'), -- Marruecos vs Escocia (Arg: 13:00)
  (235, '2026-06-20 19:00:00+00'), -- Alemania vs C. Marfil (Arg: 16:00)
  (236, '2026-06-20 22:00:00+00'), -- Curazao vs Ecuador (Arg: 19:00)

  -- 21 DE JUNIO
  (241, '2026-06-21 16:00:00+00'), -- P. Bajos vs Suecia (Arg: 13:00)
  (242, '2026-06-21 19:00:00+00'), -- Japón vs Túnez (Arg: 16:00)
  (247, '2026-06-21 22:00:00+00'), -- Bélgica vs Irán (Arg: 19:00)

  -- 22 DE JUNIO
  (248, '2026-06-22 16:00:00+00'), -- Egipto vs N. Zelanda (Arg: 13:00)
  (253, '2026-06-22 19:00:00+00'), -- España vs A. Saudita (Arg: 16:00)
  (254, '2026-06-22 22:00:00+00'), -- Cabo Verde vs Uruguay (Arg: 19:00)
  
  -- Recordatorio: ID 271 (Portugal vs Uzbekistán) ya fue fijado para el 22 Jun en el script del Grupo K.

  -- 23 DE JUNIO
  (259, '2026-06-23 16:00:00+00'), -- Francia vs Irak (Arg: 13:00)
  (260, '2026-06-23 19:00:00+00'), -- Senegal vs Noruega (Arg: 16:00)
  (265, '2026-06-23 22:00:00+00'), -- Argentina vs Austria (Arg: 19:00)
  (266, '2026-06-24 01:00:00+00'), -- Argelia vs Jordania (Arg: 23 Jun 22:00) -> Madrugada UTC

  -- 24 DE JUNIO
  (277, '2026-06-24 16:00:00+00'), -- Inglaterra vs Ghana (Arg: 13:00)
  (278, '2026-06-24 19:00:00+00')  -- Croacia vs Panamá (Arg: 16:00)

) AS c(id, nueva_fecha)
WHERE p.id = c.id;
