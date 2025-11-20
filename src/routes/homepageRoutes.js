const express = require('express');
const router = express.Router();
const { HomepageController } = require('../controllers/homepageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', HomepageController.get);
router.post('/', protect, admin, HomepageController.update);

module.exports = router;