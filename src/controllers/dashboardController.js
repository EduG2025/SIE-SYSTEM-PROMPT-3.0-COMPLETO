const { DashboardData } = require('../models');

const DashboardController = {
    getDashboardData: async (req, res) => {
        try {
            const { municipality } = req.params;
            const record = await DashboardData.findByPk(municipality);
            
            if (!record) {
                return res.status(404).json({ message: 'Dados não encontrados para este município' });
            }
            
            res.json(record.data);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar dados do dashboard', error: error.message });
        }
    },

    saveDashboardData: async (req, res) => {
        try {
            const { municipality } = req.params;
            const data = req.body; 

            await DashboardData.upsert({
                municipality,
                data,
                last_updated: new Date()
            });

            res.json({ success: true, message: 'Dados do dashboard salvos com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao salvar dados do dashboard', error: error.message });
        }
    }
};

module.exports = { DashboardController };