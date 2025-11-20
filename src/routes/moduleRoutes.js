const express = require('express');
const router = express.Router();
const { ModuleController } = require('../controllers/moduleController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, ModuleController.getModules);
router.post('/', protect, admin, ModuleController.createModule);
router.put('/:id', protect, admin, ModuleController.updateModule);
router.delete('/:id', protect, admin, ModuleController.deleteModule);

module.exports = router;