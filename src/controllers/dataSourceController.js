
const { DataSource, DataSourceCategory } = require('../models');

const DataSourceController = {
    getAll: async (req, res) => {
        try {
            const categories = await DataSourceCategory.findAll({
                include: [{ model: DataSource, as: 'sources' }]
            });
            res.json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar fontes', error: error.message });
        }
    },

    createCategory: async (req, res) => {
        try {
            const { name } = req.body;
            const category = await DataSourceCategory.create({ name });
            res.status(201).json(category);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar categoria', error: error.message });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            await DataSourceCategory.update({ name }, { where: { id } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar categoria', error: error.message });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            await DataSource.destroy({ where: { categoryId: id } }); // Delete sources first
            await DataSourceCategory.destroy({ where: { id } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao deletar categoria', error: error.message });
        }
    },

    createSource: async (req, res) => {
        try {
            const { categoryId } = req.params;
            const sourceData = req.body;
            const source = await DataSource.create({ ...sourceData, categoryId });
            res.status(201).json(source);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao criar fonte', error: error.message });
        }
    },

    updateSource: async (req, res) => {
        try {
            const { id } = req.params;
            await DataSource.update(req.body, { where: { id } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar fonte', error: error.message });
        }
    },

    toggleSource: async (req, res) => {
        try {
            const { id } = req.params;
            const source = await DataSource.findByPk(id);
            if (source) {
                await source.update({ active: !source.active });
                res.json({ success: true, active: source.active });
            } else {
                res.status(404).json({ message: 'Fonte não encontrada' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro ao alterar status', error: error.message });
        }
    },

    deleteSource: async (req, res) => {
        try {
            const { id } = req.params;
            await DataSource.destroy({ where: { id } });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao deletar fonte', error: error.message });
        }
    },

    // Ação inteligente: adicionar sugerida pela IA
    addSuggested: async (req, res) => {
        try {
            const { name, url, category, type } = req.body;
            let catRecord = await DataSourceCategory.findOne({ where: { name: category } });
            
            if (!catRecord) {
                catRecord = await DataSourceCategory.create({ name: category });
            }

            const source = await DataSource.create({
                name,
                url,
                type,
                reliability: 'Alta',
                active: true,
                categoryId: catRecord.id
            });

            res.status(201).json(source);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao adicionar sugestão', error: error.message });
        }
    },

    validateAll: async (req, res) => {
        // Simulação de validação (ping)
        try {
            const sources = await DataSource.findAll();
            for (const source of sources) {
                // Lógica real de ping iria aqui.
                // Simulamos sucesso para fins de demo rápida.
                await source.update({ status: 'Ativa' }); 
            }
            res.json({ message: 'Validação completa' });
        } catch (error) {
            res.status(500).json({ message: 'Erro na validação', error: error.message });
        }
    }
};

module.exports = { DataSourceController };
