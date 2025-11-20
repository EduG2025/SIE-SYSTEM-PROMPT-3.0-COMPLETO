const { sequelize } = require('../models');

(async () => {
    try {
        console.log('Syncing database models...');
        await sequelize.sync({ alter: true });
        console.log('Database sync complete.');
        process.exit(0);
    } catch (e) {
        console.error('Sync failed:', e);
        process.exit(1);
    }
})();