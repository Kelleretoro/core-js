# GK CLI Branding - Sistema Avanzado Completo


```text
  ██████╗ ██╗  ██╗      ██████╗██╗     ██╗                         
   ██╔════╝ ██║ ██╔╝     ██╔════╝██║     ██║                         
   ██║  ███╗█████╔╝█████╗██║     ██║     ██║                         
   ██║   ██║██╔═██╗╚════╝██║     ██║     ██║                         
   ╚██████╔╝██║  ██╗     ╚██████╗███████╗██║                         
  ╚═════╝ ╚═╝  ╚═╝      ╚═════╝╚══════╝╚═╝                         
                                                                      
       🎨 BRANDING • REPORTES • CLI • AUTOMATION                 
              by kellerEToro                           
```

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)


## Sistema completo de branding, automatización y gestión de proyectos con integraciones avanzadas

## 🌟 Características Principales


### 🎨 **Branding Personalizado**

- Identidad visual completa con `•K e l £ ə r•`
- Alter ego: `Extraterrestrial ▲ ET`
- Nombre: `Oscar Rojas Ortiz | ORO`
- Empresa: `kellerEToro`


### 🌐 **Integraciones API Externas**

- **GitHub**: Repositorios, issues, PRs, webhooks
- **Jira**: Proyectos, tickets, sprints, transiciones
- **GitKraken**: Boards Kanban, cards, colaboración


### 🖥️ **Servidor MCP Completo**

- API REST con autenticación JWT
- WebSockets para tiempo real
- Base de datos SQLite integrada
- Dashboard web administrativo


### ⚙️ **Configuración Avanzada**

- Múltiples perfiles de usuario
- Configuración por ambiente (dev/prod/test)
- Encriptación de datos sensibles
- Backup y restauración automática


### 🤖 **Sistema de Automatización**

- Workflows programables (cron jobs)
- Scripts automáticos personalizados
- Integración CI/CD completa
- Notificaciones y alertas


## 📦 Instalación Rápida

```bash
# Clonar el repositorio
git clone https://github.com/kelleretoro/gk-cli-branding.git
cd gk-cli-branding

# Instalar dependencias
npm install

# Configuración inicial
npm run setup

# Editar configuración
nano .env

# Iniciar sistema completo
npm run server
```

## 🚀 Uso Rápido


### CLI Interactivo Mejorado

```bash
npm start                    # Modo interactivo visual
npm run interactive          # Alternativa explícita
```

npm run dev                 # Desarrollo con hot-reload

### Servidor MCP Completo

```bash
npm run server              # Producción (puerto 3000)
npm run dev                 # Desarrollo con hot-reload
npm run prod                # Optimizado para producción
```


### Gestión de Configuración

```bash
npm run config get server.port                    # Obtener valor
npm run config set apis.github.token "tu-token"   # Establecer valor
npm run config list-profiles                      # Listar perfiles
npm run config switch-profile production          # Cambiar perfil
```


### Automatización y Workflows

```bash
npm run workflow list       # Ver workflows disponibles
npm run workflow stats      # Estadísticas de ejecución
npm run workflow run daily-backup  # Ejecutar workflow específico
```


### APIs Externas

```bash
npm run api github repos                    # Listar repositorios
npm run api github issues owner repo       # Ver issues
npm run api jira projects                   # Proyectos Jira
npm run api gitkraken boards              # Boards GitKraken
```


## 📋 Estructura del Proyecto

```text
gk-cli-branding/
├── 📁 src/
│   ├── 📁 api/                    # Integraciones API externas
│   │   ├── github.js              # GitHub API completa
│   │   ├── jira.js                # Jira API completa  
│   │   └── gitkraken.js           # GitKraken + Git API
│   ├── 📁 server/                 # Servidor MCP
│   │   └── mcp-server.js          # API REST + WebSockets
│   ├── 📁 database/               # Gestión de datos
│   │   └── database.js            # SQLite con schemas completos
│   ├── 📁 config/                 # Sistema de configuración
│   │   └── config.js              # Multi-perfil + encriptación
│   ├── 📁 automation/             # Automatización
│   │   └── automation.js          # Workflows y scripts
│   ├── branding.json              # Configuración de branding
│   ├── index.js                   # Módulo principal GKCli
│   └── simple-cli.js              # CLI interactivo mejorado
├── 📁 bin/
│   └── gk-cli.js                  # CLI básico original
├── advanced-cli.js                # Sistema avanzado integrado
├── demo-advanced.js               # Demo completa de funcionalidades
├── .env.example                   # Plantilla de configuración
└── package.json                   # Scripts y dependencias
```

## 🔧 Configuración Detallada

### Variables de Entorno (.env)

