#!/usr/bin/env node

/**
 * Advanced GK CLI - Sistema Completo
 * Integra APIs externas, servidor MCP, configuración avanzada y automatización
 * by kellerEToro
 */

require('core-js/stable');
require('dotenv').config();

const MCPServer = require('./src/server/mcp-server');
const Config = require('./src/config/config');
const AutomationSystem = require('./src/automation/automation');
const GitHubAPI = require('./src/api/github');
const JiraAPI = require('./src/api/jira');
const GitKrakenAPI = require('./src/api/gitkraken');

class AdvancedGKCLI {
  constructor(options = {}) {
    this.config = new Config(options);
    this.mcpServer = null;
    this.automation = null;
    this.apis = {};
  }

  /**
   * Inicializar sistema completo
   */
  async initialize() {
    try {
      console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║    ██████╗ ██╗  ██╗      ██████╗██╗     ██╗                         ║
║   ██╔════╝ ██║ ██╔╝     ██╔════╝██║     ██║                         ║
║   ██║  ███╗█████╔╝█████╗██║     ██║     ██║                         ║
║   ██║   ██║██╔═██╗╚════╝██║     ██║     ██║                         ║
║   ╚██████╔╝██║  ██╗     ╚██████╗███████╗██║                         ║
║    ╚═════╝ ╚═╝  ╚═╝      ╚═════╝╚══════╝╚═╝                         ║
║                                                                      ║
║           🚀 ADVANCED SYSTEM INITIALIZATION                         ║
║                          by kellerEToro                             ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
      `);

      console.log('🔧 Inicializando configuración avanzada...');
      await this.config.initialize();

      console.log('🌐 Configurando APIs externas...');
      await this.initializeAPIs();

      console.log('🤖 Inicializando sistema de automatización...');
      await this.initializeAutomation();

      console.log('🖥️  Configurando servidor MCP...');
      await this.initializeMCPServer();

      console.log('✅ Sistema avanzado inicializado exitosamente');
      
      return this;
    } catch (error) {
      console.error('❌ Error al inicializar sistema:', error);
      throw error;
    }
  }

  /**
   * Inicializar APIs externas
   */
  async initializeAPIs() {
    // GitHub API
    const githubToken = this.config.get('apis.github.token');
    if (githubToken) {
      this.apis.github = new GitHubAPI(githubToken);
      const authCheck = await this.apis.github.checkAuth();
      if (authCheck.success) {
        console.log(`  ✅ GitHub API: ${authCheck.message}`);
      } else {
        console.warn(`  ⚠️  GitHub API: ${authCheck.error}`);
      }
    }

    // Jira API
    const jiraConfig = {
      domain: this.config.get('apis.jira.domain'),
      email: this.config.get('apis.jira.email'),
      apiToken: this.config.get('apis.jira.token')
    };
    
    if (jiraConfig.domain && jiraConfig.email && jiraConfig.apiToken) {
      this.apis.jira = new JiraAPI(jiraConfig);
      const jiraCheck = await this.apis.jira.checkConnection();
      if (jiraCheck.success) {
        console.log(`  ✅ Jira API: ${jiraCheck.message}`);
      } else {
        console.warn(`  ⚠️  Jira API: ${jiraCheck.error}`);
      }
    }

    // GitKraken API
    const gitkrakenToken = this.config.get('apis.gitkraken.token');
    if (gitkrakenToken) {
      this.apis.gitkraken = new GitKrakenAPI({ apiToken: gitkrakenToken });
      const gkCheck = await this.apis.gitkraken.checkAuth();
      if (gkCheck.success) {
        console.log(`  ✅ GitKraken API: ${gkCheck.message}`);
      } else {
        console.warn(`  ⚠️  GitKraken API: ${gkCheck.error}`);
      }
    }
  }

  /**
   * Inicializar sistema de automatización
   */
  async initializeAutomation() {
    this.automation = new AutomationSystem({
      ...this.config.getAll(),
      githubAPI: this.apis.github,
      jiraAPI: this.apis.jira,
      gitkrakenAPI: this.apis.gitkraken
    });

    // Cargar workflows predefinidos
    await this.loadDefaultWorkflows();
    
    console.log('  ✅ Sistema de automatización configurado');
  }

  /**
   * Inicializar servidor MCP
   */
  async initializeMCPServer() {
    this.mcpServer = new MCPServer({
      ...this.config.getAll(),
      githubAPI: this.apis.github,
      jiraAPI: this.apis.jira,
      gitkrakenAPI: this.apis.gitkraken,
      automation: this.automation
    });

    // No iniciar el servidor automáticamente
    console.log('  ✅ Servidor MCP configurado (listo para iniciar)');
  }

  /**
   * Cargar workflows por defecto
   */
  async loadDefaultWorkflows() {
    const defaultWorkflows = [
      {
        id: 'daily-backup',
        name: 'Backup Diario',
        description: 'Crear backup diario de la base de datos',
        triggers: [
          {
            type: 'schedule',
            schedule: '0 2 * * *' // 2 AM todos los días
          }
        ],
        steps: [
          {
            name: 'Crear Backup',
            type: 'shell',
            command: 'sqlite3 {{database.path}} ".backup backup-$(date +%Y%m%d).sqlite"'
          },
          {
            name: 'Notificar Éxito',
            type: 'email',
            to: 'admin@kelleretoro.com',
            subject: 'Backup Diario Completado',
            text: 'El backup diario se completó exitosamente el {{timestamp}}'
          }
        ],
        conditions: {
          dayOfWeek: [1, 2, 3, 4, 5] // Solo días laborables
        }
      },
      {
        id: 'github-issue-sync',
        name: 'Sincronización GitHub-Jira',
        description: 'Sincronizar issues de GitHub con Jira',
        triggers: [
          {
            type: 'schedule',
            schedule: '*/30 * * * *' // Cada 30 minutos
          }
        ],
        steps: [
          {
            name: 'Obtener Issues de GitHub',
            type: 'github',
            action: 'get_issues',
            owner: 'kelleretoro',
            repo: 'gk-cli-branding'
          },
          {
            name: 'Crear Issues en Jira',
            type: 'jira',
            action: 'create_issue',
            projectKey: 'GK',
            summary: 'GitHub Issue: {{github.issue.title}}',
            description: '{{github.issue.body}}'
          }
        ]
      },
      {
        id: 'weekly-report',
        name: 'Reporte Semanal',
        description: 'Generar reporte semanal de actividad',
        triggers: [
          {
            type: 'schedule',
            schedule: '0 9 * * 1' // Lunes a las 9 AM
          }
        ],
        steps: [
          {
            name: 'Generar Reporte',
            type: 'shell',
            command: 'node bin/gk-cli.js generate-weekly-report'
          },
          {
            name: 'Enviar Reporte',
            type: 'email',
            to: 'team@kelleretoro.com',
            subject: 'Reporte Semanal - {{timestamp}}',
            html: '<h1>Reporte Semanal</h1><p>Adjunto encontrarás el reporte de actividad de la semana.</p>'
          }
        ]
      }
    ];

    for (const workflow of defaultWorkflows) {
      this.automation.registerWorkflow(workflow);
    }
  }

  /**
   * Iniciar servidor web
   */
  async startServer(port = null) {
    if (!this.mcpServer) {
      throw new Error('Servidor MCP no inicializado');
    }

    const serverPort = port || this.config.get('server.port');
    await this.mcpServer.start(serverPort);
    
    return this.mcpServer;
  }

  /**
   * Ejecutar en modo CLI interactivo
   */
  async runInteractive() {
    const SimpleCLI = require('./src/simple-cli');
    const cli = new SimpleCLI();
    await cli.run();
  }

  /**
   * Ejecutar comando específico
   */
  async runCommand(command, args = []) {
    switch (command) {
      case 'server':
        await this.startServer(args[0]);
        break;
        
      case 'interactive':
        await this.runInteractive();
        break;
        
      case 'config':
        await this.handleConfigCommand(args);
        break;
        
      case 'workflow':
        await this.handleWorkflowCommand(args);
        break;
        
      case 'api':
        await this.handleAPICommand(args);
        break;
        
      case 'backup':
        await this.handleBackupCommand(args);
        break;
        
      default:
        throw new Error(`Comando desconocido: ${command}`);
    }
  }

  /**
   * Manejar comandos de configuración
   */
  async handleConfigCommand(args) {
    const subcommand = args[0];
    
    switch (subcommand) {
      case 'get':
        const value = this.config.get(args[1]);
        console.log(JSON.stringify(value, null, 2));
        break;
        
      case 'set':
        await this.config.set(args[1], JSON.parse(args[2]));
        console.log(`Configuración actualizada: ${args[1]}`);
        break;
        
      case 'list-profiles':
        const profiles = await this.config.listProfiles();
        console.log('Perfiles disponibles:', profiles.join(', '));
        break;
        
      case 'switch-profile':
        await this.config.switchProfile(args[1]);
        console.log(`Cambiado a perfil: ${args[1]}`);
        break;
        
      case 'export':
        const exported = await this.config.exportConfig();
        console.log(JSON.stringify(exported, null, 2));
        break;
        
      default:
        console.log('Subcomandos de config: get, set, list-profiles, switch-profile, export');
    }
  }

  /**
   * Manejar comandos de workflow
   */
  async handleWorkflowCommand(args) {
    const subcommand = args[0];
    
    switch (subcommand) {
      case 'list':
        const stats = this.automation.getWorkflowStats();
        console.log('Workflows:', stats.workflows);
        break;
        
      case 'run':
        const result = await this.automation.executeWorkflow(args[1]);
        console.log('Resultado:', result);
        break;
        
      case 'stop':
        this.automation.stopWorkflow(args[1]);
        break;
        
      case 'start':
        this.automation.startWorkflow(args[1]);
        break;
        
      case 'stats':
        const allStats = this.automation.getWorkflowStats();
        console.log(JSON.stringify(allStats, null, 2));
        break;
        
      default:
        console.log('Subcomandos de workflow: list, run, stop, start, stats');
    }
  }

  /**
   * Manejar comandos de API
   */
  async handleAPICommand(args) {
    const api = args[0];
    const action = args[1];
    
    switch (api) {
      case 'github':
        if (this.apis.github) {
          const result = await this.handleGitHubAction(action, args.slice(2));
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.error('GitHub API no configurado');
        }
        break;
        
      case 'jira':
        if (this.apis.jira) {
          const result = await this.handleJiraAction(action, args.slice(2));
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.error('Jira API no configurado');
        }
        break;
        
      default:
        console.log('APIs disponibles: github, jira, gitkraken');
    }
  }

  /**
   * Manejar acciones de GitHub
   */
  async handleGitHubAction(action, args) {
    switch (action) {
      case 'repos':
        return await this.apis.github.getRepositories();
      case 'issues':
        return await this.apis.github.getIssues(args[0], args[1]);
      default:
        throw new Error(`Acción de GitHub no soportada: ${action}`);
    }
  }

  /**
   * Manejar acciones de Jira
   */
  async handleJiraAction(action, args) {
    switch (action) {
      case 'projects':
        return await this.apis.jira.getProjects();
      case 'issues':
        return await this.apis.jira.getIssues(args[0]);
      default:
        throw new Error(`Acción de Jira no soportada: ${action}`);
    }
  }

  /**
   * Manejar comandos de backup
   */
  async handleBackupCommand(args) {
    const subcommand = args[0];
    
    switch (subcommand) {
      case 'create':
        const backupPath = await this.config.createBackup();
        console.log(`Backup creado: ${backupPath}`);
        break;
        
      case 'restore':
        await this.config.restoreBackup(args[1]);
        console.log('Configuración restaurada');
        break;
        
      default:
        console.log('Subcomandos de backup: create, restore');
    }
  }

  /**
   * Detener sistema
   */
  async shutdown() {
    console.log('🛑 Deteniendo sistema...');
    
    if (this.automation) {
      this.automation.shutdown();
    }
    
    if (this.mcpServer) {
      await this.mcpServer.stop();
    }
    
    console.log('✅ Sistema detenido exitosamente');
  }
}

// Función principal para CLI
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 Advanced GK CLI - Sistema Completo by kellerEToro

Comandos disponibles:
  server [puerto]          - Iniciar servidor MCP completo
  interactive              - Modo interactivo mejorado
  config <subcomando>      - Gestión de configuración avanzada
  workflow <subcomando>    - Gestión de workflows y automatización
  api <api> <acción>       - Interactuar con APIs externas
  backup <subcomando>      - Gestión de backups

Ejemplos:
  node advanced-cli.js server 3000
  node advanced-cli.js interactive
  node advanced-cli.js config get server.port
  node advanced-cli.js workflow list
  node advanced-cli.js api github repos
    `);
    return;
  }

  const gkCli = new AdvancedGKCLI();
  
  try {
    await gkCli.initialize();
    
    const command = args[0];
    const commandArgs = args.slice(1);
    
    await gkCli.runCommand(command, commandArgs);
    
    // Mantener el proceso vivo si es el servidor
    if (command === 'server') {
      process.on('SIGINT', async () => {
        await gkCli.shutdown();
        process.exit(0);
      });
    } else {
      await gkCli.shutdown();
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = AdvancedGKCLI;