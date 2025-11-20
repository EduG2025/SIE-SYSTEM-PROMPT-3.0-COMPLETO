const { ApiKey } = require('../models');

const ApiKeyController = {
    getAllKeys: async (req, res) => {
        try {
            const keys = await ApiKey.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.json(keys);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar chaves', error: error.message });
        }
    },

    addKey: async (req, res) => {
        try {
            const { key, type } = req.body;
            
            if (!key || !key.startsWith('AIza')) {
                return res.status(400).json({ message: 'Formato de chave inválido (deve começar com AIza)' });
            }

            const newKey = await ApiKey.create({
                key,
                type: type || 'System',
                status: 'Ativa',
                ownerId: req.user ? req.user.id : null
            });

            res.status(201).json(newKey);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao adicionar chave', error: error.message });
        }
    },

    toggleStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const key = await ApiKey.findByPk(id);
            
            if (!key) return res.status(404).json({ message: 'Chave não encontrada' });

            key.status = key.status === 'Ativa' ? 'Inativa' : 'Ativa';
            await key.save();

            res.json(key);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar status', error: error.message });
        }
    },

    deleteKey: async (req, res) => {
        try {
            const { id } = req.params;
            await ApiKey.destroy({ where: { id } });
            res.json({ message: 'Chave removida com sucesso' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao remover chave', error: error.message });
        }
    }
};

module.exports = { ApiKeyController };