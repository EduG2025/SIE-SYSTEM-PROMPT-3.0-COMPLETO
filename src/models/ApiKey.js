
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiKey = sequelize.define('ApiKey', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'key_value' // Mapeia para snake_case no banco
    },
    status: {
        type: DataTypes.ENUM('Ativa', 'Inativa', 'Suspensa'),
        defaultValue: 'Ativa'
    },
    type: {
        type: DataTypes.ENUM('System', 'User'),
        defaultValue: 'System'
    },
    usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'usage_count'
    },
    lastUsed: {
        type: DataTypes.DATE,
        field: 'last_used'
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'owner_id',
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'api_keys',
    timestamps: true,
    underscored: true
});

module.exports = ApiKey;
