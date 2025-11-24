const { User } = require('../models');
const bcrypt = require('bcryptjs');

const UserService = {
    getAllUsers: async () => {
        return await User.findAll({ attributes: { exclude: ['password'] } });
    },

    createUser: async (userData) => {
        const exists = await User.findOne({ where: { username: userData.username } });
        if (exists) throw new Error('Nome de usuário já existe');
        return await User.create(userData);
    },

    getUserById: async (id) => {
        return await User.findByPk(id, { attributes: { exclude: ['password'] } });
    },

    updateUser: async (id, updates) => {
        const user = await User.findByPk(id);
        if (!user) throw new Error('Usuário não encontrado');
        
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        
        return await user.update(updates);
    },

    deleteUser: async (id) => {
        const user = await User.findByPk(id);
        if (!user) throw new Error('Usuário não encontrado');
        return await user.destroy();
    }
};

module.exports = UserService;