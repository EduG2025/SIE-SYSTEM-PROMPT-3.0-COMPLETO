require('dotenv').config();
const { sequelize, User, Plan, SystemSetting, Module } = require('../src/models');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        console.log('🌱 Iniciando Seeding...');
        await sequelize.sync({ alter: true });

        // 1. Admin User
        const adminPass = await bcrypt.hash('admin123', 10);
        const [admin, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                email: 'admin@sie.system',
                password: adminPass,
                role: 'admin',
                status: 'Ativo',
                planId: 'enterprise'
            }
        });
        if (created) console.log('✅ Usuário Admin criado.');

        // 2. System Settings Defaults
        await SystemSetting.upsert({ 
            key: 'theme_config', 
            value: { primary: '#0D1117', secondary: '#161B22', accent: '#30363D', text: '#E6EDF3', blue: '#3B82F6' }
        });
        await SystemSetting.upsert({
            key: 'homepage_config',
            value: { active: true, title: 'S.I.E.', subtitle: 'Inteligência Governamental', heroImageUrl: '', logoUrl: '' }
        });
        console.log('✅ Configurações padrão aplicadas.');

        console.log('🚀 Seed concluído.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro no Seed:', e);
        process.exit(1);
    }
};

seed();