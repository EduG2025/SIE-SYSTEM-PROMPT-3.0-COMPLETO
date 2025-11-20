const sequelize = require('../config/database');
const User = require('./User');
const SystemSetting = require('./SystemSetting');
const MediaFile = require('./MediaFile');
const Module = require('./Module');

// Define associations
User.hasMany(MediaFile, { foreignKey: 'uploadedBy' });
MediaFile.belongsTo(User, { foreignKey: 'uploadedBy' });

module.exports = {
    sequelize,
    User,
    SystemSetting,
    MediaFile,
    Module
};