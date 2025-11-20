const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

class AuthService {
    async login(username, password) {
        const user = await User.findOne({ where: { username } });
        
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const isMatch = await user.checkPassword(password);
        if (!isMatch) {
            throw new Error('Senha incorreta');
        }

        if (user.status !== 'Ativo') {
            throw new Error('Conta inativa. Contate o administrador.');
        }

        const token = this.generateToken(user);
        
        // Update usage stats if needed
        // user.lastLogin = new Date();
        // await user.save();

        return { user: this.sanitizeUser(user), token };
    }

    async register(userData) {
        const exists = await User.findOne({ where: { username: userData.username } });
        if (exists) throw new Error('Nome de usuário já existe');

        const user = await User.create(userData);
        const token = this.generateToken(user);

        return { user: this.sanitizeUser(user), token };
    }

    generateToken(user) {
        return jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    sanitizeUser(user) {
        const { password, ...cleanUser } = user.toJSON();
        return cleanUser;
    }
}

module.exports = new AuthService();