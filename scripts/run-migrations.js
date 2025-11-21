require('dotenv').config();
const { sequelize } = require('../src/models');

(async () => {
    try {
        console.log('🗄️  Iniciando Migração de Banco de Dados...');
        console.log(`📡 Conectando a ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}...`);
        
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida.');

        // Sincroniza modelos alterando tabelas existentes se necessário (sem perder dados)
        await sequelize.sync({ alter: true });
        
        console.log('✅ Schema do banco de dados atualizado com sucesso.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro fatal na migração:', error);
        process.exit(1);
    }
})();