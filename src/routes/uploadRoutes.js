const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { UploadController } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// Allow single file upload
router.post('/', protect, upload.single('file'), UploadController.uploadFile);

module.exports = router;