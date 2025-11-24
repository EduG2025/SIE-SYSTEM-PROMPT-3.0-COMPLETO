
const { SystemSetting } = require('../models');

const defaultTheme = {
    primary: '#0D1117',
    secondary: '#161B22',
    accent: '#30363D',
    text: '#E6EDF3',
    blue: '#3B82F6'
};

const ThemeService = {
    getTheme: async () => {
        const setting = await SystemSetting.findByPk('theme_config');
        return setting ? setting.value : defaultTheme;
    },

    saveTheme: async (config) => {
        return await SystemSetting.upsert({ 
            key: 'theme_config', 
            value: config, 
            description: 'Configuração Global do Tema Visual (S.I.E. 3.1)' 
        });
    }
};

module.exports = ThemeService;
