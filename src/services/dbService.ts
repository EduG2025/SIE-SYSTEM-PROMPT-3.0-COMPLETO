
import { initialUsers } from '../data/mock/users';
import { initialModules } from '../data/mock/modules';
import { initialApiKeys } from '../data/mock/apiKeys';
import { initialDataSources } from '../data/mock/dataSources';
import { initialTimelineEvents } from '../data/mock/timelineData';
import type {
  User, Module, ApiKey, DataSourceCategory, Politician, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, UserPlan,
  DashboardData, DbConfig, LogEntry, DashboardWidget, AiAutomationSettings, Feature, FeatureKey, SuggestedSource,
  PoliticianDataResponse, ThemeConfig, HomepageConfig
} from '../types';
import {
    generateFullDashboardData,
    generatePoliticalLeadership,
    generatePoliticalSquad,
    generateDeepPoliticianAnalysis,
    generateRealEmployees,
    generateRealCompanies,
    generateRealContracts,
    generateRealLawsuits,
    generateRealSocialPosts,
    generateRealTimeline
} from './geminiService';

// --- DEFAULT DATA ---
// Dados iniciais usados se o banco estiver vazio ou offline
// IDs de módulos corrigidos para corresponder ao initialModules (mod-dash, etc)
const DEFAULT_DB_STATE = {
    users: initialUsers,
    modules: initialModules,
    apiKeys: initialApiKeys,
    dataSources: initialDataSources,
    plans: [
        { 
            id: 'starter', 
            name: 'Starter', 
            features: [], 
            modules: ['mod-dash'], 
            requestLimit: 100 
        },
        { 
            id: 'pro', 
            name: 'Pro', 
            features: ['ai_analysis', 'own_api_key'], 
            modules: ['mod-dash', 'mod-poli', 'mod-func'], 
            requestLimit: 500 
        },
        { 
            id: 'enterprise', 
            name: 'Enterprise', 
            features: ['ai_analysis', 'advanced_search', 'data_export', 'own_api_key', 'priority_support'], 
            // Todos os módulos com seus IDs corretos conforme mock/modules.ts
            modules: ['mod-dash', 'mod-poli', 'mod-func', 'mod-empr', 'mod-cont', 'mod-judi', 'mod-soci', 'mod-time', 'mod-ocr', 'mod-res'], 
            requestLimit: -1 
        }
    ],
    politicians: [],
    employees: [],
    companies: [],
    contracts: [],
    lawsuits: [],
    socialPosts: [],
    timelineEvents: initialTimelineEvents,
    dashboardData: {},
    dashboardWidgets: [
        { id: 'mayor', title: 'Prefeito', visible: true },
        { id: 'vice_mayor', title: 'Vice-Prefeito', visible: true },
        { id: 'stats', title: 'Estatísticas Gerais', visible: true },
        { id: 'crisis', title: 'Temas de Crise', visible: true },
        { id: 'news', title: 'Notícias de Impacto', visible: true },
        { id: 'reputation', title: 'Radar de Reputação', visible: true },
        { id: 'irregularities', title: 'Irregularidades', visible: true },
        { id: 'sentiment', title: 'Sentimento', visible: true },
        { id: 'master_table', title: 'Tabela Mestra', visible: true },
        { id: 'data_sources', title: 'Fontes de Dados', visible: true },
    ],
    dbConfig: { apiUrl: '', apiToken: '', status: 'Conectado' },
    systemPrompt: 'Você é um analista de inteligência estratégica governamental.',
    logs: [],
    aiAutomationSettings: { isEnabled: false, frequency: 'daily' },
    themeConfig: { primary: '#0D1117', secondary: '#161B22', accent: '#30363D', text: '#E6EDF3', blue: '#3B82F6' },
    homepageConfig: { active: true, title: 'S.I.E.', subtitle: 'Plataforma de Inteligência Governamental', heroImageUrl: '', logoUrl: '' }
};

