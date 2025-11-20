const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register); // Protect this in production
router.get('/me', protect, authController.me);

module.exports = router;