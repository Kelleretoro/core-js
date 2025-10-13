# 🚀 GK CLI - Guía de Comandos Esenciales

## by kellerEToro - Oscar Rojas Ortiz | ORO

### 📋 COMANDOS PRINCIPALES

#### 🖥️ **Servidor MCP**

```bash
# Iniciar servidor completo
npm run server-simple

# Verificar estado
npm run health
npm run status

# Dashboard web
open http://localhost:3000/dashboard
```

#### ⚙️ **CLI Interactivo**

```bash
# Modo interactivo principal
npm start

# CLI básico
npm run cli

# Modo interactivo avanzado
npm run interactive
```

#### 🔧 **Configuración**

```bash
# Configuración inicial
npm run setup

# Editar variables de entorno
nano .env

# Ver configuración
npm run config
```

#### 🤖 **Automatización**

```bash
# Ejecutar workflows
npm run workflow

# APIs externas
npm run api

# Backup completo
npm run backup
```

#### 🧹 **Mantenimiento**

```bash
# Limpiar archivos temporales
npm run clean

# Instalar/actualizar dependencias
npm run install-deps

# Verificar funcionamiento
npm run status
```

### 🎯 **URLs IMPORTANTES**

- **[Dashboard](http://localhost:3000/dashboard)**
- **[API Health](http://localhost:3000/api/health)**
- **[API Info](http://localhost:3000/api/info)**

### 🔑 **CONFIGURACIÓN .env**

```bash
# Mínima configuración requerida
NODE_ENV=development
PORT=3000
HOST=localhost
JWT_SECRET=tu-clave-secreta-jwt-muy-larga-y-segura

# APIs opcionales
GITHUB_TOKEN=ghp_tu_token_github
JIRA_DOMAIN=tu-dominio
JIRA_EMAIL=tu-email
JIRA_API_TOKEN=tu_token_jira
```

### 🚨 **SOLUCIÓN DE PROBLEMAS**

#### El servidor no inicia

```bash
# Verificar puerto libre
lsof -i :3000

# Reiniciar limpio
npm run clean
npm install
npm run server-simple
```

#### Problemas de dependencias

```bash
# Reinstalar todo
rm -rf node_modules
npm install
npm audit fix --force
```

#### Verificar funcionamiento

```bash
# Test completo
npm run status
curl http://localhost:3000/api/health
```

### 🎉 **FUNCIONALIDADES DESTACADAS**

✅ **Servidor MCP** con REST API + WebSockets  
✅ **Dashboard Web** interactivo  
✅ **CLI Avanzado** con modo interactivo  
✅ **Integración APIs** (GitHub, Jira, GitKraken)  
✅ **Sistema de Configuración** multi-perfil  
✅ **Automatización** de workflows  
✅ **Branding Personalizado** "Oscar Rojas Ortiz | ORO"  

### 📞 **SOPORTE**

- **Autor:** Oscar Rojas Ortiz | ORO
- **Email:** [rojort.os@kelleretoro.com](mailto:rojort.os@kelleretoro.com)
- **Empresa:** kellerEToro
- **[URL](https://kelleretoro.com)**

---
*Sistema completo y optimizado - Listo para producción* 🌟