# Tareas Pendientes - Prode Mundial 2026

## 1. 🛠️ Estabilidad y Despliegue (Alta Prioridad)
- [x] **Instalación de dependencias:** Ejecutar `npm install` en `frontend/` y `backend/` en el entorno de desarrollo/CI.
- [x] **Validación de Build:** Confirmar que `npm run build` en el frontend pase sin errores de TypeScript tras los fixes de `verbatimModuleSyntax` e imports.
- [x] **Error de Base de Datos (Vercel):** Resolver el error `relation "usuarios" does not exist`. (Sincronización de modelos en Postgres).

## 2. 🧪 Testing (Deuda Técnica)
- [x] **Backend Tests:** Aumentar cobertura en `backend/src/services/`. Especialmente `torneo.service.ts` y la nueva lógica de avance de fases.
- [x] **Frontend Tests:** Configurar Vitest y crear tests para componentes críticos (Simulador de posiciones, Brackets).

## 3. ⚽ Lógica de Negocio (Funcional)
- [x] **Ganador por Penales:** Verificar persistencia de `ganadorNombre` en eliminatorias.
- [x] **Cierre de Fases:** Probar flujo completo desde Semis hasta Final/3er Puesto.
- [x] **Validación de Tiempos:** Bloquear edición de pronósticos una vez iniciado el partido.

## 4. 🎨 UI/UX (Pulido)
- [x] **Responsividad:** Mejorar tablas y grids en móviles (`AdminPanel`, `RankingPage`).
- [x] **Skeletons/Loading:** Añadir estados de carga visuales en el Dashboard.
- [x] **Documentación API:** Actualizar `swagger.ts` con nuevos parámetros y rutas.

## 5. 🚀 Infraestructura
- [x] **GitHub Actions:** Configurar pipeline de CI para build y tests automáticos.
- [x] **Seeds de Producción:** Asegurar que los datos iniciales (Admin, Configuración de puntos) se inserten tras la creación de tablas.

---
*Archivo actualizado el 14 de mayo de 2026 por Gemini CLI.*
