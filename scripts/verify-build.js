
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying PATCH Library Tauri Build Configuration...\n');

const checks = [
  {
    name: 'Node.js Dependencies',
    check: () => fs.existsSync('node_modules'),
    fix: 'Run: npm install'
  },
  {
    name: 'Dist Directory',
    check: () => fs.existsSync('dist') || fs.existsSync('build'),
    fix: 'Run: npm run build'
  },
  {
    name: 'Tauri Config',
    check: () => fs.existsSync('tauri-config/tauri.conf.json'),
    fix: 'Tauri config file missing'
  },
  {
    name: 'Service Worker',
    check: () => fs.existsSync('public/sw.js'),
    fix: 'Service worker missing'
  },
  {
    name: 'PWA Manifest',
    check: () => fs.existsSync('public/manifest.json'),
    fix: 'PWA manifest missing'
  },
  {
    name: 'Setup Scripts',
    check: () => fs.existsSync('scripts/tauri-setup.sh') && fs.existsSync('scripts/tauri-setup.bat'),
    fix: 'Setup scripts missing'
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  
  if (!passed) {
    console.log(`   → ${fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Ready for Tauri build.');
  console.log('\nNext steps:');
  console.log('1. Run setup script: scripts/tauri-setup.sh (or .bat on Windows)');
  console.log('2. Build React app: npm run build');
  console.log('3. Build Tauri app: cargo tauri build');
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above.');
}

console.log('\n📚 Full documentation: docs/Tauri_Desktop_Setup.md');
