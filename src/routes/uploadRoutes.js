const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { UploadController } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// Upload Simples
router.post('/', protect, upload.single('file'), UploadController.uploadFile);

// Upload em Chunks
router.post('/chunk', protect, upload.single('file'), UploadController.uploadChunk);
router.post('/complete', protect, UploadController.completeChunkedUpload);

module.exports = router;
