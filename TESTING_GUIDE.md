# Guía de Testing Unitario - Prode Mundial 2026

Este documento explica cómo funcionan los tests unitarios en este proyecto para asegurar la integridad de los puntajes.

## 🛠️ Herramientas Utilizadas
- **Jest:** El framework de ejecución de tests.
- **ts-jest:** Permite a Jest entender archivos TypeScript.
- **Mocks:** Técnica para simular comportamientos de la base de datos (Sequelize).

## 💡 Conceptos Clave para Aprender

### 1. ¿Por qué usamos Mocks?
En un entorno serverless o de desarrollo, no siempre queremos depender de una base de datos activa para probar una simple cuenta matemática. Usamos `jest.mock('../models/Partido')` para interceptar las llamadas a la DB y devolver datos estáticos.

### 2. Estructura de un Test (AAA)
- **Arrange (Organizar):** Configuramos los datos falsos (ej. el resultado del partido es 2-1).
- **Act (Actuar):** Ejecutamos la función que queremos probar (`calcularPuntosPronosticos`).
- **Assert (Afirmar):** Verificamos que el resultado sea el esperado (ej. `expect(puntos).toBe(3)`).

## 🏃 Cómo correr los tests
Desde la carpeta `backend`, ejecuta:
```bash
npm test
```

## 📈 Próximos Pasos Sugeridos
- **Tests de Integración:** Probar los Endpoints de la API (usando `supertest`).
- **Frontend Testing:** Usar Vitest para asegurar que los componentes de React muestran los datos correctamente.

---
*Documento generado por Gemini CLI para fines educativos.*
