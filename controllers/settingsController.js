const { SystemSetting } = require('../models');

// --- Theme Logic ---
exports.getTheme = async (req, res) => {
    try {
        const setting = await SystemSetting.findByPk('theme_config');
        const defaultTheme = {
            primary: '#0D1117',
            secondary: '#161B22',
            accent: '#30363D',
            text: '#E6EDF3',
            blue: '#3B82F6'
        };
        res.json(setting ? setting.value : defaultTheme);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching theme', error: error.message });
    }
};

exports.saveTheme = async (req, res) => {
    try {
        const config = req.body;
        await SystemSetting.upsert({ 
            key: 'theme_config', 
            value: config, 
            description: 'Global Theme Configuration' 
        });
        res.json({ success: true, message: 'Tema atualizado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving theme', error: error.message });
    }
};

// --- Homepage Logic ---
exports.getHomepage = async (req, res) => {
    try {
        const setting = await SystemSetting.findByPk('homepage_config');
        const defaultConfig = {
            active: true,
            title: 'Sistema de Investigação Estratégica',
            subtitle: 'Plataforma de Inteligência Governamental 3.0.3',
            heroImageUrl: '',
            logoUrl: ''
        };
        res.json(setting ? setting.value : defaultConfig);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching homepage config', error: error.message });
    }
};

exports.saveHomepage = async (req, res) => {
    try {
        const config = req.body;
        await SystemSetting.upsert({ 
            key: 'homepage_config', 
            value: config,
            description: 'Homepage Settings'
        });
        res.json({ success: true, message: 'Homepage atualizada com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving homepage', error: error.message });
    }
};