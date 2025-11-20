const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public or protected read access
router.get('/theme', settingsController.getTheme);
router.get('/homepage', settingsController.getHomepage);

// Protected write access
router.post('/theme', protect, admin, settingsController.saveTheme);
router.post('/homepage', protect, admin, settingsController.saveHomepage);

module.exports = router;