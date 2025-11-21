
const { SystemSetting } = require('../models');
const schedulerService = require('../services/schedulerService');

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

    // --- AI Settings ---
    getAiSettings: async (req, res) => {
        try {
            // Prompt Global
            const promptSetting = await SystemSetting.findByPk('ai_system_prompt');
            
            // Automation Settings
            const automationSetting = await SystemSetting.findByPk('ai_automation_settings');
            const defaultAutomation = { isEnabled: false, frequency: 'daily' };

            res.json({ 
                systemPrompt: promptSetting ? promptSetting.value.prompt : '',
                automation: automationSetting ? automationSetting.value : defaultAutomation
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching AI settings', error: error.message });
        }
    },

    saveAiSettings: async (req, res) => {
        try {
            const { systemPrompt } = req.body;
            if (systemPrompt) {
                await SystemSetting.upsert({
                    key: 'ai_system_prompt',
                    value: { prompt: systemPrompt },
                    description: 'Global AI Persona & Rules'
                });
            }
            res.json({ success: true, message: 'Configurações de IA salvas' });
        } catch (error) {
            res.status(500).json({ message: 'Error saving AI settings', error: error.message });
        }
    },

    // Salva configurações de automação e recarrega o CRON
    saveAutomationSettings: async (req, res) => {
        try {
            const settings = req.body;
            await SystemSetting.upsert({
                key: 'ai_automation_settings',
                value: settings,
                description: 'Cron Job Configuration'
            });
            
            // Notifica o serviço de agendamento para aplicar as novas regras
            await schedulerService.reload();

            res.json({ success: true, message: 'Automação configurada com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao salvar automação', error: error.message });
        }
    },

    // Trigger Manual da Tarefa de Automação
    runAutomationTask: async (req, res) => {
        try {
            const success = await schedulerService.runNow();
            if (success) {
                res.json({ success: true, message: 'Tarefa executada com sucesso.' });
            } else {
                res.status(500).json({ success: false, message: 'A tarefa falhou ao executar.' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro na execução manual', error: error.message });
        }
    }
};

module.exports = { SettingsController };
