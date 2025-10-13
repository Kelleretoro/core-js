/**
 * Database Manager - SQLite
 * Gestión completa de base de datos para el sistema MCP
 * by kellerEToro
 */

require('core-js/stable');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class Database {
  constructor(config = {}) {
    this.dbPath = config.path || path.join(__dirname, '../../data/database.sqlite');
    this.db = null;
  }

  /**
   * Inicializar base de datos
   */
  async initialize() {
    try {
      // Crear directorio si no existe
      const dbDir = path.dirname(this.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      // Conectar a la base de datos
      this.db = new sqlite3.Database(this.dbPath);
      
      // Crear tablas
      await this.createTables();
      
      console.log('Base de datos inicializada exitosamente');
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      throw error;
    }
  }

  /**
   * Crear tablas de la base de datos
   */
  async createTables() {
    const tables = [
      // Tabla de usuarios
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        role TEXT DEFAULT 'user',
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de proyectos
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        technologies TEXT, -- JSON array
        github_repo TEXT,
        jira_project TEXT,
        settings TEXT, -- JSON object
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Tabla de configuraciones de usuario
      `CREATE TABLE IF NOT EXISTS user_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        config_key TEXT NOT NULL,
        config_value TEXT NOT NULL, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        UNIQUE(user_id, config_key)
      )`,

      // Tabla de sesiones
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        data TEXT NOT NULL, -- JSON
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Tabla de logs de actividad
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        details TEXT, -- JSON
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
      )`,

      // Tabla de integraciones
      `CREATE TABLE IF NOT EXISTS integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- github, jira, gitkraken
        name TEXT NOT NULL,
        config TEXT NOT NULL, -- JSON con tokens y configuración
        active BOOLEAN DEFAULT 1,
        last_sync DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Tabla de notificaciones
      `CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info', -- info, success, warning, error
        read BOOLEAN DEFAULT 0,
        action_url TEXT,
        data TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Tabla de templates
      `CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL, -- project, component, etc.
        content TEXT NOT NULL, -- JSON template
        public BOOLEAN DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Tabla de analytics
      `CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        project_id INTEGER,
        event_type TEXT NOT NULL,
        event_name TEXT NOT NULL,
        properties TEXT, -- JSON
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Crear índices
    await this.createIndexes();
  }

  /**
   * Crear índices para optimizar consultas
   */
  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_analytics_events_project_id ON analytics_events(project_id)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  /**
   * Ejecutar query SQL (promisificado)
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Obtener un registro
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Obtener múltiples registros
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Métodos de usuarios
   */
  async createUser(userData) {
    const { username, email, password, name, avatar = null, role = 'user' } = userData;
    
    const result = await this.run(
      `INSERT INTO users (username, email, password, name, avatar, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, password, name, avatar, role]
    );

    return this.getUserById(result.id);
  }

  async getUserById(id) {
    return this.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  async getUserByEmail(email) {
    return this.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  async getUserByUsername(username) {
    return this.get('SELECT * FROM users WHERE username = ?', [username]);
  }

  async updateUser(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await this.run(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
  }

  /**
   * Métodos de proyectos
   */
  async createProject(projectData) {
    const { 
      userId, name, description, type, technologies = [], 
      githubRepo = null, jiraProject = null, settings = {} 
    } = projectData;
    
    const result = await this.run(
      `INSERT INTO projects (user_id, name, description, type, technologies, github_repo, jira_project, settings) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, name, description, type, 
        JSON.stringify(technologies), githubRepo, jiraProject, JSON.stringify(settings)
      ]
    );

    return this.getProject(result.id, userId);
  }

  async getProject(id, userId) {
    const project = await this.get(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?', 
      [id, userId]
    );

    if (project) {
      project.technologies = JSON.parse(project.technologies || '[]');
      project.settings = JSON.parse(project.settings || '{}');
    }

    return project;
  }

  async getUserProjects(userId) {
    const projects = await this.all(
      'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC', 
      [userId]
    );

    return projects.map(project => ({
      ...project,
      technologies: JSON.parse(project.technologies || '[]'),
      settings: JSON.parse(project.settings || '{}')
    }));
  }

  async updateProject(id, userId, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData).map(value => 
      Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : value
    );
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await this.run(
      `UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [...values, id, userId]
    );
  }

  async deleteProject(id, userId) {
    await this.run(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }

  /**
   * Métodos de configuración
   */
  async getUserConfig(userId) {
    const configs = await this.all(
      'SELECT config_key, config_value FROM user_configs WHERE user_id = ?',
      [userId]
    );

    const configObj = {};
    configs.forEach(config => {
      configObj[config.config_key] = JSON.parse(config.config_value);
    });

    return configObj;
  }

  async updateUserConfig(userId, configData) {
    for (const [key, value] of Object.entries(configData)) {
      await this.run(
        `INSERT OR REPLACE INTO user_configs (user_id, config_key, config_value, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, key, JSON.stringify(value)]
      );
    }
  }

  /**
   * Métodos de logs de actividad
   */
  async logActivity(activityData) {
    const { 
      userId, projectId, action, entityType, entityId, 
      details = {}, ipAddress = null, userAgent = null 
    } = activityData;
    
    await this.run(
      `INSERT INTO activity_logs (user_id, project_id, action, entity_type, entity_id, details, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, projectId, action, entityType, entityId, JSON.stringify(details), ipAddress, userAgent]
    );
  }

  async getUserActivity(userId, limit = 50) {
    const activities = await this.all(
      `SELECT * FROM activity_logs WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );

    return activities.map(activity => ({
      ...activity,
      details: JSON.parse(activity.details || '{}')
    }));
  }

  /**
   * Métodos de notificaciones
   */
  async createNotification(notificationData) {
    const { userId, title, message, type = 'info', actionUrl = null, data = {} } = notificationData;
    
    const result = await this.run(
      `INSERT INTO notifications (user_id, title, message, type, action_url, data) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, message, type, actionUrl, JSON.stringify(data)]
    );

    return result.id;
  }

  async getUserNotifications(userId, unreadOnly = false) {
    const whereClause = unreadOnly ? 'WHERE user_id = ? AND read = 0' : 'WHERE user_id = ?';
    
    const notifications = await this.all(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC`,
      [userId]
    );

    return notifications.map(notification => ({
      ...notification,
      data: JSON.parse(notification.data || '{}')
    }));
  }

  async markNotificationRead(id, userId) {
    await this.run(
      'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
  }

  /**
   * Métodos de analytics
   */
  async trackEvent(eventData) {
    const { userId, projectId, eventType, eventName, properties = {}, sessionId = null } = eventData;
    
    await this.run(
      `INSERT INTO analytics_events (user_id, project_id, event_type, event_name, properties, session_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, projectId, eventType, eventName, JSON.stringify(properties), sessionId]
    );
  }

  async getDashboardAnalytics(userId) {
    const [projectCount, activityCount, recentProjects] = await Promise.all([
      this.get('SELECT COUNT(*) as count FROM projects WHERE user_id = ?', [userId]),
      this.get('SELECT COUNT(*) as count FROM activity_logs WHERE user_id = ? AND created_at >= datetime("now", "-30 days")', [userId]),
      this.all('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5', [userId])
    ]);

    return {
      projectCount: projectCount.count,
      activityCount: activityCount.count,
      recentProjects: recentProjects.map(project => ({
        ...project,
        technologies: JSON.parse(project.technologies || '[]'),
        settings: JSON.parse(project.settings || '{}')
      }))
    };
  }

  async getProjectAnalytics(projectId, userId) {
    const [activityCount, eventCount] = await Promise.all([
      this.get('SELECT COUNT(*) as count FROM activity_logs WHERE project_id = ? AND user_id = ?', [projectId, userId]),
      this.get('SELECT COUNT(*) as count FROM analytics_events WHERE project_id = ? AND user_id = ?', [projectId, userId])
    ]);

    return {
      activityCount: activityCount.count,
      eventCount: eventCount.count
    };
  }

  /**
   * Cerrar conexión a la base de datos
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Conexión a la base de datos cerrada');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Backup de la base de datos
   */
  async backup(backupPath) {
    const fs = require('fs').promises;
    try {
      await fs.copyFile(this.dbPath, backupPath);
      console.log(`Backup creado en: ${backupPath}`);
    } catch (error) {
      console.error('Error al crear backup:', error);
      throw error;
    }
  }

  /**
   * Limpiar datos antiguos
   */
  async cleanup(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    await this.run(
      'DELETE FROM activity_logs WHERE created_at < ?',
      [cutoffDate.toISOString()]
    );

    await this.run(
      'DELETE FROM analytics_events WHERE created_at < ?',
      [cutoffDate.toISOString()]
    );

    console.log(`Limpieza completada: datos anteriores a ${cutoffDate.toDateString()} eliminados`);
  }
}

module.exports = Database;