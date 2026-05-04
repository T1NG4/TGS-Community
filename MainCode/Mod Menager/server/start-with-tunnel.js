const { spawn } = require('child_process');
const http = require('http');

// Iniciar servidor
console.log('Iniciando servidor TGS...');
const server = spawn('node', ['app.js'], {
    stdio: 'inherit',
    shell: true
});

// Esperar um pouco e iniciar localtunnel
setTimeout(() => {
    console.log('\nIniciando localtunnel para webhooks...');
    const tunnel = spawn('npx', ['localtunnel', '--port', '3001', '--subdomain', 'tgs-payments'], {
        stdio: 'inherit',
        shell: true
    });
    
    tunnel.on('close', (code) => {
        console.log(`Localtunnel encerrado com código ${code}`);
        server.kill();
    });
}, 3000);

server.on('close', (code) => {
    console.log(`Servidor encerrado com código ${code}`);
    process.exit(code);
});
