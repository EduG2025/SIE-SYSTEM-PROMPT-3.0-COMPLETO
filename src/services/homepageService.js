
const { SystemSetting, HomepageContent } = require('../models');

const defaultHomepageConfig = {
    active: true,
    theme: 'modern',
    title: 'S.I.E.',
    subtitle: 'Sistema de Investigação Estratégica',
    heroImageUrl: '',
    logoUrl: '',
    features: [],
    customColors: { background: '#000000', text: '#ffffff', primary: '#3B82F6' }
};

const HomepageService = {
    // Configurações Gerais (Ativo/Inativo, Cores, Títulos)
    getConfig: async () => {
        const setting = await SystemSetting.findByPk('homepage_config');
        return setting ? setting.value : defaultHomepageConfig;
    },

    saveConfig: async (config) => {
        return await SystemSetting.upsert({ 
            key: 'homepage_config', 
            value: config, 
            description: 'Configurações da Landing Page Pública'
        });
    },

    // Conteúdo Rico (Notícias, Blocos HTML)
    getContent: async () => {
        return await HomepageContent.findOne({ 
            where: { active: true },
            order: [['createdAt', 'DESC']] 
        });
    },

    updateContent: async (data) => {
        // Desativa conteúdo anterior e cria versão nova (histórico)
        await HomepageContent.update({ active: false }, { where: { active: true } });
        return await HomepageContent.create({ ...data, active: true });
    }
};

module.exports = HomepageService;
