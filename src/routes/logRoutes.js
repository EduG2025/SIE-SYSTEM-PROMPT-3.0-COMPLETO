const express = require('express');
const router = express.Router();
const { LogController } = require('../controllers/logController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, LogController.getLogs);
router.post('/', protect, LogController.createLog);

module.exports = router;