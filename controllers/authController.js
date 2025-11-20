const authService = require('../services/authService');

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
        }

        const result = await authService.login(username, password);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        // Only admin should register via this endpoint usually, but for setup:
        const result = await authService.register(req.body);
        res.status(201).json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.me = async (req, res) => {
    try {
        // req.user is populated by authMiddleware
        res.json(req.user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao recuperar dados do usuário' });
    }
};