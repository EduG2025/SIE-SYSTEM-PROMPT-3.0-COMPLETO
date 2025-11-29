/**
 * S.I.E. 3.1.0 - Server Entry Point
 * Optimized for Production: Graceful Shutdown, Error Handling, and Security.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');

// Import Models and Services
const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const stateRoutes = require('./src/routes/stateRoutes');
const schedulerService = require('./src/services/schedulerService');
const { errorHandler } = require('./src/middleware/errorHandler');

// App Configuration
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. Security & Performance Middlewares
// ==========================================

app.use(compression());

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-sync-token'],
    credentials: true
}));

// Content Security Policy desabilitada para permitir scripts inline do Vite/React em desenvolvimento
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// 2. Static Files (Storage & Frontend)
// ==========================================

const storagePath = path.join(__dirname, 'storage', 'uploads');
if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
    console.log('📁 Storage directory created:', storagePath);
}

// Serve uploads
app.use('/media', express.static(storagePath, {
    maxAge: '1d',
    immutable: true
}));

// Serve frontend build
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1h'
}));

// ==========================================
// 3. API Routes
// ==========================================

app.use('/api/state', stateRoutes);
app.use('/api', routes);

// Health Check - Endpoint leve para monitoramento
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ==========================================
// 4. SPA Fallback & Error Handling
// ==========================================

app.get('*', (req, res) => {
    // Se for uma chamada de API não encontrada, retorna 404 JSON
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ message: 'API Endpoint not found.' });
    }
    
    // Fallback para React Router (index.html)
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        if (process.env.NODE_ENV === 'production') {
            res.status(404).send('S.I.E. Frontend not found. Run "npm run build".');
        } else {
            res.status(200).send('S.I.E. Backend Running. Frontend handled by Vite in Dev mode.');
        }
    }
});

app.use(errorHandler);

// ==========================================
// 5. Server Initialization
// ==========================================

let server;

const startServer = async () => {
    try {
        console.log(`\n🚀 S.I.E. v${process.env.npm_package_version || '3.1.0'} Initializing...`);

        // 1. Conexão com Banco de Dados (Non-blocking para o servidor HTTP)
        sequelize.authenticate()
            .then(() => {
                console.log('✅ MySQL: Connected.');
                // Sync não destrutivo (alter: true)
                return sequelize.sync({ alter: true });
            })
            .then(() => {
                console.log('✅ Sequelize: Schema Synced.');
                // Inicializa Agendador apenas se o banco estiver ok
                return schedulerService.init();
            })
            .catch(err => {
                console.error('⚠️ Database/Scheduler Warning:', err.message);
                console.log('⚠️ Server starting in degraded mode (Database offline).');
            });

        // 2. Sobe o Servidor HTTP imediatamente
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n📡 Listening on port: ${PORT}`);
            console.log(`   Frontend: http://localhost:${PORT}`);
            console.log(`   API: http://localhost:${PORT}/api`);
        });

    } catch (error) {
        console.error('\n❌ FATAL STARTUP ERROR:', error);
        process.exit(1);
    }
};

// Graceful Shutdown
const shutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    
    if (server) {
        server.close(() => {
            console.log('   HTTP Server closed.');
        });
    }

    try {
        await sequelize.close();
        console.log('   Database connection closed.');
        process.exit(0);
    } catch (err) {
        console.error('   Error during shutdown:', err);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();