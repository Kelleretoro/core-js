/**
 * MCP Server - Model Context Protocol Server
 * API REST completa con WebSockets, autenticación y base de datos
 * by kellerEToro
 */

require('core-js/stable');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const dotenv = require('dotenv');

// Importar APIs externas
const GitHubAPI = require('../api/github');
const JiraAPI = require('../api/jira');
const GitKrakenAPI = require('../api/gitkraken');

// Importar base de datos
const Database = require('../database/database');

// Importar configuración
const Config = require('../config/config');

// Cargar variables de entorno
dotenv.config();

class MCPServer {
  constructor(config = {}) {
    this.config = new Config(config);
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: this.config.get('cors.origin'),
        methods: ['GET', 'POST']
      }
    });
    
    this.db = new Database(this.config.get('database'));
    this.githubAPI = new GitHubAPI();
    this.jiraAPI = new JiraAPI();
    this.gitkrakenAPI = new GitKrakenAPI();
    
    this.connectedClients = new Map();
    this.activeProjects = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSockets();
    this.setupErrorHandling();
  }

  /**
   * Configurar middleware
   */
  setupMiddleware() {
    // Seguridad
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: this.config.get('cors.origin'),
      credentials: true
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por ventana
      message: 'Demasiadas requests, intenta más tarde'
    });
    this.app.use('/api/', limiter);
    
    // Logging
    this.app.use(morgan('combined'));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Headers personalizados
    this.app.use((req, res, next) => {
      res.set('X-Powered-By', 'gk-cli-branding by kellerEToro');
      next();
    });
  }

  /**
   * Configurar rutas de la API
   */
  setupRoutes() {
    // Ruta de salud
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        server: 'gk-cli-branding MCP Server by kellerEToro'
      });
    });

    // Rutas de autenticación
    this.app.post('/api/auth/register', this.validateRegistration, this.register.bind(this));
    this.app.post('/api/auth/login', this.validateLogin, this.login.bind(this));
    this.app.post('/api/auth/refresh', this.authenticateToken, this.refreshToken.bind(this));
    this.app.post('/api/auth/logout', this.authenticateToken, this.logout.bind(this));

    // Rutas de usuario
    this.app.get('/api/user/profile', this.authenticateToken, this.getUserProfile.bind(this));
    this.app.put('/api/user/profile', this.authenticateToken, this.updateUserProfile.bind(this));

    // Rutas de proyectos
    this.app.get('/api/projects', this.authenticateToken, this.getProjects.bind(this));
    this.app.post('/api/projects', this.authenticateToken, this.validateProject, this.createProject.bind(this));
    this.app.get('/api/projects/:id', this.authenticateToken, this.getProject.bind(this));
    this.app.put('/api/projects/:id', this.authenticateToken, this.validateProject, this.updateProject.bind(this));
    this.app.delete('/api/projects/:id', this.authenticateToken, this.deleteProject.bind(this));

    // Rutas de GitHub
    this.app.get('/api/github/repos', this.authenticateToken, this.getGitHubRepos.bind(this));
    this.app.get('/api/github/repos/:owner/:repo/issues', this.authenticateToken, this.getGitHubIssues.bind(this));
    this.app.post('/api/github/repos/:owner/:repo/issues', this.authenticateToken, this.createGitHubIssue.bind(this));

    // Rutas de Jira
    this.app.get('/api/jira/projects', this.authenticateToken, this.getJiraProjects.bind(this));
    this.app.get('/api/jira/projects/:key/issues', this.authenticateToken, this.getJiraIssues.bind(this));
    this.app.post('/api/jira/issues', this.authenticateToken, this.createJiraIssue.bind(this));

    // Rutas de GitKraken
    this.app.get('/api/gitkraken/boards', this.authenticateToken, this.getGitKrakenBoards.bind(this));
    this.app.get('/api/gitkraken/boards/:id/cards', this.authenticateToken, this.getGitKrakenCards.bind(this));

    // Rutas de branding
    this.app.get('/api/branding', this.getBranding.bind(this));
    this.app.get('/api/branding/report', this.authenticateToken, this.getBrandingReport.bind(this));
    this.app.get('/api/branding/template/:type', this.authenticateToken, this.getBrandingTemplate.bind(this));

    // Rutas de analytics
    this.app.get('/api/analytics/dashboard', this.authenticateToken, this.getDashboardAnalytics.bind(this));
    this.app.get('/api/analytics/projects/:id', this.authenticateToken, this.getProjectAnalytics.bind(this));

    // Rutas de configuración
    this.app.get('/api/config', this.authenticateToken, this.getConfig.bind(this));
    this.app.put('/api/config', this.authenticateToken, this.updateConfig.bind(this));

    // Rutas estáticas para el dashboard web
    this.app.use('/dashboard', express.static('src/dashboard/dist'));
  }

  /**
   * Configurar WebSockets
   */
  setupWebSockets() {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket) => {
      console.log(`Cliente conectado: ${socket.id}`);
      
      const userId = socket.decoded.userId;
      this.connectedClients.set(socket.id, { userId, socket });

      // Unirse a room de usuario
      socket.join(`user_${userId}`);

      // Eventos de proyecto
      socket.on('join_project', (projectId) => {
        socket.join(`project_${projectId}`);
        this.activeProjects.set(projectId, (this.activeProjects.get(projectId) || 0) + 1);
        
        // Notificar a otros miembros del proyecto
        socket.to(`project_${projectId}`).emit('user_joined_project', {
          userId,
          projectId,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('leave_project', (projectId) => {
        socket.leave(`project_${projectId}`);
        const count = this.activeProjects.get(projectId) || 0;
        if (count > 1) {
          this.activeProjects.set(projectId, count - 1);
        } else {
          this.activeProjects.delete(projectId);
        }
        
        socket.to(`project_${projectId}`).emit('user_left_project', {
          userId,
          projectId,
          timestamp: new Date().toISOString()
        });
      });

      // Eventos de colaboración en tiempo real
      socket.on('project_update', (data) => {
        socket.to(`project_${data.projectId}`).emit('project_updated', {
          ...data,
          userId,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('typing', (data) => {
        socket.to(`project_${data.projectId}`).emit('user_typing', {
          userId,
          projectId: data.projectId,
          timestamp: new Date().toISOString()
        });
      });

      // Eventos de notificaciones
      socket.on('subscribe_notifications', () => {
        socket.join(`notifications_${userId}`);
      });

      // Desconexión
      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
        this.connectedClients.delete(socket.id);
        
        // Limpiar rooms de proyectos
        this.activeProjects.forEach((count, projectId) => {
          socket.to(`project_${projectId}`).emit('user_disconnected', {
            userId,
            timestamp: new Date().toISOString()
          });
        });
      });
    });
  }

  /**
   * Configurar manejo de errores
   */
  setupErrorHandling() {
    // Error 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint no encontrado',
        path: req.originalUrl,
        method: req.method
      });
    });

    // Error handler global
    this.app.use((error, req, res, next) => {
      console.error('Error:', error);
      
      res.status(error.status || 500).json({
        error: error.message || 'Error interno del servidor',
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      });
    });
  }

  /**
   * Middleware de autenticación JWT
   */
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, this.config.get('jwt.secret'), (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }
      
      req.user = decoded;
      next();
    });
  }

  /**
   * Middleware de autenticación para WebSockets
   */
  authenticateSocket(socket, next) {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Token requerido'));
    }

    jwt.verify(token, this.config.get('jwt.secret'), (err, decoded) => {
      if (err) {
        return next(new Error('Token inválido'));
      }
      
      socket.decoded = decoded;
      next();
    });
  }

  /**
   * Validaciones con Joi
   */
  validateRegistration(req, res, next) {
    const schema = Joi.object({
      username: Joi.string().alphanum().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      name: Joi.string().max(100).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    next();
  }

  validateLogin(req, res, next) {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    next();
  }

  validateProject(req, res, next) {
    const schema = Joi.object({
      name: Joi.string().max(100).required(),
      description: Joi.string().max(500),
      type: Joi.string().valid('web', 'mobile', 'api', 'desktop').required(),
      technologies: Joi.array().items(Joi.string()),
      githubRepo: Joi.string(),
      jiraProject: Joi.string()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    
    next();
  }

  /**
   * Controladores de autenticación
   */
  async register(req, res) {
    try {
      const { username, email, password, name } = req.body;
      
      // Verificar si el usuario ya existe
      const existingUser = await this.db.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = await this.db.createUser({
        username,
        email,
        password: hashedPassword,
        name
      });

      // Generar token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        this.config.get('jwt.secret'),
        { expiresIn: this.config.get('jwt.expiresIn') }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Buscar usuario
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        this.config.get('jwt.secret'),
        { expiresIn: this.config.get('jwt.expiresIn') }
      );

      res.json({
        message: 'Login exitoso',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        },
        token
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async refreshToken(req, res) {
    try {
      const { userId } = req.user;
      
      const user = await this.db.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        this.config.get('jwt.secret'),
        { expiresIn: this.config.get('jwt.expiresIn') }
      );

      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async logout(req, res) {
    // En una implementación real, podrías invalidar el token en una blacklist
    res.json({ message: 'Logout exitoso' });
  }

  /**
   * Controladores de usuario
   */
  async getUserProfile(req, res) {
    try {
      const { userId } = req.user;
      const user = await this.db.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateUserProfile(req, res) {
    try {
      const { userId } = req.user;
      const updateData = req.body;
      
      await this.db.updateUser(userId, updateData);
      
      res.json({ message: 'Perfil actualizado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Controladores de proyectos
   */
  async getProjects(req, res) {
    try {
      const { userId } = req.user;
      const projects = await this.db.getUserProjects(userId);
      
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createProject(req, res) {
    try {
      const { userId } = req.user;
      const projectData = { ...req.body, userId };
      
      const project = await this.db.createProject(projectData);
      
      // Notificar via WebSocket
      this.io.to(`user_${userId}`).emit('project_created', project);
      
      res.status(201).json({
        message: 'Proyecto creado exitosamente',
        project
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProject(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      
      const project = await this.db.getProject(id, userId);
      
      if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const updateData = req.body;
      
      await this.db.updateProject(id, userId, updateData);
      
      // Notificar via WebSocket
      this.io.to(`project_${id}`).emit('project_updated', {
        projectId: id,
        changes: updateData,
        userId
      });
      
      res.json({ message: 'Proyecto actualizado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      
      await this.db.deleteProject(id, userId);
      
      res.json({ message: 'Proyecto eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Controladores de APIs externas
   */
  async getGitHubRepos(req, res) {
    try {
      const result = await this.githubAPI.getRepositories();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getGitHubIssues(req, res) {
    try {
      const { owner, repo } = req.params;
      const result = await this.githubAPI.getIssues(owner, repo);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createGitHubIssue(req, res) {
    try {
      const { owner, repo } = req.params;
      const result = await this.githubAPI.createIssue(owner, repo, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getJiraProjects(req, res) {
    try {
      const result = await this.jiraAPI.getProjects();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getJiraIssues(req, res) {
    try {
      const { key } = req.params;
      const result = await this.jiraAPI.getIssues(key);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createJiraIssue(req, res) {
    try {
      const result = await this.jiraAPI.createIssue(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getGitKrakenBoards(req, res) {
    try {
      const result = await this.gitkrakenAPI.getBoards();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getGitKrakenCards(req, res) {
    try {
      const { id } = req.params;
      const result = await this.gitkrakenAPI.getCards(id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Controladores de branding
   */
  async getBranding(req, res) {
    try {
      const branding = require('../branding.json');
      res.json(branding);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBrandingReport(req, res) {
    try {
      const GKCli = require('../index');
      const gkCli = new GKCli();
      const report = gkCli.generateFullReport();
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBrandingTemplate(req, res) {
    try {
      const { type } = req.params;
      const GKCli = require('../index');
      const gkCli = new GKCli();
      const template = gkCli.generateTemplate(type);
      
      res.json({ template });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Controladores de analytics
   */
  async getDashboardAnalytics(req, res) {
    try {
      const { userId } = req.user;
      const analytics = await this.db.getDashboardAnalytics(userId);
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProjectAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.user;
      const analytics = await this.db.getProjectAnalytics(id, userId);
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Controladores de configuración
   */
  async getConfig(req, res) {
    try {
      const { userId } = req.user;
      const config = await this.db.getUserConfig(userId);
      
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateConfig(req, res) {
    try {
      const { userId } = req.user;
      const configData = req.body;
      
      await this.db.updateUserConfig(userId, configData);
      
      res.json({ message: 'Configuración actualizada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Enviar notificación
   */
  sendNotification(userId, notification) {
    this.io.to(`notifications_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast a todos los clientes conectados
   */
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Inicializar servidor
   */
  async start(port = null) {
    try {
      await this.db.initialize();
      
      const serverPort = port || this.config.get('server.port');
      
      this.server.listen(serverPort, () => {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     MCP SERVER INICIADO                     ║
║                      by kellerEToro                         ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Puerto: ${serverPort.toString().padEnd(48)} ║
║  🌐 URL: http://localhost:${serverPort.toString().padEnd(41)} ║
║  📊 Dashboard: http://localhost:${serverPort}/dashboard${' '.padEnd(25)} ║
║  📡 WebSocket: Activo${' '.padEnd(42)} ║
║  🔒 JWT: Configurado${' '.padEnd(39)} ║
║  💾 Base de datos: SQLite${' '.padEnd(35)} ║
╚══════════════════════════════════════════════════════════════╝
        `);
      });
      
      return this.server;
    } catch (error) {
      console.error('Error al iniciar el servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Detener servidor
   */
  async stop() {
    try {
      await this.db.close();
      this.server.close();
      console.log('Servidor detenido exitosamente');
    } catch (error) {
      console.error('Error al detener el servidor:', error);
    }
  }
}

module.exports = MCPServer;