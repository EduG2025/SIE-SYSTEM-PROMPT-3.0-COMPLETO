
const express = require('express');
const router = express.Router();
const { DataSourceController } = require('../controllers/dataSourceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, DataSourceController.getAll);
router.post('/categories', protect, admin, DataSourceController.createCategory);
router.put('/categories/:id', protect, admin, DataSourceController.updateCategory);
router.delete('/categories/:id', protect, admin, DataSourceController.deleteCategory);

router.post('/categories/:categoryId/sources', protect, admin, DataSourceController.createSource);
router.put('/sources/:id', protect, admin, DataSourceController.updateSource);
router.put('/sources/:id/toggle', protect, admin, DataSourceController.toggleSource);
router.delete('/sources/:id', protect, admin, DataSourceController.deleteSource);

router.post('/suggested', protect, admin, DataSourceController.addSuggested);
router.post('/validate', protect, admin, DataSourceController.validateAll);

module.exports = router;
