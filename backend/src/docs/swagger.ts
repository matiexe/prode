import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Prode Mundial 2026 API',
      version: '1.0.0',
      description: 'API REST para el sistema de pronósticos deportivos del Mundial 2026',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        AuthSolicitarOTP: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
          },
        },
        AuthVerificarOTP: {
          type: 'object',
          required: ['email', 'codigo'],
          properties: {
            email: { type: 'string', format: 'email' },
            codigo: { type: 'string', minLength: 6, maxLength: 6 },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            usuario: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                nombre: { type: 'string' },
                email: { type: 'string' },
                rol: { type: 'string', enum: ['admin', 'user'] },
              },
            },
          },
        },
        Usuario: {
          type: 'object',
          required: ['nombre', 'email'],
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            email: { type: 'string', format: 'email' },
            rol: { type: 'string', enum: ['admin', 'user'] },
            activo: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CrearUsuario: {
          type: 'object',
          required: ['nombre', 'email'],
          properties: {
            nombre: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            rol: { type: 'string', enum: ['admin', 'user'], default: 'user' },
          },
        },
        Partido: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            fase: { type: 'string', enum: ['grupos', '16vos', '8vos', 'cuartos', 'semis', 'final'] },
            grupo: { type: 'string', nullable: true },
            equipoLocal: { type: 'string' },
            equipoVisitante: { type: 'string' },
            fechaHora: { type: 'string', format: 'date-time' },
            golesLocal: { type: 'integer', nullable: true },
            golesVisitante: { type: 'integer', nullable: true },
            estado: { type: 'string', enum: ['pendiente', 'jugando', 'finalizado'] },
          },
        },
        ResultadoRequest: {
          type: 'object',
          required: ['golesLocal', 'golesVisitante'],
          properties: {
            golesLocal: { type: 'integer', minimum: 0 },
            golesVisitante: { type: 'integer', minimum: 0 },
          },
        },
        PronosticoRequest: {
          type: 'object',
          required: ['partidoId', 'golesLocal', 'golesVisitante'],
          properties: {
            partidoId: { type: 'integer' },
            golesLocal: { type: 'integer', minimum: 0 },
            golesVisitante: { type: 'integer', minimum: 0 },
          },
        },
        Pronostico: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            partidoId: { type: 'integer' },
            partido: { $ref: '#/components/schemas/Partido' },
            golesLocal: { type: 'integer' },
            golesVisitante: { type: 'integer' },
            puntosObtenidos: { type: 'integer', nullable: true },
          },
        },
        ConfiguracionPuntos: {
          type: 'object',
          properties: {
            exacto: { type: 'integer', description: 'Puntos por resultado exacto' },
            diferencia: { type: 'integer', description: 'Puntos por acertar diferencia de goles' },
            ganador: { type: 'integer', description: 'Puntos por acertar solo el ganador' },
            error: { type: 'integer', description: 'Puntos por pronóstico errado' },
          },
        },
        RankingEntry: {
          type: 'object',
          properties: {
            posicion: { type: 'integer' },
            usuarioId: { type: 'integer' },
            nombre: { type: 'string' },
            puntos: { type: 'integer' },
            aciertosExactos: { type: 'integer' },
            aciertosDiferencia: { type: 'integer' },
            aciertosGanador: { type: 'integer' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            mensaje: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/api/auth/solicitar-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Solicitar código OTP',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSolicitarOTP' } } },
          },
          responses: {
            '200': { description: 'OTP enviado al email' },
            '400': { description: 'Email inválido' },
          },
        },
      },
      '/api/auth/verificar-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Verificar código OTP e iniciar sesión',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthVerificarOTP' } } },
          },
          responses: {
            '200': { description: 'Autenticación exitosa', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            '401': { description: 'Código inválido o expirado' },
          },
        },
      },
      '/api/admin/usuarios': {
        get: {
          tags: ['Usuarios'],
          summary: 'Listar usuarios',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Lista de usuarios', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Usuario' } } } } },
          },
        },
        post: {
          tags: ['Usuarios'],
          summary: 'Registrar nuevo usuario',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CrearUsuario' } } },
          },
          responses: {
            '201': { description: 'Usuario creado' },
            '400': { description: 'Datos inválidos' },
          },
        },
      },
      '/api/admin/usuarios/{id}': {
        put: {
          tags: ['Usuarios'],
          summary: 'Editar usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Usuario actualizado' } },
        },
        delete: {
          tags: ['Usuarios'],
          summary: 'Desactivar usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { '200': { description: 'Usuario desactivado' } },
        },
      },
      '/api/partidos': {
        get: {
          tags: ['Partidos'],
          summary: 'Listar partidos',
          parameters: [
            { name: 'fase', in: 'query', schema: { type: 'string', enum: ['grupos', '16vos', '8vos', 'cuartos', 'semis', 'final'] } },
            { name: 'grupo', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Lista de partidos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Partido' } } } } } },
        },
      },
      '/api/admin/partidos/generar': {
        post: {
          tags: ['Partidos'],
          summary: 'Generar fixture automático',
          security: [{ bearerAuth: [] }],
          responses: { '201': { description: 'Fixture generado' } },
        },
      },
      '/api/admin/partidos/{id}/resultado': {
        put: {
          tags: ['Partidos'],
          summary: 'Cargar resultado real',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ResultadoRequest' } } },
          },
          responses: { '200': { description: 'Resultado guardado' } },
        },
      },
      '/api/pronosticos': {
        put: {
          tags: ['Pronósticos'],
          summary: 'Crear o actualizar pronóstico',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PronosticoRequest' } } },
          },
          responses: {
            '200': { description: 'Pronóstico guardado' },
            '403': { description: 'Partido ya comenzó' },
          },
        },
      },
      '/api/pronosticos/mis': {
        get: {
          tags: ['Pronósticos'],
          summary: 'Obtener mis pronósticos',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Mis pronósticos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Pronostico' } } } } } },
        },
      },
      '/api/pronosticos/puntajes': {
        get: {
          tags: ['Pronósticos'],
          summary: 'Ranking general de puntos',
          responses: { '200': { description: 'Ranking', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RankingEntry' } } } } } },
        },
      },
      '/api/admin/configuracion': {
        get: {
          tags: ['Configuración'],
          summary: 'Ver configuración de puntuación',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Configuración actual', content: { 'application/json': { schema: { $ref: '#/components/schemas/ConfiguracionPuntos' } } } } },
        },
        put: {
          tags: ['Configuración'],
          summary: 'Actualizar configuración de puntuación',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ConfiguracionPuntos' } } },
          },
          responses: { '200': { description: 'Configuración actualizada' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
