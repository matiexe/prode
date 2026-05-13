# Guía de Gestión de Ambientes - Prode Mundial 2026

Esta guía explica cómo gestionar los ambientes de Desarrollo, Pruebas (Preview) y Producción utilizando Vercel y GitHub para asegurar un flujo de trabajo profesional y seguro.

---

## 1. Los Tres Ambientes

| Ambiente | URL Ejemplo | Base de Datos | Uso |
| :--- | :--- | :--- | :--- |
| **Producción** | `prode-2026.vercel.app` | `prode-prod` | Usuarios reales. |
| **Preview** | `prode-git-develop.vercel.app` | `prode-testing` | Pruebas antes de lanzar. |
| **Local** | `localhost:5173` | Postgres Local / Testing | Desarrollo de nuevas funciones. |

---

## 2. Configuración de Base de Datos de Pruebas

Para evitar borrar datos reales durante tus tests, sigue estos pasos:

1.  Ve a la pestaña **Storage** en Vercel.
2.  Crea una **segunda base de datos Postgres** llamada `prode-testing`.
3.  En la configuración de la nueva base de datos, haz clic en **"Connect Project"**.
4.  **IMPORTANTE:** Cuando te pregunte por el "Environment", selecciona **únicamente "Preview"**.
5.  Esto hará que cuando uses una rama de pruebas, el backend use automáticamente `prode-testing`.

---

## 3. Flujo de Trabajo con Ramas (Git Flow)

Nunca trabajes directamente sobre `main`. Sigue este ciclo:

### Paso A: Crear una rama de pruebas
```bash
git checkout -b develop
```

### Paso B: Realizar cambios y subir
```bash
git add .
git commit -m "feat: mi nueva funcionalidad"
git push origin develop
```

### Paso C: Revisar el despliegue de Preview
1.  Vercel detectará el push y creará un **Preview Deployment**.
2.  Ve a tu Dashboard de Vercel y busca la URL de esa rama.
3.  Esta URL es idéntica a la real pero usa la base de datos de pruebas.

---

## 4. Uso del Master Seed (Poblar Datos)

Para llenar la base de datos de pruebas (o producción) con todos los partidos del Mundial de un solo golpe:

1.  Asegúrate de tener la variable `ADMIN_SECRET` configurada en Vercel.
2.  Usa una herramienta como Postman o `curl` para llamar al endpoint:
    *   **Método:** `POST`
    *   **URL:** `https://tu-url-de-vercel.app/api/seed/full-reset`
    *   **Body (JSON):** 
        ```json
        { "secret": "tu_secreto_configurado" }
        ```
3.  Esto borrará los partidos actuales y cargará los 48 partidos de fase de grupos, el admin y la configuración de puntos.

---

## 5. Paso a Producción (Merge)

Cuando estés satisfecho con las pruebas en el ambiente de Preview:

1.  Ve a GitHub y abre un **Pull Request** de `develop` hacia `main`.
2.  Haz el **Merge**.
3.  Vercel desplegará automáticamente en la URL de producción.

---

## 6. Variables de Entorno Requeridas

Asegúrate de que estas variables estén en Vercel para todos los ambientes:

- `POSTGRES_URL`: (Gestionado automáticamente por Vercel)
- `RESEND_API_KEY`: Tu clave de Resend.
- `JWT_SECRET`: Una clave larga y aleatoria.
- `ADMIN_SECRET`: Clave para ejecutar el `full-reset`.
- `NODE_ENV`: Vercel lo pone en `production` automáticamente en la nube.

---
**Nota de Rama:** Esta versión corresponde a la rama `develop` para pruebas.
---
*Documento generado por Gemini CLI para el proyecto Prode Mundial 2026.*
