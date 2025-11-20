
const express = require('express');
const router = express.Router();
const { SystemController } = require('../controllers/systemController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/version', SystemController.version);
router.get('/status', SystemController.status);

// Rota protegida para o dashboard administrativo
router.get('/stats', protect, admin, SystemController.getDashboardStats);

module.exports = router;
