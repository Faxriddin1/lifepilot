process.chdir('./frontend');
require('child_process').execSync('node node_modules/vite/bin/vite.js --port 3000', { stdio: 'inherit' });
