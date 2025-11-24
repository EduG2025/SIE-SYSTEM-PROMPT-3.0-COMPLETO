const { 
    sequelize, User, Plan, Module, ApiKey, SystemSetting, 
    Politician, Employee, Company, Contract, Lawsuit, 
    SocialPost, TimelineEvent, DashboardData 
} = require('../models');

const StateController = {
    // GET /api/state - Retorna todo o banco de dados como um JSON único (formato Frontend)
    getState: async (req, res) => {
        try {
            // Busca paralela de todas as tabelas
            const [
                users, plans, modules, apiKeys, dbConfigList, 
                politicians, employees, companies, contracts, 
                lawsuits, socialPosts, timelineEvents, dashboardDataList
            ] = await Promise.all([
                User.findAll({ attributes: { exclude: ['password'] } }), // Segurança: Não envia hash de senha
                Plan.findAll(),
                Module.findAll(),
                ApiKey.findAll(),
                SystemSetting.findAll(), 
                Politician.findAll(),
                Employee.findAll(),
                Company.findAll(),
                Contract.findAll(),
                Lawsuit.findAll(),
                SocialPost.findAll(),
                TimelineEvent.findAll(),
                DashboardData.findAll()
            ]);

            // Transforma lista de DashboardData em Objeto { "Municipality": Data }
            const dashboardDataObj = {};
            dashboardDataList.forEach(d => {
                dashboardDataObj[d.municipality] = d.data;
            });

            // Reconstrói configurações a partir da tabela key-value SystemSetting
            const themeConfig = dbConfigList.find(s => s.key === 'theme_config')?.value;
            const homepageConfig = dbConfigList.find(s => s.key === 'homepage_config')?.value;
            const systemPrompt = dbConfigList.find(s => s.key === 'ai_system_prompt')?.value?.prompt;
            const aiAutomationSettings = dbConfigList.find(s => s.key === 'ai_automation_settings')?.value;

            // Monta o objeto gigante esperado pelo dbService.ts no frontend
            const fullState = {
                users,
                plans,
                modules,
                apiKeys,
                politicians,
                employees,
                companies,
                contracts,
                lawsuits,
                socialPosts,
                timelineEvents,
                dashboardData: dashboardDataObj,
                themeConfig,
                homepageConfig,
                systemPrompt,
                aiAutomationSettings,
                // Injeta config de conexão para confirmar status
                dbConfig: { status: 'Conectado', apiUrl: '/api', apiToken: '***' }
            };

            res.json(fullState);
        } catch (error) {
            console.error("Get State Error:", error);
            res.status(500).json({ message: 'Erro ao sincronizar estado', error: error.message });
        }
    },

    saveState: async (req, res) => {
        res.json({ 
            success: true, 
            message: 'Sincronização recebida. Para persistência, use as rotas específicas de domínio (/api/domain/*).' 
        });
    }
};

module.exports = { StateController };