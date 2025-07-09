# Destored Backend

Backend robusto, escalable y seguro para la plataforma Destored - una plataforma que conecta profesionales con clientes para proyectos freelance.

## 🚀 Características

- **Arquitectura de capas**: Separación clara entre rutas, servicios, modelos y middlewares
- **Autenticación robusta**: JWT, Passport.js con estrategias local, Google y LinkedIn
- **Base de datos**: PostgreSQL con Sequelize ORM
- **Validación**: Joi para validación de esquemas
- **Documentación**: Swagger/OpenAPI integrada
- **Subida de archivos**: Integración con Cloudinary
- **Sistema de notificaciones**: En tiempo real
- **Analytics**: Estadísticas completas de la plataforma
- **Testing**: Jest configurado para pruebas
- **Linting**: ESLint y Prettier para calidad de código

## 📁 Estructura del Proyecto

```
src/
├── config/              # Configuraciones (Passport, etc.)
├── db/                  # Base de datos
│   ├── config/         # Configuración de Sequelize
│   ├── models/         # Modelos de Sequelize
│   ├── migrations/     # Migraciones
│   └── seeders/        # Datos iniciales
├── middlewares/         # Middlewares personalizados
├── routes/              # Rutas de la API
│   └── api/v1/         # Versión 1 de la API
├── schemas/             # Esquemas de validación Joi
├── services/            # Lógica de negocio
└── utils/               # Utilidades
```

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Sequelize** - ORM
- **JWT** - Autenticación
- **Passport.js** - Estrategias de autenticación
- **Joi** - Validación de esquemas
- **Cloudinary** - Gestión de archivos
- **Winston** - Logging
- **Swagger** - Documentación de API
- **Jest** - Testing
- **ESLint** - Linting
- **Prettier** - Formateo de código

## 📋 Prerrequisitos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn
- Cuenta en Cloudinary (para archivos)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd backend-destored
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Configurar las siguientes variables:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=destored_dev
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Configurar base de datos

```bash
# Crear base de datos
npm run db:create

# Ejecutar migraciones
npm run migrate

# Poblar con datos iniciales
npm run seed
```

### 5. Iniciar servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Documentación de la API

Una vez iniciado el servidor, la documentación de Swagger estará disponible en:

```
http://localhost:3000/api/docs
```

## 🗂️ Endpoints Principales

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Inicio de sesión
- `POST /api/v1/auth/refresh` - Renovar token
- `GET /api/v1/auth/google` - Autenticación con Google
- `GET /api/v1/auth/linkedin` - Autenticación con LinkedIn

### Usuarios
- `GET /api/v1/users/profile` - Obtener perfil
- `PUT /api/v1/users/profile` - Actualizar perfil
- `GET /api/v1/users/stats` - Estadísticas del usuario

### Profesionales
- `GET /api/v1/professionals/search` - Buscar profesionales
- `GET /api/v1/professionals/profile` - Perfil del profesional
- `POST /api/v1/professionals/skills` - Agregar habilidad
- `POST /api/v1/professionals/portfolio` - Agregar proyecto al portafolio

### Clientes
- `GET /api/v1/clients/profile` - Perfil del cliente
- `GET /api/v1/clients/projects` - Proyectos del cliente
- `POST /api/v1/clients/reviews` - Crear review

### Proyectos
- `GET /api/v1/projects` - Listar proyectos
- `POST /api/v1/projects` - Crear proyecto
- `POST /api/v1/projects/:id/apply` - Aplicar a proyecto
- `PUT /api/v1/projects/:id/assign` - Asignar proyecto

### Archivos
- `POST /api/v1/files/upload` - Subir archivo
- `GET /api/v1/files/:id` - Obtener archivo
- `DELETE /api/v1/files/:id` - Eliminar archivo

### Notificaciones
- `GET /api/v1/notifications` - Obtener notificaciones
- `PATCH /api/v1/notifications/:id/read` - Marcar como leída

### Analytics (Admin)
- `GET /api/v1/analytics/dashboard` - Dashboard completo
- `GET /api/v1/analytics/platform-stats` - Estadísticas generales

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage
```

## 📝 Scripts Disponibles

```bash
npm start              # Iniciar servidor en producción
npm run dev            # Iniciar servidor en desarrollo
npm test              # Ejecutar tests
npm run migrate       # Ejecutar migraciones
npm run seed          # Poblar base de datos
npm run db:reset      # Resetear base de datos completa
npm run lint          # Ejecutar linter
npm run lint:fix      # Corregir errores de linting
npm run format        # Formatear código con Prettier
npm run setup         # Configuración inicial completa
```

## 🔐 Roles y Permisos

### Roles de Usuario
- **client**: Cliente que publica proyectos
- **professional**: Profesional que aplica a proyectos
- **admin**: Administrador del sistema
- **gerencia**: Gestión y analytics

### Middlewares de Autenticación
- `authMiddleware`: Verificar token JWT
- `roleMiddleware`: Verificar roles específicos

## 🏗️ Modelos de Base de Datos

### Principales Entidades
- **User**: Usuario base del sistema
- **Professional**: Perfil de profesional
- **Client**: Perfil de cliente
- **Project**: Proyectos publicados
- **Application**: Aplicaciones a proyectos
- **Skill**: Habilidades de profesionales
- **Portfolio**: Portafolio de trabajos
- **Review**: Reseñas y calificaciones
- **Payment**: Gestión de pagos
- **Notification**: Sistema de notificaciones

## 🔧 Configuración de Desarrollo

### Variables de Entorno de Desarrollo
```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

### Base de Datos de Testing
```env
DB_NAME_TEST=destored_test
```

## 🚀 Despliegue

### Variables de Producción
```env
NODE_ENV=production
LOG_LEVEL=info
```

### Comandos de Despliegue
```bash
# Build y optimización
npm run build

# Inicio en producción
npm start
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo

- **Backend Developer**: Desarrollador principal
- **DevOps**: Configuración de infraestructura
- **QA**: Testing y calidad

## 📞 Soporte

Para soporte técnico:
- Email: soporte@destored.com
- Documentación: `/api/docs`
- Issues: GitHub Issues

---

### 🎯 Próximas Características

- [ ] Sistema de pagos con Stripe
- [ ] Chat en tiempo real con Socket.io
- [ ] Sistema de mentorías
- [ ] Convocatorias grupales
- [ ] API de métricas avanzadas
- [ ] Integración con más proveedores OAuth
- [ ] Sistema de disputes y resolución
- [ ] Certificaciones de habilidades

---

**Destored Backend** - Conectando talento con oportunidades 🚀
