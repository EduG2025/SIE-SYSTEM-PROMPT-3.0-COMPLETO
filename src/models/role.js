const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, unique: true }
}, { tableName: 'roles' });
module.exports = Role;