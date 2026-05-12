# Plan: Sistema Prode Mundial 2026

## Stack
| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express + TypeScript |
| Base de Datos | MySQL con Sequelize ORM |
| Frontend | React + Vite + TypeScript |
| Auth | OTP por email (nodemailer + OTP generado) |
| API Docs | OpenAPI/Swagger |
| Testing | Jest (backend) + Vitest (frontend) |

---

## 1. Modelo de Datos (MySQL)

```
Usuarios
  - id, nombre, email, rol (admin|user), activo, creado_por_admin, created_at

Partidos
  - id, fase (grupos/16vos/8vos/cuartos/semis/final), grupo (A-L)
  - equipo_local, equipo_visitante, fecha_hora
  - goles_local, goles_visitante (se llena cuando termina)
  - estado (pendiente/jugando/finalizado)

Pronosticos
  - id, usuario_id, partido_id
  - goles_local, goles_visitante
  - puntos_obtenidos (nullable, se calcula post-partido)
  - created_at, updated_at

ConfiguracionPuntos
  - id, tipo (exacto|diferencia|ganador|error), puntos (int)
  - activo (bool), modified_at

CodigosOTP
  - id, email, codigo, expira_en, usado, created_at
```

## 2. API REST (Endpoints)

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/solicitar-otp` | Envía OTP al email |
| POST | `/api/auth/verificar-otp` | Verifica OTP y devuelve JWT |

### Usuarios (Admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/usuarios` | Listar usuarios |
| POST | `/api/admin/usuarios` | Registrar usuario |
| PUT | `/api/admin/usuarios/:id` | Editar usuario |
| DELETE | `/api/admin/usuarios/:id` | Desactivar usuario |

### Partidos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/partidos` | Listar partidos (filtro por fase) |
| PUT | `/api/admin/partidos/:id/resultado` | Admin carga resultado real |
| POST | `/api/admin/partidos/generar` | Genera fixture automático |

### Pronósticos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/pronosticos/mis` | Mis pronósticos |
| PUT | `/api/pronosticos` | Cargar/actualizar pronóstico |
| GET | `/api/pronosticos/puntajes` | Ranking general con puntos |

### Configuración (Admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/configuracion` | Ver config de puntuación |
| PUT | `/api/admin/configuracion` | Actualizar puntuación |

## 3. Componentes React

```
src/
  pages/
    LoginPage.tsx          # Ingreso de email + OTP
    Dashboard.tsx          # Panel del usuario (pronósticos + puntaje)
    AdminPanel.tsx         # Admin: usuarios, config, resultados
    RankingPage.tsx        # Tabla general pública
  components/
    PartidoCard.tsx        # Card con selector de resultado
    TablaPosiciones.tsx    # Tabla de ranking
    FormUsuario.tsx        # Formulario crear/editar usuario
    ModalResultado.tsx     # Modal para carga de resultado real
  contexts/
    AuthContext.tsx        # Contexto de autenticación
```

## 4. Fases de Implementación

### Fase 1: Specs y Setup
- Escribir especificación OpenAPI (swagger.yml)
- Inicializar proyecto Node.js + Express + TypeScript
- Inicializar proyecto React + Vite + TypeScript
- Configurar ESLint, Prettier
- Configurar Sequelize + MySQL

### Fase 2: Auth (Login OTP por email)
- Modelo CodigosOTP + Usuarios
- Endpoint solicitar-otp (generar código, enviar email)
- Endpoint verificar-otp (validar, devolver JWT)
- Middleware de autenticación JWT
- Frontend: LoginPage.tsx + AuthContext.tsx

### Fase 3: Generación automática de fixture
- Seed con las 48 selecciones del Mundial 2026
- Lógica de generación: 12 grupos de 4, armado de fixture grupos
- Lógica de generación: eliminatorias
- Endpoints de partidos

### Fase 4: Módulo de Pronósticos
- Modelo Pronosticos
- Endpoints de pronósticos
- Frontend: Dashboard.tsx + PartidoCard.tsx

### Fase 5: Puntuación y Ranking
- Modelo ConfiguracionPuntos
- Sistema de cálculo de puntos
- Endpoint de ranking
- Frontend: RankingPage.tsx + TablaPosiciones.tsx

### Fase 6: Panel de Administración
- CRUD usuarios
- Carga de resultados
- Configuración de puntuación
- Frontend: AdminPanel.tsx

### Fase 7: Testing y Polish
- Tests unitarios backend y frontend
- Documentación Swagger
- Manejo de estados (loading, empty, error)
- Responsive design

## 5. Reglas de Negocio

- **Cierre de pronóstico**: No se puede modificar un pronóstico después de que el partido comenzó
- **Cálculo de puntos**: Se ejecuta automáticamente cuando el admin carga el resultado real
- **Puntuación configurable**: Admin define valores para exacto, diferencia, ganador, error
- **Eliminatorias**: Se liberan fase por fase según el admin cargue resultados
