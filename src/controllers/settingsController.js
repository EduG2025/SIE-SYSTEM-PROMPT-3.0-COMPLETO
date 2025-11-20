const { SystemSetting } = require('../models');

const SettingsController = {
    // --- Theme Logic ---
    getTheme: async (req, res) => {
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
    },

    saveTheme: async (req, res) => {
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
    },

    // --- Homepage Logic ---
    getHomepage: async (req, res) => {
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
    },

    saveHomepage: async (req, res) => {
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
    },

    // --- AI System Prompt Logic ---
    getAiSettings: async (req, res) => {
        try {
            const setting = await SystemSetting.findByPk('ai_system_prompt');
            const defaultPrompt = 'Você é um analista de inteligência estratégica governamental focado em integridade pública e compliance.';
            
            res.json({ 
                systemPrompt: setting ? setting.value.prompt : defaultPrompt 
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching AI settings', error: error.message });
        }
    },

    saveAiSettings: async (req, res) => {
        try {
            const { systemPrompt } = req.body;
            await SystemSetting.upsert({
                key: 'ai_system_prompt',
                value: { prompt: systemPrompt },
                description: 'Global AI Persona & Rules'
            });
            res.json({ success: true, message: 'Configurações de IA salvas' });
        } catch (error) {
            res.status(500).json({ message: 'Error saving AI settings', error: error.message });
        }
    }
};

module.exports = { SettingsController };