/**
 * GK CLI - Sistema de Branding y Reportes
 * Integración con core-js para máxima compatibilidad
 * by kellerEToro
 */

// Importar core-js para garantizar compatibilidad
require('core-js/stable');

// Cargar configuración de branding
const branding = require('./branding.json');

class GKCli {
  constructor() {
    this.branding = branding;
    this.version = '1.0.0';
  }

  /**
   * Generar reporte completo de branding
   */
  generateFullReport() {
    return {
      artist: this.branding.KELLER_NICKNAME_ARTIST,
      alterEgo: this.branding.KELLER_ALTER_EGO,
      name: this.branding.KELLER_NAME,
      enterprise: this.branding.ENTERPRISE_KELLER,
      contact: this.branding.CONTACTO,
      social: this.branding.KELLER_SOCIAL,
      hashtags: this.branding.KELLER_HASHTAGS,
      colors: this.branding.KELLER_PALLETS,
      generatedAt: new Date().toISOString(),
      version: this.version
    };
  }

  /**
   * Validar configuración de branding
   */
  validateBranding() {
    const required = [
      'KELLER_NICKNAME_ARTIST',
      'KELLER_ALTER_EGO', 
      'KELLER_NAME',
      'ENTERPRISE_KELLER'
    ];
    
    const missing = required.filter(key => !this.branding[key]);
    
    return {
      valid: missing.length === 0,
      missing: missing,
      score: Math.round(((required.length - missing.length) / required.length) * 100)
    };
  }

  /**
   * Obtener información de contacto
   */
  getContactInfo() {
    return this.branding.CONTACTO || {};
  }

  /**
   * Obtener paleta de colores
   */
  getColorPalette() {
    return this.branding.KELLER_PALLETS || [];
  }

  /**
   * Obtener hashtags
   */
  getHashtags() {
    return this.branding.KELLER_HASHTAGS || [];
  }

  /**
   * Obtener información social
   */
  getSocialInfo() {
    return this.branding.KELLER_SOCIAL || [];
  }

  /**
   * Generar template personalizado
   */
  generateTemplate(templateType = 'basic') {
    const templates = {
      basic: `# ${this.branding.KELLER_NICKNAME_ARTIST}
## ${this.branding.KELLER_ALTER_EGO}
### ${this.branding.KELLER_NAME}

**Empresa:** ${this.branding.ENTERPRISE_KELLER}
**Email:** ${this.branding.CONTACTO.KELLER_MAIL}
**Phone:** ${this.branding.CONTACTO.KELLER_PHONE}
**Website:** ${this.branding.CONTACTO.KELLER_WEBSITE}`,

      detailed: `# Proyecto ${this.branding.KELLER_NICKNAME_ARTIST}

## Información del Artista
- **Nombre Artístico:** ${this.branding.KELLER_NICKNAME_ARTIST}
- **Alter Ego:** ${this.branding.KELLER_ALTER_EGO}
- **Nombre Completo:** ${this.branding.KELLER_NAME}
- **Empresa:** ${this.branding.ENTERPRISE_KELLER}

## Contacto
- **Email:** ${this.branding.CONTACTO.KELLER_MAIL}
- **Teléfono:** ${this.branding.CONTACTO.KELLER_PHONE}  
- **Website:** ${this.branding.CONTACTO.KELLER_WEBSITE}

## Hashtags
${this.branding.KELLER_HASHTAGS.map(tag => `- ${tag}`).join('\n')}

## Colores
${this.branding.KELLER_PALLETS.map(color => `- ${color}`).join('\n')}

## Redes Sociales  
${this.branding.KELLER_SOCIAL.map(social => `- ${social}`).join('\n')}

---
*by ${this.branding.ENTERPRISE_KELLER}*`
    };

    return templates[templateType] || templates.basic;
  }

  /**
   * Ejecutar validación completa del sistema
   */
  runSystemCheck() {
    const checks = {
      coreJS: this.checkCoreJS(),
      branding: this.validateBranding(),
      contact: this.checkContactInfo(),
      social: this.checkSocialInfo()
    };

    return {
      overall: Object.values(checks).every(check => check.valid || check.score > 80),
      details: checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verificar funcionalidad de core-js
   */
  checkCoreJS() {
    try {
      const tests = [
        () => Array.from('test').length === 4,
        () => 'hello'.includes('ell'),
        () => [1,2,3].find(x => x > 2) === 3,
        () => Object.assign({a: 1}, {b: 2}).b === 2,
        () => Promise.resolve(42).then !== undefined
      ];

      const results = tests.map(test => {
        try {
          return test();
        } catch {
          return false;
        }
      });

      const passed = results.filter(Boolean).length;
      
      return {
        valid: passed === tests.length,
        passed: passed,
        total: tests.length,
        score: Math.round((passed / tests.length) * 100)
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        score: 0
      };
    }
  }

  /**
   * Verificar información de contacto
   */
  checkContactInfo() {
    const contact = this.branding.CONTACTO || {};
    const required = ['KELLER_MAIL', 'KELLER_PHONE', 'KELLER_WEBSITE'];
    const present = required.filter(key => contact[key]);
    
    return {
      valid: present.length === required.length,
      missing: required.filter(key => !contact[key]),
      score: Math.round((present.length / required.length) * 100)
    };
  }

  /**
   * Verificar información social
   */
  checkSocialInfo() {
    const social = this.branding.KELLER_SOCIAL || [];
    const hashtags = this.branding.KELLER_HASHTAGS || [];
    
    return {
      valid: social.length > 0 && hashtags.length > 0,
      socialCount: social.length,
      hashtagCount: hashtags.length,
      score: Math.min(100, (social.length + hashtags.length) * 20)
    };
  }
}

module.exports = GKCli;