const authService = require('../services/authService');

const AuthController = {
    login: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            
            // Suporte a login por username ou email
            if ((!username && !email) || !password) {
                return res.status(400).json({ message: 'Credenciais são obrigatórias' });
            }

            const result = await authService.login(username || email, password);
            
            res.json({ 
                success: true, 
                ...result
            });
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    },

    register: async (req, res) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({
                success: true,
                ...result
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    me: async (req, res) => {
        try {
            res.json(req.user);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao recuperar dados do usuário' });
        }
    }
};

module.exports = { AuthController };