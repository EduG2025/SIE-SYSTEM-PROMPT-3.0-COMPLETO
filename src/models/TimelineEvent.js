const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimelineEvent = sequelize.define('TimelineEvent', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.STRING, // YYYY-MM-DD
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    category: {
        type: DataTypes.STRING // Nomination, Contract, Lawsuit, etc.
    },
    icon: {
        type: DataTypes.STRING
    },
    relatedId: {
        type: DataTypes.STRING,
        field: 'related_id'
    },
    relatedModule: {
        type: DataTypes.STRING,
        field: 'related_module'
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'timeline_events'
});

module.exports = TimelineEvent;