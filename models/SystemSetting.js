const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemSetting = sequelize.define('SystemSetting', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    value: {
        type: DataTypes.JSON,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING
    }
});

module.exports = SystemSetting;