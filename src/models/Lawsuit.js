const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lawsuit = sequelize.define('Lawsuit', {
    id: {
        type: DataTypes.STRING, // Process Number
        primaryKey: true
    },
    parties: {
        type: DataTypes.TEXT // Formatted string for display
    },
    involvedParties: {
        type: DataTypes.JSON, // Structured array
        field: 'involved_parties'
    },
    court: {
        type: DataTypes.STRING
    },
    class: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'Ongoing'
    },
    lastUpdate: {
        type: DataTypes.STRING,
        field: 'last_update'
    },
    description: {
        type: DataTypes.TEXT
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Lawsuit;