const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'sie_secure_secret_key_2025';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
            if (!req.user) throw new Error('User not found');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Não autorizado, token inválido' });
        }
    } else {
        res.status(401).json({ message: 'Não autorizado, sem token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso restrito a administradores' });
    }
};

module.exports = { protect, admin, JWT_SECRET };