/**
 * GitHub API Integration
 * Conecta con GitHub para gestión de repositorios, issues, PRs
 * by kellerEToro
 */

require('core-js/stable');
const axios = require('axios');

class GitHubAPI {
  constructor(token = null) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.baseURL = 'https://api.github.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': this.token ? `token ${this.token}` : undefined,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'gk-cli-branding by kellerEToro'
      }
    });
  }

  /**
   * Verificar autenticación
   */
  async checkAuth() {
    try {
      const response = await this.client.get('/user');
      return {
        success: true,
        user: response.data,
        message: `Autenticado como: ${response.data.login}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener repositorios del usuario
   */
  async getRepositories(username = null, options = {}) {
    try {
      const endpoint = username ? `/users/${username}/repos` : '/user/repos';
      const params = {
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: options.perPage || 30,
        page: options.page || 1
      };

      const response = await this.client.get(endpoint, { params });
      
      return {
        success: true,
        data: response.data.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          private: repo.private,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          updatedAt: repo.updated_at,
          createdAt: repo.created_at
        })),
        total: response.data.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Crear un nuevo repositorio
   */
  async createRepository(repoData) {
    try {
      const payload = {
        name: repoData.name,
        description: repoData.description || '',
        private: repoData.private || false,
        auto_init: repoData.autoInit || true,
        gitignore_template: repoData.gitignoreTemplate || null,
        license_template: repoData.licenseTemplate || null
      };

      const response = await this.client.post('/user/repos', payload);
      
      return {
        success: true,
        data: {
          id: response.data.id,
          name: response.data.name,
          fullName: response.data.full_name,
          url: response.data.html_url,
          cloneUrl: response.data.clone_url
        },
        message: `Repositorio "${repoData.name}" creado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener issues de un repositorio
   */
  async getIssues(owner, repo, options = {}) {
    try {
      const params = {
        state: options.state || 'open',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: options.perPage || 30,
        page: options.page || 1
      };

      const response = await this.client.get(`/repos/${owner}/${repo}/issues`, { params });
      
      return {
        success: true,
        data: response.data.map(issue => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          user: issue.user.login,
          labels: issue.labels.map(label => label.name),
          assignees: issue.assignees.map(assignee => assignee.login),
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          url: issue.html_url
        })),
        total: response.data.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Crear un nuevo issue
   */
  async createIssue(owner, repo, issueData) {
    try {
      const payload = {
        title: issueData.title,
        body: issueData.body || '',
        assignees: issueData.assignees || [],
        labels: issueData.labels || []
      };

      const response = await this.client.post(`/repos/${owner}/${repo}/issues`, payload);
      
      return {
        success: true,
        data: {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          url: response.data.html_url
        },
        message: `Issue #${response.data.number} creado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener pull requests
   */
  async getPullRequests(owner, repo, options = {}) {
    try {
      const params = {
        state: options.state || 'open',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: options.perPage || 30,
        page: options.page || 1
      };

      const response = await this.client.get(`/repos/${owner}/${repo}/pulls`, { params });
      
      return {
        success: true,
        data: response.data.map(pr => ({
          id: pr.id,
          number: pr.number,
          title: pr.title,
          body: pr.body,
          state: pr.state,
          user: pr.user.login,
          head: pr.head.ref,
          base: pr.base.ref,
          mergeable: pr.mergeable,
          createdAt: pr.created_at,
          updatedAt: pr.updated_at,
          url: pr.html_url
        })),
        total: response.data.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener información de commits
   */
  async getCommits(owner, repo, options = {}) {
    try {
      const params = {
        sha: options.branch || 'main',
        per_page: options.perPage || 30,
        page: options.page || 1
      };

      const response = await this.client.get(`/repos/${owner}/${repo}/commits`, { params });
      
      return {
        success: true,
        data: response.data.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
          url: commit.html_url
        })),
        total: response.data.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Webhook para eventos de GitHub
   */
  async setupWebhook(owner, repo, webhookData) {
    try {
      const payload = {
        name: 'web',
        active: true,
        events: webhookData.events || ['push', 'pull_request', 'issues'],
        config: {
          url: webhookData.url,
          content_type: 'json',
          secret: webhookData.secret || undefined
        }
      };

      const response = await this.client.post(`/repos/${owner}/${repo}/hooks`, payload);
      
      return {
        success: true,
        data: {
          id: response.data.id,
          url: response.data.config.url,
          events: response.data.events
        },
        message: 'Webhook configurado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener estadísticas del repositorio
   */
  async getRepoStats(owner, repo) {
    try {
      const [repoResponse, contributorsResponse, languagesResponse] = await Promise.all([
        this.client.get(`/repos/${owner}/${repo}`),
        this.client.get(`/repos/${owner}/${repo}/contributors`),
        this.client.get(`/repos/${owner}/${repo}/languages`)
      ]);

      return {
        success: true,
        data: {
          repository: {
            name: repoResponse.data.name,
            description: repoResponse.data.description,
            stars: repoResponse.data.stargazers_count,
            forks: repoResponse.data.forks_count,
            openIssues: repoResponse.data.open_issues_count,
            size: repoResponse.data.size,
            language: repoResponse.data.language,
            createdAt: repoResponse.data.created_at,
            updatedAt: repoResponse.data.updated_at
          },
          contributors: contributorsResponse.data.slice(0, 10).map(contributor => ({
            login: contributor.login,
            contributions: contributor.contributions,
            url: contributor.html_url
          })),
          languages: languagesResponse.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = GitHubAPI;