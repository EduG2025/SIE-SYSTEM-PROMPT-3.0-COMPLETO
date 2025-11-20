const express = require('express');
const router = express.Router();
const { UserController } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, UserController.getAll);
router.post('/', protect, admin, UserController.create);
// router.put('/:id', protect, admin, UserController.update);
// router.delete('/:id', protect, admin, UserController.delete);

module.exports = router;