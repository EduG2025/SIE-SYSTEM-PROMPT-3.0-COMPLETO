const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING },
  details: { type: DataTypes.JSON }
}, { tableName: 'audit_logs' });
module.exports = AuditLog;