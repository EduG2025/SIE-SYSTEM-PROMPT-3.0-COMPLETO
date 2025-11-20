const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const UserSetting = sequelize.define('UserSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  key: { type: DataTypes.STRING, allowNull: false },
  value: { type: DataTypes.JSON }
}, { tableName: 'user_settings' });
module.exports = UserSetting;