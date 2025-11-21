#!/bin/bash

echo "🛡️  Iniciando Configuração Blindada S.I.E. (v3.1.2)..."

# 1. Instalar Dependências de Sistema e Node.js
echo "📦 Verificando dependências..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Instala pacotes locais necessários para o backend
npm install express cors body-parser mysql2 dotenv js-yaml node-cron sequelize bcryptjs jsonwebtoken multer uuid morgan compression @google/genai

# 2. Configurar Variáveis de Ambiente (.env) se não existir
if [ ! -f .env ]; then
    echo "🔑 Configurando credenciais..."
    cat << 'EOF' > .env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=sie301
DB_PASSWORD=Gegerminal180!
DB_NAME=sie301
PORT=3000
JWT_SECRET=sie_secure_secret_2025
STORAGE_PATH=storage
EOF
fi

# 3. Criar Estrutura de Diretórios
echo "📂 Criando diretórios de armazenamento..."
mkdir -p storage/uploads/system
mkdir -p src/models
mkdir -p src/controllers
mkdir -p src/routes
mkdir -p src/middleware
mkdir -p src/services
mkdir -p src/config

# 4. Criar Servidor Backend (server.cjs)
# Usamos 'EOF' para evitar que o bash tente interpretar variáveis dentro do arquivo JS
echo "🚀 Recriando servidor backend (server.cjs)..."
cat << 'EOF' > server.cjs
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const schedulerService = require('./src/services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3000;
const SNAPSHOTS_DIR = path.join(__dirname, 'storage', 'snapshots');

// Garante diretórios
if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// Configurações
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos (uploads)
app.use('/media', express.static(path.join(__dirname, 'storage/uploads')));

// Rotas da API
app.use('/api', routes);

// Rotas de Diagnóstico (Auto-Updater)
app.get('/api/diagnostics', async (req, res) => {
    try {
        let dbStatus = 'ok';
        try {
            await sequelize.authenticate();
        } catch (e) {
            dbStatus = 'error';
        }

        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const memUsage = ((totalMem - freeMem) / totalMem) * 100;
        const loadAvg = os.loadavg()[0];

        const criticalFiles = ['package.json', 'server.cjs', 'deploy.sh'];
        const filesStatus = criticalFiles.reduce((acc, file) => {
            acc[file] = fs.existsSync(path.join(__dirname, file)) ? 'exists' : 'missing';
            return acc;
        }, {});

        res.json({
            status: 'online',
            timestamp: new Date().toISOString(),
            system: {
                uptime: process.uptime(),
                memoryUsagePercent: memUsage.toFixed(2),
                loadAverage: loadAvg,
                platform: os.platform(),
                arch: os.arch()
            },
            database: dbStatus,
            files: filesStatus
        });

    } catch (error) {
        res.status(500).json({ error: 'Falha diagnóstica.', details: error.message });
    }
});

// Salvar Snapshot de Atualização
app.post('/api/snapshots', async (req, res) => {
    try {
        const { filename, content } = req.body;
        if (!filename || !content) return res.status(400).json({ error: 'Dados incompletos.' });

        const safeName = path.basename(filename);
        const filePath = path.join(SNAPSHOTS_DIR, safeName);

        fs.writeFileSync(filePath, typeof content === 'object' ? JSON.stringify(content, null, 2) : content);
        res.json({ success: true, path: filePath });
    } catch (e) {
        res.status(500).json({ error: 'Erro ao salvar snapshot.', details: e.message });
    }
});

// Middleware de Erro
app.use(errorHandler);

// Inicialização
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected.');
        
        // Sync models (alter: true updates schema without data loss)
        await sequelize.sync({ alter: true });
        
        // Init Automation
        await schedulerService.init();
        console.log('✅ Scheduler initialized.');

        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error);
    }
};

startServer();
EOF

# 5. Configurar Permissões de Execução
chmod +x deploy.sh
chmod +x setup.sh

# 6. Gerenciamento de Processo (PM2)
echo "🔄 Reiniciando processo PM2..."
pm2 delete sie-backend 2>/dev/null || true
# Inicia apontando explicitamente para o arquivo CommonJS (.cjs)
pm2 start server.cjs --name "sie-backend" --watch --ignore-watch="node_modules dist .git storage"

# 7. Salvar lista de processos para reboot
pm2 save
# Tenta configurar startup (pode falhar se não for root, mas o pm2 save ajuda)
pm2 startup | grep "sudo" | bash 2>/dev/null

echo ""
echo "✅ SETUP CONCLUÍDO COM SUCESSO!"
echo "Backend rodando na porta 3000 e conectado ao MySQL."
