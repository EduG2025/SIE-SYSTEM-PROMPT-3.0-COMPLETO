const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Post = sequelize.define('Post', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER },
  title: { type: DataTypes.STRING },
  body: { type: DataTypes.TEXT },
  metadata: { type: DataTypes.JSON }
}, { tableName: 'posts' });
module.exports = Post;