
const versionConfig = require('../config/version');
const { sequelize, User, Module, AuditLog } = require('../models');
const os = require('os');

const SystemController = {
  version: (req, res) => {
    res.json({ 
        system: 'S.I.E.',
        version: versionConfig.VERSION,
        build: versionConfig.BUILD,
        environment: process.env.NODE_ENV || 'development'
    });
  },

  status: async (req, res) => {
      const startTime = Date.now();
      try {
          // Health Check do Banco de Dados
          await sequelize.authenticate();
          
          res.json({ 
              status: 'online', 
              database: 'connected',
              latency: `${Date.now() - startTime}ms`,
              timestamp: new Date().toISOString()
          });
      } catch (error) {
          res.status(503).json({ 
              status: 'degraded', 
              database: 'disconnected', 
              error: error.message,
              timestamp: new Date().toISOString()
          });
      }
  }
};

module.exports = { SystemController };
