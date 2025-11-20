const { AuditLog } = require('../models');

const LogController = {
    getLogs: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const logs = await AuditLog.findAll({
                limit,
                order: [['timestamp', 'DESC']]
            });
            res.json(logs);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar logs', error: error.message });
        }
    },

    createLog: async (req, res) => {
        try {
            const { level, message, user, metadata } = req.body;
            const newLog = await AuditLog.create({
                level: level || 'INFO',
                message,
                user: user || (req.user ? req.user.username : 'Anonymous'),
                metadata
            });
            res.status(201).json(newLog);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar log', error: error.message });
        }
    }
};

module.exports = { LogController };