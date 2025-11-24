
const express = require('express');
const router = express.Router();
const { HomepageController } = require('../controllers/homepageController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/config', HomepageController.getConfig);
router.post('/config', auth, admin, HomepageController.saveConfig);

router.get('/content', HomepageController.getContent);
router.post('/content', auth, admin, HomepageController.updateContent);

module.exports = router;
