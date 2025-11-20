const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    position: {
        type: DataTypes.STRING
    },
    department: {
        type: DataTypes.STRING
    },
    appointedBy: {
        type: DataTypes.STRING,
        field: 'appointed_by'
    },
    startDate: {
        type: DataTypes.STRING,
        field: 'start_date'
    },
    riskScore: {
        type: DataTypes.DECIMAL(4, 2),
        field: 'risk_score',
        defaultValue: 0
    },
    riskAnalysis: {
        type: DataTypes.TEXT,
        field: 'risk_analysis'
    },
    investigationReport: {
        type: DataTypes.TEXT('long'),
        field: 'investigation_report'
    },
    alerts: {
        type: DataTypes.JSON
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Employee;