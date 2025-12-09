
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DataSource = sequelize.define('DataSource', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    type: {
        type: DataTypes.STRING, // API, Web Scraping, RSS, etc.
        defaultValue: 'Web Scraping'
    },
    reliability: {
        type: DataTypes.ENUM('Alta', 'Média', 'Baixa'),
        defaultValue: 'Média'
    },
    status: {
        type: DataTypes.ENUM('Ativa', 'Inativa', 'Com Erro'),
        defaultValue: 'Ativa'
    },
    categoryId: {
        type: DataTypes.INTEGER,
        field: 'category_id'
    }
}, {
    tableName: 'data_sources',
    timestamps: true,
    underscored: true
});

module.exports = DataSource;
