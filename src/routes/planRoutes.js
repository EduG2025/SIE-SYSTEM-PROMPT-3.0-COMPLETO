const express = require('express');
const router = express.Router();
const { PlanController } = require('../controllers/planController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public access to read plans
router.get('/', protect, PlanController.getAllPlans);
router.get('/:id', protect, PlanController.getPlanById);

// Admin only for modifications
router.post('/', protect, admin, PlanController.createPlan);
router.put('/:id', protect, admin, PlanController.updatePlan);
router.delete('/:id', protect, admin, PlanController.deletePlan);

module.exports = router;