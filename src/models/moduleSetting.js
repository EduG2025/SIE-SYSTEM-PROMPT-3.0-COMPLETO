const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const ModuleSetting = sequelize.define('ModuleSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  module: { type: DataTypes.STRING, allowNull: false },
  key: { type: DataTypes.STRING, allowNull: false },
  value: { type: DataTypes.JSON },
  active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'module_settings' });
module.exports = ModuleSetting;