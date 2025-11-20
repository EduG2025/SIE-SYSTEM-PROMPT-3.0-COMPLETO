
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    level: {
        type: DataTypes.ENUM('INFO', 'WARN', 'ERROR', 'AUDIT'),
        defaultValue: 'INFO'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    user: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'System'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false // Logs não são atualizados, apenas criados
});

module.exports = AuditLog;
