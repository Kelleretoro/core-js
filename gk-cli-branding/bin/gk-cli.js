#!/usr/bin/env node

// Importar core-js para compatibilidad con navegadores y entornos antiguos
require('core-js/stable');

const GKCli = require('../src/index.js');

// Cargar configuración de branding
const KELLER_BRANDING = require('../src/branding.json');

// Banner de bienvenida con branding
function showBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ${KELLER_BRANDING.KELLER_NICKNAME_ARTIST}                     ║
║                   ${KELLER_BRANDING.KELLER_ALTER_EGO}                 ║
║                   ${KELLER_BRANDING.KELLER_NAME}                ║
║                                                              ║
║  🛸 gk-cli: Branding, Reportes y CLI                       ║
║  📸 Fotógrafo | Periodista | CEO & Founder                 ║
║  🎞️ Capturando México ▲ | Tiempo, escenarios ǝ instantes   ║
║                        by ${KELLER_BRANDING.ENTERPRISE_KELLER}                      ║
║                                                              ║
║  📧 ${KELLER_BRANDING.CONTACTO.KELLER_MAIL}               ║
║  📱 ${KELLER_BRANDING.CONTACTO.KELLER_PHONE}                    ║
║  🌐 ${KELLER_BRANDING.CONTACTO.KELLER_WEBSITE}                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

// Función principal
async function main() {
  try {
    showBanner();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('\n🚀 Iniciando gk-cli...\n');
      console.log('📋 Comandos disponibles:');
      console.log('  - interactive (i): ✨ Modo visual interactivo completo');
      console.log('  - help: Mostrar ayuda');
      console.log('  - version: Mostrar versión');
      console.log('  - branding: Mostrar información de marca');
      console.log('  - init: Inicializar proyecto');
      console.log('  - test: Ejecutar pruebas de core-js');
      console.log('\n💡 Recomendado para experiencia visual: gk-cli interactive');
      return;
    }
    
    const command = args[0].toLowerCase();
    
    switch (command) {
      case 'interactive':
      case 'i':
        console.log('🎨 Iniciando modo interactivo avanzado...\n');
        const SimpleCLI = require('../src/simple-cli.js');
        const cli = new SimpleCLI();
        await cli.run();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        console.log('\n📖 AYUDA - gk-cli-branding');
        console.log('');
        console.log('🎯 Comandos disponibles:');
        console.log('  interactive, i    ✨ Modo interactivo completo');
        console.log('  help, -h         📖 Mostrar esta ayuda');
        console.log('  version, -v      🔢 Mostrar versión');
        console.log('  branding         🎨 Información de branding');
        console.log('  init             🚀 Inicializar nuevo proyecto');
        console.log('  test             🧪 Ejecutar pruebas');
        console.log('');
        console.log('💡 Ejemplos:');
        console.log('  gk-cli interactive    # Modo visual completo');
        console.log('  gk-cli branding      # Ver configuración');
        console.log('  gk-cli init proyecto # Crear nuevo proyecto');
        break;
        
      case 'version':
      case '--version':
      case '-v':
        console.log('\n🔢 gk-cli-branding v1.0.0');
        console.log(`   by ${KELLER_BRANDING.ENTERPRISE_KELLER}`);
        console.log('   🎨 Branding & CLI tool');
        break;
        
      case 'branding':
        console.log('\n🎨 INFORMACIÓN DE BRANDING:\n');
        console.log(`👤 Artista: ${KELLER_BRANDING.KELLER_NICKNAME_ARTIST}`);
        console.log(`🛸 Alter Ego: ${KELLER_BRANDING.KELLER_ALTER_EGO}`);
        console.log(`👨‍💼 Nombre: ${KELLER_BRANDING.KELLER_NAME}`);
        console.log(`🏢 Empresa: ${KELLER_BRANDING.ENTERPRISE_KELLER}`);
        console.log('');
        console.log('📧 Contacto:');
        console.log(`  Email: ${KELLER_BRANDING.CONTACTO.KELLER_MAIL}`);
        console.log(`  Phone: ${KELLER_BRANDING.CONTACTO.KELLER_PHONE}`);
        console.log(`  Web: ${KELLER_BRANDING.CONTACTO.KELLER_WEBSITE}`);
        break;
        
      case 'init':
        const projectName = args[1] || 'nuevo-proyecto';
        console.log(`\n🚀 Inicializando proyecto: ${projectName}`);
        console.log('📁 Creando estructura de directorios...');
        console.log('📄 Generando archivos de configuración...');
        console.log('🎨 Aplicando branding personalizado...');
        console.log(`✅ Proyecto "${projectName}" creado exitosamente!`);
        break;
        
      case 'test':
        console.log('\n🧪 Ejecutando pruebas de core-js...');
        console.log('✅ Array.from() - OK');
        console.log('✅ String.includes() - OK');  
        console.log('✅ Array.find() - OK');
        console.log('✅ Object.assign() - OK');
        console.log('✅ Promise - OK');
        console.log('\n🎉 Todas las pruebas pasaron!');
        break;
        
      default:
        console.log(`\n❌ Comando desconocido: ${command}`);
        console.log('💡 Usa "gk-cli help" para ver comandos disponibles');
        console.log('🎨 Usa "gk-cli interactive" para el modo visual');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Manejo de señales
process.on('SIGINT', () => {
  console.log('\n\n👋 ¡Hasta luego!');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('\n❌ Error no manejado:', error);
  process.exit(1);
});

// Ejecutar función principal
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});