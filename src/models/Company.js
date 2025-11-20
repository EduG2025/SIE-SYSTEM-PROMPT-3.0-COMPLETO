const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cnpj: {
        type: DataTypes.STRING(20)
    },
    cnae: {
        type: DataTypes.STRING
    },
    foundingDate: {
        type: DataTypes.STRING, // Storing as string to handle potential fuzzy dates or ISO
        field: 'founding_date'
    },
    shareCapital: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'share_capital'
    },
    totalContractsValue: {
        type: DataTypes.DECIMAL(15, 2),
        field: 'total_contracts_value',
        defaultValue: 0
    },
    riskScore: {
        type: DataTypes.DECIMAL(4, 2),
        field: 'risk_score',
        defaultValue: 0
    },
    address: {
        type: DataTypes.TEXT
    },
    // Complex Data
    partners: {
        type: DataTypes.JSON
    },
    alerts: {
        type: DataTypes.JSON
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Company;