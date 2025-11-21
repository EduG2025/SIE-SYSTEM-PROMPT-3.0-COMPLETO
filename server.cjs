require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { sequelize } = require('./src/models');
const schedulerService = require('./src/services/schedulerService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Limites para Uploads e JSON grandes
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos (uploads de imagem)
// Importante para o funcionamento do Theme Manager (Logo/Hero)
app.use('/media', express.static(path.join(__dirname, 'storage/uploads')));

// Rotas da API
app.use('/api', routes);

// Middleware de Erro Global
app.use(errorHandler);

const startServer = async () => {
    try {
        console.log('🚀 Inicializando S.I.E. Backend v3.1...');
        
        // 1. Conexão com Banco de Dados
        await sequelize.authenticate();
        console.log('✅ Banco de Dados conectado (MySQL).');
        
        // Sincroniza modelos (Alter: true para migrations automáticas leves)
        await sequelize.sync({ alter: true });

        // 2. Inicializar Scheduler (Automação de IA)
        await schedulerService.init();
        console.log('✅ Scheduler de Automação iniciado.');

        // 3. Iniciar Servidor HTTP
        app.listen(PORT, () => {
            console.log(`📡 Servidor rodando na porta ${PORT}`);
            console.log(`📂 Uploads servidos em /media`);
        });
    } catch (error) {
        console.error('❌ Falha crítica na inicialização:', error);
        process.exit(1);
    }
};

startServer();
