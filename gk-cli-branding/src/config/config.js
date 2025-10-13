/**
 * Advanced Configuration System
 * Múltiples perfiles, configuración por ambiente, sincronización cloud
 * by kellerEToro
 */

require('core-js/stable');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class Config {
  constructor(options = {}) {
    this.configDir = options.configDir || path.join(process.cwd(), 'config');
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.profile = options.profile || 'default';
    this.configs = new Map();
    this.watchers = new Map();
    this.encryptionKey = options.encryptionKey || process.env.CONFIG_ENCRYPTION_KEY;
    
    // Configuración por defecto
    this.defaultConfig = {
      server: {
        port: 3000,
        host: 'localhost',
        ssl: false
      },
      database: {
        type: 'sqlite',
        path: './data/database.sqlite',
        pool: {
          min: 2,
          max: 10
        }
      },
      jwt: {
        secret: 'your-secret-key',
        expiresIn: '24h',
        refreshExpiresIn: '7d'
      },
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:8080'],
        credentials: true
      },
      apis: {
        github: {
          baseURL: 'https://api.github.com',
          timeout: 10000,
          retries: 3
        },
        jira: {
          timeout: 15000,
          retries: 2
        },
        gitkraken: {
          baseURL: 'https://gloapi.gitkraken.com/v1',
          timeout: 10000
        }
      },
      logging: {
        level: 'info',
        format: 'combined',
        file: './logs/app.log',
        maxSize: '10m',
        maxFiles: 5
      },
      cache: {
        ttl: 300, // 5 minutos
        maxSize: 100,
        checkPeriod: 600 // 10 minutos
      },
      email: {
        smtp: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false
        }
      },
      branding: {
        theme: 'default',
        customColors: {},
        logo: null,
        companyName: 'kellerEToro'
      },
      security: {
        rateLimiting: {
          windowMs: 15 * 60 * 1000, // 15 minutos
          max: 100
        },
        encryption: {
          algorithm: 'aes-256-gcm'
        }
      }
    };
  }

  /**
   * Inicializar sistema de configuración
   */
  async initialize() {
    try {
      await this.ensureConfigDirectory();
      await this.loadConfigurations();
      await this.validateConfigurations();
      
      console.log(`Configuración inicializada - Ambiente: ${this.environment}, Perfil: ${this.profile}`);
    } catch (error) {
      console.error('Error al inicializar configuración:', error);
      throw error;
    }
  }

  /**
   * Asegurar que el directorio de configuración existe
   */
  async ensureConfigDirectory() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
      await fs.mkdir(path.join(this.configDir, 'profiles'), { recursive: true });
      await fs.mkdir(path.join(this.configDir, 'environments'), { recursive: true });
      await fs.mkdir(path.join(this.configDir, 'backups'), { recursive: true });
    } catch (error) {
      console.error('Error al crear directorios de configuración:', error);
      throw error;
    }
  }

  /**
   * Cargar todas las configuraciones
   */
  async loadConfigurations() {
    // Cargar configuración base
    await this.loadBaseConfig();
    
    // Cargar configuración de ambiente
    await this.loadEnvironmentConfig();
    
    // Cargar configuración de perfil
    await this.loadProfileConfig();
    
    // Cargar configuración local (no versionada)
    await this.loadLocalConfig();
  }

  /**
   * Cargar configuración base
   */
  async loadBaseConfig() {
    const baseConfigPath = path.join(this.configDir, 'base.json');
    
    try {
      const baseConfig = await this.loadConfigFile(baseConfigPath);
      this.configs.set('base', { ...this.defaultConfig, ...baseConfig });
    } catch (error) {
      // Si no existe, crear con configuración por defecto
      this.configs.set('base', { ...this.defaultConfig });
      await this.saveConfigFile(baseConfigPath, this.defaultConfig);
    }
  }

  /**
   * Cargar configuración de ambiente
   */
  async loadEnvironmentConfig() {
    const envConfigPath = path.join(this.configDir, 'environments', `${this.environment}.json`);
    
    try {
      const envConfig = await this.loadConfigFile(envConfigPath);
      this.configs.set('environment', envConfig);
    } catch (error) {
      // Configuración de ambiente por defecto
      const defaultEnvConfig = this.getDefaultEnvironmentConfig();
      this.configs.set('environment', defaultEnvConfig);
      await this.saveConfigFile(envConfigPath, defaultEnvConfig);
    }
  }

  /**
   * Cargar configuración de perfil
   */
  async loadProfileConfig() {
    const profileConfigPath = path.join(this.configDir, 'profiles', `${this.profile}.json`);
    
    try {
      const profileConfig = await this.loadConfigFile(profileConfigPath);
      this.configs.set('profile', profileConfig);
    } catch (error) {
      // Configuración de perfil por defecto
      const defaultProfileConfig = this.getDefaultProfileConfig();
      this.configs.set('profile', defaultProfileConfig);
      await this.saveConfigFile(profileConfigPath, defaultProfileConfig);
    }
  }

  /**
   * Cargar configuración local
   */
  async loadLocalConfig() {
    const localConfigPath = path.join(this.configDir, 'local.json');
    
    try {
      const localConfig = await this.loadConfigFile(localConfigPath);
      this.configs.set('local', localConfig);
    } catch (error) {
      // Configuración local opcional
      this.configs.set('local', {});
    }
  }

  /**
   * Cargar archivo de configuración
   */
  async loadConfigFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const config = JSON.parse(content);
      
      // Desencriptar campos sensibles si es necesario
      return this.decryptSensitiveFields(config);
    } catch (error) {
      throw new Error(`Error al cargar configuración desde ${filePath}: ${error.message}`);
    }
  }

  /**
   * Guardar archivo de configuración
   */
  async saveConfigFile(filePath, config) {
    try {
      // Encriptar campos sensibles
      const encryptedConfig = this.encryptSensitiveFields(config);
      
      const content = JSON.stringify(encryptedConfig, null, 2);
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Error al guardar configuración en ${filePath}: ${error.message}`);
    }
  }

  /**
   * Obtener valor de configuración con precedencia
   */
  get(keyPath, defaultValue = null) {
    const keys = keyPath.split('.');
    
    // Orden de precedencia: local > profile > environment > base > default
    const searchOrder = ['local', 'profile', 'environment', 'base'];
    
    for (const configType of searchOrder) {
      const config = this.configs.get(configType);
      if (config) {
        const value = this.getNestedValue(config, keys);
        if (value !== undefined && value !== null) {
          return value;
        }
      }
    }
    
    return defaultValue;
  }

  /**
   * Establecer valor de configuración
   */
  async set(keyPath, value, configType = 'local') {
    const keys = keyPath.split('.');
    const config = this.configs.get(configType) || {};
    
    this.setNestedValue(config, keys, value);
    this.configs.set(configType, config);
    
    // Guardar cambios
    await this.saveConfigType(configType);
  }

  /**
   * Obtener valor anidado de objeto
   */
  getNestedValue(obj, keys) {
    return keys.reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  /**
   * Establecer valor anidado en objeto
   */
  setNestedValue(obj, keys, value) {
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Guardar tipo de configuración específico
   */
  async saveConfigType(configType) {
    const config = this.configs.get(configType);
    if (!config) return;
    
    let filePath;
    switch (configType) {
      case 'base':
        filePath = path.join(this.configDir, 'base.json');
        break;
      case 'environment':
        filePath = path.join(this.configDir, 'environments', `${this.environment}.json`);
        break;
      case 'profile':
        filePath = path.join(this.configDir, 'profiles', `${this.profile}.json`);
        break;
      case 'local':
        filePath = path.join(this.configDir, 'local.json');
        break;
      default:
        throw new Error(`Tipo de configuración desconocido: ${configType}`);
    }
    
    await this.saveConfigFile(filePath, config);
  }

  /**
   * Crear nuevo perfil
   */
  async createProfile(profileName, baseProfile = 'default') {
    const baseConfig = this.configs.get('profile') || this.getDefaultProfileConfig();
    const newProfilePath = path.join(this.configDir, 'profiles', `${profileName}.json`);
    
    await this.saveConfigFile(newProfilePath, baseConfig);
    
    console.log(`Perfil "${profileName}" creado exitosamente`);
  }

  /**
   * Cambiar perfil activo
   */
  async switchProfile(profileName) {
    this.profile = profileName;
    await this.loadProfileConfig();
    
    console.log(`Cambiado a perfil: ${profileName}`);
  }

  /**
   * Listar perfiles disponibles
   */
  async listProfiles() {
    const profilesDir = path.join(this.configDir, 'profiles');
    
    try {
      const files = await fs.readdir(profilesDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * Validar configuraciones
   */
  async validateConfigurations() {
    const requiredKeys = [
      'server.port',
      'database.type',
      'jwt.secret'
    ];
    
    const missing = [];
    
    for (const key of requiredKeys) {
      if (this.get(key) === null) {
        missing.push(key);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Configuración incompleta. Faltan: ${missing.join(', ')}`);
    }
    
    // Validaciones específicas
    if (this.get('server.port') < 1 || this.get('server.port') > 65535) {
      throw new Error('Puerto del servidor debe estar entre 1 y 65535');
    }
    
    if (this.get('jwt.secret').length < 32) {
      console.warn('⚠️  JWT secret es muy corto. Recomendado: al menos 32 caracteres');
    }
  }

  /**
   * Configuración por defecto para ambiente
   */
  getDefaultEnvironmentConfig() {
    const configs = {
      development: {
        server: {
          port: 3000,
          debug: true
        },
        logging: {
          level: 'debug'
        },
        database: {
          debug: true
        }
      },
      production: {
        server: {
          port: process.env.PORT || 8080,
          debug: false
        },
        logging: {
          level: 'error'
        },
        database: {
          debug: false
        }
      },
      test: {
        server: {
          port: 3001
        },
        database: {
          path: ':memory:'
        },
        logging: {
          level: 'silent'
        }
      }
    };
    
    return configs[this.environment] || configs.development;
  }

  /**
   * Configuración por defecto para perfil
   */
  getDefaultProfileConfig() {
    return {
      user: {
        preferences: {
          theme: 'dark',
          language: 'es',
          notifications: true
        }
      },
      integrations: {
        github: {
          enabled: false
        },
        jira: {
          enabled: false
        },
        gitkraken: {
          enabled: false
        }
      },
      automation: {
        enabled: true,
        schedules: {}
      }
    };
  }

  /**
   * Encriptar campos sensibles
   */
  encryptSensitiveFields(config) {
    if (!this.encryptionKey) return config;
    
    const sensitiveFields = [
      'jwt.secret',
      'database.password',
      'email.auth.pass',
      'apis.github.token',
      'apis.jira.token',
      'apis.gitkraken.token'
    ];
    
    const encryptedConfig = JSON.parse(JSON.stringify(config));
    
    for (const fieldPath of sensitiveFields) {
      const value = this.getNestedValue(encryptedConfig, fieldPath.split('.'));
      if (value && typeof value === 'string') {
        const encrypted = this.encrypt(value);
        this.setNestedValue(encryptedConfig, fieldPath.split('.'), encrypted);
      }
    }
    
    return encryptedConfig;
  }

  /**
   * Desencriptar campos sensibles
   */
  decryptSensitiveFields(config) {
    if (!this.encryptionKey) return config;
    
    const sensitiveFields = [
      'jwt.secret',
      'database.password',
      'email.auth.pass',
      'apis.github.token',
      'apis.jira.token',
      'apis.gitkraken.token'
    ];
    
    const decryptedConfig = JSON.parse(JSON.stringify(config));
    
    for (const fieldPath of sensitiveFields) {
      const value = this.getNestedValue(decryptedConfig, fieldPath.split('.'));
      if (value && typeof value === 'string' && value.startsWith('encrypted:')) {
        try {
          const decrypted = this.decrypt(value);
          this.setNestedValue(decryptedConfig, fieldPath.split('.'), decrypted);
        } catch (error) {
          console.warn(`No se pudo desencriptar ${fieldPath}`);
        }
      }
    }
    
    return decryptedConfig;
  }

  /**
   * Encriptar texto
   */
  encrypt(text) {
    if (!this.encryptionKey) {
      return text; // Si no hay clave, devolver texto sin encriptar
    }
    
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `encrypted:${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.warn('Error en encriptación, guardando texto plano:', error.message);
      return text;
    }
  }

  /**
   * Desencriptar texto
   */
  decrypt(encryptedText) {
    if (!encryptedText || !encryptedText.startsWith('encrypted:')) {
      return encryptedText; // Si no está encriptado, devolver tal como está
    }
    
    if (!this.encryptionKey) {
      return encryptedText; // Si no hay clave, devolver tal como está
    }
    
    try {
      const parts = encryptedText.split(':');
      const encrypted = parts[parts.length - 1];
      
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      
      const decipher = crypto.createDecipher(algorithm, key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.warn('Error al desencriptar, devolviendo texto original:', error.message);
      return encryptedText;
    }
  }

  /**
   * Exportar configuración completa
   */
  async exportConfig(includeSecrets = false) {
    const exportData = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      profile: this.profile,
      configs: {}
    };
    
    for (const [type, config] of this.configs) {
      exportData.configs[type] = includeSecrets ? config : this.removeSensitiveFields(config);
    }
    
    return exportData;
  }

  /**
   * Importar configuración
   */
  async importConfig(importData) {
    if (importData.configs) {
      for (const [type, config] of Object.entries(importData.configs)) {
        this.configs.set(type, config);
        await this.saveConfigType(type);
      }
    }
    
    console.log('Configuración importada exitosamente');
  }

  /**
   * Remover campos sensibles para exportación
   */
  removeSensitiveFields(config) {
    const sensitiveFields = [
      'jwt.secret',
      'database.password',
      'email.auth.pass',
      'apis.github.token',
      'apis.jira.token',
      'apis.gitkraken.token'
    ];
    
    const cleanConfig = JSON.parse(JSON.stringify(config));
    
    for (const fieldPath of sensitiveFields) {
      this.setNestedValue(cleanConfig, fieldPath.split('.'), '[REDACTED]');
    }
    
    return cleanConfig;
  }

  /**
   * Crear backup de configuración
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.configDir, 'backups', `config-backup-${timestamp}.json`);
    
    const exportData = await this.exportConfig(true);
    await fs.writeFile(backupPath, JSON.stringify(exportData, null, 2));
    
    console.log(`Backup creado: ${backupPath}`);
    return backupPath;
  }

  /**
   * Restaurar desde backup
   */
  async restoreBackup(backupPath) {
    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
      await this.importConfig(backupData);
      
      console.log(`Configuración restaurada desde: ${backupPath}`);
    } catch (error) {
      throw new Error(`Error al restaurar backup: ${error.message}`);
    }
  }

  /**
   * Observar cambios en configuración
   */
  watch(keyPath, callback) {
    if (!this.watchers.has(keyPath)) {
      this.watchers.set(keyPath, new Set());
    }
    
    this.watchers.get(keyPath).add(callback);
    
    // Retornar función para remover el watcher
    return () => {
      const callbacks = this.watchers.get(keyPath);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.watchers.delete(keyPath);
        }
      }
    };
  }

  /**
   * Notificar cambios a watchers
   */
  notifyWatchers(keyPath, oldValue, newValue) {
    const callbacks = this.watchers.get(keyPath);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newValue, oldValue, keyPath);
        } catch (error) {
          console.error('Error en watcher de configuración:', error);
        }
      });
    }
  }

  /**
   * Obtener toda la configuración mergeada
   */
  getAll() {
    const merged = {};
    
    // Merge en orden de precedencia
    const mergeOrder = ['base', 'environment', 'profile', 'local'];
    
    for (const configType of mergeOrder) {
      const config = this.configs.get(configType);
      if (config) {
        this.deepMerge(merged, config);
      }
    }
    
    return merged;
  }

  /**
   * Merge profundo de objetos
   */
  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }
}

module.exports = Config;