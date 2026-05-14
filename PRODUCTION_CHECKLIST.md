# Guía de Paso a Producción - Prode Mundial 2026

Este documento detalla los pasos críticos y consideraciones para mover el sistema del entorno de **Preview/Staging** a **Producción Real**.

## 1. 🛡️ Seguridad y Autenticación
- [ ] **Desactivar Código Mágico:** Eliminar la lógica de `MAGIC_CODE = '123456'` en `backend/src/routes/auth.routes.ts` o condicionarla estrictamente a `process.env.NODE_ENV !== 'production'`.
- [ ] **Rotación de Secretos:** Asegurar que `JWT_SECRET` y `ADMIN_SECRET` sean cadenas largas, aleatorias y diferentes a las usadas en Preview.
- [ ] **Resend API Key:** Verificar que la API Key de producción en Resend tenga el dominio verificado para evitar que los OTP caigan en SPAM.

## 2. 🗄️ Base de Datos (Postgres)
- [ ] **Migración de Esquema:** Ejecutar el `ALTER TABLE` manual (o asegurar que el sync corra una vez) para tener la columna `ganador_nombre`.
- [ ] **Backup Plan:** Configurar backups automáticos en Vercel/Neon.
- [ ] **Limpieza de Datos de Prueba:** Antes del lanzamiento, resetear las tablas `pronosticos`, `partidos` y `usuarios` (excepto admins) para empezar con el contador en cero.

## 3. 🚀 Infraestructura y CI/CD
- [ ] **Variables de Entorno en Vercel:** Copiar todas las variables del scope `Preview` al scope `Production`.
- [ ] **Dominio Personalizado:** Configurar el dominio final en Vercel y actualizar la variable `FRONTEND_URL` en el backend para los headers de CORS.
- [ ] **GitHub Actions:** Asegurar que la rama `main` esté protegida y requiera que el pipeline de CI (`ci.yml`) pase antes de permitir merges.

## 4. ⚽ Lógica de Negocio
- [ ] **Verificación de Fechas:** Revisar que las fechas en `backend/src/data/fixture.ts` coincidan exactamente con el calendario oficial (considerar zonas horarias, se recomienda usar UTC).
- [ ] **Puntuación:** Validar con el cliente que los valores de puntos (3, 2, 1, 0) son los definitivos.

## 5. 🧹 Limpieza Final
- [ ] **Remover scripts de diagnóstico:** Asegurar que archivos como `backend/src/verify-db.ts` no se incluyan en el bundle final.
- [ ] **Swagger:** Desactivar la UI de Swagger en producción si se desea ocultar la estructura de la API al público general.

---
*Generado por Gemini CLI - v1.3.1*
