const express = require('express');
const router = express.Router();
const { DomainController } = require('../controllers/domainController');
const { protect } = require('../middleware/authMiddleware');

// Generic routes: /api/domain/:type (where type = politicians, companies, etc.)
router.get('/:type', protect, DomainController.getAll);
router.get('/:type/:id', protect, DomainController.getById);
router.post('/:type', protect, DomainController.upsert);
router.delete('/:type/:id', protect, DomainController.delete);

module.exports = router;