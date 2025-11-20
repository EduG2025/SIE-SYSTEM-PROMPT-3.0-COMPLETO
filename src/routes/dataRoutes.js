const express = require('express');
const router = express.Router();
const { DataController } = require('../controllers/dataController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/backup/sql', protect, admin, DataController.downloadSqlBackup);
router.get('/backup/json', protect, admin, DataController.downloadJsonBackup);
router.post('/reset', protect, admin, DataController.resetDatabase);

module.exports = router;