const moduleService = require('../services/moduleService');

exports.getModules = async (req, res) => {
    try {
        const modules = await moduleService.getAll();
        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar módulos', error: error.message });
    }
};

exports.updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await moduleService.update(id, req.body);
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao atualizar módulo', error: error.message });
    }
};

exports.createModule = async (req, res) => {
    try {
        const created = await moduleService.create(req.body);
        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar módulo', error: error.message });
    }
};

exports.deleteModule = async (req, res) => {
    try {
        await moduleService.delete(req.params.id);
        res.json({ message: 'Módulo removido com sucesso' });
    } catch (error) {
        res.status(400).json({ message: 'Erro ao remover módulo', error: error.message });
    }
};