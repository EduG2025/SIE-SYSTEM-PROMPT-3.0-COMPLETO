const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/version', systemController.getVersion);
router.get('/status', systemController.getStatus);

module.exports = router;