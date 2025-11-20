const { Module } = require('../models');

class ModuleService {
    async getAll() {
        return await Module.findAll({
            order: [['active', 'DESC'], ['name', 'ASC']]
        });
    }

    async getById(id) {
        return await Module.findByPk(id);
    }

    async update(id, updates) {
        const module = await Module.findByPk(id);
        if (!module) throw new Error('Módulo não encontrado');
        
        // Atualiza campos específicos permitidos
        if (updates.active !== undefined) module.active = updates.active;
        if (updates.rules !== undefined) module.rules = updates.rules; // JSON string
        if (updates.name !== undefined) module.name = updates.name;
        if (updates.icon !== undefined) module.icon = updates.icon;
        if (updates.view !== undefined) module.view = updates.view;
        if (updates.hasSettings !== undefined) module.hasSettings = updates.hasSettings;
        
        module.lastUpdate = new Date();
        return await module.save();
    }

    async create(data) {
        const exists = await Module.findByPk(data.id);
        if (exists) throw new Error('Módulo já existe com este ID');
        
        // Garante defaults
        const newModule = {
            ...data,
            active: data.active !== undefined ? data.active : true,
            lastUpdate: new Date()
        };
        
        return await Module.create(newModule);
    }

    async delete(id) {
        const module = await Module.findByPk(id);
        if (!module) throw new Error('Módulo não encontrado');
        return await module.destroy();
    }
}

module.exports = new ModuleService();