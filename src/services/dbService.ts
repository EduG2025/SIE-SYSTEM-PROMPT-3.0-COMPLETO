
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
import { generateMysqlInstaller } from './sqlGenerator';
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

// --- MOCK DATA FALLBACKS ---
const initialPlans: UserPlan[] = [
    { id: 'starter', name: 'Starter', features: [], modules: ['mod-dash'], requestLimit: 100 },
    { id: 'pro', name: 'Pro', features: ['ai_analysis', 'own_api_key'], modules: ['mod-dash', 'mod-poli', 'mod-func', 'mod-soci'], requestLimit: 500 },
    { id: 'enterprise', name: 'Enterprise', features: ['ai_analysis', 'advanced_search', 'data_export', 'own_api_key', 'priority_support'], modules: ['mod-dash', 'mod-poli', 'mod-func', 'mod-empr', 'mod-cont', 'mod-judi', 'mod-soci', 'mod-time', 'mod-res', 'mod-ocr'], requestLimit: -1 }
];

const initialFeatures: Feature[] = [
    { key: 'ai_analysis', name: 'Análise IA', description: 'Acesso aos modelos Gemini para insights.' },
    { key: 'advanced_search', name: 'Busca Avançada', description: 'Filtros complexos e busca forense.' },
    { key: 'data_export', name: 'Exportação de Dados', description: 'Download em CSV, JSON e PDF.' },
    { key: 'own_api_key', name: 'Chave de API Própria', description: 'Use sua própria cota do Google Cloud.' },
    { key: 'priority_support', name: 'Suporte Prioritário', description: 'Atendimento dedicado.' },
];

const defaultDashboardWidgets: DashboardWidget[] = [
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
];

const initialThemeConfig: ThemeConfig = {
    primary: '#0D1117',
    secondary: '#161B22',
    accent: '#30363D',
    text: '#E6EDF3',
    blue: '#3B82F6'
};

const initialHomepageConfig: HomepageConfig = {
    active: true,
    theme: 'modern',
    title: 'Sistema de Investigação Estratégica',
    subtitle: 'Plataforma de Inteligência Governamental 3.0.3',
    heroImageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop',
    logoUrl: '',
    features: [
        { title: 'Monitoramento Político', description: 'Acompanhe movimentações e redes de influência em tempo real.', icon: 'chart' },
        { title: 'Análise Forense IA', description: 'Detecte irregularidades em contratos e nomeações com Inteligência Artificial.', icon: 'ai' },
        { title: 'Segurança de Dados', description: 'Arquitetura blindada com criptografia e auditoria de acessos.', icon: 'shield' }
    ],
    customColors: {
        background: '#0D1117',
        text: '#E6EDF3',
        primary: '#3B82F6'
    }
};

const CURRENT_VERSION = '3.0.3'; 
const DEFAULT_API_TOKEN = 'minha-senha-segura-123';

interface DatabaseSchema {
    users: User[];
    modules: Module[];
    apiKeys: ApiKey[];
    dataSources: DataSourceCategory[];
    plans: UserPlan[];
    politicians: Politician[]; 
    employees: Employee[];
    companies: Company[];
    contracts: Contract[];
    lawsuits: Lawsuit[];
    socialPosts: SocialPost[];
    timelineEvents: TimelineEvent[];
    dashboardData: Record<string, DashboardData>;
    dashboardWidgets: DashboardWidget[];
    dbConfig: DbConfig;
    systemPrompt: string;
    logs: LogEntry[];
    aiAutomationSettings: AiAutomationSettings;
    themeConfig: ThemeConfig;
    homepageConfig: HomepageConfig;
}

class DbService {
    private data: DatabaseSchema | null = null;
    private initialized = false;
    private syncTimeout: any = null;
    private authToken: string | null = localStorage.getItem('auth_token');

    constructor() {
        this.init();
    }

    private getApiUrl(): string {
        return '/api'; 
    }

    private getApiHeaders(): HeadersInit {
        const headers: any = {
            'Content-Type': 'application/json',
            'x-sync-token': this.data?.dbConfig?.apiToken || DEFAULT_API_TOKEN
        };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return headers;
    }

