const express = require('express');
const router = express.Router();
const { AuthController } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/me', protect, AuthController.me);

module.exports = router;