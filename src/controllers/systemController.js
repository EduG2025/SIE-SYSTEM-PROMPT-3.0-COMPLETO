
const versionConfig = require('../config/version');
const { SystemSetting, User, Module, AuditLog, sequelize } = require('../models');
const os = require('os');

const SystemController = {
  version: async (req, res) => {
    try {
      let currentVersion = versionConfig.VERSION || '3.0.3';
      try {
          const setting = await SystemSetting.findByPk('version');
          if (setting && setting.value && setting.value.version) {
              currentVersion = setting.value.version;
          }
      } catch (e) {
          // Se a tabela não existir, usa o config
      }
      res.json({ version: currentVersion });
    } catch (err) { 
        res.status(500).json({ error: true, message: err.message }); 
    }
  },

  status: async (req, res) => {
      try {
          await sequelize.authenticate();
          
          res.json({ 
              status: 'online', 
              database: 'connected',
              version: '3.0.3',
              timestamp: new Date() 
          });
      } catch (error) {
          res.status(500).json({ 
              status: 'degraded', 
              database: 'disconnected', 
              error: error.message,
              version: '3.0.3'
          });
      }
  },

  // NOVO: Dashboard Stats e Monitoramento de Recursos
  getDashboardStats: async (req, res) => {
      try {
          // 1. Recursos do Servidor (Node.js OS Module)
          const freeMem = os.freemem();
          const totalMem = os.totalmem();
          const memUsage = ((totalMem - freeMem) / totalMem) * 100;
          const loadAvg = os.loadavg()[0]; // Carga média de 1 minuto
          const uptime = os.uptime();

          // 2. Dados do Banco de Dados
          const [usersCount, modulesCount, activeModulesCount, logsCount] = await Promise.all([
              User.count(),
              Module.count(),
              Module.count({ where: { active: true } }),
              AuditLog.count()
          ]);

          // Simulação de sessões ativas (baseada em logs recentes ou tabela de sessões se existisse)
          // Em uma implementação real com Redis, isso seria exato.
          const activeSessionsEstimate = await AuditLog.count({
            where: {
                createdAt: {
                    [require('sequelize').Op.gte]: new Date(Date.now() - 15 * 60 * 1000) // Últimos 15 min
                }
            }
          });

          res.json({
              server: {
                  cpuLoad: loadAvg,
                  memoryUsage: parseFloat(memUsage.toFixed(2)),
                  totalMemoryGB: (totalMem / 1024 ** 3).toFixed(2),
                  uptimeSeconds: uptime,
                  platform: os.platform()
              },
              system: {
                  usersTotal: usersCount,
                  usersActive: activeSessionsEstimate, // Estimativa
                  modulesTotal: modulesCount,
                  modulesActive: activeModulesCount,
                  logsTotal: logsCount,
                  version: '3.0.3',
                  lastDeploy: new Date().toISOString() // Em prod, ler de um arquivo de build
              }
          });
      } catch (error) {
          console.error('Dashboard Stats Error:', error);
          res.status(500).json({ message: 'Erro ao coletar estatísticas', error: error.message });
      }
  }
};

module.exports = { SystemController };
