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
const IS_PROD = process.env.NODE_ENV === 'production';

// ==========================================
// 1. Security & Performance Middlewares
// ==========================================

app.use(compression());

app.use(cors({
    origin: IS_PROD ? '*' : '*', // Configure specific domains in strict production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-sync-token'],
    credentials: true
}));

app.use(helmet({
    contentSecurityPolicy: false, // Required for Inline Scripts in some React setups
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow serving media
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// 2. Static Files
// ==========================================

const storagePath = path.join(__dirname, 'storage', 'uploads');
if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
}

app.use('/media', express.static(storagePath, {
    maxAge: '1d',
    immutable: true
}));

app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1h'
}));

// ==========================================
// 3. API Routes
// ==========================================

app.use('/api/state', stateRoutes);
app.use('/api', routes);

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
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ message: 'API Endpoint not found.' });
    }
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('S.I.E. Frontend not built. Run "npm run build".');
    }
});

app.use(errorHandler);

// ==========================================
// 5. Server Initialization & Graceful Shutdown
// ==========================================

let server;

const startServer = async () => {
    try {
        console.log(`\n🚀 S.I.E. v${process.env.npm_package_version || '3.1.0'} Initializing...`);

        // 1. Database Connection
        await sequelize.authenticate();
        console.log('✅ MySQL: Connected.');
        
        // 2. Schema Sync (Non-destructive)
        await sequelize.sync({ alter: true });
        console.log('✅ Sequelize: Schema Synced.');

        // 3. Scheduler
        await schedulerService.init().catch(err => console.error('⚠️ Scheduler Warning:', err.message));

        // 4. Start Listener
        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n📡 Listening on port: ${PORT}`);
            console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
        });

    } catch (error) {
        console.error('\n❌ FATAL STARTUP ERROR:', error);
        process.exit(1);
    }
};

// Graceful Shutdown Logic
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