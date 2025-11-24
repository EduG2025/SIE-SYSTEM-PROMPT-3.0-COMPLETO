
const ThemeService = require('../services/themeService');

const ThemeController = {
    getTheme: async (req, res) => {
        try {
            const theme = await ThemeService.getTheme();
            res.json(theme);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar tema', error: error.message });
        }
    },

    saveTheme: async (req, res) => {
        try {
            const config = req.body;
            await ThemeService.saveTheme(config);
            res.json({ success: true, message: 'Tema visual atualizado com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao salvar tema', error: error.message });
        }
    }
};

module.exports = { ThemeController };
