-- Script de actualización de horarios oficiales FIFA 2026 para PostgreSQL
-- Versión consolidada: Ejecuta todos los cambios en un solo comando atómico.
-- Esto soluciona el error "cannot insert multiple commands into a prepared statement".

UPDATE "partidos" AS p
SET "fecha_hora" = c.nueva_fecha::timestamptz,
    "updated_at" = NOW()
FROM (VALUES
  (234, '2026-06-14 23:00:00+00'), -- Costa de Marfil vs Ecuador
  (240, '2026-06-14 20:00:00+00'), -- Suecia vs Túnez
  (252, '2026-06-15 22:00:00+00'), -- Arabia Saudita vs Uruguay
  (213, '2026-06-24 21:00:00+00'), -- México vs Rep. Checa (J3 simultáneo)
  (219, '2026-06-24 21:00:00+00'), -- Canadá vs Suiza (J3 simultáneo)
  (225, '2026-06-25 21:00:00+00'), -- Brasil vs Escocia (J3 simultáneo)
  (231, '2026-06-25 21:00:00+00'), -- EE.UU. vs Turquía (J3 simultáneo)
  (237, '2026-06-26 21:00:00+00'), -- Alemania vs Ecuador (J3 simultáneo)
  (243, '2026-06-26 21:00:00+00'), -- Países Bajos vs Túnez (J3 simultáneo)
  (249, '2026-06-27 21:00:00+00'), -- Bélgica vs N. Zelanda (J3 simultáneo)
  (255, '2026-06-27 21:00:00+00'), -- España vs Uruguay (J3 simultáneo)
  (261, '2026-06-28 21:00:00+00'), -- Francia vs Noruega (J3 simultáneo)
  (267, '2026-06-28 21:00:00+00'), -- Argentina vs Jordania (J3 simultáneo)
  (273, '2026-06-29 21:00:00+00'), -- Portugal vs Uzbekistán (J3 simultáneo)
  (279, '2026-06-29 21:00:00+00')  -- Inglaterra vs Panamá (J3 simultáneo)
) AS c(id, nueva_fecha)
WHERE p.id = c.id;
