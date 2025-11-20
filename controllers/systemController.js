const versionConfig = require('../config/version');
const { SystemSetting } = require('../models');

exports.getVersion = (req, res) => {
    res.json(versionConfig);
};

exports.getStatus = async (req, res) => {
    try {
        // Basic DB check
        await SystemSetting.findOne(); 
        res.json({
            system: 'S.I.E.',
            status: 'operational',
            version: versionConfig.version,
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            system: 'S.I.E.',
            status: 'degraded',
            database: 'error',
            error: error.message
        });
    }
};