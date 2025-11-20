const path = require('path');
const STORAGE_ROOT = path.resolve(process.env.STORAGE_PATH || path.join(__dirname, '..', '..', 'storage'));
module.exports = { STORAGE_ROOT };