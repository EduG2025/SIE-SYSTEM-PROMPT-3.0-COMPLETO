const { Politician, Company, Employee, Contract, Lawsuit, SocialPost, TimelineEvent } = require('../models');
const BackendAiService = require('../services/backendAiService');

const getModel = (type) => {
    switch (type) {
        case 'politicians': return Politician;
        case 'companies': return Company;
        case 'employees': return Employee;
        case 'contracts': return Contract;
        case 'judicial': return Lawsuit;
        case 'social': return SocialPost;
        case 'timeline': return TimelineEvent;
        default: return null;
    }
};

const DomainController = {
    getAll: async (req, res) => {
        try {
            const Model = getModel(req.params.type);
            if (!Model) return res.status(400).json({ message: 'Invalid domain type' });

            const items = await Model.findAll();
            res.json(items);
        } catch (error) {
            res.status(500).json({ message: `Error fetching ${req.params.type}`, error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const Model = getModel(req.params.type);
            if (!Model) return res.status(400).json({ message: 'Invalid domain type' });

            const item = await Model.findByPk(req.params.id);
            if (!item) return res.status(404).json({ message: 'Item not found' });

            res.json(item);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching item', error: error.message });
        }
    },

    upsert: async (req, res) => {
        try {
            const Model = getModel(req.params.type);
            if (!Model) return res.status(400).json({ message: 'Invalid domain type' });

            const data = req.body;
            if (Array.isArray(data)) {
                const results = [];
                for (const item of data) {
                    if (item.id && typeof item.id !== 'number') { 
                        const [record] = await Model.upsert(item);
                        results.push(record);
                    } else {
                        const record = await Model.create(item);
                        results.push(record);
                    }
                }
                return res.json({ success: true, count: results.length });
            }

            if (data.id) {
                const [record] = await Model.upsert(data);
                return res.json(record);
            } else {
                const record = await Model.create(data);
                return res.json(record);
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error saving data', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const Model = getModel(req.params.type);
            if (!Model) return res.status(400).json({ message: 'Invalid domain type' });

            await Model.destroy({ where: { id: req.params.id } });
            res.json({ message: 'Item deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting item', error: error.message });
        }
    },

    // Nova função para acionar varredura de IA
    scan: async (req, res) => {
        try {
            const { type } = req.params;
            const { municipality } = req.body;

            if (!municipality) return res.status(400).json({ message: 'Município é obrigatório para varredura.' });

            let count = 0;
            if (type === 'politicians') {
                count = await BackendAiService.scanPoliticians(municipality);
            } else if (type === 'employees') {
                count = await BackendAiService.scanEmployees(municipality);
            } else {
                return res.status(400).json({ message: 'Tipo de varredura não suportado pela IA neste endpoint.' });
            }

            res.json({ success: true, count, message: `Varredura concluída. ${count} registros encontrados.` });
        } catch (error) {
            console.error("Scan Failed:", error);
            res.status(500).json({ message: 'Erro durante a varredura da IA', error: error.message });
        }
    }
};

module.exports = { DomainController };