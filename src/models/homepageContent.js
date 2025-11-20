const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const HomepageContent = sequelize.define('HomepageContent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: false },
  title: { type: DataTypes.STRING },
  body: { type: DataTypes.TEXT }, // Markdown or HTML
  heroImageId: { type: DataTypes.INTEGER },
  settings: { type: DataTypes.JSON } // Colors, layouts, specific flags
}, { tableName: 'homepage_content' });
module.exports = HomepageContent;