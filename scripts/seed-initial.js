
const { sequelize, User, Plan, SystemSetting } = require('../src/models');
const bcrypt = require('bcryptjs');

(async () => {
  try {
      console.log('🔄 Conectando e Sincronizando Banco de Dados...');
      // O 'alter: true' cria colunas faltantes como updated_at
      await sequelize.sync({ alter: true });
      
      console.log('🌱 Iniciando Seed...');

      // 1. Garantir Planos
      const plans = [
          { id: 'starter', name: 'Starter', requestLimit: 100, features: [], modules: ['dashboard'] },
          { id: 'pro', name: 'Pro', requestLimit: 500, features: ['ai_analysis'], modules: ['dashboard', 'political', 'employees'] },
          { id: 'enterprise', name: 'Enterprise', requestLimit: -1, features: ['ai_analysis', 'own_api_key', 'data_export'], modules: ['dashboard', 'political', 'employees', 'companies', 'contracts', 'judicial', 'social', 'timeline', 'research', 'ocr'] }
      ];

      for (const p of plans) {
          await Plan.upsert(p);
      }
      console.log('✅ Planos verificados.');

      // 2. Garantir Usuário Admin
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      // findOrCreate usa 'username' como chave única, não email, baseado no modelo
      const [user, created] = await User.findOrCreate({ 
          where: { username: 'admin' }, 
          defaults: { 
              email: 'admin@sie.local',
              password: passwordHash,
              role: 'admin',
              status: 'Ativo',
              planId: 'enterprise'
          } 
      });
      
      if (created) console.log('✅ Usuário Admin criado (admin / admin123).');
      else console.log('ℹ️ Usuário Admin já existente.');
      
      // 3. Configurações do Sistema
      await SystemSetting.upsert({ key: 'version', value: { version: '3.0.3' } });
      await SystemSetting.upsert({ 
          key: 'theme_config', 
          value: { primary: '#0D1117', secondary: '#161B22', accent: '#30363D', text: '#E6EDF3', blue: '#3B82F6' } 
      });
      
      console.log('✅ Seed concluído com sucesso.');
      process.exit(0);
  } catch(e) {
      console.error('❌ Erro fatal no seed:', e);
      process.exit(1);
  }
})();
