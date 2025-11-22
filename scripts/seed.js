
/**
 * script/seed.js
 * Popula o banco de dados com dados iniciais essenciais para o funcionamento do S.I.E. 3.1.0
 */

require('dotenv').config();
const { 
    sequelize, User, Module, SystemSetting, Plan 
} = require('../src/models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🔄 Conectando ao banco de dados...');
        await sequelize.authenticate();
        
        console.log('🔄 Sincronizando schema (sync)...');
        await sequelize.sync({ alter: true });

        console.log('🌱 Iniciando Seeding...');

        // 1. Criar Planos
        const plans = [
            { 
                id: 'starter', 
                name: 'Starter', 
                requestLimit: 100, 
                features: [], 
                modules: ['mod-dash'] 
            },
            { 
                id: 'pro', 
                name: 'Pro', 
                requestLimit: 500, 
                features: ['ai_analysis'], 
                modules: ['mod-dash', 'mod-poli', 'mod-func', 'mod-soci'] 
            },
            { 
                id: 'enterprise', 
                name: 'Enterprise', 
                requestLimit: -1, 
                features: ['ai_analysis', 'own_api_key', 'data_export'], 
                modules: ['mod-dash', 'mod-poli', 'mod-func', 'mod-empr', 'mod-cont', 'mod-judi', 'mod-soci', 'mod-time', 'mod-res', 'mod-ocr'] 
            }
        ];

        for (const p of plans) {
            await Plan.upsert(p);
        }
        console.log('✅ Planos criados.');

        // 2. Criar Usuários
        const commonPassword = await bcrypt.hash('123456', 10);
        
        // Admin
        await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                email: 'admin@sie.system',
                password: commonPassword,
                role: 'admin',
                status: 'Ativo',
                planId: 'enterprise'
            }
        });
        console.log('✅ Usuário Admin verificado (admin / 123456).');

        // Usuário Padrão (Para Testes de Fluxo D)
        await User.findOrCreate({
            where: { username: 'jornalista' },
            defaults: {
                email: 'user@teste.com',
                password: commonPassword,
                role: 'user',
                status: 'Ativo',
                planId: 'pro'
            }
        });
        console.log('✅ Usuário Padrão verificado (jornalista / 123456).');

        // 3. Criar Configurações Iniciais
        const configs = [
            { key: 'version', value: { version: '3.1.0' }, description: 'System Version' },
            { 
                key: 'theme_config', 
                value: { primary: '#0D1117', secondary: '#161B22', accent: '#30363D', text: '#E6EDF3', blue: '#3B82F6' },
                description: 'Default Dark Theme'
            },
            {
                key: 'homepage_config',
                value: { active: true, title: 'S.I.E.', subtitle: 'Sistema de Investigação Estratégica', heroImageUrl: '', logoUrl: '' },
                description: 'Homepage Settings'
            },
            {
                key: 'ai_system_prompt',
                value: { prompt: 'Você é um auditor forense digital do S.I.E. Analise dados com rigor, imparcialidade e foco em compliance.' },
                description: 'Global AI Persona'
            }
        ];

        for (const conf of configs) {
            await SystemSetting.upsert(conf);
        }
        console.log('✅ Configurações do Sistema aplicadas.');

        // 4. Criar Módulos Padrão
        const modules = [
            { id: 'mod-dash', name: 'Dashboard', view: 'dashboard', icon: 'dashboard', active: true, hasSettings: true },
            { id: 'mod-poli', name: 'Político', view: 'political', icon: 'political', active: true, hasSettings: true },
            { id: 'mod-func', name: 'Funcionários', view: 'employees', icon: 'employees', active: true, hasSettings: true },
            { id: 'mod-empr', name: 'Empresas', view: 'companies', icon: 'companies', active: true, hasSettings: true },
            { id: 'mod-cont', name: 'Contratos', view: 'contracts', icon: 'contracts', active: true, hasSettings: true },
            { id: 'mod-judi', name: 'Judicial', view: 'judicial', icon: 'judicial', active: true, hasSettings: true },
            { id: 'mod-soci', name: 'Redes Sociais', view: 'social', icon: 'social', active: true, hasSettings: true },
            { id: 'mod-time', name: 'Linha do Tempo', view: 'timeline', icon: 'timeline', active: true, hasSettings: true },
            { id: 'mod-res', name: 'Pesquisa IA', view: 'research', icon: 'search-circle', active: true, hasSettings: false },
            { id: 'mod-ocr', name: 'OCR Jurídico', view: 'ocr', icon: 'document-text', active: true, hasSettings: false },
        ];

        for (const mod of modules) {
            await Module.upsert(mod);
        }
        console.log('✅ Módulos Padrão instalados.');

        console.log('🚀 SEED CONCLUÍDO COM SUCESSO!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro fatal no seeding:', error);
        process.exit(1);
    }
}

seed();
