const path = require('path');

const STORAGE_ROOT = path.resolve(process.env.STORAGE_PATH || 'storage');
const UPLOADS_DIR = path.join(STORAGE_ROOT, 'uploads');

module.exports = {
    STORAGE_ROOT,
    UPLOADS_DIR
};