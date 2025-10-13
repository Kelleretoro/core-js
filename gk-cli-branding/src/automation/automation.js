/**
 * Automation & Workflow System
 * Scripts automáticos, tareas programadas, integración CI/CD
 * by kellerEToro
 */

require('core-js/stable');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class AutomationSystem {
  constructor(config = {}) {
    this.config = config;
    this.scheduledTasks = new Map();
    this.workflows = new Map();
    this.triggers = new Map();
    this.hooks = new Map();
    this.mailer = null;
    
    // APIs externas
    this.githubAPI = config.githubAPI;
    this.jiraAPI = config.jiraAPI;
    this.database = config.database;
    
    this.initializeMailer();
  }

  /**
   * Inicializar sistema de email
   */
  async initializeMailer() {
    try {
      const emailConfig = this.config.get('email');
      if (emailConfig && emailConfig.smtp) {
        this.mailer = nodemailer.createTransporter({
          host: emailConfig.smtp.host,
          port: emailConfig.smtp.port,
          secure: emailConfig.smtp.secure,
          auth: emailConfig.smtp.auth
        });
        
        console.log('✅ Sistema de email inicializado');
      }
    } catch (error) {
      console.warn('⚠️  No se pudo inicializar el sistema de email:', error.message);
    }
  }

  /**
   * Registrar workflow
   */
  registerWorkflow(workflowData) {
    const workflow = {
      id: workflowData.id,
      name: workflowData.name,
      description: workflowData.description,
      triggers: workflowData.triggers || [],
      steps: workflowData.steps || [],
      conditions: workflowData.conditions || {},
      enabled: workflowData.enabled !== false,
      createdAt: new Date().toISOString(),
      lastRun: null,
      runCount: 0,
      successCount: 0,
      errorCount: 0
    };

    this.workflows.set(workflow.id, workflow);
    
    // Configurar triggers
    workflow.triggers.forEach(trigger => {
      this.setupTrigger(workflow.id, trigger);
    });

    console.log(`Workflow registrado: ${workflow.name}`);
    return workflow;
  }

  /**
   * Configurar trigger
   */
  setupTrigger(workflowId, trigger) {
    const triggerId = `${workflowId}_${trigger.type}_${Date.now()}`;
    
    switch (trigger.type) {
      case 'schedule':
        this.setupScheduleTrigger(triggerId, workflowId, trigger);
        break;
      case 'webhook':
        this.setupWebhookTrigger(triggerId, workflowId, trigger);
        break;
      case 'file_watch':
        this.setupFileWatchTrigger(triggerId, workflowId, trigger);
        break;
      case 'git_push':
        this.setupGitPushTrigger(triggerId, workflowId, trigger);
        break;
      case 'jira_issue':
        this.setupJiraIssueTrigger(triggerId, workflowId, trigger);
        break;
      default:
        console.warn(`Tipo de trigger no soportado: ${trigger.type}`);
    }
  }

  /**
   * Configurar trigger de programación (cron)
   */
  setupScheduleTrigger(triggerId, workflowId, trigger) {
    const task = cron.schedule(trigger.schedule, async () => {
      await this.executeWorkflow(workflowId, {
        triggerId,
        triggerType: 'schedule',
        timestamp: new Date().toISOString()
      });
    }, {
      scheduled: false
    });

    this.scheduledTasks.set(triggerId, task);
    task.start();
    
    console.log(`Trigger programado configurado: ${trigger.schedule}`);
  }

  /**
   * Configurar trigger de webhook
   */
  setupWebhookTrigger(triggerId, workflowId, trigger) {
    this.triggers.set(triggerId, {
      workflowId,
      type: 'webhook',
      path: trigger.path,
      method: trigger.method || 'POST',
      secret: trigger.secret
    });
  }

  /**
   * Configurar trigger de observación de archivos
   */
  setupFileWatchTrigger(triggerId, workflowId, trigger) {
    // Implementación básica - en producción usarías chokidar
    const checkInterval = setInterval(async () => {
      try {
        const stats = await fs.stat(trigger.path);
        const lastModified = stats.mtime.getTime();
        
        if (!this.triggers.has(`${triggerId}_lastModified`)) {
          this.triggers.set(`${triggerId}_lastModified`, lastModified);
          return;
        }
        
        const previousModified = this.triggers.get(`${triggerId}_lastModified`);
        if (lastModified > previousModified) {
          this.triggers.set(`${triggerId}_lastModified`, lastModified);
          
          await this.executeWorkflow(workflowId, {
            triggerId,
            triggerType: 'file_watch',
            filePath: trigger.path,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error en file watcher para ${trigger.path}:`, error.message);
      }
    }, trigger.interval || 5000);

    this.triggers.set(triggerId, { checkInterval, type: 'file_watch' });
  }

  /**
   * Configurar trigger de Git push
   */
  setupGitPushTrigger(triggerId, workflowId, trigger) {
    // Este trigger normalmente se activaría via webhook de GitHub/GitLab
    this.triggers.set(triggerId, {
      workflowId,
      type: 'git_push',
      repository: trigger.repository,
      branch: trigger.branch || 'main'
    });
  }

  /**
   * Configurar trigger de issues de Jira
   */
  setupJiraIssueTrigger(triggerId, workflowId, trigger) {
    // Polling de issues de Jira
    const checkInterval = setInterval(async () => {
      try {
        if (this.jiraAPI) {
          const result = await this.jiraAPI.getIssues(trigger.project, {
            jql: trigger.jql || `project = "${trigger.project}" AND updated >= -5m`
          });
          
          if (result.success && result.data.length > 0) {
            for (const issue of result.data) {
              await this.executeWorkflow(workflowId, {
                triggerId,
                triggerType: 'jira_issue',
                issue,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      } catch (error) {
        console.error('Error en Jira trigger:', error.message);
      }
    }, trigger.interval || 60000); // Check cada minuto

    this.triggers.set(triggerId, { checkInterval, type: 'jira_issue' });
  }

  /**
   * Ejecutar workflow
   */
  async executeWorkflow(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.enabled) {
      return;
    }

    console.log(`🚀 Ejecutando workflow: ${workflow.name}`);
    
    const execution = {
      workflowId,
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      context,
      steps: [],
      status: 'running',
      error: null
    };

    try {
      // Actualizar estadísticas
      workflow.lastRun = execution.startTime.toISOString();
      workflow.runCount++;

      // Verificar condiciones
      if (!await this.checkConditions(workflow.conditions, context)) {
        execution.status = 'skipped';
        console.log(`⏭️  Workflow saltado por condiciones: ${workflow.name}`);
        return execution;
      }

      // Ejecutar pasos
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepExecution = await this.executeStep(step, { ...context, execution });
        
        execution.steps.push(stepExecution);

        if (stepExecution.status === 'failed' && step.continueOnError !== true) {
          throw new Error(`Paso ${i + 1} falló: ${stepExecution.error}`);
        }
      }

      execution.status = 'completed';
      workflow.successCount++;
      
      console.log(`✅ Workflow completado: ${workflow.name}`);

    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      workflow.errorCount++;
      
      console.error(`❌ Workflow falló: ${workflow.name} - ${error.message}`);
      
      // Enviar notificación de error si está configurado
      await this.sendErrorNotification(workflow, execution, error);
    } finally {
      execution.endTime = new Date();
      execution.duration = execution.endTime - execution.startTime;
      
      // Guardar ejecución en base de datos
      await this.saveExecution(execution);
    }

    return execution;
  }

  /**
   * Verificar condiciones
   */
  async checkConditions(conditions, context) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    // Verificar día de la semana
    if (conditions.dayOfWeek) {
      const currentDay = new Date().getDay();
      if (!conditions.dayOfWeek.includes(currentDay)) {
        return false;
      }
    }

    // Verificar hora
    if (conditions.timeRange) {
      const currentHour = new Date().getHours();
      const [startHour, endHour] = conditions.timeRange;
      if (currentHour < startHour || currentHour > endHour) {
        return false;
      }
    }

    // Verificar contexto personalizado
    if (conditions.custom && typeof conditions.custom === 'function') {
      return await conditions.custom(context);
    }

    return true;
  }

  /**
   * Ejecutar paso individual
   */
  async executeStep(step, context) {
    const stepExecution = {
      name: step.name,
      type: step.type,
      startTime: new Date(),
      status: 'running',
      output: null,
      error: null
    };

    try {
      switch (step.type) {
        case 'shell':
          stepExecution.output = await this.executeShellStep(step, context);
          break;
        case 'email':
          stepExecution.output = await this.executeEmailStep(step, context);
          break;
        case 'github':
          stepExecution.output = await this.executeGitHubStep(step, context);
          break;
        case 'jira':
          stepExecution.output = await this.executeJiraStep(step, context);
          break;
        case 'http':
          stepExecution.output = await this.executeHttpStep(step, context);
          break;
        case 'file':
          stepExecution.output = await this.executeFileStep(step, context);
          break;
        case 'condition':
          stepExecution.output = await this.executeConditionStep(step, context);
          break;
        case 'loop':
          stepExecution.output = await this.executeLoopStep(step, context);
          break;
        default:
          throw new Error(`Tipo de paso no soportado: ${step.type}`);
      }

      stepExecution.status = 'completed';

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = error.message;
    } finally {
      stepExecution.endTime = new Date();
      stepExecution.duration = stepExecution.endTime - stepExecution.startTime;
    }

    return stepExecution;
  }

  /**
   * Ejecutar paso de shell
   */
  async executeShellStep(step, context) {
    const command = this.interpolateVariables(step.command, context);
    const options = {
      cwd: step.workingDirectory || process.cwd(),
      timeout: step.timeout || 30000,
      env: { ...process.env, ...step.env }
    };

    const { stdout, stderr } = await execAsync(command, options);
    
    return {
      command,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0
    };
  }

  /**
   * Ejecutar paso de email
   */
  async executeEmailStep(step, context) {
    if (!this.mailer) {
      throw new Error('Sistema de email no configurado');
    }

    const mailOptions = {
      from: step.from || this.config.get('email.from'),
      to: this.interpolateVariables(step.to, context),
      subject: this.interpolateVariables(step.subject, context),
      text: step.text ? this.interpolateVariables(step.text, context) : null,
      html: step.html ? this.interpolateVariables(step.html, context) : null,
      attachments: step.attachments || []
    };

    const result = await this.mailer.sendMail(mailOptions);
    
    return {
      messageId: result.messageId,
      to: mailOptions.to,
      subject: mailOptions.subject
    };
  }

  /**
   * Ejecutar paso de GitHub
   */
  async executeGitHubStep(step, context) {
    if (!this.githubAPI) {
      throw new Error('GitHub API no configurado');
    }

    switch (step.action) {
      case 'create_issue':
        return await this.githubAPI.createIssue(
          step.owner,
          step.repo,
          {
            title: this.interpolateVariables(step.title, context),
            body: this.interpolateVariables(step.body, context),
            labels: step.labels || []
          }
        );
      
      case 'create_pr':
        // Implementar creación de PR
        break;
      
      default:
        throw new Error(`Acción de GitHub no soportada: ${step.action}`);
    }
  }

  /**
   * Ejecutar paso de Jira
   */
  async executeJiraStep(step, context) {
    if (!this.jiraAPI) {
      throw new Error('Jira API no configurado');
    }

    switch (step.action) {
      case 'create_issue':
        return await this.jiraAPI.createIssue({
          projectKey: step.projectKey,
          summary: this.interpolateVariables(step.summary, context),
          description: this.interpolateVariables(step.description, context),
          issueType: step.issueType || 'Task'
        });
      
      case 'transition_issue':
        return await this.jiraAPI.transitionIssue(
          step.issueKey,
          step.transitionId
        );
      
      default:
        throw new Error(`Acción de Jira no soportada: ${step.action}`);
    }
  }

  /**
   * Ejecutar paso HTTP
   */
  async executeHttpStep(step, context) {
    const axios = require('axios');
    
    const config = {
      method: step.method || 'GET',
      url: this.interpolateVariables(step.url, context),
      headers: step.headers || {},
      timeout: step.timeout || 10000
    };

    if (step.data) {
      config.data = this.interpolateVariables(JSON.stringify(step.data), context);
      config.data = JSON.parse(config.data);
    }

    const response = await axios(config);
    
    return {
      status: response.status,
      headers: response.headers,
      data: response.data
    };
  }

  /**
   * Ejecutar paso de archivo
   */
  async executeFileStep(step, context) {
    const filePath = this.interpolateVariables(step.path, context);
    
    switch (step.action) {
      case 'read':
        const content = await fs.readFile(filePath, step.encoding || 'utf8');
        return { content, size: content.length };
      
      case 'write':
        const data = this.interpolateVariables(step.content, context);
        await fs.writeFile(filePath, data, step.encoding || 'utf8');
        return { path: filePath, size: data.length };
      
      case 'copy':
        await fs.copyFile(filePath, step.destination);
        return { from: filePath, to: step.destination };
      
      case 'delete':
        await fs.unlink(filePath);
        return { deleted: filePath };
      
      default:
        throw new Error(`Acción de archivo no soportada: ${step.action}`);
    }
  }

  /**
   * Ejecutar paso condicional
   */
  async executeConditionStep(step, context) {
    const condition = this.interpolateVariables(step.condition, context);
    const result = eval(condition); // En producción, usar un evaluador más seguro
    
    if (result) {
      return { condition, result: true, message: 'Condición cumplida' };
    } else {
      return { condition, result: false, message: 'Condición no cumplida' };
    }
  }

  /**
   * Ejecutar paso de bucle
   */
  async executeLoopStep(step, context) {
    const items = this.interpolateVariables(step.items, context);
    const results = [];
    
    for (let i = 0; i < items.length; i++) {
      const itemContext = {
        ...context,
        loop: {
          index: i,
          item: items[i],
          first: i === 0,
          last: i === items.length - 1
        }
      };
      
      for (const subStep of step.steps) {
        const result = await this.executeStep(subStep, itemContext);
        results.push(result);
      }
    }
    
    return { iterations: items.length, results };
  }

  /**
   * Interpolar variables en strings
   */
  interpolateVariables(template, context) {
    if (typeof template !== 'string') {
      return template;
    }

    return template.replace(/\{\{(.+?)\}\}/g, (match, variable) => {
      const keys = variable.trim().split('.');
      let value = context;
      
      for (const key of keys) {
        value = value && value[key];
      }
      
      return value !== undefined ? value : match;
    });
  }

  /**
   * Enviar notificación de error
   */
  async sendErrorNotification(workflow, execution, error) {
    try {
      if (workflow.notifications && workflow.notifications.onError) {
        const notification = workflow.notifications.onError;
        
        await this.executeStep({
          type: 'email',
          name: 'Error Notification',
          to: notification.email,
          subject: `Workflow Error: ${workflow.name}`,
          text: `
Workflow: ${workflow.name}
Execution ID: ${execution.executionId}
Error: ${error.message}
Time: ${new Date().toISOString()}

Context: ${JSON.stringify(execution.context, null, 2)}
          `
        }, execution.context);
      }
    } catch (notificationError) {
      console.error('Error al enviar notificación:', notificationError.message);
    }
  }

  /**
   * Guardar ejecución en base de datos
   */
  async saveExecution(execution) {
    try {
      if (this.database) {
        await this.database.logActivity({
          userId: execution.context.userId,
          projectId: execution.context.projectId,
          action: 'workflow_execution',
          entityType: 'workflow',
          entityId: execution.workflowId,
          details: {
            executionId: execution.executionId,
            status: execution.status,
            duration: execution.duration,
            steps: execution.steps.length,
            error: execution.error
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar ejecución:', error.message);
    }
  }

  /**
   * Obtener estadísticas de workflows
   */
  getWorkflowStats() {
    const stats = {
      totalWorkflows: this.workflows.size,
      enabledWorkflows: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      workflows: []
    };

    for (const [id, workflow] of this.workflows) {
      if (workflow.enabled) {
        stats.enabledWorkflows++;
      }
      
      stats.totalExecutions += workflow.runCount;
      stats.successfulExecutions += workflow.successCount;
      stats.failedExecutions += workflow.errorCount;
      
      stats.workflows.push({
        id: workflow.id,
        name: workflow.name,
        enabled: workflow.enabled,
        runCount: workflow.runCount,
        successCount: workflow.successCount,
        errorCount: workflow.errorCount,
        lastRun: workflow.lastRun,
        successRate: workflow.runCount > 0 ? (workflow.successCount / workflow.runCount * 100).toFixed(2) : 0
      });
    }

    return stats;
  }

  /**
   * Parar workflow
   */
  stopWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.enabled = false;
      
      // Detener triggers asociados
      for (const [triggerId, trigger] of this.triggers) {
        if (trigger.workflowId === workflowId) {
          if (trigger.checkInterval) {
            clearInterval(trigger.checkInterval);
          }
        }
      }
      
      console.log(`Workflow detenido: ${workflow.name}`);
    }
  }

  /**
   * Iniciar workflow
   */
  startWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.enabled = true;
      console.log(`Workflow iniciado: ${workflow.name}`);
    }
  }

  /**
   * Eliminar workflow
   */
  removeWorkflow(workflowId) {
    this.stopWorkflow(workflowId);
    this.workflows.delete(workflowId);
    
    // Limpiar triggers
    for (const [triggerId, trigger] of this.triggers) {
      if (trigger.workflowId === workflowId) {
        this.triggers.delete(triggerId);
      }
    }
    
    console.log(`Workflow eliminado: ${workflowId}`);
  }

  /**
   * Cargar workflows desde archivo
   */
  async loadWorkflowsFromFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const workflows = JSON.parse(content);
      
      for (const workflowData of workflows) {
        this.registerWorkflow(workflowData);
      }
      
      console.log(`${workflows.length} workflows cargados desde ${filePath}`);
    } catch (error) {
      console.error('Error al cargar workflows:', error.message);
    }
  }

  /**
   * Guardar workflows en archivo
   */
  async saveWorkflowsToFile(filePath) {
    try {
      const workflows = Array.from(this.workflows.values());
      await fs.writeFile(filePath, JSON.stringify(workflows, null, 2));
      
      console.log(`${workflows.length} workflows guardados en ${filePath}`);
    } catch (error) {
      console.error('Error al guardar workflows:', error.message);
    }
  }

  /**
   * Detener todos los servicios
   */
  shutdown() {
    console.log('Deteniendo sistema de automatización...');
    
    // Detener todas las tareas programadas
    for (const [id, task] of this.scheduledTasks) {
      task.stop();
      task.destroy();
    }
    
    // Detener todos los triggers
    for (const [id, trigger] of this.triggers) {
      if (trigger.checkInterval) {
        clearInterval(trigger.checkInterval);
      }
    }
    
    console.log('Sistema de automatización detenido');
  }
}

module.exports = AutomationSystem;