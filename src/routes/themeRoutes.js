
const express = require('express');
const router = express.Router();
const { ThemeController } = require('../controllers/themeController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Público (leitura)
router.get('/', ThemeController.getTheme);

// Protegido (escrita)
router.post('/', auth, admin, ThemeController.saveTheme);

module.exports = router;
