const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING },
  roleId: { type: DataTypes.INTEGER, defaultValue: 2 }, // 1=Admin, 2=User
  plan: { type: DataTypes.STRING, defaultValue: 'free' },
  meta: { type: DataTypes.JSON, allowNull: true } // Store avatarUrl, specific permissions, etc.
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => { if (user.password) user.password = await bcrypt.hash(user.password, 10); },
    beforeUpdate: async (user) => { if (user.changed('password')) user.password = await bcrypt.hash(user.password, 10); }
  }
});

User.prototype.validatePassword = function (password) { return bcrypt.compare(password, this.password); };
module.exports = User;