```env
# === CONFIGURACIÓN BÁSICA ===
NODE_ENV=development
PORT=3000
HOST=localhost

# === SEGURIDAD ===
JWT_SECRET=tu-clave-jwt-muy-larga-kelleretoro-2025
CONFIG_ENCRYPTION_KEY=clave-encriptacion-kelleretoro

# === APIS EXTERNAS ===
GITHUB_TOKEN=ghp_tu_token_github_aqui
JIRA_DOMAIN=tu-dominio
JIRA_EMAIL=tu-email@kelleretoro.com  
JIRA_API_TOKEN=tu_token_jira_aqui
GITKRAKEN_TOKEN=tu_token_gitkraken_aqui

# === EMAIL (NOTIFICACIONES) ===
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-password-aplicacion
```

### Perfiles de Configuración

El sistema soporta múltiples perfiles con precedencia automática:

1. **Local** (mayor precedencia) - `config/local.json`
2. **Perfil** - `config/profiles/{perfil}.json`  
3. **Ambiente** - `config/environments/{ambiente}.json`
4. **Base** (menor precedencia) - `config/base.json`

```bash
# Gestión de perfiles
npm run config list-profiles        # Ver perfiles disponibles
npm run config create-profile team  # Crear perfil "team"  
npm run config switch-profile team  # Cambiar a perfil "team"
```

## 🌐 API REST Endpoints


### Autenticación

```http
POST /api/auth/register    # Registrar usuario
POST /api/auth/login       # Iniciar sesión
POST /api/auth/refresh     # Renovar token
POST /api/auth/logout      # Cerrar sesión
```


### Usuarios y Proyectos

```http
GET    /api/user/profile           # Perfil usuario
PUT    /api/user/profile           # Actualizar perfil
GET    /api/projects               # Listar proyectos
POST   /api/projects               # Crear proyecto
GET    /api/projects/:id           # Ver proyecto
PUT    /api/projects/:id           # Actualizar proyecto
DELETE /api/projects/:id           # Eliminar proyecto
```


### Integraciones

```http
GET  /api/github/repos                    # Repositorios GitHub
GET  /api/github/repos/:owner/:repo/issues # Issues GitHub
POST /api/github/repos/:owner/:repo/issues # Crear issue GitHub

GET  /api/jira/projects                   # Proyectos Jira
GET  /api/jira/projects/:key/issues       # Issues Jira
POST /api/jira/issues                     # Crear issue Jira

GET  /api/gitkraken/boards               # Boards GitKraken
GET  /api/gitkraken/boards/:id/cards     # Cards del board
```


### Branding y Analytics

```http
GET /api/branding                    # Configuración branding
GET /api/branding/report            # Reporte completo
GET /api/branding/template/:type    # Plantilla específica
GET /api/analytics/dashboard        # Analytics dashboard
```

## 🤖 Workflows Incluidos


### 1. Backup Diario Automático

```json
{
  "id": "daily-backup",
  "name": "Backup Diario",
  "schedule": "0 2 * * *",
  "steps": [
    "Crear backup SQLite",
    "Notificar por email",
    "Limpiar backups antiguos"
  ]
}
```


### 2. Sincronización GitHub ↔ Jira

```json
{
  "id": "github-jira-sync", 
  "name": "Sincronización GitHub-Jira",
  "schedule": "*/30 * * * *",
  "steps": [
    "Obtener issues GitHub nuevos",
    "Crear tickets Jira equivalentes", 
    "Sincronizar estados bidireccional"
  ]
}
```


### 3. Reporte Semanal

```json
{
  "id": "weekly-report",
  "name": "Reporte Semanal", 
  "schedule": "0 9 * * 1",
  "steps": [
    "Generar estadísticas",
    "Crear reporte HTML",
    "Enviar por email al equipo"
  ]
}
```

## 📊 Dashboard Web

Accede al dashboard web en: `http://localhost:3000/dashboard`


### Funcionalidades del Dashboard

- 📈 **Analytics en tiempo real** - Métricas de uso y rendimiento
- 👥 **Gestión de usuarios** - Roles, permisos y actividad
- 📋 **Proyectos visuales** - Kanban boards y seguimiento
- 🔗 **Integraciones** - Estado de APIs y sincronización
- 🤖 **Workflows** - Editor visual y programación
- ⚙️ **Configuración** - Panel de administración

## 🔒 Seguridad


### Características de Seguridad

- **JWT Authentication** con refresh tokens
- **Rate Limiting** configurable por endpoint
- **CORS** con whitelist de dominios
- **Helmet.js** para headers seguros
- **Validación Joi** para todos los inputs
- **Encriptación AES-256-GCM** para datos sensibles


### Mejores Prácticas Implementadas

