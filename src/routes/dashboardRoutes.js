const express = require('express');
const router = express.Router();
const { DashboardController } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:municipality', protect, DashboardController.getDashboardData);
router.post('/:municipality', protect, DashboardController.saveDashboardData);

module.exports = router;