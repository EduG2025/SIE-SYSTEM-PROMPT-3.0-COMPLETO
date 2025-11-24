
const express = require('express');
const router = express.Router();
const { SystemController } = require('../controllers/systemController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/version', SystemController.version);
router.get('/status', SystemController.status);

// Endpoint administrativo futuro para estatísticas do servidor (CPU/Memória)
// router.get('/stats', auth, admin, SystemController.stats);

module.exports = router;
