
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

// ... (initial constants maintained) ...
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
        // Use relative path for production to avoid CORS issues and port mismatches.
        // Vite proxy (dev) and Nginx (prod) handle the redirection to the backend.
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

    async testConnection(): Promise<{ status: string, details: string }> {
        try {
            // We use /system/status as the health check endpoint
            const response = await fetch(`${this.getApiUrl()}/system/status`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            const contentType = response.headers.get("content-type");
            
            if (contentType && contentType.includes("text/html")) {
                 console.warn("[DB] Proxy Error: Received HTML from API endpoint.");
                 return { status: 'Falha', details: 'ERRO DE PROXY: Nginx retornou HTML (index.html) em vez de JSON.' };
            }
            
            if (!response.ok) {
                return { status: 'Erro Backend', details: `HTTP ${response.status}` };
            }
            
            const data = await response.json();
            return { status: 'Conectado', details: `Online` };
        } catch (e) {
            console.warn("[DB] Connection error:", e);
            return { status: 'Offline', details: 'Servidor inalcançável.' };
        }
    }

    private async init() {
        try {
            // Ensure minimal initialization for UI rendering
            if (!this.data) await this.resetDatabase(false);
            this.initialized = true;
        } catch (e) {
            console.error("Init failed", e);
        }
    }

    private async ensureReady() {
        if (!this.initialized) await this.init();
    }

    async resetDatabase(persist = true) {
        // Sets default structure to prevent UI crashes if backend is unreachable
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

    // --- Public Methods ---

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

    async getUsers(): Promise<User[]> { return this.request('/users'); }
    async saveUser(user: User, adminUsername: string) { return this.request('/users', { method: 'POST', body: JSON.stringify(user) }); }
    async deleteUser(id: number, adminUsername: string): Promise<boolean> { return this.request(`/users/${id}`, { method: 'DELETE' }).then(() => true).catch(() => false); }
    async updateUserProfile(id: number, updates: Partial<User>): Promise<User> { return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) }); }

    async getModules(): Promise<Module[]> { return this.request('/modules'); }
    async getPlans(): Promise<UserPlan[]> { return this.request('/plans'); }
    async savePlan(plan: UserPlan) { return this.request('/plans', { method: 'POST', body: JSON.stringify(plan) }); }
    async deletePlan(id: string) { return this.request(`/plans/${id}`, { method: 'DELETE' }); }
    
    async getUserActiveModules(user: User): Promise<Module[]> {
        try {
            const modules = await this.getModules();
            const plans = await this.getPlans();
            const plan = plans.find(p => p.id === user.planId);
            return plan ? modules.filter(m => m.active && plan.modules.includes(m.id)) : [];
        } catch (e) {
            return initialModules;
        }
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

    async getModule(view: string): Promise<Module | undefined> { return (await this.getModules()).find(m => m.view === view); }
    async updateModuleStatus(id: string, active: boolean) { return this.request(`/modules/${id}`, { method: 'PUT', body: JSON.stringify({ active }) }); }
    async saveModuleRules(id: string, rules: string) { return this.request(`/modules/${id}`, { method: 'PUT', body: JSON.stringify({ rules }) }); }
    async saveModuleConfig(id: string, updates: Partial<Module>) { return this.request(`/modules/${id}`, { method: 'PUT', body: JSON.stringify(updates) }); }
    async addModule(module: Module) { return this.request('/modules', { method: 'POST', body: JSON.stringify(module) }); }
    async deleteModule(id: string) { return this.request(`/modules/${id}`, { method: 'DELETE' }); }
    
    async installModule(file: File): Promise<void> {
        const formData = new FormData();
        formData.append('modulePackage', file);
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${this.getApiUrl()}/modules/install`, {
            method: 'POST',
            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
            body: formData
        });
        if (!res.ok) throw new Error('Falha na instalação do módulo');
    }

    async getTheme(): Promise<ThemeConfig> { return this.request('/settings/theme'); }
    async saveTheme(config: ThemeConfig, user: string) { return this.request('/settings/theme', { method: 'POST', body: JSON.stringify(config) }); }
    async getHomepageConfig(): Promise<HomepageConfig> { return this.request('/settings/homepage'); }
    async saveHomepageConfig(config: HomepageConfig, user: string) { return this.request('/settings/homepage', { method: 'POST', body: JSON.stringify(config) }); }
    
    async getSystemPrompt(): Promise<string> { return this.request('/settings/ai').then(r => r.systemPrompt); }
    async setSystemPrompt(prompt: string, user: string) { return this.request('/settings/ai', { method: 'POST', body: JSON.stringify({ systemPrompt: prompt }) }); }
    async getAiAutomationSettings(): Promise<AiAutomationSettings> { return this.request('/settings/ai').then(r => r.automation); }
    async saveAiAutomationSettings(settings: AiAutomationSettings) { return this.request('/settings/ai/automation', { method: 'POST', body: JSON.stringify(settings) }); }
    async runAiAutomationTask() { return this.request('/settings/ai/run', { method: 'POST' }); }
    async proxyAiRequest(payload: any) { return this.request('/ai/generate', { method: 'POST', body: JSON.stringify(payload) }); }

    async getApiKeys(): Promise<ApiKey[]> { return this.request('/settings/keys'); }
    async addApiKey(key: string, username: string) { return this.request('/settings/keys', { method: 'POST', body: JSON.stringify({ key }) }); }
    async removeApiKey(id: number, username: string) { return this.request(`/settings/keys/${id}`, { method: 'DELETE' }); }
    async toggleApiKeyStatus(id: number, username: string) { return this.request(`/settings/keys/${id}/toggle`, { method: 'PUT' }); }
    async setApiKeyStatus(id: number, status: string) { return this.request(`/settings/keys/${id}/toggle`, { method: 'PUT' }); }
    async saveUserApiKey(userId: number, key: string) { return this.updateUserProfile(userId, { apiKey: key, canUseOwnApiKey: true }); }
    async removeUserApiKey(userId: number) { return this.updateUserProfile(userId, { apiKey: '', canUseOwnApiKey: false }); }

    async getEmployees(refresh = false): Promise<Employee[]> { return this.request('/domain/employees'); }
    async getCompanies(): Promise<Company[]> { return this.request('/domain/companies'); }
    async getContracts(): Promise<Contract[]> { return this.request('/domain/contracts'); }
    async getLawsuits(): Promise<Lawsuit[]> { return this.request('/domain/judicial'); }
    async getSocialPosts(): Promise<SocialPost[]> { return this.request('/domain/social'); }
    async getTimelineEvents(): Promise<TimelineEvent[]> { return this.request('/domain/timeline'); }
    async getAllPoliticians(): Promise<Politician[]> { return this.request('/domain/politicians'); }
    
    async getDashboardData(municipality: string, refresh: boolean): Promise<DashboardData> {
        const url = `/dashboard/${encodeURIComponent(municipality)}`;
        if (refresh) {
            await this.request(url, { method: 'POST' });
        }
        return this.request(url);
    }

    async getDashboardWidgets(): Promise<DashboardWidget[]> {
        const stored = localStorage.getItem('dashboard_widgets');
        return stored ? JSON.parse(stored) : defaultDashboardWidgets;
    }
    async saveDashboardWidgets(widgets: DashboardWidget[]) { localStorage.setItem('dashboard_widgets', JSON.stringify(widgets)); }

    async getLogs(): Promise<LogEntry[]> { return this.request('/logs'); }
    async logActivity(level: string, message: string, user: string) { 
        this.request('/logs', { method: 'POST', body: JSON.stringify({ level, message, user }) }).catch(console.error); 
    }
    async getSystemDashboardStats() { return this.request('/system/status'); } 
    async getStats() { return this.getSystemDashboardStats().then(s => s.system || {}); }
    
    async getDbConfig(): Promise<DbConfig> { return { status: (await this.testConnection()).status as any, apiUrl: '/api', apiToken: '***' }; }
    async saveDbConfig(config: DbConfig, user: string) { return Promise.resolve(); }

    async uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('auth_token');
        
        const res = await fetch(`${this.getApiUrl()}/upload`, {
            method: 'POST',
            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
            body: formData
        });
        
        if(!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.file.url;
    }

    async downloadMysqlInstaller() { 
        const token = localStorage.getItem('auth_token');
        window.open(`${this.getApiUrl()}/data/backup/sql?token=${token}`, '_blank'); 
    }
    async getFullDatabaseBackup() { return this.request('/data/backup/json'); }
    async resetDatabaseRemote() { return this.request('/data/reset', { method: 'POST' }); }
    
    async getDataSources(): Promise<DataSourceCategory[]> { return initialDataSources; } 
    async addDataSource(catId: number, source: any) { /* TODO */ }
    async updateDataSource(id: number, updates: any) { /* TODO */ }
    async deleteDataSource(id: number) { /* TODO */ }
    async toggleDataSourceStatus(id: number) { /* TODO */ }
    async addDataSourceCategory(name: string) { /* TODO */ }
    async renameDataSourceCategory(id: number, name: string) { /* TODO */ }
    async deleteDataSourceCategory(id: number) { /* TODO */ }
    async addSourceToCategoryByName(source: SuggestedSource) { /* TODO */ }
    async validateAllDataSources() { /* TODO */ }
    async getNextSystemApiKey() { return ''; }
    async checkForRemoteUpdates() { return { updated: false, message: "Sistema atualizado.", version: "3.1.0" }; }
    async executeServerCommand(cmd: string) { return { success: false, output: "Comando não permitido via API pública." }; }
    async scanPoliticalSquad(municipality: string) { /* TODO: Move to backend AI service */ }
    async ensurePoliticalLeadership(municipality: string) { return this.getAllPoliticians(); }
    async togglePoliticianMonitoring(id: string) { /* TODO */ }
    
    async getPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> { 
        try {
            const p = (await this.getAllPoliticians()).find(x => x.id === id);
            if(!p) throw new Error("Not found");
            return { data: p, timestamp: Date.now(), source: 'api' };
        } catch (e) {
            throw e;
        }
    }
    
    async refreshPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> { return this.getPoliticianAnalysisData(id); }
    async getUserUsageStats(id: number) { return { usage: 0, limit: 100 }; }
    async getCompactDatabaseSnapshot() { return "{}"; }
}

export const dbService = new DbService();
