const { User } = require('../models');

const UserController = {
    getAll: async (req, res) => {
        try {
            const users = await User.findAll({ attributes: { exclude: ['password'] } });
            res.json(users);
        } catch (err) { res.status(500).json({ message: err.message }); }
    },
    create: async (req, res) => {
        try {
            const user = await User.create(req.body);
            res.status(201).json({ success: true, user: { id: user.id, email: user.email } });
        } catch (err) { res.status(500).json({ message: err.message }); }
    }
};

module.exports = { UserController };