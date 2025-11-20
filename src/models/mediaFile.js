const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const MediaFile = sequelize.define('MediaFile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  module: { type: DataTypes.STRING, allowNull: true },
  originalName: { type: DataTypes.STRING },
  mimeType: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
  path: { type: DataTypes.STRING },
  url: { type: DataTypes.STRING },
  metadata: { type: DataTypes.JSON }
}, { tableName: 'media_files' });
module.exports = MediaFile;