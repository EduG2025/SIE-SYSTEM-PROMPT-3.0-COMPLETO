const express = require('express');
const router = express.Router();
const { AiController } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const checkQuota = require('../middleware/quotaMiddleware');

// POST /api/ai/generate
// Protected by Auth AND Quota
router.post('/generate', protect, checkQuota, AiController.generateContent);

module.exports = router;