const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const SystemSetting = sequelize.define('SystemSetting', {
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.JSON }
}, { tableName: 'system_settings' });
module.exports = SystemSetting;