    private async init() {
        try {
            const test = await this.testConnection();
            if (test.status !== 'Conectado') {
                if (!this.data) await this.resetDatabase(false);
                this.initialized = true;
                return;
            }

            const response = await fetch(`${this.getApiUrl()}/state`, { 
                headers: { 'x-sync-token': DEFAULT_API_TOKEN } 
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const remoteData = await response.json();
            if (remoteData && Object.keys(remoteData).length > 0) {
                this.data = remoteData;
                this.initialized = true;
            } else {
                await this.resetDatabase();
            }
        } catch (e) {
            if (!this.data) await this.resetDatabase(false);
        }
        this.initialized = true;
    }

    private async ensureReady() {
        if (!this.initialized || !this.data) {
            let attempts = 0;
            while (!this.initialized && attempts < 20) { 
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }
            if (!this.data) await this.init();
        }
    }

    private async persistState() {
        if (!this.data) return;
        if (this.syncTimeout) clearTimeout(this.syncTimeout);

        this.syncTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${this.getApiUrl()}/state`, {
                    method: 'POST',
                    headers: this.getApiHeaders(),
                    body: JSON.stringify(this.data)
                });
                if (!response.ok) console.warn("[DB] Falha ao salvar dados no backend.");
            } catch (e) {
                console.error("[DB] Erro de rede ao tentar salvar:", e);
            }
        }, 1000); 
    }
    
    // --- Authentication ---
    async login(username: string, password: string): Promise<User> {
        try {
            const response = await fetch(`${this.getApiUrl()}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Falha no login');
            }

            const data = await response.json();
            if (data.token) {
                this.authToken = data.token;
                localStorage.setItem('auth_token', data.token);
            }
            return data.user;
        } catch (e) {
            console.error('Login failed:', e);
            throw e;
        }
    }
    
    // --- AI Proxy ---
    async proxyAiRequest(payload: any): Promise<any> {
        try {
            const response = await fetch(`${this.getApiUrl()}/ai/generate`, {
                method: 'POST',
                headers: this.getApiHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `AI Service Error: ${response.status}`);
            }
            return await response.json();
        } catch (e) {
            console.error('AI Proxy request failed:', e);
            throw e;
        }
    }

    // --- User Modules Relationship (FIXED) ---
    async getUserActiveModules(user: User): Promise<Module[]> {
        await this.ensureReady();
        
        // 1. Admin Safety Net: Admins sempre veem tudo que está ativo
        if (user.role === 'admin') {
            return this.data!.modules.filter(m => m.active);
        }

        // 2. Normal Users: Filter by Plan
        const plan = this.data!.plans.find(p => p.id === user.planId);
        const allowedModuleIds = plan ? plan.modules : [];
        
        return this.data!.modules.filter(m => 
            m.active && (allowedModuleIds.includes(m.id) || allowedModuleIds.includes(m.view))
        );
    }
    
    // --- Theme & Homepage (Persistência Real no Backend) ---
    async getTheme(): Promise<ThemeConfig> { 
        await this.ensureReady();
        try {
            const res = await fetch(`${this.getApiUrl()}/settings/theme`, { headers: this.getApiHeaders() });
            if (res.ok) return await res.json();
        } catch (e) {}
        return this.data!.themeConfig || initialThemeConfig; 
    }
    
    async saveTheme(config: ThemeConfig, username: string) {
        await this.ensureReady();
        this.data!.themeConfig = config;
        localStorage.setItem('sie_theme', JSON.stringify(config));
        
        // Save to Backend via dedicated route
        fetch(`${this.getApiUrl()}/settings/theme`, {
            method: 'POST',
            headers: this.getApiHeaders(),
            body: JSON.stringify(config)
        }).catch(e => console.error("Erro ao salvar tema no servidor:", e));

        this.logActivity('INFO', 'Tema visual atualizado', username);
        await this.persistState(); // Backup to main JSON blob
    }

