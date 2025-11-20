const { Module } = require('../models');

class ModuleService {
    async getAll() {
        return await Module.findAll();
    }

    async getById(id) {
        return await Module.findByPk(id);
    }

    async update(id, updates) {
        const module = await Module.findByPk(id);
        if (!module) throw new Error('Módulo não encontrado');
        return await module.update(updates);
    }

    async create(data) {
        const exists = await Module.findByPk(data.id);
        if (exists) throw new Error('Módulo já existe');
        return await Module.create(data);
    }

    async delete(id) {
        const module = await Module.findByPk(id);
        if (!module) throw new Error('Módulo não encontrado');
        return await module.destroy();
    }
}

module.exports = new ModuleService();