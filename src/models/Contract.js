const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contract = sequelize.define('Contract', {
    id: {
        type: DataTypes.STRING, // Contract Number/ID
        primaryKey: true
    },
    companyName: {
        type: DataTypes.STRING,
        field: 'company_name'
    },
    companyCnpj: {
        type: DataTypes.STRING,
        field: 'company_cnpj'
    },
    value: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
    },
    object: {
        type: DataTypes.TEXT
    },
    startDate: {
        type: DataTypes.STRING,
        field: 'start_date'
    },
    endDate: {
        type: DataTypes.STRING,
        field: 'end_date'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Ativo'
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Contract;