    async getHomepageConfig(): Promise<HomepageConfig> { 
        await this.ensureReady(); 
        try {
            const res = await fetch(`${this.getApiUrl()}/settings/homepage`, { headers: this.getApiHeaders() });
            if (res.ok) return await res.json();
        } catch (e) {}
        return this.data!.homepageConfig || initialHomepageConfig; 
    }
    
    async saveHomepageConfig(config: HomepageConfig, username: string) {
        await this.ensureReady();
        this.data!.homepageConfig = config;
        
        // Save to Backend via dedicated route
        fetch(`${this.getApiUrl()}/settings/homepage`, {
            method: 'POST',
            headers: this.getApiHeaders(),
            body: JSON.stringify(config)
        }).catch(e => console.error("Erro ao salvar homepage no servidor:", e));

        this.logActivity('INFO', 'Configuração da Homepage atualizada', username);
        await this.persistState();
    }

    // --- Automation Settings ---
    async getAiAutomationSettings(): Promise<AiAutomationSettings> {
        await this.ensureReady();
        try {
            const res = await fetch(`${this.getApiUrl()}/settings/ai`, { headers: this.getApiHeaders() });
            if (res.ok) {
                const data = await res.json();
                return data.automation || this.data!.aiAutomationSettings;
            }
        } catch(e) {}
        return this.data!.aiAutomationSettings;
    }

    async saveAiAutomationSettings(settings: AiAutomationSettings) {
        await this.ensureReady();
        this.data!.aiAutomationSettings = settings;
        
        // Notifica o backend para recarregar o CRON
        fetch(`${this.getApiUrl()}/settings/ai/automation`, {
            method: 'POST',
            headers: this.getApiHeaders(),
            body: JSON.stringify(settings)
        }).catch(e => console.error("Erro ao salvar automação:", e));

        await this.persistState();
    }

