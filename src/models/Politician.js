const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Politician = sequelize.define('Politician', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    party: {
        type: DataTypes.STRING
    },
    position: {
        type: DataTypes.STRING
    },
    state: {
        type: DataTypes.STRING(2)
    },
    imageUrl: {
        type: DataTypes.TEXT,
        field: 'image_url'
    },
    bio: {
        type: DataTypes.TEXT
    },
    salary: {
        type: DataTypes.DECIMAL(10, 2)
    },
    monitored: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // JSON Fields for nested data structures defined in frontend types
    risks: {
        type: DataTypes.JSON
    },
    socialMedia: {
        type: DataTypes.JSON,
        field: 'social_media'
    },
    votingHistory: {
        type: DataTypes.JSON,
        field: 'voting_history'
    },
    latestNews: {
        type: DataTypes.JSON,
        field: 'latest_news'
    },
    reputation: {
        type: DataTypes.JSON
    },
    connections: {
        type: DataTypes.JSON
    },
    electoralHistory: {
        type: DataTypes.JSON,
        field: 'electoral_history'
    },
    partyHistory: {
        type: DataTypes.JSON,
        field: 'party_history'
    },
    donations: {
        type: DataTypes.JSON
    },
    assets: {
        type: DataTypes.JSON
    },
    electoralMap: {
        type: DataTypes.JSON,
        field: 'electoral_map'
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Politician;