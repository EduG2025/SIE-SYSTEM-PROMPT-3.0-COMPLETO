const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Module = sequelize.define('Module', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    view: {
        type: DataTypes.STRING,
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: 'cube'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    hasSettings: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    rules: {
        type: DataTypes.TEXT, // JSON string for AI rules
        allowNull: true
    },
    updateFrequency: {
        type: DataTypes.STRING,
        defaultValue: '24h'
    },
    lastUpdate: {
        type: DataTypes.DATE
    }
});

module.exports = Module;