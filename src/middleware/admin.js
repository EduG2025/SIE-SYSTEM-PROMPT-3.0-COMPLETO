
const checkAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            message: 'Acesso negado. Esta operação requer privilégios de Administrador.',
            requiredRole: 'admin',
            currentRole: req.user ? req.user.role : 'guest'
        });
    }
};

module.exports = checkAdmin;
