const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// Allow single file upload
router.post('/', protect, upload.single('file'), uploadController.uploadFile);

module.exports = router;