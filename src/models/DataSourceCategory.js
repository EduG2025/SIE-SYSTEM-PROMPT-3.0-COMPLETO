
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DataSourceCategory = sequelize.define('DataSourceCategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'data_source_categories',
    timestamps: true,
    underscored: true
});

module.exports = DataSourceCategory;
