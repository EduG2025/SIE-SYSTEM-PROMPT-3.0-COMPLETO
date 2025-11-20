const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SocialPost = sequelize.define('SocialPost', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    platform: {
        type: DataTypes.STRING, // Facebook, Instagram, Twitter, etc.
        allowNull: false
    },
    author: {
        type: DataTypes.STRING
    },
    content: {
        type: DataTypes.TEXT
    },
    sentiment: {
        type: DataTypes.STRING, // Positive, Negative, Neutral
        defaultValue: 'Neutral'
    },
    timestamp: {
        type: DataTypes.STRING, // ISO String for frontend compatibility
        field: 'post_date'
    },
    url: {
        type: DataTypes.TEXT
    },
    metrics: {
        type: DataTypes.JSON // { likes: 0, comments: 0, shares: 0 }
    }
}, {
    timestamps: true,
    underscored: true,
    tableName: 'social_posts'
});

module.exports = SocialPost;