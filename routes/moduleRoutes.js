const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, moduleController.getModules);
router.post('/', protect, admin, moduleController.createModule);
router.put('/:id', protect, admin, moduleController.updateModule);
router.delete('/:id', protect, admin, moduleController.deleteModule);

module.exports = router;