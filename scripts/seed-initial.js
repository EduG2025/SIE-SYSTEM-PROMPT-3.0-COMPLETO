const { Role, User, SystemSetting } = require('../src/models');
(async () => {
  try {
      await Role.findOrCreate({ where: { name: 'admin' }, defaults: { id: 1 } });
      await Role.findOrCreate({ where: { name: 'user' }, defaults: { id: 2 } });
      
      const [admin] = await User.findOrCreate({ 
          where: { email: 'admin@sie.local' }, 
          defaults: { name: 'Admin', password: 'admin123', roleId: 1 } 
      });
      
      await SystemSetting.upsert({ key: 'version', value: { version: '3.0.3' } });
      
      console.log('Seeded initial data');
      process.exit(0);
  } catch(e) {
      console.error(e);
      process.exit(1);
  }
})();