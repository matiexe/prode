# Resumen de Migración: Prode Mundial 2026 a Vercel Serverless

Este documento detalla los cambios técnicos realizados para adaptar el sistema de Prode a la infraestructura de Vercel con un modelo de costes optimizado ($0/mes).

## 📅 Fecha de Migración
12 de mayo de 2026

## 🚀 Cambios de Infraestructura

### 1. Base de Datos: De SQL Server a Postgres
- **Proveedor sugerido:** Vercel Postgres (Powered by Neon).
- **ORM:** Se actualizó Sequelize para usar el dialecto `postgres`.
- **Conectividad:** Se implementó una lógica de conexión dual (URL de conexión para producción y parámetros individuales para desarrollo local).
- **Optimización:** Se redujo el pool de conexiones (`max: 5`) para evitar el agotamiento de recursos en funciones serverless.

### 2. Envío de Emails: De SMTP a Resend API
- **Motivo:** Mayor confiabilidad y velocidad en entornos serverless.
- **Implementación:** Se sustituyó `nodemailer` por el SDK de `@resend/node`.
- **Configuración:** Requiere la variable de entorno `RESEND_API_KEY`.

### 3. Arquitectura del Servidor: Express a Vercel Functions
- **Punto de Entrada:** `backend/src/index.ts` ahora exporta la aplicación `app` en lugar de solo iniciar un servidor persistente.
- **Inicialización de DB:** Se implementó un middleware de "Warm start" para sincronizar modelos e insertar datos iniciales (configuración de puntos y admin) solo cuando es necesario.
- **Enrutamiento:** Se configuró `vercel.json` para manejar tanto el frontend de React como el backend de Express en un mismo despliegue.

## 📦 Versionado
- **Commit:** `feat(infra): migrate to vercel serverless, postgres and resend`
- **Etiqueta (Tag):** `v1.1.0-vercel`

## 🔑 Variables de Entorno Requeridas en Vercel
| Variable | Descripción |
| :--- | :--- |
| `POSTGRES_URL` | URL de conexión de Vercel Postgres |
| `RESEND_API_KEY` | API Key de Resend para envío de correos |
| `JWT_SECRET` | Secreto para la firma de tokens de sesión |
| `FRONTEND_URL` | URL del despliegue (para CORS) |
| `NODE_ENV` | Debe ser `production` |

---
*Documento generado automáticamente por Gemini CLI.*
