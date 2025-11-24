
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

// ... (constantes iniciais mantidas) ...
const initialPlans: UserPlan[] = [
    { id: 'starter', name: 'Starter', features: [], modules: ['dashboard'], requestLimit: 100 },
    { id: 'pro', name: 'Pro', features: ['ai_analysis', 'own_api_key'], modules: ['dashboard', 'political', 'employees'], requestLimit: 500 },
    { id: 'enterprise', name: 'Enterprise', features: ['ai_analysis', 'advanced_search', 'data_export', 'own_api_key', 'priority_support'], modules: ['dashboard', 'political', 'employees', 'companies', 'contracts', 'judicial', 'social', 'timeline', 'ocr', 'research'], requestLimit: -1 }
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
    subtitle: 'Plataforma de Inteligência Governamental',
    heroImageUrl: '',
    logoUrl: '',
    features: [],
    customColors: { background: '#000000', text: '#ffffff', primary: '#3B82F6' }
};

const CURRENT_VERSION = '3.1.0'; 
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

    constructor() {
        this.init();
    }

    private getApiUrl(): string {
        return '/api'; 
    }

    private getApiHeaders(): HeadersInit {
        const token = localStorage.getItem('auth_token');
        const headers: any = {
            'Content-Type': 'application/json',
            'x-sync-token': this.data?.dbConfig?.apiToken || DEFAULT_API_TOKEN
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // --- INTELIGÊNCIA DE DIAGNÓSTICO DE CONEXÃO ---
    async testConnection(): Promise<{ status: string, details: string }> {
        try {
            const response = await fetch(`${this.getApiUrl()}/system/status`);
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                 return { status: 'Falha Crítica', details: 'ERRO DE PROXY: Nginx retornou HTML.' };
            }
            if (!response.ok) {
                return { status: 'Erro Backend', details: `HTTP ${response.status}` };
            }
            const data = await response.json();
            return { status: 'Conectado', details: `Online v${data.version || '?'}` };
        } catch (e) {
            return { status: 'Offline', details: 'Servidor inalcançável.' };
        }
    }

    private async init() {
        try {
            const diagnosis = await this.testConnection();
            if (diagnosis.status !== 'Conectado') {
                await this.resetDatabase(false);
                this.initialized = true;
                return;
            }
            const response = await fetch(`${this.getApiUrl()}/state`, { 
                headers: { 'x-sync-token': DEFAULT_API_TOKEN } 
            });
            if (response.ok) {
                const remoteData = await response.json();
                if (remoteData && Object.keys(remoteData).length > 0) {
                    this.data = remoteData;
                }
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
        // Placeholder para modo offline
    }

    async resetDatabase(persist = true) {
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
            dbConfig: { 
                apiUrl: '', 
                apiToken: DEFAULT_API_TOKEN, 
                status: 'Conectado',
                host: '127.0.0.1',
                port: '3306',
                user: 'sie301',
                password: '***',
                database: 'sie301'
            },
            systemPrompt: 'Você é um analista de inteligência estratégica governamental.',
            logs: [],
            aiAutomationSettings: { isEnabled: false, frequency: 'daily' },
            themeConfig: initialThemeConfig,
            homepageConfig: initialHomepageConfig
        };
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        await this.ensureReady();
        
        if (['POST', 'PUT', 'DELETE'].includes(options.method || '')) {
             const check = await this.testConnection();
             if (check.status !== 'Conectado') throw new Error(check.details);
        }

        const res = await fetch(`${this.getApiUrl()}${endpoint}`, {
            ...options,
            headers: { ...this.getApiHeaders(), ...options.headers }
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Erro HTTP ${res.status}`);
        }
        return res.json();
    }

    // --- INSTALL MODULE (NEW) ---
    async installModule(file: File): Promise<void> {
        const formData = new FormData();
        formData.append('modulePackage', file);
        
        const token = this.data?.dbConfig?.apiToken || DEFAULT_API_TOKEN;
        const tokenObject = localStorage.getItem('auth_token'); // Get user JWT for auth middleware

        const res = await fetch(`${this.getApiUrl()}/modules/install`, {
            method: 'POST',
            headers: {
                'x-sync-token': token,
                'Authorization': tokenObject ? `Bearer ${tokenObject}` : ''
            },
            body: formData
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Falha na instalação do módulo');
        }
    }

    // Users
    async getUsers(): Promise<User[]> { return this.request('/users'); }
    async saveUser(user: User, adminUsername: string) { return this.request('/users', { method: 'POST', body: JSON.stringify(user) }); }
    async deleteUser(id: number, adminUsername: string): Promise<boolean> { return this.request(`/users/${id}`, { method: 'DELETE' }).then(() => true).catch(() => false); }
    async updateUserProfile(id: number, updates: Partial<User>): Promise<User> { return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) }); }

    // Auth
    async login(username: string, password: string): Promise<User> { 
        const res = await this.request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        if (res.token) localStorage.setItem('auth_token', res.token);
        return res.user;
    }

    async validateSession(): Promise<User | null> {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;
        try {
            return await this.request('/auth/me');
        } catch (error) {
            localStorage.removeItem('auth_token');
            return null;
        }
    }

    // Modules & Plans
    async getModules(): Promise<Module[]> { return this.request('/modules'); }
    async getPlans(): Promise<UserPlan[]> { return this.request('/plans'); }
    async savePlan(plan: UserPlan) { return this.request('/plans', { method: 'POST', body: JSON.stringify(plan) }); }
    async deletePlan(id: string) { return this.request(`/plans/${id}`, { method: 'DELETE' }); }
    async getUserActiveModules(user: User): Promise<Module[]> {
        const modules = await this.getModules();
        const plans = await this.getPlans();
        const plan = plans.find(p => p.id === user.planId);
        return plan ? modules.filter(m => m.active && plan.modules.includes(m.id)) : [];
    }
    async getUserPlanDetails(user: User) {
        const plans = await this.getPlans();
        const plan = plans.find(p => p.id === user.planId);
        const features = initialFeatures;
        if (!plan) throw new Error("Plan not found");
        return { plan, features: features.map(f => ({ ...f, isActive: plan.features.includes(f.key) })) };
    }
    async checkUserFeatureAccess(userId: number, featureKey: FeatureKey): Promise<boolean> {
        const user = (await this.getUsers()).find(u => u.id === userId);
        if (!user) return false;
        const plans = await this.getPlans();
        const plan = plans.find(p => p.id === user.planId);
        return plan ? plan.features.includes(featureKey) : false;
    }

    // Module Configs
    async getModule(view: string): Promise<Module | undefined> { return (await this.getModules()).find(m => m.view === view); }
    async updateModuleStatus(id: string, active: boolean) { return this.request(`/modules/${id}`, { method: 'PUT', body: JSON.stringify({ active }) }); }
    async saveModuleRules(id: string, rules: string) { return this.request(`/modules/${id}`, { method: 'PUT', body: JSON.stringify({ rules }) }); }
    async saveModuleConfig(id: string, updates: Partial<Module>) { return this.request(`/modules/${id}`, { method: 'PUT', body: JSON.stringify(updates) }); }
    async addModule(module: Module) { return this.request('/modules', { method: 'POST', body: JSON.stringify(module) }); }
    async deleteModule(id: string) { return this.request(`/modules/${id}`, { method: 'DELETE' }); }

    // Settings
    async getTheme(): Promise<ThemeConfig> { return this.request('/settings/theme'); }
    async saveTheme(config: ThemeConfig, user: string) { return this.request('/settings/theme', { method: 'POST', body: JSON.stringify(config) }); }
    async getHomepageConfig(): Promise<HomepageConfig> { return this.request('/settings/homepage'); }
    async saveHomepageConfig(config: HomepageConfig, user: string) { return this.request('/settings/homepage', { method: 'POST', body: JSON.stringify(config) }); }
    
    // AI
    async getSystemPrompt(): Promise<string> { return this.request('/settings/ai').then(r => r.systemPrompt); }
    async setSystemPrompt(prompt: string, user: string) { return this.request('/settings/ai', { method: 'POST', body: JSON.stringify({ systemPrompt: prompt }) }); }
    async getAiAutomationSettings(): Promise<AiAutomationSettings> { return this.request('/settings/ai').then(r => r.automation); }
    async saveAiAutomationSettings(settings: AiAutomationSettings) { return this.request('/settings/ai/automation', { method: 'POST', body: JSON.stringify(settings) }); }
    async runAiAutomationTask() { return this.request('/settings/ai/run', { method: 'POST' }); }
    async proxyAiRequest(payload: any) { return this.request('/ai/generate', { method: 'POST', body: JSON.stringify(payload) }); }

    // Keys
    async getApiKeys(): Promise<ApiKey[]> { return this.request('/settings/keys'); }
    async addApiKey(key: string, username: string) { return this.request('/settings/keys', { method: 'POST', body: JSON.stringify({ key }) }); }
    async removeApiKey(id: number, username: string) { return this.request(`/settings/keys/${id}`, { method: 'DELETE' }); }
    async toggleApiKeyStatus(id: number, username: string) { return this.request(`/settings/keys/${id}/toggle`, { method: 'PUT' }); }
    async setApiKeyStatus(id: number, status: string) { return this.request(`/settings/keys/${id}/toggle`, { method: 'PUT' }); }
    async saveUserApiKey(userId: number, key: string) { return this.updateUserProfile(userId, { apiKey: key, canUseOwnApiKey: true }); }
    async removeUserApiKey(userId: number) { return this.updateUserProfile(userId, { apiKey: '', canUseOwnApiKey: false }); }

    // Domain
    async getEmployees(refresh = false): Promise<Employee[]> { return this.request('/domain/employees'); }
    async getCompanies(): Promise<Company[]> { return this.request('/domain/companies'); }
    async getContracts(): Promise<Contract[]> { return this.request('/domain/contracts'); }
    async getLawsuits(): Promise<Lawsuit[]> { return this.request('/domain/judicial'); }
    async getSocialPosts(): Promise<SocialPost[]> { return this.request('/domain/social'); }
    async getTimelineEvents(): Promise<TimelineEvent[]> { return this.request('/domain/timeline'); }
    async getAllPoliticians(): Promise<Politician[]> { return this.request('/domain/politicians'); }
    
    async getDashboardData(municipality: string, refresh: boolean): Promise<DashboardData> {
        const url = `/dashboard/${encodeURIComponent(municipality)}`;
        if (refresh) await this.request(url, { method: 'POST' });
        return this.request(url);
    }

    async getDashboardWidgets(): Promise<DashboardWidget[]> {
        const stored = localStorage.getItem('dashboard_widgets');
        return stored ? JSON.parse(stored) : defaultDashboardWidgets;
    }
    async saveDashboardWidgets(widgets: DashboardWidget[]) { localStorage.setItem('dashboard_widgets', JSON.stringify(widgets)); }

    // System & Logs
    async getLogs(): Promise<LogEntry[]> { return this.request('/logs'); }
    async logActivity(level: string, message: string, user: string) { this.request('/logs', { method: 'POST', body: JSON.stringify({ level, message, user }) }).catch(console.error); }
    async getSystemDashboardStats() { return this.request('/system/stats'); }
    async getStats() { return this.getSystemDashboardStats().then(s => s.system); }
    async getDbConfig(): Promise<DbConfig> { return { status: (await this.testConnection()).status as any, apiUrl: '/api', apiToken: '***' }; }
    async saveDbConfig(config: DbConfig, user: string) { return Promise.resolve(); }

    // Files
    async uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        const tokenObject = localStorage.getItem('auth_token');
        const res = await fetch(`${this.getApiUrl()}/upload`, {
            method: 'POST',
            headers: { 
                'Authorization': tokenObject ? `Bearer ${tokenObject}` : ''
            },
            body: formData
        });
        if(!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.file.url;
    }

    // Fallbacks and Stubs
    async getDataSources(): Promise<DataSourceCategory[]> { return initialDataSources; } 
    async addDataSource(catId: number, source: any) { /* Stub */ }
    async updateDataSource(id: number, updates: any) { /* Stub */ }
    async deleteDataSource(id: number) { /* Stub */ }
    async toggleDataSourceStatus(id: number) { /* Stub */ }
    async addDataSourceCategory(name: string) { /* Stub */ }
    async renameDataSourceCategory(id: number, name: string) { /* Stub */ }
    async deleteDataSourceCategory(id: number) { /* Stub */ }
    async addSourceToCategoryByName(source: SuggestedSource) { /* Stub */ }
    async validateAllDataSources() { /* Stub */ }
    async getNextSystemApiKey() { return ''; }
    async checkForRemoteUpdates() { return { updated: false, message: "Up to date", version: "3.1.0" }; }
    async executeServerCommand(cmd: string) { return { success: false, output: "Command execution not enabled via API." }; }
    async downloadMysqlInstaller() { window.open(`${this.getApiUrl()}/data/backup/sql`, '_blank'); }
    async getFullDatabaseBackup() { return this.request('/data/backup/json'); }
    async resetDatabaseRemote() { return this.request('/data/reset', { method: 'POST' }); }
    async scanPoliticalSquad(municipality: string) { /* Stub */ }
    async ensurePoliticalLeadership(municipality: string) { return this.getAllPoliticians(); }
    async togglePoliticianMonitoring(id: string) { /* Stub */ }
    async getPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> { 
        const p = (await this.getAllPoliticians()).find(x => x.id === id);
        if(!p) throw new Error("Not found");
        return { data: p, timestamp: Date.now(), source: 'api' };
    }
    async refreshPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> { return this.getPoliticianAnalysisData(id); }
    async getUserUsageStats(id: number) { return { usage: 0, limit: 100 }; }
    async getCompactDatabaseSnapshot() { return "{}"; }
}

export const dbService = new DbService();
