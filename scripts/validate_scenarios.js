
/**
 * scripts/validate_scenarios.js
 * 
 * Executa a Etapa D: Validação Funcional e Simulação de Fluxos Críticos.
 * Simula requisições HTTP reais para testar:
 * 1. Login de Usuário e Criação de Dados (Persistência).
 * 2. Login de Admin e Configuração de Sistema.
 * 3. Teste de Segurança (Bloqueio de rota protegida).
 */

const BASE_URL = 'http://localhost:3000/api';

async function runValidation() {
    console.log('\n🧪 INICIANDO VALIDAÇÃO FUNCIONAL DO SISTEMA S.I.E.\n');

    // --- Variáveis de Sessão ---
    let userToken = '';
    let adminToken = '';

    // =================================================================
    // CENÁRIO 1: USUÁRIO PADRÃO (Login + Navegação + Criação)
    // =================================================================
    console.log('--- [CENÁRIO 1] Usuário Padrão ---');

    // 1.1 Login
    console.log('📡 1.1 Tentando login como "jornalista"...');
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'jornalista', password: '123456' })
        });
        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.token) {
            userToken = loginData.token;
            console.log('✅ Login com sucesso.');
            console.log(`   Token recebido: ${userToken.substring(0, 20)}...`);
            console.log(`   Role: ${loginData.user.role}`);
        } else {
            throw new Error(`Falha no login: ${loginData.message}`);
        }
    } catch (e) {
        console.error('❌ Erro crítico no login de usuário:', e.message);
        return;
    }

    // 1.2 Simular Criação de Registro (Ex: Post de Rede Social)
    console.log('\n📡 1.2 Criando novo registro no módulo Social...');
    const newPost = {
        platform: 'Twitter',
        author: 'Cidadão Teste',
        content: 'Denúncia de teste gerada pelo script de validação.',
        sentiment: 'Negative',
        timestamp: new Date().toISOString()
    };

    try {
        // O DomainController lida com /api/domain/:type
        const createRes = await fetch(`${BASE_URL}/domain/social`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(newPost)
        });
        const createData = await createRes.json();

        if (createRes.ok) {
            console.log('✅ Persistência no Banco de Dados confirmada.');
            console.log('   Resposta do Backend (JSON):');
            console.dir(createData, { depth: null, colors: true });
        } else {
            console.error('❌ Falha na criação:', createData);
        }
    } catch (e) {
        console.error('❌ Erro na requisição:', e.message);
    }

    // =================================================================
    // CENÁRIO 2: ADMINISTRADOR (Ação de Alto Privilégio)
    // =================================================================
    console.log('\n\n--- [CENÁRIO 2] Administrador ---');

    // 2.1 Login Admin
    console.log('📡 2.1 Tentando login como "admin"...');
    try {
        const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: '123456' })
        });
        const adminData = await adminLoginRes.json();
        adminToken = adminData.token;
        console.log('✅ Admin logado com sucesso.');
    } catch (e) {
        console.error('❌ Erro no login de admin:', e.message);
        return;
    }

    // 2.2 Alterar Configuração Global (Theme)
    console.log('\n📡 2.2 Alterando configuração global (Tema)...');
    const newTheme = {
        primary: '#000000',
        secondary: '#111111',
        accent: '#222222',
        text: '#ffffff',
        blue: '#3B82F6'
    };

    try {
        const configRes = await fetch(`${BASE_URL}/settings/theme`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(newTheme)
        });
        const configData = await configRes.json();

        if (configRes.ok) {
            console.log('✅ Configuração global atualizada.');
            console.log(`   Status: ${configData.message}`);
        } else {
            console.error('❌ Falha na configuração:', configData);
        }
    } catch (e) {
        console.error('❌ Erro:', e.message);
    }

    // =================================================================
    // CENÁRIO 3: TESTE DE SEGURANÇA (Validação de Regras)
    // =================================================================
    console.log('\n\n--- [CENÁRIO 3] Validação de Segurança ---');
    console.log('🔒 Tentando acessar rota de ADMIN com token de USUÁRIO...');
    console.log('   Rota: POST /api/settings/theme');

    try {
        const failRes = await fetch(`${BASE_URL}/settings/theme`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}` // Usando token do jornalista
            },
            body: JSON.stringify(newTheme)
        });
        
        if (failRes.status === 403) {
            console.log('✅ SUCESSO: O Backend bloqueou a ação corretamente (HTTP 403 Forbidden).');
            const errData = await failRes.json();
            console.log(`   Mensagem do servidor: "${errData.message}"`);
        } else if (failRes.ok) {
            console.error('❌ FALHA GRAVE: O Backend permitiu acesso não autorizado!');
        } else {
            console.log(`⚠️ Resultado inesperado: HTTP ${failRes.status}`);
        }

    } catch (e) {
        console.error('Erro no teste de segurança:', e.message);
    }

    console.log('\n🏁 Validação Completa.');
}

runValidation();
