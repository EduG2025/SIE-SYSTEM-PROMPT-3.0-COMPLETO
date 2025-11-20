const backupService = require('../services/backupService');
const { sequelize } = require('../models');

const DataController = {
    downloadSqlBackup: async (req, res) => {
        try {
            const sql = await backupService.generateMysqlDump();
            res.setHeader('Content-Disposition', `attachment; filename="sie_backup_${Date.now()}.sql"`);
            res.setHeader('Content-Type', 'text/sql');
            res.send(sql);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao gerar backup SQL', error: error.message });
        }
    },

    downloadJsonBackup: async (req, res) => {
        try {
            const json = await backupService.generateJsonDump();
            res.setHeader('Content-Disposition', `attachment; filename="sie_backup_${Date.now()}.json"`);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(json, null, 2));
        } catch (error) {
            res.status(500).json({ message: 'Erro ao gerar backup JSON', error: error.message });
        }
    },

    resetDatabase: async (req, res) => {
        try {
            if (req.user.role !== 'admin') return res.status(403).json({ message: 'Sem permissão.' });
            
            await sequelize.sync({ force: true });
            
            res.json({ message: 'Banco de dados resetado com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro fatal ao resetar banco', error: error.message });
        }
    }
};

module.exports = { DataController };