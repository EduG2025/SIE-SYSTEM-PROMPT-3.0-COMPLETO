/**
 * S.I.E. 3.1.0 - Server Entry Point
 * 
 * Este arquivo configura o servidor Express, conecta ao MySQL via Sequelize,
 * inicializa os agendamentos de IA e serve os arquivos estáticos do Frontend.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');

// Importação de Modelos e Configurações
const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const schedulerService = require('./src/services/schedulerService');
const { errorHandler } = require('./src/middleware/errorHandler');

// Configuração do App
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. Middlewares de Segurança e Utilidade
// ==========================================

// Habilita compressão Gzip (melhora performance em redes lentas)
app.use(compression());

// Configuração de CORS (Cross-Origin Resource Sharing)
app.use(cors({
    origin: '*', // Em produção restrita, substitua pelo domínio da VPS
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-sync-token']
}));

// Segurança de Headers HTTP (Helmet)
// Nota: contentSecurityPolicy desabilitado para permitir scripts inline do React/Vite se necessário
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Parser de JSON e URL-Encoded (Aumentado para suportar uploads base64 grandes se necessário)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// 2. Configuração de Diretórios Estáticos
// ==========================================

// Garante que a pasta de uploads existe
const storagePath = path.join(__dirname, 'storage', 'uploads');
if (!fs.existsSync(storagePath)) {
    console.log('📁 Criando diretório de uploads: storage/uploads');
    fs.mkdirSync(storagePath, { recursive: true });
}

// Serve arquivos de mídia (uploads) na rota /media
app.use('/media', express.static(storagePath));

// Serve os arquivos do Frontend React compilado (pasta dist)
app.use(express.static(path.join(__dirname, 'dist')));

// ==========================================
// 3. Rotas da API
// ==========================================

// Todas as rotas da API começam com /api
app.use('/api', routes);

// Rota de Health Check simples para o Nginx/LoadBalancer
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==========================================
// 4. Fallback SPA (Single Page Application)
// ==========================================

// Qualquer requisição que NÃO seja /api e NÃO seja arquivo estático
// retorna o index.html do React. Isso permite que o React Router funcione.
app.get('*', (req, res) => {
    // Verifica se é uma requisição de API mal formada para não retornar HTML nela
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ message: 'Endpoint da API não encontrado.' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

// ==========================================
// 5. Inicialização do Servidor
// ==========================================

const startServer = async () => {
    try {
        console.log('\n==================================================');
        console.log(`🚀 S.I.E. v${process.env.npm_package_version || '3.1.0'} - Inicializando...`);
        console.log('==================================================');

        // 1. Conexão com Banco de Dados
        await sequelize.authenticate();
        console.log('✅ MySQL: Conectado com sucesso.');

        // 2. Sincronização de Tabelas (Migrations Automáticas)
        // alter: true atualiza colunas sem perder dados.
        await sequelize.sync({ alter: true });
        console.log('✅ Sequelize: Models sincronizados.');

        // 3. Inicialização do Agendador (Cron Jobs para IA)
        await schedulerService.init();
        console.log('✅ Scheduler: Serviço de automação iniciado.');

        // 4. Iniciar Listener HTTP
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n📡 Servidor rodando na porta: ${PORT}`);
            console.log(`👉 Frontend: http://localhost:${PORT}`);
            console.log(`👉 API Base: http://localhost:${PORT}/api`);
            console.log(`👉 Uploads:  http://localhost:${PORT}/media`);
            console.log('==================================================\n');
        });

    } catch (error) {
        console.error('\n❌ ERRO FATAL NA INICIALIZAÇÃO:');
        console.error(error);
        console.error('\nVerifique suas credenciais no arquivo .env e se o MySQL está rodando.');
        process.exit(1); // Encerra com erro para o PM2 reiniciar
    }
};

startServer();
lightbulb_tips
Suggestions
