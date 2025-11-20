const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { UPLOADS_DIR } = require('../config/storage');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const moduleName = req.body.module || 'system';
        const userId = req.user ? req.user.id : 'public';
        
        // Structure: /storage/uploads/{module}/{userId}/
        const uploadPath = path.join(UPLOADS_DIR, moduleName, String(userId));
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não suportado'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter
});

module.exports = upload;