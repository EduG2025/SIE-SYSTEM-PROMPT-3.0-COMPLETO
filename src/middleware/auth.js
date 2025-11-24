
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'sie_secure_secret_key_2025';

const verifyToken = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const user = await User.findByPk(decoded.id, { 
                attributes: ['id', 'username', 'role', 'status', 'planId'] 
            });
            
            if (!user) {
                return res.status(401).json({ message: 'Token inválido: Usuário não encontrado.' });
            }

            if (user.status !== 'Ativo') {
                return res.status(403).json({ message: 'Conta inativa. Contate o administrador.' });
            }

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Não autorizado, token expirado ou inválido.' });
        }
    } else {
        return res.status(401).json({ message: 'Não autorizado, token de acesso não fornecido.' });
    }
};

module.exports = verifyToken;
