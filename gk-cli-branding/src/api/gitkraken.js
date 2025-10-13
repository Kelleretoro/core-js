/**
 * GitKraken Integration
 * Conecta con GitKraken Glo Boards y Git repositories
 * by kellerEToro
 */

require('core-js/stable');
const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class GitKrakenAPI {
  constructor(config = {}) {
    this.apiToken = config.apiToken || process.env.GITKRAKEN_TOKEN;
    this.baseURL = 'https://gloapi.gitkraken.com/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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
        message: `Autenticado como: ${response.data.username}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener boards de Glo
   */
  async getBoards() {
    try {
      const response = await this.client.get('/boards');
      
      return {
        success: true,
        data: response.data.map(board => ({
          id: board.id,
          name: board.name,
          description: board.description,
          createdBy: board.created_by.username,
          createdDate: board.created_date,
          inviteCode: board.invite_code
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Crear un nuevo board
   */
  async createBoard(boardData) {
    try {
      const payload = {
        name: boardData.name,
        description: boardData.description || ''
      };

      const response = await this.client.post('/boards', payload);
      
      return {
        success: true,
        data: {
          id: response.data.id,
          name: response.data.name,
          inviteCode: response.data.invite_code
        },
        message: `Board "${boardData.name}" creado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener columnas de un board
   */
  async getColumns(boardId) {
    try {
      const response = await this.client.get(`/boards/${boardId}/columns`);
      
      return {
        success: true,
        data: response.data.map(column => ({
          id: column.id,
          name: column.name,
          position: column.position,
          cardCount: column.card_count
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener cards de un board
   */
  async getCards(boardId, options = {}) {
    try {
      const params = {
        fields: 'assignees,labels,due_date,description',
        per_page: options.perPage || 25,
        page: options.page || 1
      };

      const response = await this.client.get(`/boards/${boardId}/cards`, { params });
      
      return {
        success: true,
        data: response.data.map(card => ({
          id: card.id,
          name: card.name,
          description: card.description,
          columnId: card.column_id,
          position: card.position,
          dueDate: card.due_date,
          assignees: card.assignees?.map(assignee => assignee.username) || [],
          labels: card.labels?.map(label => label.name) || [],
          createdDate: card.created_date,
          updatedDate: card.updated_date
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Crear una nueva card
   */
  async createCard(boardId, cardData) {
    try {
      const payload = {
        name: cardData.name,
        description: cardData.description || '',
        column_id: cardData.columnId,
        assignees: cardData.assignees || [],
        labels: cardData.labels || [],
        due_date: cardData.dueDate || null
      };

      const response = await this.client.post(`/boards/${boardId}/cards`, payload);
      
      return {
        success: true,
        data: {
          id: response.data.id,
          name: response.data.name,
          columnId: response.data.column_id
        },
        message: `Card "${cardData.name}" creada exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Actualizar una card
   */
  async updateCard(boardId, cardId, updateData) {
    try {
      const response = await this.client.put(`/boards/${boardId}/cards/${cardId}`, updateData);
      
      return {
        success: true,
        data: response.data,
        message: `Card actualizada exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Mover card a otra columna
   */
  async moveCard(boardId, cardId, columnId, position = 0) {
    try {
      const payload = {
        column_id: columnId,
        position: position
      };

      await this.client.put(`/boards/${boardId}/cards/${cardId}`, payload);
      
      return {
        success: true,
        message: 'Card movida exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener comentarios de una card
   */
  async getCardComments(boardId, cardId) {
    try {
      const response = await this.client.get(`/boards/${boardId}/cards/${cardId}/comments`);
      
      return {
        success: true,
        data: response.data.map(comment => ({
          id: comment.id,
          text: comment.text,
          author: comment.created_by.username,
          createdDate: comment.created_date
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Agregar comentario a una card
   */
  async addCardComment(boardId, cardId, text) {
    try {
      const payload = { text };
      const response = await this.client.post(`/boards/${boardId}/cards/${cardId}/comments`, payload);
      
      return {
        success: true,
        data: {
          id: response.data.id,
          text: response.data.text
        },
        message: 'Comentario agregado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Funciones Git locales
   */

  /**
   * Obtener estado de git
   */
  async getGitStatus(repoPath = '.') {
    try {
      const { stdout } = await execAsync('git status --porcelain', { cwd: repoPath });
      const { stdout: branch } = await execAsync('git branch --show-current', { cwd: repoPath });
      
      const files = stdout.split('\n').filter(line => line.trim()).map(line => {
        const status = line.substring(0, 2);
        const file = line.substring(3);
        return { status, file };
      });

      return {
        success: true,
        data: {
          currentBranch: branch.trim(),
          modifiedFiles: files.filter(f => f.status.includes('M')),
          addedFiles: files.filter(f => f.status.includes('A')),
          deletedFiles: files.filter(f => f.status.includes('D')),
          untrackedFiles: files.filter(f => f.status.includes('??')),
          totalChanges: files.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener histórico de commits
   */
  async getCommitHistory(repoPath = '.', options = {}) {
    try {
      const limit = options.limit || 10;
      const format = '--pretty=format:"%H|%an|%ae|%ad|%s" --date=iso';
      const { stdout } = await execAsync(`git log -${limit} ${format}`, { cwd: repoPath });
      
      const commits = stdout.split('\n').filter(line => line.trim()).map(line => {
        const [hash, author, email, date, message] = line.replace(/"/g, '').split('|');
        return { hash, author, email, date, message };
      });

      return {
        success: true,
        data: commits
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtener branches
   */
  async getBranches(repoPath = '.') {
    try {
      const { stdout: localBranches } = await execAsync('git branch', { cwd: repoPath });
      const { stdout: remoteBranches } = await execAsync('git branch -r', { cwd: repoPath });
      
      const local = localBranches.split('\n')
        .filter(line => line.trim())
        .map(line => ({
          name: line.replace('*', '').trim(),
          current: line.includes('*'),
          type: 'local'
        }));

      const remote = remoteBranches.split('\n')
        .filter(line => line.trim())
        .map(line => ({
          name: line.trim(),
          current: false,
          type: 'remote'
        }));

      return {
        success: true,
        data: {
          local,
          remote,
          current: local.find(b => b.current)?.name
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Crear nueva branch
   */
  async createBranch(branchName, repoPath = '.') {
    try {
      await execAsync(`git checkout -b ${branchName}`, { cwd: repoPath });
      
      return {
        success: true,
        message: `Branch "${branchName}" creada exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cambiar de branch
   */
  async switchBranch(branchName, repoPath = '.') {
    try {
      await execAsync(`git checkout ${branchName}`, { cwd: repoPath });
      
      return {
        success: true,
        message: `Cambiado a branch "${branchName}"`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Hacer commit
   */
  async commit(message, repoPath = '.') {
    try {
      await execAsync('git add .', { cwd: repoPath });
      await execAsync(`git commit -m "${message}"`, { cwd: repoPath });
      
      return {
        success: true,
        message: `Commit realizado: "${message}"`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Hacer push
   */
  async push(repoPath = '.', remote = 'origin', branch = null) {
    try {
      const pushCommand = branch ? `git push ${remote} ${branch}` : `git push ${remote}`;
      await execAsync(pushCommand, { cwd: repoPath });
      
      return {
        success: true,
        message: 'Push realizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Hacer pull
   */
  async pull(repoPath = '.', remote = 'origin', branch = null) {
    try {
      const pullCommand = branch ? `git pull ${remote} ${branch}` : 'git pull';
      await execAsync(pullCommand, { cwd: repoPath });
      
      return {
        success: true,
        message: 'Pull realizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GitKrakenAPI;