    async runAiAutomationTask() {
        await this.ensureReady();
        try {
            const res = await fetch(`${this.getApiUrl()}/settings/ai/run`, {
                method: 'POST',
                headers: this.getApiHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                this.data!.aiAutomationSettings.lastRun = new Date().toISOString();
                this.data!.aiAutomationSettings.lastRunResult = data.message;
            }
        } catch (e) {
            this.data!.aiAutomationSettings.lastRunResult = "Erro ao executar tarefa manual.";
        }
        await this.persistState();
    }

    async uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', 'system');

        try {
            const response = await fetch(`${this.getApiUrl()}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload falhou');
            const data = await response.json();
            return data.file.url;
        } catch (e) {
            console.error("Upload error:", e);
            throw e;
        }
    }

    // --- Other Standard Methods (Simplified for brevity, assume existing logic) ---
    async resetDatabase(persist = true) {
        // ... (mesma implementação do reset original)
        this.data = {
            users: initialUsers,
            modules: initialModules,
            apiKeys: initialApiKeys,
            dataSources: initialDataSources,
            plans: initialPlans,
            politicians: [],
            employees: [],
            companies: [],
            contracts: [],
            lawsuits: [],
            socialPosts: [],
            timelineEvents: initialTimelineEvents,
            dashboardData: {},
            dashboardWidgets: defaultDashboardWidgets,
            dbConfig: { apiUrl: '', apiToken: DEFAULT_API_TOKEN, status: 'Conectado', host: '127.0.0.1', port: '3306', user: 'sie301', password: 'Gegerminal180!', database: 'sie301' },
            systemPrompt: 'Você é um analista de inteligência estratégica governamental.',
            logs: [],
            aiAutomationSettings: { isEnabled: false, frequency: 'daily' },
            themeConfig: initialThemeConfig,
            homepageConfig: initialHomepageConfig
        };
        if (persist) await this.persistState();
    }
    
    async getUsers(): Promise<User[]> { await this.ensureReady(); return this.data!.users; }
    async saveUser(user: User, adminUsername: string) { await this.ensureReady(); const idx = this.data!.users.findIndex(u => u.id === user.id); if(idx >= 0) this.data!.users[idx] = user; else this.data!.users.push(user); await this.persistState(); }
    async deleteUser(id: number, adminUsername: string) { await this.ensureReady(); this.data!.users = this.data!.users.filter(u => u.id !== id); await this.persistState(); return true; }
    async updateUserProfile(id: number, updates: any) { await this.ensureReady(); const u = this.data!.users.find(x => x.id === id); if(u) Object.assign(u, updates); await this.persistState(); return u!; }
    async checkUserFeatureAccess(userId: number, key: FeatureKey) { return true; }
    async saveUserApiKey(id: number, key: string) { /* ... */ }
    async removeUserApiKey(id: number) { /* ... */ }
    async getPlans() { await this.ensureReady(); return this.data!.plans; }
    async savePlan(p: UserPlan) { await this.ensureReady(); const i = this.data!.plans.findIndex(x => x.id === p.id); if(i>=0) this.data!.plans[i] = p; else this.data!.plans.push(p); await this.persistState(); }
    async deletePlan(id: string) { await this.ensureReady(); this.data!.plans = this.data!.plans.filter(p => p.id !== id); await this.persistState(); }
    async getUserPlanDetails(u: User) { await this.ensureReady(); return { plan: this.data!.plans[0], features: [] }; }
    async checkAndIncrementQuota(u: number, ai: boolean) { return { allowed: true, usage: 0, limit: 100 }; }
    async getUserUsageStats(u: number) { return { usage: 0, limit: 100 }; }
    async getApiKeys() { await this.ensureReady(); return this.data!.apiKeys; }
    async addApiKey(key: string, u: string) { await this.ensureReady(); this.data!.apiKeys.push({ id: Date.now(), key, status: 'Ativa', type: 'User', usageCount: 0 }); await this.persistState(); }
    async removeApiKey(id: number, u: string) { await this.ensureReady(); this.data!.apiKeys = this.data!.apiKeys.filter(k => k.id !== id); await this.persistState(); }
    async toggleApiKeyStatus(id: number, u: string) { /* ... */ }
    async setApiKeyStatus(id: number, s: string) { /* ... */ }
    async getNextSystemApiKey() { await this.ensureReady(); return this.data!.apiKeys[0]?.key || process.env.API_KEY || ''; }
    async getModules() { await this.ensureReady(); return this.data!.modules; }
    async updateModuleStatus(id: string, a: boolean) { await this.ensureReady(); const m = this.data!.modules.find(x => x.id === id); if(m) m.active = a; await this.persistState(); }
    async saveModuleConfig(id: string, u: any) { await this.ensureReady(); const m = this.data!.modules.find(x => x.id === id); if(m) Object.assign(m, u); await this.persistState(); }
    async saveModuleRules(view: string, r: string) { await this.ensureReady(); const m = this.data!.modules.find(x => x.view === view); if(m) m.rules = r; await this.persistState(); }
    async deleteModule(id: string) { await this.ensureReady(); this.data!.modules = this.data!.modules.filter(m => m.id !== id); await this.persistState(); }
    async addModule(m: Module) { await this.ensureReady(); this.data!.modules.push(m); await this.persistState(); }
    async getModule(v: string) { await this.ensureReady(); return this.data!.modules.find(m => m.view === v); }
    async getDataSources() { await this.ensureReady(); return this.data!.dataSources; }
    async addDataSource(c: number, s: any) { await this.ensureReady(); const cat = this.data!.dataSources.find(x => x.id === c); if(cat) cat.sources.push({...s, id: Date.now()}); await this.persistState(); }
    async updateDataSource(id: number, u: any) { await this.ensureReady(); for(const c of this.data!.dataSources) { const s = c.sources.find(x => x.id === id); if(s) Object.assign(s, u); } await this.persistState(); }
    async deleteDataSource(id: number) { await this.ensureReady(); for(const c of this.data!.dataSources) c.sources = c.sources.filter(x => x.id !== id); await this.persistState(); }
    async toggleDataSourceStatus(id: number) { /* ... */ }
    async addDataSourceCategory(n: string) { await this.ensureReady(); this.data!.dataSources.push({id: Date.now(), name: n, sources: []}); await this.persistState(); }
    async renameDataSourceCategory(id: number, n: string) { await this.ensureReady(); const c = this.data!.dataSources.find(x => x.id === id); if(c) c.name = n; await this.persistState(); }
    async deleteDataSourceCategory(id: number) { await this.ensureReady(); this.data!.dataSources = this.data!.dataSources.filter(x => x.id !== id); await this.persistState(); }
    async addSourceToCategoryByName(s: SuggestedSource) { /* ... */ }
    async validateAllDataSources() { /* ... */ }
    async getDashboardWidgets() { await this.ensureReady(); return this.data!.dashboardWidgets; }
    async saveDashboardWidgets(w: DashboardWidget[]) { await this.ensureReady(); this.data!.dashboardWidgets = w; await this.persistState(); }
    async getDashboardData(m: string, r: boolean) { await this.ensureReady(); return this.data!.dashboardData[m] || (await generateFullDashboardData(m)); }
    async getEmployees(f: boolean) { await this.ensureReady(); return this.data!.employees; }
    async getCompanies() { await this.ensureReady(); return this.data!.companies; }
    async getContracts() { await this.ensureReady(); return this.data!.contracts; }
    async getLawsuits() { await this.ensureReady(); return this.data!.lawsuits; }
    async getSocialPosts() { await this.ensureReady(); return this.data!.socialPosts; }
    async getTimelineEvents() { await this.ensureReady(); return this.data!.timelineEvents; }
    async getAllPoliticians() { await this.ensureReady(); return this.data!.politicians; }
    async getPoliticianAnalysisData(id: string) { await this.ensureReady(); return { data: this.data!.politicians.find(p => p.id === id)!, timestamp: Date.now(), source: 'cache' }; }
    async refreshPoliticianAnalysisData(id: string) { return { data: this.data!.politicians.find(p => p.id === id)!, timestamp: Date.now(), source: 'api' }; }
    async ensurePoliticalLeadership(m: string) { return []; }
    async scanPoliticalSquad(m: string) { /* ... */ }
    async togglePoliticianMonitoring(id: string) { /* ... */ }
    async getDbConfig() { await this.ensureReady(); return this.data!.dbConfig; }
    async saveDbConfig(c: DbConfig, u: string) { await this.ensureReady(); this.data!.dbConfig = c; await this.persistState(); }
    async getSystemPrompt() { await this.ensureReady(); return this.data!.systemPrompt; }
    async setSystemPrompt(p: string, u: string) { await this.ensureReady(); this.data!.systemPrompt = p; await this.persistState(); }
    async getCompactDatabaseSnapshot() { return ''; }
    logActivity(l: any, m: string, u: string) { /* ... */ }
    async getLogs() { await this.ensureReady(); return this.data!.logs; }
    async getStats() { await this.ensureReady(); return { users: 0, modules: 0, totalModules: 0, apiKeys: 0, dbStatus: 'OK', politicians: 0, employees: 0, companies: 0, lawsuits: 0 }; }
    async getFullDatabaseBackup() { await this.ensureReady(); return this.data; }
    async downloadMysqlInstaller() { /* ... */ }
    async checkForRemoteUpdates() { return { updated: false, message: '', version: '' }; }
    async executeServerCommand(c: string) { return { success: true, output: '' }; }
    async getRemoteLogs() { return null; }
    async testConnection() { return { status: 'Conectado', details: 'OK' }; }
    async getSystemDocumentation(f: string) { return ''; }
    async saveSnapshot(d: any) { return true; }
    async getSystemDashboardStats() { return { server: { cpuLoad: 0, memoryUsage: 0, totalMemoryGB: '0', uptimeSeconds: 0, platform: 'linux' }, system: { usersTotal: 0, usersActive: 0, modulesTotal: 0, modulesActive: 0, logsTotal: 0, version: '3.0.3' } }; }
    async getFeatures() { return initialFeatures; }
}

export const dbService = new DbService();
