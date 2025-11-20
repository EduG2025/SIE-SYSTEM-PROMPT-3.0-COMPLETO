
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DashboardData = sequelize.define('DashboardData', {
    municipality: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false
    },
    last_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = DashboardData;
