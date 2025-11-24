
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300, // Limite de requisições por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: true,
        message: "Muitas requisições originadas deste IP. Tente novamente em 15 minutos."
    }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // Bloqueia após 10 tentativas falhas
    message: {
        error: true,
        message: "Muitas tentativas de login falhas. Conta temporariamente bloqueada."
    }
});

module.exports = { apiLimiter, authLimiter };
