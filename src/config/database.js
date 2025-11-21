
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'sie301', 
  process.env.DB_USER || 'sie301', 
  process.env.DB_PASS || 'Gegerminal180!', 
  {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      define: {
          timestamps: true,
          underscored: true // Importante: converte camelCase para snake_case (createdAt -> created_at)
      }
  }
);

module.exports = { sequelize };
