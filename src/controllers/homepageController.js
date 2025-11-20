const { HomepageContent } = require('../models');

const HomepageController = {
    get: async (req, res) => {
        try {
            // Busca a homepage ativa ou a última criada
            const content = await HomepageContent.findOne({ 
                where: { active: true },
                order: [['createdAt', 'DESC']] 
            });
            
            const defaultConfig = {
                active: true,
                title: 'S.I.E.',
                subtitle: 'Sistema de Investigação Estratégica',
                heroImageUrl: '',
                logoUrl: ''
            };

            res.json(content ? content : defaultConfig);
        } catch (err) { 
            res.status(500).json({ message: err.message }); 
        }
    },
    
    update: async (req, res) => {
        try {
            // Desativa anteriores se necessário, ou apenas atualiza a única
            // Para simplificar, vamos fazer upsert num registro 'principal' ou criar novo
            
            const existing = await HomepageContent.findOne({ where: { active: true } });
            
            if (existing) {
                await existing.update(req.body);
                res.json({ success: true, content: existing });
            } else {
                const newContent = await HomepageContent.create({ ...req.body, active: true });
                res.json({ success: true, content: newContent });
            }
        } catch (err) { 
            res.status(500).json({ message: err.message }); 
        }
    }
};

module.exports = { HomepageController };