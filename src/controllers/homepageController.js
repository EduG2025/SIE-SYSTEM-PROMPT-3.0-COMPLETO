
const HomepageService = require('../services/homepageService');

const HomepageController = {
    getConfig: async (req, res) => {
        try {
            const config = await HomepageService.getConfig();
            res.json(config);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao carregar configurações da homepage', error: error.message });
        }
    },

    saveConfig: async (req, res) => {
        try {
            await HomepageService.saveConfig(req.body);
            res.json({ success: true, message: 'Homepage atualizada e publicada.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao salvar configurações', error: error.message });
        }
    },

    getContent: async (req, res) => {
        try {
            const content = await HomepageService.getContent();
            res.json(content || { title: '', body: '' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao carregar conteúdo dinâmico', error: error.message });
        }
    },

    updateContent: async (req, res) => {
        try {
            const content = await HomepageService.updateContent(req.body);
            res.json({ success: true, data: content });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar conteúdo', error: error.message });
        }
    }
};

module.exports = { HomepageController };
