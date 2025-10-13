/**
 * Jira API Integration
 * Conecta con Jira para gestión de proyectos, issues, sprints
 * by kellerEToro
 */

require('core-js/stable');
const axios = require('axios');

class JiraAPI {
  constructor(config = {}) {
    this.domain = config.domain || process.env.JIRA_DOMAIN;
    this.email = config.email || process.env.JIRA_EMAIL;
    this.apiToken = config.apiToken || process.env.JIRA_API_TOKEN;
    this.baseURL = `https://${this.domain}.atlassian.net/rest/api/3`;
    
    const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'gk-cli-branding by kellerEToro'
      }
    });
  }

  /**
   * Verificar conexión con Jira
   */
  async checkConnection() {
    try {
      const response = await this.client.get('/myself');
      return {
        success: true,
        user: {
          accountId: response.data.accountId,
          displayName: response.data.displayName,
          emailAddress: response.data.emailAddress
        },
        message: `Conectado como: ${response.data.displayName}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Obtener proyectos
   */
  async getProjects(options = {}) {
    try {
      const params = {
        expand: 'description,lead,url,projectKeys',
        maxResults: options.maxResults || 50,
        startAt: options.startAt || 0
      };

      const response = await this.client.get('/project/search', { params });
      
      return {
        success: true,
        data: response.data.values.map(project => ({
          id: project.id,
          key: project.key,
          name: project.name,
          description: project.description,
          projectTypeKey: project.projectTypeKey,
          lead: project.lead.displayName,
          url: project.url
        })),
        total: response.data.total
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Crear un nuevo proyecto
   */
  async createProject(projectData) {
    try {
      const payload = {
        key: projectData.key,
        name: projectData.name,
        projectTypeKey: projectData.projectType || 'software',
        description: projectData.description || '',
        leadAccountId: projectData.leadAccountId,
        assigneeType: 'PROJECT_LEAD'
      };

      const response = await this.client.post('/project', payload);
      
      return {
        success: true,
        data: {
          id: response.data.id,
          key: response.data.key,
          name: response.data.name,
          url: response.data.self
        },
        message: `Proyecto "${projectData.name}" creado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Obtener issues de un proyecto
   */
  async getIssues(projectKey, options = {}) {
    try {
      const jql = options.jql || `project = "${projectKey}" ORDER BY updated DESC`;
      const params = {
        jql: jql,
        maxResults: options.maxResults || 50,
        startAt: options.startAt || 0,
        fields: 'summary,status,assignee,reporter,created,updated,priority,issuetype,description'
      };

      const response = await this.client.post('/search', params);
      
      return {
        success: true,
        data: response.data.issues.map(issue => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          description: issue.fields.description,
          status: issue.fields.status.name,
          statusCategory: issue.fields.status.statusCategory.name,
          priority: issue.fields.priority?.name || 'None',
          issueType: issue.fields.issuetype.name,
          assignee: issue.fields.assignee?.displayName || 'Unassigned',
          reporter: issue.fields.reporter.displayName,
          created: issue.fields.created,
          updated: issue.fields.updated,
          url: `https://${this.domain}.atlassian.net/browse/${issue.key}`
        })),
        total: response.data.total
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Crear un nuevo issue
   */
  async createIssue(issueData) {
    try {
      const payload = {
        fields: {
          project: {
            key: issueData.projectKey
          },
          summary: issueData.summary,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: issueData.description || ''
                  }
                ]
              }
            ]
          },
          issuetype: {
            name: issueData.issueType || 'Task'
          },
          priority: issueData.priority ? {
            name: issueData.priority
          } : undefined,
          assignee: issueData.assigneeAccountId ? {
            accountId: issueData.assigneeAccountId
          } : undefined
        }
      };

      const response = await this.client.post('/issue', payload);
      
      return {
        success: true,
        data: {
          id: response.data.id,
          key: response.data.key,
          url: `https://${this.domain}.atlassian.net/browse/${response.data.key}`
        },
        message: `Issue ${response.data.key} creado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Actualizar un issue
   */
  async updateIssue(issueKey, updateData) {
    try {
      const payload = {
        fields: {}
      };

      if (updateData.summary) {
        payload.fields.summary = updateData.summary;
      }
      
      if (updateData.description) {
        payload.fields.description = {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: updateData.description
                }
              ]
            }
          ]
        };
      }

      if (updateData.assigneeAccountId) {
        payload.fields.assignee = {
          accountId: updateData.assigneeAccountId
        };
      }

      await this.client.put(`/issue/${issueKey}`, payload);
      
      return {
        success: true,
        message: `Issue ${issueKey} actualizado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Obtener sprints activos
   */
  async getActiveSprints(boardId) {
    try {
      const response = await this.client.get(`/board/${boardId}/sprint`, {
        params: { state: 'active' }
      });
      
      return {
        success: true,
        data: response.data.values.map(sprint => ({
          id: sprint.id,
          name: sprint.name,
          state: sprint.state,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          goal: sprint.goal
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Obtener boards
   */
  async getBoards(options = {}) {
    try {
      const params = {
        maxResults: options.maxResults || 50,
        startAt: options.startAt || 0
      };

      const response = await this.client.get('/board', { params });
      
      return {
        success: true,
        data: response.data.values.map(board => ({
          id: board.id,
          name: board.name,
          type: board.type,
          url: board.self
        })),
        total: response.data.total
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Transicionar issue (cambiar estado)
   */
  async transitionIssue(issueKey, transitionId) {
    try {
      const payload = {
        transition: {
          id: transitionId
        }
      };

      await this.client.post(`/issue/${issueKey}/transitions`, payload);
      
      return {
        success: true,
        message: `Issue ${issueKey} transicionado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Obtener transiciones disponibles para un issue
   */
  async getTransitions(issueKey) {
    try {
      const response = await this.client.get(`/issue/${issueKey}/transitions`);
      
      return {
        success: true,
        data: response.data.transitions.map(transition => ({
          id: transition.id,
          name: transition.name,
          to: transition.to.name
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }

  /**
   * Obtener estadísticas del proyecto
   */
  async getProjectStats(projectKey) {
    try {
      const [issuesResponse, versionsResponse] = await Promise.all([
        this.getIssues(projectKey, { maxResults: 1000 }),
        this.client.get(`/project/${projectKey}/version`)
      ]);

      if (!issuesResponse.success) {
        return issuesResponse;
      }

      const issues = issuesResponse.data;
      const statusCounts = {};
      const priorityCounts = {};
      const typeCounts = {};

      issues.forEach(issue => {
        statusCounts[issue.statusCategory] = (statusCounts[issue.statusCategory] || 0) + 1;
        priorityCounts[issue.priority] = (priorityCounts[issue.priority] || 0) + 1;
        typeCounts[issue.issueType] = (typeCounts[issue.issueType] || 0) + 1;
      });

      return {
        success: true,
        data: {
          totalIssues: issues.length,
          statusBreakdown: statusCounts,
          priorityBreakdown: priorityCounts,
          typeBreakdown: typeCounts,
          versions: versionsResponse.data.length,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message
      };
    }
  }
}

module.exports = JiraAPI;