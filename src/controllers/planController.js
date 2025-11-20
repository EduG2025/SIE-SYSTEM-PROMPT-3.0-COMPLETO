const { Plan } = require('../models');

const PlanController = {
    getAllPlans: async (req, res) => {
        try {
            const plans = await Plan.findAll();
            res.json(plans);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar planos', error: error.message });
        }
    },

    getPlanById: async (req, res) => {
        try {
            const plan = await Plan.findByPk(req.params.id);
            if (!plan) return res.status(404).json({ message: 'Plano não encontrado' });
            res.json(plan);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar plano', error: error.message });
        }
    },

    createPlan: async (req, res) => {
        try {
            const { id, name, features, modules, requestLimit, price } = req.body;
            
            const existing = await Plan.findByPk(id);
            if (existing) return res.status(400).json({ message: 'ID do plano já existe' });

            const newPlan = await Plan.create({
                id,
                name,
                features: features || [],
                modules: modules || [],
                requestLimit: requestLimit !== undefined ? requestLimit : 100,
                price: price || 0
            });

            res.status(201).json(newPlan);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar plano', error: error.message });
        }
    },

    updatePlan: async (req, res) => {
        try {
            const plan = await Plan.findByPk(req.params.id);
            if (!plan) return res.status(404).json({ message: 'Plano não encontrado' });

            await plan.update(req.body);
            res.json(plan);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar plano', error: error.message });
        }
    },

    deletePlan: async (req, res) => {
        try {
            const plan = await Plan.findByPk(req.params.id);
            if (!plan) return res.status(404).json({ message: 'Plano não encontrado' });

            await plan.destroy();
            res.json({ message: 'Plano removido com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao remover plano', error: error.message });
        }
    }
};

module.exports = { PlanController };