- Separación de secretos por ambiente
- Rotación automática de tokens
- Logs de seguridad y auditoría
- Sanitización de inputs
- Manejo seguro de errores

## 📈 Monitoreo y Logs


### Sistema de Logging

```javascript
// Configuración de logs
{
  level: 'info',           // debug, info, warn, error
  format: 'combined',      // Morgan format
  file: './logs/app.log',  // Archivo de logs
  maxSize: '10m',         // Rotación por tamaño
  maxFiles: 5             // Archivos históricos
}
```


### Métricas Disponibles

- 📊 **Requests por minuto** - Tráfico de API
- ⏱️ **Tiempo de respuesta** - Latencia promedio
- 🔄 **Workflows ejecutados** - Estadísticas de automatización
- 👥 **Usuarios activos** - Sesiones y actividad
- 🌐 **APIs externas** - Calls y rate limits

## 🧪 Testing

```bash
# Ejecutar tests básicos
npm test                    

# Tests de integración  
npm run test:integration    

# Coverage completo
npm run test:coverage      

# Tests de APIs
npm run test:api           
```

## 🚀 Deployment


### Desarrollo

```bash
npm run dev                # Servidor desarrollo
```


### Producción

```bash
# Configurar ambiente
export NODE_ENV=production

# Variables de producción en .env
PORT=8080
JWT_SECRET=production-secret-muy-largo
DATABASE_PATH=/data/production.sqlite

# Iniciar
npm run prod
```


### Docker (Opcional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "run", "prod"]
```

## 📚 Documentación API


### Generación Automática

- **OpenAPI 3.0** spec disponible en `/api/docs`
- **Swagger UI** interactivo en `/api/docs/ui`
- **Postman Collection** exportable
- **Insomnia Workspace** incluido


### Ejemplos de Uso



#### Autenticación de API

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@kelleretoro.com',
    password: 'password123'
  })
});

const { token } = await response.json();
```


#### Uso con Token

```javascript
// Requests autenticados
const projects = await fetch('/api/projects', {
  headers: { 
    'Authorization': `Bearer ${token}` 
  }
});
```

## 🔧 Desarrollo y Contribución


### Configuración de Desarrollo

```bash
# Fork y clone
git clone https://github.com/tu-usuario/gk-cli-branding.git
cd gk-cli-branding

# Instalar dependencias de desarrollo
npm install

# Configurar pre-commit hooks
npm run prepare

# Servidor de desarrollo con hot-reload
npm run dev
```


### Estructura de Commits

```text
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización documentación
style: cambios de formato
refactor: refactorización
test: añadir tests
chore: tareas de mantenimiento
```


### Pull Requests

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commits descriptivos siguiendo convención
4. Tests para nueva funcionalidad
5. Actualizar documentación
6. PR con descripción detallada

## 🏗️ Roadmap Futuro


### 🔮 Próximas Funcionalidades


#### Q1 2025

- [ ] **Plugin System** - Arquitectura de plugins extensible
- [ ] **GraphQL API** - Alternativa a REST API
- [ ] **Real-time Dashboard** - Updates en vivo con WebSockets
- [ ] **Mobile App** - Companion app React Native


#### Q2 2025

- [ ] **AI Integration** - ChatGPT/Claude para workflows
- [ ] **Advanced Analytics** - ML para insights predictivos
- [ ] **Multi-tenant** - Soporte para múltiples organizaciones
- [ ] **Kubernetes** - Deployment cloud-native


#### Q3 2025

- [ ] **Blockchain Integration** - NFTs para branding assets
- [ ] **AR/VR Support** - Branding en realidad aumentada
- [ ] **Voice Commands** - Control por voz
- [ ] **Global CDN** - Distribución mundial

## 🤝 Soporte y Comunidad


### 📞 Contacto

- **Email**: [rojort.os@kelleretoro.com](mailto:rojort.os@kelleretoro.com)
- **Website**: [https://kelleretoro.com](https://kelleretoro.com)
- **Phone**: +52 5532298221


### 🌐 Redes Sociales

- **Instagram**: [@kelleretoro](https://instagram.com/kelleretoro)
- **Facebook**: [kelleretoroph](https://facebook.com/kelleretoroph)


### 🏷️ Hashtags

- `#KellerOjo` `#kellerETojo` `#kellerEToro`

### 🎨 Paleta de Colores:
- `#8dffe9` `#4bfbd6` `#283431` `#01f8fe` `#2a302b`

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**Hecho con ❤️ por [kellerEToro](https://kelleretoro.com)**

`•K e l £ ə r• | Extraterrestrial ▲ ET | Oscar Rojas Ortiz | ORO`

*Capturando México ▲ | Tiempo, escenarios ǝ instantes*

---

⭐ **¡Dale una estrella si este proyecto te ayudó!** ⭐

</div>