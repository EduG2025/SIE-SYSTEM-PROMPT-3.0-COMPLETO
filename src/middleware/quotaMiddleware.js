const { User, Plan } = require('../models');

const checkQuota = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        // Admins bypass quota
        if (req.user.role === 'admin') {
            return next();
        }

        const user = await User.findByPk(req.user.id, { include: Plan });
        
        if (!user.Plan) {
            // Fallback if no plan assigned
            if (user.usageCount >= 50) {
                return res.status(429).json({ message: 'Limite de requisições excedido para conta sem plano.' });
            }
            return next();
        }

        const limit = user.Plan.requestLimit;

        // -1 means unlimited
        if (limit !== -1 && user.usageCount >= limit) {
            return res.status(429).json({ 
                message: 'Limite do plano excedido.', 
                detail: `Você usou ${user.usageCount} de ${limit} requisições. Faça upgrade do seu plano.` 
            });
        }

        // Attach user object with plan to request for the controller to increment usage later
        req.userWithPlan = user;
        next();

    } catch (error) {
        console.error("Quota Check Error:", error);
        res.status(500).json({ message: 'Erro ao verificar cota de uso.' });
    }
};

module.exports = checkQuota;