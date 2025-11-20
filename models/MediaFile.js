const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MediaFile = sequelize.define('MediaFile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    originalName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filename: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mimeType: {
        type: DataTypes.STRING
    },
    size: {
        type: DataTypes.INTEGER
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    module: {
        type: DataTypes.STRING,
        defaultValue: 'system'
    },
    uploadedBy: {
        type: DataTypes.INTEGER,
        allowNull: true // Nullable for system uploads
    },
    publicUrl: {
        type: DataTypes.VIRTUAL,
        get() {
            return `/media/${this.module}/${this.filename}`;
        }
    }
});

module.exports = MediaFile;