class DbService {
    private data: any = null;
    private initialized = false;
    private syncTimeout: any = null;
    private API_URL = '/api'; // Relativo para usar o proxy Nginx

    constructor() {
        this.init();
    }

    // Inicialização: Tenta baixar dados do servidor MySQL
    private async init() {
        try {
            const response = await fetch(`${this.API_URL}/state`);
            if (response.ok) {
                const remoteData = await response.json();
                // Se o banco remoto tiver dados, usamos. Se estiver vazio (primeiro boot), usamos DEFAULT_DB_STATE
                if (Object.keys(remoteData).length > 0) {
                    this.data = { ...DEFAULT_DB_STATE, ...remoteData };
                    console.log('[DB] Sincronizado com MySQL (VPS).');
                } else {
                    this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE));
                    console.log('[DB] Banco vazio. Inicializando defaults...');
                    this.persistState(); // Salva os defaults no MySQL
                }
            } else {
                throw new Error('API Error');
            }
        } catch (e) {
            console.warn('[DB] Backend offline ou inacessível. Usando modo offline local.');
            this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE));
        }
        this.initialized = true;
    }

    // Garante que o this.data esteja carregado antes de qualquer leitura
    private async ensureReady() {
        if (!this.initialized || !this.data) {
            let attempts = 0;
            while (!this.initialized && attempts < 20) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }
            if (!this.data) this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE));
        }
    }

    // Salva o estado completo no MySQL (Debounced)
    private async persistState() {
        if (!this.data) return;
        if (this.syncTimeout) clearTimeout(this.syncTimeout);

        this.syncTimeout = setTimeout(async () => {
            try {
                await fetch(`${this.API_URL}/state`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.data)
                });
            } catch (e) {
                console.error('[DB] Falha ao salvar no backend:', e);
            }
        }, 1000);
    }

    // --- Authentication & Core Services ---

    async login(username: string, password: string): Promise<User> {
        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) localStorage.setItem('auth_token', data.token);
                return data.user;
            }
            throw new Error('Falha na autenticação');
        } catch (e: any) {
            // Fallback para modo offline/demo se backend não responder ou se o teste mockar
            await this.ensureReady();
            const user = this.data.users.find((u: User) => u.username === username && u.password === password);
            if (user) return user;
            throw e;
        }
    }

    async proxyAiRequest(payload: any): Promise<any> {
        const token = localStorage.getItem('auth_token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${this.API_URL}/ai/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Request Failed: ${response.statusText} - ${errorText}`);
        }
        return await response.json();
    }

    async getSystemDashboardStats(): Promise<any> {
        const token = localStorage.getItem('auth_token');
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(`${this.API_URL}/system/stats`, { headers });
            if (response.ok) return await response.json();
        } catch(e) {}
        
        // Fallback mock data for offline display
        await this.ensureReady();
        return {
            server: { cpuLoad: 0.5, memoryUsage: 45, totalMemoryGB: "8.00", uptimeSeconds: 3600, platform: "linux" },
            system: {
                usersTotal: this.data.users.length,
                usersActive: 1,
                modulesTotal: this.data.modules.length,
                modulesActive: this.data.modules.filter((m: any) => m.active).length,
                logsTotal: this.data.logs.length,
                version: "3.0.3"
            }
        };
    }

    // --- Métodos de Leitura/Escrita Genéricos ---

    async getUsers(): Promise<User[]> { await this.ensureReady(); return this.data.users; }
    
    async saveUser(user: User, adminUsername: string) {
        await this.ensureReady();
        const index = this.data.users.findIndex((u: User) => u.id === user.id);
        if (index >= 0) this.data.users[index] = user;
        else this.data.users.push(user);
        this.logActivity('INFO', `Usuário salvo: ${user.username}`, adminUsername);
        await this.persistState();
    }

    async deleteUser(id: number, adminUsername: string): Promise<boolean> {
        await this.ensureReady();
        this.data.users = this.data.users.filter((u: User) => u.id !== id);
        this.logActivity('WARN', `Usuário removido: ${id}`, adminUsername);
        await this.persistState();
        return true;
    }

    async getPlans(): Promise<UserPlan[]> { await this.ensureReady(); return this.data.plans; }
    async getFeatures(): Promise<Feature[]> { return [
        { key: 'ai_analysis', name: 'Análise IA', description: 'Acesso aos modelos Gemini.' },
        { key: 'own_api_key', name: 'Chave Própria', description: 'Usar chave pessoal.' }
    ]; } // Mock estático por enquanto

    async getModules(): Promise<Module[]> { await this.ensureReady(); return this.data.modules; }
    async getModule(view: string): Promise<Module | undefined> { await this.ensureReady(); return this.data.modules.find((m: Module) => m.view === view); }
    
    private getCacheKey(municipality: string): string {
        return `sie_cache_dash_${municipality.replace(/\s+/g, '_').toLowerCase()}`;
    }

    async getDashboardData(municipality: string, refresh: boolean): Promise<DashboardData> {
        await this.ensureReady();
        const cacheKey = this.getCacheKey(municipality);

        // 1. Se for refresh forçado, ignora cache e busca nova IA
        if (refresh) {
            const newData = await generateFullDashboardData(municipality);
            this.updateLocalAndRemoteState(municipality, newData, cacheKey);
            return newData;
        }

        // 2. Verifica dados em memória (Vindos do servidor/MySQL no init())
        const serverData = this.data.dashboardData[municipality];
        
        // 3. Verifica dados no Cache Local (LocalStorage)
        const localCache = localStorage.getItem(cacheKey);
        let localData: DashboardData | null = null;
        if (localCache) {
            try {
                const parsed = JSON.parse(localCache);
                // Validação básica de formato
                if (parsed.data && parsed.timestamp) {
                    localData = parsed.data;
                }
            } catch (e) { localStorage.removeItem(cacheKey); }
        }

        // 4. Lógica de Comparação de Frescor (Recency Check)
        // Objetivo: Usar sempre o dado mais novo disponível (seja do servidor ou do cache local)
        let finalData: DashboardData | null = null;

        if (serverData && localData) {
            const serverTime = new Date(serverData.lastAnalysis || 0).getTime();
            const localTime = new Date(localData.lastAnalysis || 0).getTime();
            // Usa o que tiver a data de análise mais recente
            finalData = serverTime > localTime ? serverData : localData;
        } else if (serverData) {
            finalData = serverData;
        } else if (localData) {
            finalData = localData;
        }

        // 5. Retorna dados existentes ou gera novos
        if (finalData) {
            // Se o dado "vencedor" não estiver no cache local, atualiza o cache para próxima vez ser mais rápido
            if (finalData !== localData) {
                localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: finalData }));
            }
            // Se o dado vencedor não estiver na memória (ex: veio do localStorage), atualiza memória
            if (this.data.dashboardData[municipality] !== finalData) {
                this.data.dashboardData[municipality] = finalData;
            }
            return finalData;
        }

        // Se não tem dados em lugar nenhum, gera agora
        const newData = await generateFullDashboardData(municipality);
        this.updateLocalAndRemoteState(municipality, newData, cacheKey);
        return newData;
    }

    private updateLocalAndRemoteState(municipality: string, data: DashboardData, cacheKey: string) {
        // Atualiza Memória
        this.data.dashboardData[municipality] = data;
        // Atualiza Cache Local
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
        // Atualiza Servidor (MySQL)
        this.persistState();
    }

    async getDashboardWidgets(): Promise<DashboardWidget[]> { await this.ensureReady(); return this.data.dashboardWidgets; }
    async saveDashboardWidgets(widgets: DashboardWidget[]) {
        await this.ensureReady();
        this.data.dashboardWidgets = widgets;
        await this.persistState();
    }

    // Domain Specifics
    async getEmployees(refresh = false): Promise<Employee[]> {
        await this.ensureReady();
        if (this.data.employees.length === 0 || refresh) {
             const municipality = Object.keys(this.data.dashboardData)[0] || 'Local';
             this.data.employees = await generateRealEmployees(municipality);
             await this.persistState();
        }
        return this.data.employees;
    }

    async getCompanies(): Promise<Company[]> {
        await this.ensureReady();
        if (this.data.companies.length === 0) {
             const municipality = Object.keys(this.data.dashboardData)[0] || 'Local';
             this.data.companies = await generateRealCompanies(municipality);
             await this.persistState();
        }
        return this.data.companies;
    }

    async getContracts(): Promise<Contract[]> { await this.ensureReady(); return this.data.contracts; }
    async getLawsuits(): Promise<Lawsuit[]> { await this.ensureReady(); return this.data.lawsuits; }
    async getSocialPosts(): Promise<SocialPost[]> { await this.ensureReady(); return this.data.socialPosts; }
    async getTimelineEvents(): Promise<TimelineEvent[]> { await this.ensureReady(); return this.data.timelineEvents; }

    async getAllPoliticians(): Promise<Politician[]> { await this.ensureReady(); return this.data.politicians; }
    async getPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> {
        await this.ensureReady();
        const p = this.data.politicians.find((pol: Politician) => pol.id === id);
        if (p) return { data: p, timestamp: Date.now(), source: 'cache' };
        throw new Error('Político não encontrado');
    }

    async refreshPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> {
        await this.ensureReady();
        const p = this.data.politicians.find((pol: Politician) => pol.id === id);
        if (p) {
            const updated = await generateDeepPoliticianAnalysis(p);
            Object.assign(p, updated);
            await this.persistState();
            return { data: p, timestamp: Date.now(), source: 'api' };
        }
        throw new Error('Político não encontrado');
    }

    async togglePoliticianMonitoring(id: string) {
        await this.ensureReady();
        const p = this.data.politicians.find((pol: Politician) => pol.id === id);
        if(p) { p.monitored = !p.monitored; await this.persistState(); }
    }

    async ensurePoliticalLeadership(municipality: string): Promise<Politician[]> {
        await this.ensureReady();
        if (this.data.politicians.length === 0) {
            this.data.politicians = await generatePoliticalLeadership(municipality);
            await this.persistState();
        }
        return this.data.politicians;
    }

    async scanPoliticalSquad(municipality: string) {
        await this.ensureReady();
        const squad = await generatePoliticalSquad(municipality);
        // Merge evita duplicatas
        squad.forEach(p => {
            if (!this.data.politicians.find((ex: Politician) => ex.id === p.id)) {
                this.data.politicians.push(p);
            }
        });
        await this.persistState();
    }

    // System Settings
    async getDbConfig(): Promise<DbConfig> {
        const test = await this.testConnection();
        return {
            apiUrl: this.API_URL,
            apiToken: '***',
            status: test.status as any,
            host: '127.0.0.1',
            port: '3306',
            user: 'sie301',
            password: '***',
            database: 'sie301'
        };
    }
    
    async saveDbConfig(config: DbConfig, username: string) {
        // No modo "Universal Memory", a config é gerida pelo server.cjs e .env
        // Aqui apenas logamos a intenção
        this.logActivity('AUDIT', 'Tentativa de reconfiguração de DB (Requer acesso SSH)', username);
    }

    async testConnection() {
        try {
            const res = await fetch(`${this.API_URL}/status`);
            if (res.ok) return { status: 'Conectado', details: 'MySQL Online via Express' };
            return { status: 'Erro', details: res.statusText };
        } catch (e) {
            return { status: 'Desconectado', details: 'Falha de rede' };
        }
    }

    async getSystemPrompt(): Promise<string> { await this.ensureReady(); return this.data.systemPrompt; }
    async setSystemPrompt(prompt: string, user: string) { 
        await this.ensureReady(); 
        this.data.systemPrompt = prompt; 
        await this.persistState(); 
    }

    // --- AUTH & PERMISSIONS (LOGICA ESTRITA ATIVADA) ---
    async getUserActiveModules(user: User): Promise<Module[]> {
        await this.ensureReady();
        
        const plan = this.data.plans.find((p: any) => p.id === user.planId);
        
        // Validação Rigorosa de Integridade: Plano
        if (!plan) {
            const errorMsg = `INTEGRITY FAILURE: Usuário '${user.username}' possui planId '${user.planId}' que não existe na tabela de planos.`;
            console.error(errorMsg);
            this.logActivity('ERROR', errorMsg, 'SYSTEM_AUDIT');
            // Tolerância Zero: Se o plano não existe, nenhum módulo é retornado.
            return []; 
        }

        const allowedIds = plan.modules || [];
        const activeModules: Module[] = [];

        // Validação Rigorosa de Integridade: Módulos
        // Verificamos cada ID listado no plano contra o registro de módulos
        for (const id of allowedIds) {
            const module = this.data.modules.find((m: Module) => m.id === id);
            
            if (!module) {
                // BUG DETECTADO: Referência quebrada
                const errorMsg = `DATA CORRUPTION: O Plano '${plan.name}' referencia o módulo ID '${id}', mas este não foi encontrado no registro de módulos.`;
                console.error(errorMsg);
                this.logActivity('ERROR', errorMsg, 'SYSTEM_AUDIT');
            } else if (module.active) {
                activeModules.push(module);
            }
        }

        return activeModules;
    }

    async checkAndIncrementQuota(userId: number, isAi: boolean) {
        await this.ensureReady();
        const user = this.data.users.find((u: User) => u.id === userId);
        if (!user) return { allowed: false, usage: 0, limit: 0 };
        const plan = this.data.plans.find((p: any) => p.id === user.planId);
        const limit = plan ? plan.requestLimit : 100;
        
        if (limit !== -1 && isAi) {
            if (user.usage >= limit) return { allowed: false, usage: user.usage, limit };
            user.usage++;
            this.persistState(); // Salva incremento
        }
        return { allowed: true, usage: user.usage, limit };
    }

    async getUserUsageStats(userId: number) {
        await this.ensureReady();
        const user = this.data.users.find((u: User) => u.id === userId);
        const plan = this.data.plans.find((p: any) => p.id === user?.planId);
        return { usage: user?.usage || 0, limit: plan?.requestLimit || 100 };
    }

    async getNextSystemApiKey() {
        await this.ensureReady();
        // Fallback para chave do processo se não houver no banco
        if (process.env.API_KEY) return process.env.API_KEY;
        const active = this.data.apiKeys.filter((k: any) => k.status === 'Ativa');
        if (active.length > 0) return active[0].key;
        throw new Error("Sem chaves disponíveis");
    }

    logActivity(level: string, message: string, user: string) {
        if (!this.data) return;
        this.data.logs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), level, message, user });
        if (this.data.logs.length > 200) this.data.logs.pop();
        this.persistState();
    }

    // Placeholders para evitar erros de TS
    async getStats() { await this.ensureReady(); return { users: this.data.users.length, dbStatus: 'Online' }; }
    async getLogs() { await this.ensureReady(); return this.data.logs; }
    async getApiKeys() { await this.ensureReady(); return this.data.apiKeys; }
    
    async getTheme() { await this.ensureReady(); return this.data.themeConfig; }
    async saveTheme(config: ThemeConfig, username: string) {
        await this.ensureReady();
        this.data.themeConfig = config;
        
        // Tenta salvar no backend se disponível
        const token = localStorage.getItem('auth_token');
        const headers: any = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            await fetch(`${this.API_URL}/settings/theme`, {
                method: 'POST',
                headers,
                body: JSON.stringify(config)
            });
        } catch (e) {
            console.warn('Failed to save theme to backend API, falling back to state sync');
        }
        
        this.logActivity('INFO', 'Tema visual atualizado', username);
        await this.persistState();
    }

    async getHomepageConfig() { await this.ensureReady(); return this.data.homepageConfig; }
    async saveHomepageConfig(c: any, u: string) { await this.ensureReady(); this.data.homepageConfig = c; await this.persistState(); }
    async getAiAutomationSettings() { await this.ensureReady(); return this.data.aiAutomationSettings; }
    async saveAiAutomationSettings(s: any) { await this.ensureReady(); this.data.aiAutomationSettings = s; await this.persistState(); }
    async getDataSources() { await this.ensureReady(); return this.data.dataSources; }
    async addDataSource(catId: number, src: any) { /* Implementar */ }
    async updateDataSource(id: number, src: any) { /* Implementar */ }
    async deleteDataSource(id: number) { /* Implementar */ }
    async addDataSourceCategory(n: string) { /* Implementar */ }
    async renameDataSourceCategory(id: number, n: string) { /* Implementar */ }
    async deleteDataSourceCategory(id: number) { /* Implementar */ }
    async addSourceToCategoryByName(s: any) { /* Implementar */ }
    async validateAllDataSources() { /* Implementar */ }
    async runAiAutomationTask() { /* Implementar */ }
    async saveUserApiKey(uid: number, key: string) { await this.ensureReady(); const u = this.data.users.find((x:any)=>x.id===uid); if(u) { u.apiKey = key; u.canUseOwnApiKey=true; await this.persistState(); } }
    async removeUserApiKey(uid: number) { await this.ensureReady(); const u = this.data.users.find((x:any)=>x.id===uid); if(u) { u.apiKey = null; await this.persistState(); } }
    async checkUserFeatureAccess(uid: number, f: string) { return true; }
    async updateUserProfile(uid: number, updates: any) { await this.ensureReady(); const u = this.data.users.find((x:any)=>x.id===uid); Object.assign(u, updates); await this.persistState(); return u; }
    async getUserPlanDetails(u: User) { return { plan: { name: 'Pro' }, features: [] }; }
    async addApiKey(k: string, u: string) { /* Impl */ }
    async removeApiKey(id: number, u: string) { /* Impl */ }
    async toggleApiKeyStatus(id: number, u: string) { /* Impl */ }
    async setApiKeyStatus(id: number, s: string) { /* Impl */ }
    async savePlan(p: any) { /* Impl */ }
    async deletePlan(id: string) { /* Impl */ }
    async saveModuleRules(view: string, rules: string) { await this.ensureReady(); const m = this.data.modules.find((x:any)=>x.view===view); if(m) { m.rules = rules; await this.persistState(); } }
    async updateModuleStatus(id: string, active: boolean) { await this.ensureReady(); const m = this.data.modules.find((x:any)=>x.id===id); if(m) { m.active = active; await this.persistState(); } }
    async saveModuleConfig(id: string, updates: any) { await this.ensureReady(); const m = this.data.modules.find((x:any)=>x.id===id); if(m) { Object.assign(m, updates); await this.persistState(); } }
    async deleteModule(id: string) { /* Impl */ }
    async addModule(m: any) { /* Impl */ }
    async getCompactDatabaseSnapshot() { return "{}"; }
    async uploadFile(f: File) { return URL.createObjectURL(f); }
    async executeServerCommand(c: string) { return { success: true, output: "Simulated" }; }
    async checkForRemoteUpdates() { return { updated: false }; }
    async getFullDatabaseBackup() { return this.data; }
    async resetDatabase() { this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE)); await this.persistState(); }
    async downloadMysqlInstaller() { alert("Use o backup JSON nesta versão."); }
}

export const dbService = new DbService();
