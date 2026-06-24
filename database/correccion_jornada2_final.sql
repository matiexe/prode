-- Corrección Quirúrgica de la Jornada 2 (FIFA World Cup 2026)
-- Este script distribuye los partidos de la Jornada 2 entre el 18 y el 24 de junio,
-- alineándolos con el calendario oficial sin borrar pronósticos.
-- Las horas están en UTC (+3 horas respecto a Argentina).

UPDATE "partidos" AS p
SET "fecha_hora" = c.nueva_fecha::timestamptz,
    "updated_at" = NOW()
FROM (VALUES
  -- 19 DE JUNIO
  (229, '2026-06-19 19:00:00+00'), -- EE.UU. vs Australia (Arg: 16:00)
  (224, '2026-06-19 22:00:00+00'), -- Marruecos vs Escocia (Arg: 19:00)
  (223, '2026-06-19 00:30:00+00'), -- Brasil vs Haití (Arg: 19 Jun 21:30)

  -- 20 DE JUNIO
  (230, '2026-06-20 03:00:00+00'), -- Paraguay vs Turquía (Arg: 00:00)
  (241, '2026-06-20 17:00:00+00'), -- P. Bajos vs Suecia (Arg: 14:00)
  (235, '2026-06-20 20:00:00+00'), -- Alemania vs C. Marfil (Arg: 17:00)
  (236, '2026-06-20 24:00:00+00'), -- Curazao vs Ecuador (Arg: 21:00)

  -- 21 DE JUNIO
  
  (242, '2026-06-21 04:00:00+00'), -- Japón vs Túnez (Arg: 01:00)
  (253, '2026-06-22 16:00:00+00'), -- España vs A. Saudita (Arg: 13:00)
  (247, '2026-06-21 19:00:00+00'), -- Bélgica vs Irán (Arg: 16:00)
  (254, '2026-06-22 22:00:00+00'), -- Cabo Verde vs Uruguay (Arg: 19:00)
  (248, '2026-06-22 01:00:00+00'), -- Egipto vs N. Zelanda (Arg: 22:00)

  -- 22 DE JUNIO
  (259, '2026-06-22 20:00:00+00'), -- Francia vs Irak (Arg: 18:00)
  (260, '2026-06-22 00:00:00+00'), -- Senegal vs Noruega (Arg: 21:00)
  (265, '2026-06-22 16:00:00+00'), -- Argentina vs Austria (Arg: 14:00)
  
  
  
  
  -- Recordatorio: ID 271 (Portugal vs Uzbekistán) ya fue fijado para el 22 Jun en el script del Grupo K.

  -- 23 DE JUNIO
 (266, '2026-06-23 03:00:00+00'), -- Argelia vs Jordania (Arg: 23 Jun 00:00)
   (277, '2026-06-23 20:00:00+00'), -- Inglaterra vs Ghana (Arg: 17:00)
  (278, '2026-06-23 23:00:00+00')  -- Croacia vs Panamá (Arg: 20:00)

  -- 24 DE JUNIO


) AS c(id, nueva_fecha)
WHERE p.id = c.id;
