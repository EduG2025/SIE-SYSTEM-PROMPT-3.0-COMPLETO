const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('Plan', {
    id: {
        type: DataTypes.STRING, // ex: 'starter', 'pro', 'enterprise'
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    features: {
        type: DataTypes.JSON, // Array de strings: ['ai_analysis', 'export_pdf']
        defaultValue: []
    },
    modules: {
        type: DataTypes.JSON, // Array de IDs de módulos permitidos
        defaultValue: []
    },
    requestLimit: {
        type: DataTypes.INTEGER, // -1 para ilimitado
        defaultValue: 100,
        field: 'request_limit'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'plans',
    timestamps: true,
    underscored: true
});

module.exports = Plan;