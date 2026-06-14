-- Script de actualización TOTAL de horarios oficiales FIFA 2026 para PostgreSQL
-- Incluye Jornada 1 (pendientes), Jornada 2 y Jornada 3.
-- Se excluyen los partidos finalizados (IDs: 210, 215, 216, 221, 227).

UPDATE "partidos" AS p
SET "fecha_hora" = c.nueva_fecha::timestamptz,
    "updated_at" = NOW()
FROM (VALUES
  -- JORNADA 1 (PENDIENTES)
  (222, '2026-06-13 01:00:00+00'), -- Haití vs Escocia (C) - Madrugada del 14
  (228, '2026-06-13 04:00:00+00'), -- Australia vs Turquía (D) - Madrugada del 14
  (233, '2026-06-14 17:00:00+00'), -- Alemania vs Curazao (E)
  (234, '2026-06-14 23:00:00+00'), -- Costa de Marfil vs Ecuador (E)
  (239, '2026-06-14 20:00:00+00'), -- Países Bajos vs Japón (F)
  (240, '2026-06-14 02:00:00+00'), -- Suecia vs Túnez (F) - Madrugada del 15
  (245, '2026-06-15 19:00:00+00'), -- Bélgica vs Egipto (G)
  (246, '2026-06-15 01:00:00+00'), -- Irán vs Nueva Zelanda (G) - Madrugada del 16
  (251, '2026-06-15 16:00:00+00'), -- España vs Cabo Verde (H)
  (252, '2026-06-15 22:00:00+00'), -- Arabia Saudita vs Uruguay (H)
  (257, '2026-06-16 19:00:00+00'), -- Francia vs Senegal (I)
  (258, '2026-06-16 22:00:00+00'), -- Irak vs Noruega (I)
  (263, '2026-06-16 01:00:00+00'), -- Argentina vs Argelia (J) - Madrugada del 17
  (264, '2026-06-17 17:00:00+00'), -- Austria vs Jordania (J)
  (269, '2026-06-17 17:00:00+00'), -- Portugal vs RD Congo (K)
  (270, '2026-06-17 21:00:00+00'), -- RD Congo vs Uzbekistán (K)
  (275, '2026-06-17 20:00:00+00'), -- Inglaterra vs Croacia (L)
  (276, '2026-06-17 23:00:00+00'), -- Ghana vs Panamá (L)

  -- JORNADA 2
  (211, '2026-06-18 19:00:00+00'), -- México vs Corea del Sur (A)
  (212, '2026-06-18 16:00:00+00'), -- Sudáfrica vs Rep. Checa (A)
  (217, '2026-06-18 01:00:00+00'), -- Canadá vs Qatar (B) - Madrugada del 19
  (218, '2026-06-18 22:00:00+00'), -- Bosnia vs Suiza (B)
  (223, '2026-06-19 22:00:00+00'), -- Brasil vs Haití (C)
  (224, '2026-06-19 22:00:00+00'), -- Marruecos vs Escocia (C)
  (229, '2026-06-19 01:00:00+00'), -- EE.UU. vs Australia (D) - Madrugada del 20
  (230, '2026-06-19 04:00:00+00'), -- Paraguay vs Turquía (D) - Madrugada del 20
  (235, '2026-06-20 23:00:00+00'), -- Alemania vs C. Marfil (E)
  (236, '2026-06-20 23:00:00+00'), -- Curazao vs Ecuador (E)
  (241, '2026-06-20 02:00:00+00'), -- P. Bajos vs Suecia (F) - Madrugada del 21
  (242, '2026-06-20 02:00:00+00'), -- Japón vs Túnez (F) - Madrugada del 21
  (247, '2026-06-21 01:00:00+00'), -- Bélgica vs Irán (G) - Madrugada del 22
  (248, '2026-06-21 01:00:00+00'), -- Egipto vs N. Zelanda (G) - Madrugada del 22
  (253, '2026-06-21 22:00:00+00'), -- España vs A. Saudita (H)
  (254, '2026-06-21 22:00:00+00'), -- Cabo Verde vs Uruguay (H)
  (259, '2026-06-22 19:00:00+00'), -- Francia vs Irak (I)
  (260, '2026-06-22 19:00:00+00'), -- Senegal vs Noruega (I)
  (265, '2026-06-22 22:00:00+00'), -- Argentina vs Austria (J)
  (266, '2026-06-22 22:00:00+00'), -- Argelia vs Jordania (J)
  (271, '2026-06-23 23:30:00+00'), -- Portugal vs RD Congo (K)
  (272, '2026-06-23 23:30:00+00'), -- Colombia vs Uzbekistán (K)
  (277, '2026-06-23 21:00:00+00'), -- Inglaterra vs Ghana (L)
  (278, '2026-06-23 21:00:00+00'), -- Croacia vs Panamá (L)

  -- JORNADA 3 (Simultáneos por Grupo)
  (213, '2026-06-24 21:00:00+00'), -- México vs Rep. Checa (A)
  (214, '2026-06-24 21:00:00+00'), -- Corea Sur vs Sudáfrica (A)
  (219, '2026-06-24 21:00:00+00'), -- Canadá vs Suiza (B)
  (220, '2026-06-24 21:00:00+00'), -- Bosnia vs Qatar (B)
  (225, '2026-06-25 19:00:00+00'), -- Brasil vs Escocia (C)
  (226, '2026-06-25 19:00:00+00'), -- Marruecos vs Haití (C)
  (231, '2026-06-25 22:00:00+00'), -- EE.UU. vs Turquía (D)
  (232, '2026-06-25 22:00:00+00'), -- Paraguay vs Australia (D)
  (237, '2026-06-26 19:00:00+00'), -- Alemania vs Ecuador (E)
  (238, '2026-06-26 19:00:00+00'), -- Curazao vs C. Marfil (E)
  (243, '2026-06-26 22:00:00+00'), -- P. Bajos vs Túnez (F)
  (244, '2026-06-26 22:00:00+00'), -- Japón vs Suecia (F)
  (249, '2026-06-27 22:00:00+00'), -- Bélgica vs N. Zelanda (G)
  (250, '2026-06-27 22:00:00+00'), -- Egipto vs Irán (G)
  (255, '2026-06-27 19:00:00+00'), -- España vs Uruguay (H)
  (256, '2026-06-27 19:00:00+00'), -- Cabo Verde vs A. Saudita (H)
  (261, '2026-06-28 01:00:00+00'), -- Francia vs Noruega (I)
  (262, '2026-06-28 01:00:00+00'), -- Senegal vs Irak (I)
  (267, '2026-06-28 04:00:00+00'), -- Argentina vs Jordania (J)
  (268, '2026-06-28 04:00:00+00'), -- Argelia vs Austria (J)
  (273, '2026-06-29 01:00:00+00'), -- Portugal vs Uzbekistán (K)
  (274, '2026-06-29 01:00:00+00'), -- Colombia vs RD Congo (K)
  (279, '2026-06-29 04:00:00+00'), -- Inglaterra vs Panamá (L)
  (280, '2026-06-29 04:00:00+00')  -- Croacia vs Ghana (L)
) AS c(id, nueva_fecha)
WHERE p.id = c.id;
