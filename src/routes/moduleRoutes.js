const express = require('express');
const router = express.Router();
const { ModuleController } = require('../controllers/moduleController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', protect, ModuleController.getModules);
router.post('/', protect, admin, ModuleController.createModule);
router.put('/:id', protect, admin, ModuleController.updateModule);
router.delete('/:id', protect, admin, ModuleController.deleteModule);

// Rota de Instalação via ZIP
router.post('/install', protect, admin, upload.single('modulePackage'), ModuleController.installModulePackage);

module.exports = router;