#!/usr/bin/env node

/**
 * CLI Simple y Funcional para gk-cli-branding  
 * Versión mejorada con readline para máxima compatibilidad
 */

const readline = require('readline');
const GKCli = require('../src/index.js');

class SimpleCLI {
  constructor() {
    this.gkCli = new GKCli();
    this.branding = this.gkCli.branding;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Banner visual simple pero efectivo
   */
  showBanner() {
    console.clear();
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
║           🎨 BRANDING • REPORTES • CLI • AUTOMATION                 ║
║                          by ${this.branding.ENTERPRISE_KELLER}                           ║
║                                                                      ║
║  👤 ${this.branding.KELLER_NICKNAME_ARTIST}                                       ║
║  🛸 ${this.branding.KELLER_ALTER_EGO}                             ║
║  👨‍💼 ${this.branding.KELLER_NAME}                          ║
║  📧 ${this.branding.CONTACTO.KELLER_MAIL}                         ║
║  📱 ${this.branding.CONTACTO.KELLER_PHONE}                              ║
║  🌐 ${this.branding.CONTACTO.KELLER_WEBSITE}                                     ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Mostrar progreso visual simple
   */
  showProgress(message, percent = 0) {
    const progressBar = '█'.repeat(Math.floor(percent / 2));
    const emptyBar = '░'.repeat(50 - Math.floor(percent / 2));
    process.stdout.write(`\r${message} [${progressBar}${emptyBar}] ${percent}%`);
    if (percent >= 100) {
      console.log('\n✅ Completado!');
    }
  }

  /**
   * Menú principal interactivo
   */
  async showMainMenu() {
    console.log('\n🔥 ¿Qué te gustaría hacer?');
    console.log('  1) 🎨 Validar configuración de branding');
    console.log('  2) 📊 Generar reporte completo');
    console.log('  3) 📝 Generar plantilla personalizada');
    console.log('  4) 🔍 Ver detalles de branding');
    console.log('  5) 🧪 Ejecutar pruebas de core-js');
    console.log('  6) 🎯 Demo interactivo avanzado');
    console.log('  0) 🚪 Salir');
    console.log('');

    return new Promise((resolve) => {
      this.rl.question('👉 Selecciona una opción (0-6): ', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Validación completa de branding
   */
  async validateBranding() {
    console.log('\n🔍 Validando configuración de branding...\n');
    
    const validations = [
      { name: 'KELLER_NICKNAME_ARTIST', value: this.branding.KELLER_NICKNAME_ARTIST },
      { name: 'KELLER_ALTER_EGO', value: this.branding.KELLER_ALTER_EGO },
      { name: 'KELLER_NAME', value: this.branding.KELLER_NAME },
      { name: 'ENTERPRISE_KELLER', value: this.branding.ENTERPRISE_KELLER },
      { name: 'KELLER_SOCIAL', value: Array.isArray(this.branding.KELLER_SOCIAL) },
      { name: 'KELLER_HASHTAGS', value: Array.isArray(this.branding.KELLER_HASHTAGS) },
      { name: 'KELLER_PALLETS', value: Array.isArray(this.branding.KELLER_PALLETS) },
      { name: 'CONTACTO.KELLER_MAIL', value: this.branding.CONTACTO?.KELLER_MAIL },
      { name: 'CONTACTO.KELLER_PHONE', value: this.branding.CONTACTO?.KELLER_PHONE }
    ];

    let score = 0;
    for (let i = 0; i < validations.length; i++) {
      const validation = validations[i];
      const isValid = validation.value ? true : false;
      
      await new Promise(resolve => {
        setTimeout(() => {
          console.log(`${isValid ? '✅' : '❌'} ${validation.name}: ${isValid ? 'OK' : 'FALTANTE'}`);
          if (isValid) score++;
          this.showProgress('Validando', Math.round(((i + 1) / validations.length) * 100));
          resolve();
        }, 300);
      });
    }

    console.log(`\n📊 Puntuación: ${score}/${validations.length} (${Math.round((score/validations.length)*100)}%)`);
    
    if (score === validations.length) {
      console.log('🎉 ¡Configuración perfecta! Todos los elementos de branding están presentes.');
    } else {
      console.log('⚠️  Algunos elementos de branding necesitan atención.');
    }
  }

  /**
   * Generar reporte detallado
   */
  async generateReport() {
    console.log('\n📊 Generando reporte detallado...\n');
    
    const report = this.gkCli.generateFullReport();
    
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                     📋 REPORTE DE BRANDING                   ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║ 👤 Artista: ${this.branding.KELLER_NICKNAME_ARTIST.padEnd(48)} ║`);
    console.log(`║ 🛸 Alter Ego: ${this.branding.KELLER_ALTER_EGO.padEnd(46)} ║`);
    console.log(`║ 👨‍💼 Nombre: ${this.branding.KELLER_NAME.padEnd(47)} ║`);
    console.log(`║ 🏢 Empresa: ${this.branding.ENTERPRISE_KELLER.padEnd(48)} ║`);
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║ 📧 Email: ${this.branding.CONTACTO.KELLER_MAIL.padEnd(50)} ║`);
    console.log(`║ 📱 Teléfono: ${this.branding.CONTACTO.KELLER_PHONE.padEnd(47)} ║`);
    console.log(`║ 🌐 Website: ${this.branding.CONTACTO.KELLER_WEBSITE.padEnd(48)} ║`);
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║ 🏷️  Hashtags: ${this.branding.KELLER_HASHTAGS.length} elementos${' '.repeat(36)} ║`);
    console.log(`║ 🎨 Paleta: ${this.branding.KELLER_PALLETS.length} colores${' '.repeat(40)} ║`);
    console.log(`║ 📱 Social: ${this.branding.KELLER_SOCIAL.length} plataformas${' '.repeat(38)} ║`);
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    
    console.log('\n🎨 Paleta de colores:');
    this.branding.KELLER_PALLETS.forEach(color => {
      console.log(`   ${color} ████`);
    });
    
    console.log('\n🏷️ Hashtags:');
    this.branding.KELLER_HASHTAGS.forEach(tag => {
      console.log(`   ${tag}`);
    });
  }

  /**
   * Demo interactivo avanzado
   */
  async runInteractiveDemo() {
    console.log('\n🎯 Iniciando demo interactivo avanzado...\n');
    
    // Simulación de carga de datos
    console.log('📡 Cargando datos de branding...');
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.showProgress('Cargando', i);
    }
    
    console.log('\n🔄 Procesando información...');
    for (let i = 0; i <= 100; i += 25) {
      await new Promise(resolve => setTimeout(resolve, 200));
      this.showProgress('Procesando', i);
    }
    
    console.log('\n✨ ¡Demo completado exitosamente!');
    console.log('🎨 Branding cargado correctamente');
    console.log('📊 Datos procesados');
    console.log('🚀 Sistema listo para usar');
  }

  /**
   * Mostrar detalles de branding
   */
  showBrandingDetails() {
    console.log('\n🎨 DETALLES DE BRANDING COMPLETOS:\n');
    console.log(JSON.stringify(this.branding, null, 2));
  }

  /**
   * Ejecutar pruebas de core-js
   */
  async runCoreJSTests() {
    console.log('\n🧪 Ejecutando pruebas básicas de core-js...\n');
    
    // Pruebas básicas de core-js
    const tests = [
      () => Array.from('hello').length === 5,
      () => 'hello'.includes('ell'),
      () => [1,2,3].find(x => x > 2) === 3,
      () => Object.assign({a: 1}, {b: 2}).b === 2,
      () => Promise.resolve(42).then !== undefined
    ];
    
    let passed = 0;
    for (let i = 0; i < tests.length; i++) {
      try {
        const result = tests[i]();
        console.log(`${result ? '✅' : '❌'} Prueba ${i + 1}: ${result ? 'PASÓ' : 'FALLÓ'}`);
        if (result) passed++;
      } catch (error) {
        console.log(`❌ Prueba ${i + 1}: ERROR - ${error.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Resultados: ${passed}/${tests.length} pruebas pasaron`);
    console.log(passed === tests.length ? '🎉 ¡Todas las pruebas pasaron!' : '⚠️ Algunas pruebas fallaron');
  }

  /**
   * Generar plantilla personalizada
   */
  async generateCustomTemplate() {
    console.log('\n📝 Generando plantilla personalizada...\n');
    
    const template = `
# ${this.branding.KELLER_NICKNAME_ARTIST} - Plantilla de Proyecto

## Información del Artista
- **Nombre Artístico:** ${this.branding.KELLER_NICKNAME_ARTIST}
- **Alter Ego:** ${this.branding.KELLER_ALTER_EGO}  
- **Nombre Completo:** ${this.branding.KELLER_NAME}
- **Empresa:** ${this.branding.ENTERPRISE_KELLER}

## Contacto
- **Email:** ${this.branding.CONTACTO.KELLER_MAIL}
- **Teléfono:** ${this.branding.CONTACTO.KELLER_PHONE}
- **Website:** ${this.branding.CONTACTO.KELLER_WEBSITE}

## Branding Elements
### Hashtags
${this.branding.KELLER_HASHTAGS.map(tag => `- ${tag}`).join('\n')}

### Paleta de Colores
${this.branding.KELLER_PALLETS.map(color => `- ${color}`).join('\n')}

### Redes Sociales
${this.branding.KELLER_SOCIAL.map(social => `- ${social}`).join('\n')}

---
*Generado automáticamente por gk-cli-branding*
*by ${this.branding.ENTERPRISE_KELLER}*
    `;
    
    console.log('📄 Plantilla generada:\n');
    console.log(template);
  }

  /**
   * Loop principal del CLI
   */
  async run() {
    this.showBanner();
    
    while (true) {
      try {
        const choice = await this.showMainMenu();
        
        switch (choice) {
          case '1':
            await this.validateBranding();
            break;
          case '2':
            await this.generateReport();
            break;
          case '3':
            await this.generateCustomTemplate();
            break;
          case '4':
            this.showBrandingDetails();
            break;
          case '5':
            await this.runCoreJSTests();
            break;
          case '6':
            await this.runInteractiveDemo();
            break;
          case '0':
            console.log('\n👋 ¡Hasta luego! Gracias por usar gk-cli-branding');
            console.log(`   by ${this.branding.ENTERPRISE_KELLER}\n`);
            this.rl.close();
            return;
          default:
            console.log('\n❌ Opción no válida. Por favor selecciona 0-6.');
        }
        
        // Pausa antes del siguiente menú
        await new Promise(resolve => {
          console.log('\n⏸️  Presiona Enter para continuar...');
          this.rl.once('line', resolve);
        });
        
      } catch (error) {
        console.error('\n❌ Error:', error.message);
      }
    }
  }

  /**
   * Manejo de cierre limpio
   */
  close() {
    this.rl.close();
  }
}

// Manejo de señales del sistema
process.on('SIGINT', () => {
  console.log('\n\n👋 CLI interrumpido. ¡Hasta luego!');
  process.exit(0);
});

// Ejecutar CLI si es llamado directamente
if (require.main === module) {
  const cli = new SimpleCLI();
  cli.run().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = SimpleCLI;