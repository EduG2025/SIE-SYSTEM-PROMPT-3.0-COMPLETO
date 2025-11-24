const authService = require('../services/authService');

const AuthController = {
    login: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            
            if ((!username && !email) || !password) {
                return res.status(400).json({ message: 'Credenciais (usuário/email e senha) são obrigatórias' });
            }

            const result = await authService.login(username || email, password);
            
            res.json({ 
                success: true, 
                ...result
            });
        } catch (error) {
            res.status(401).json({ message: error.message || 'Falha na autenticação' });
        }
    },

    register: async (req, res) => {
        try {
            // Em produção, o registro público pode ser restrito
            const result = await authService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'Usuário registrado com sucesso',
                ...result
            });
        } catch (error) {
            res.status(400).json({ message: error.message || 'Erro ao registrar usuário' });
        }
    },

    me: async (req, res) => {
        try {
            // req.user é populado pelo middleware de auth
            if (!req.user) {
                return res.status(404).json({ message: 'Usuário não encontrado na sessão' });
            }
            res.json(req.user);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao recuperar dados do usuário' });
        }
    }
};

module.exports = { AuthController };