
import type { 
    User, Module, DashboardData, DashboardWidget, LogEntry, ApiKey, 
    DbConfig, DataSourceCategory, AiAutomationSettings, PoliticianDataResponse,
    Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent,
    Politician, UserPlan, Feature, FeatureKey, SuggestedSource
} from '../types';
import { initialUsers } from '../data/mock/users';
import { initialModules } from '../data/mock/modules';
import { initialApiKeys } from '../data/mock/apiKeys';
import { initialDataSources } from '../data/mock/dataSources';
import { politiciansDatabase } from '../data/mock/politicalAnalysisData';
// CORREÇÃO: Importação redirecionada para timelineData para evitar conflito de extensão .ts/.tsx
import { initialTimelineEvents } from '../data/mock/timelineData';

class DbService {
    private users: User[] = [];
    private modules: Module[] = [];
    private apiKeys: ApiKey[] = [];
    private dataSources: DataSourceCategory[] = [];
    private logs: LogEntry[] = [];
    private dashboardWidgets: DashboardWidget[] = [];
    private systemPrompt: string = '';
    private dbConfig: DbConfig = { host: 'localhost', port: '3306', user: 'root', status: 'Desconectado' };
    private aiAutomationSettings: AiAutomationSettings = { isEnabled: false, frequency: 'daily' };
    private plans: UserPlan[] = [];
    
    private employees: Employee[] = [];
    private companies: Company[] = [];
    private contracts: Contract[] = [];
    private lawsuits: Lawsuit[] = [];
    private socialPosts: SocialPost[] = [];
    private timelineEvents: TimelineEvent[] = [];
    private politicians: Record<string, Politician> = {};

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        try {
            const stored = localStorage.getItem('SIE_DB_V1');
            if (stored) {
                const data = JSON.parse(stored);
                this.users = data.users || initialUsers;
                this.modules = data.modules || initialModules;
                this.apiKeys = data.apiKeys || initialApiKeys;
                this.dataSources = data.dataSources || initialDataSources;
                this.logs = data.logs || [];
                this.dashboardWidgets = data.dashboardWidgets || this.getDefaultDashboardWidgets();
                this.systemPrompt = data.systemPrompt || '';
                this.dbConfig = data.dbConfig || this.dbConfig;
                this.aiAutomationSettings = data.aiAutomationSettings || { isEnabled: false, frequency: 'daily' };
                this.plans = data.plans || this.getDefaultPlans();
                
                this.employees = data.employees || [];
                this.companies = data.companies || [];
                this.contracts = data.contracts || [];
                this.lawsuits = data.lawsuits || [];
                this.socialPosts = data.socialPosts || [];
                // Garante inicialização correta mesmo se o localStorage tiver dados antigos vazios
                this.timelineEvents = (data.timelineEvents && data.timelineEvents.length > 0) 
                    ? data.timelineEvents 
                    : initialTimelineEvents;
                    
                this.politicians = data.politicians || politiciansDatabase;
            } else {
                this.resetDatabase(false);
            }
        } catch (e) {
            console.error("Failed to load from storage, resetting.", e);
            this.resetDatabase(false);
        }
    }

    private saveToStorage() {
        try {
            const data = {
                users: this.users,
                modules: this.modules,
                apiKeys: this.apiKeys,
                dataSources: this.dataSources,
                logs: this.logs,
                dashboardWidgets: this.dashboardWidgets,
                systemPrompt: this.systemPrompt,
                dbConfig: this.dbConfig,
                aiAutomationSettings: this.aiAutomationSettings,
                plans: this.plans,
                employees: this.employees,
                companies: this.companies,
                contracts: this.contracts,
                lawsuits: this.lawsuits,
                socialPosts: this.socialPosts,
                timelineEvents: this.timelineEvents,
                politicians: this.politicians
            };
            localStorage.setItem('SIE_DB_V1', JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save to storage", e);
        }
    }

    private delay(mock: boolean, ms: number = 300) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private getDefaultDashboardWidgets(): DashboardWidget[] {
        return [
            { id: 'stats', title: 'Estatísticas Gerais', visible: true },
            { id: 'mayor', title: 'Prefeito', visible: true },
            { id: 'vice_mayor', title: 'Vice-Prefeito', visible: true },
            { id: 'reputation', title: 'Radar de Reputação', visible: true },
            { id: 'crisis', title: 'Temas de Crise', visible: true },
            { id: 'sentiment', title: 'Análise de Sentimento', visible: true },
            { id: 'irregularities', title: 'Panorama de Irregularidades', visible: true },
            { id: 'news', title: 'Notícias de Impacto', visible: true },
            { id: 'master_table', title: 'Tabela Mestra', visible: true },
            { id: 'data_sources', title: 'Fontes de Dados', visible: true },
        ];
    }

    private getDefaultPlans(): UserPlan[] {
        return [
            { id: 'starter', name: 'Starter', features: [], modules: ['mod-dash'], requestLimit: 50 },
            { id: 'pro', name: 'Pro', features: ['ai_analysis', 'own_api_key'], modules: ['mod-dash', 'mod-poli', 'mod-soci'], requestLimit: 200 },
            { id: 'enterprise', name: 'Enterprise', features: ['ai_analysis', 'own_api_key', 'advanced_search', 'data_export', 'priority_support'], modules: initialModules.map(m => m.id), requestLimit: -1 }
        ];
    }

    // --- PUBLIC API ---

    getUsers = async (): Promise<User[]> => { await this.delay(true, 300); return this.users; };
    
    saveUser = async (user: User, adminUser: string) => {
        if (user.id) {
            this.users = this.users.map(u => u.id === user.id ? user : u);
            this.logActivity('AUDIT', `Usuário atualizado: ${user.username}`, adminUser);
        } else {
            user.id = Date.now();
            this.users.push(user);
            this.logActivity('AUDIT', `Usuário criado: ${user.username}`, adminUser);
        }
        this.saveToStorage();
    };
    
    deleteUser = async (userId: number, adminUser: string): Promise<boolean> => {
        this.users = this.users.filter(u => u.id !== userId);
        this.logActivity('AUDIT', `Usuário removido: ID ${userId}`, adminUser);
        this.saveToStorage();
        return true;
    };
    
    updateUserProfile = async (userId: number, updates: Partial<User>): Promise<User> => {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error("User not found");
        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        this.saveToStorage();
        return this.users[userIndex];
    };

    getModules = async (): Promise<Module[]> => { return this.modules; };
    
    getUserActiveModules = async (user: User): Promise<Module[]> => {
        const plan = this.plans.find(p => p.id === user.planId);
        if (!plan) return this.modules.filter(m => m.active);
        
        // If plan.modules is missing (migration), fallback to global active modules or a default set
        const allowedModuleIds = plan.modules || [];
        
        return this.modules.filter(m => m.active && (allowedModuleIds.includes(m.id) || user.role === 'admin'));
    };
    
    updateModuleStatus = async (moduleId: string, active: boolean) => {
        this.modules = this.modules.map(m => m.id === moduleId ? { ...m, active } : m);
        this.saveToStorage();
    };
    
    deleteModule = async (moduleId: string) => {
        this.modules = this.modules.filter(m => m.id !== moduleId);
        this.saveToStorage();
    };
    
    addModule = async (module: Module) => {
        this.modules.push(module);
        this.saveToStorage();
    };
    
    saveModuleConfig = async (moduleId: string, updates: Partial<Module>) => {
        this.modules = this.modules.map(m => m.id === moduleId ? { ...m, ...updates } : m);
        this.saveToStorage();
    };
    
    getModule = async (moduleNameOrView: string): Promise<Module | undefined> => {
        return this.modules.find(m => m.name.toLowerCase() === moduleNameOrView.toLowerCase() || m.view === moduleNameOrView);
    };
    
    saveModuleRules = async (moduleName: string, rules: string) => {
        const mod = this.modules.find(m => m.name.toLowerCase() === moduleName.toLowerCase() || m.view === moduleName.toLowerCase());
        if (mod) {
            mod.rules = rules;
            this.saveToStorage();
        }
    };

    getPlans = async (): Promise<UserPlan[]> => { return this.plans; };
    
    savePlan = async (plan: UserPlan) => {
        const idx = this.plans.findIndex(p => p.id === plan.id);
        if (idx >= 0) {
            this.plans[idx] = plan;
        } else {
            this.plans.push(plan);
        }
        this.saveToStorage();
    };
    
    deletePlan = async (planId: string) => {
        this.plans = this.plans.filter(p => p.id !== planId);
        this.saveToStorage();
    };
    
    getUserPlanDetails = async (user: User) => {
        const plan = this.plans.find(p => p.id === user.planId);
        const features = await this.getFeatures();
        if (!plan) return null;
        return {
            plan,
            features: features.map(f => ({ ...f, isActive: plan.features.includes(f.key) }))
        };
    };
    
    checkUserFeatureAccess = async (userId: number, featureKey: FeatureKey): Promise<boolean> => {
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;
        const plan = this.plans.find(p => p.id === user.planId);
        return plan ? plan.features.includes(featureKey) : false;
    };
    
    saveUserApiKey = async (userId: number, key: string) => {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
            this.users[userIndex].apiKey = key;
            this.users[userIndex].canUseOwnApiKey = true;
            this.saveToStorage();
        }
    };
    
    removeUserApiKey = async (userId: number) => {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
            this.users[userIndex].apiKey = undefined;
            this.saveToStorage();
        }
    };

    getFeatures = async (): Promise<Feature[]> => {
        return [
            { key: 'ai_analysis', name: 'Análise AI Avançada', description: 'Relatórios detalhados gerados por IA.' },
            { key: 'own_api_key', name: 'Chave de API Própria', description: 'Use sua chave para limites maiores.' },
            { key: 'advanced_search', name: 'Busca Profunda', description: 'Acesso a fontes de dados restritas.' },
            { key: 'data_export', name: 'Exportação de Dados', description: 'Download de relatórios em CSV/PDF.' },
            { key: 'priority_support', name: 'Suporte Prioritário', description: 'Atendimento dedicado.' },
        ];
    };

    logActivity = (level: LogEntry['level'], message: string, user: string = 'System') => {
        const log: LogEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            level,
            message,
            user
        };
        this.logs.unshift(log);
        if (this.logs.length > 1000) this.logs.pop();
        this.saveToStorage();
    };
    
    getLogs = async (): Promise<LogEntry[]> => { return this.logs; };

    getApiKeys = async (): Promise<ApiKey[]> => { return this.apiKeys; };
    
    addApiKey = async (key: string, username: string) => {
        this.apiKeys.push({
            id: Date.now(),
            key,
            status: 'Ativa',
            type: 'User',
            usageCount: 0
        });
        this.logActivity('INFO', `Nova chave de API adicionada`, username);
        this.saveToStorage();
    };
    
    removeApiKey = async (id: number, username: string) => {
        this.apiKeys = this.apiKeys.filter(k => k.id !== id);
        this.logActivity('WARN', `Chave de API removida: ${id}`, username);
        this.saveToStorage();
    };
    
    toggleApiKeyStatus = async (id: number, username: string) => {
        const key = this.apiKeys.find(k => k.id === id);
        if (key) {
            key.status = key.status === 'Ativa' ? 'Inativa' : 'Ativa';
            this.logActivity('INFO', `Status da chave API ${id} alterado para ${key.status}`, username);
            this.saveToStorage();
        }
    };
    
    getNextSystemApiKey = async (): Promise<string> => {
        const activeKeys = this.apiKeys.filter(k => k.status === 'Ativa' && k.type === 'System');
        if (activeKeys.length === 0) {
            if (process.env.API_KEY) return process.env.API_KEY;
            throw new Error("No active system API keys available.");
        }
        const key = activeKeys[Math.floor(Math.random() * activeKeys.length)];
        key.usageCount++;
        key.lastUsed = new Date().toISOString();
        this.saveToStorage();
        return key.key;
    };
    
    checkAndIncrementQuota = async (userId: number, increment: boolean): Promise<{ allowed: boolean; usage: number; limit: number }> => {
        const user = this.users.find(u => u.id === userId);
        if (!user) return { allowed: false, usage: 0, limit: 0 };

        const plan = this.plans.find(p => p.id === user.planId);
        const limit = plan ? plan.requestLimit : 100;

        const today = new Date().toISOString().split('T')[0];
        if (user.lastUsageReset !== today) {
            user.usage = 0;
            user.lastUsageReset = today;
        }

        if (limit !== -1 && user.usage >= limit) {
            if(increment) this.saveToStorage();
            return { allowed: false, usage: user.usage, limit };
        }

        if (increment) {
            user.usage++;
            this.saveToStorage();
        }
        return { allowed: true, usage: user.usage, limit };
    };
    
    getUserUsageStats = async (userId: number) => {
        const status = await this.checkAndIncrementQuota(userId, false);
        return { usage: status.usage, limit: status.limit };
    };

    getDbConfig = async (): Promise<DbConfig> => { return this.dbConfig; };
    
    saveDbConfig = async (config: DbConfig, username: string) => {
        this.dbConfig = { ...config, status: 'Conectado' };
        this.logActivity('INFO', 'Configuração de banco de dados atualizada', username);
        this.saveToStorage();
    };

    getSystemPrompt = async (): Promise<string> => { return this.systemPrompt; };
    
    setSystemPrompt = async (prompt: string, username: string) => {
        this.systemPrompt = prompt;
        this.logActivity('INFO', 'System prompt da IA atualizado', username);
        this.saveToStorage();
    };
    
    getAiAutomationSettings = async (): Promise<AiAutomationSettings> => { return this.aiAutomationSettings; };
    
    saveAiAutomationSettings = async (settings: AiAutomationSettings) => {
        this.aiAutomationSettings = settings;
        this.saveToStorage();
    };
    
    runAiAutomationTask = async () => {
        await this.delay(true, 2000);
        this.aiAutomationSettings.lastRun = new Date().toISOString();
        this.aiAutomationSettings.lastRunResult = 'Sucesso (Simulado) - ' + new Date().toLocaleTimeString();
        this.logActivity('INFO', 'Automação IA de fontes executada com sucesso.');
        this.saveToStorage();
        return true;
    };

    getStats = async () => {
        return {
            users: this.users.filter(u => u.status === 'Ativo').length,
            modules: this.modules.filter(m => m.active).length,
            totalModules: this.modules.length,
            apiKeys: this.apiKeys.filter(k => k.status === 'Ativa').length,
            dbStatus: this.dbConfig.status,
            politicians: Object.keys(this.politicians).length,
            employees: this.employees.length,
            companies: this.companies.length,
            lawsuits: this.lawsuits.length
        };
    };

    resetDatabase = async (log: boolean = true) => {
        localStorage.removeItem('SIE_DB_V1');
        // Re-initialize with defaults instead of just clearing, to prevent empty states
        this.users = [...initialUsers];
        this.modules = [...initialModules];
        this.apiKeys = [...initialApiKeys];
        this.dataSources = [...initialDataSources];
        this.dashboardWidgets = this.getDefaultDashboardWidgets();
        this.plans = this.getDefaultPlans();
        this.timelineEvents = [...initialTimelineEvents];
        this.politicians = { ...politiciansDatabase };
        
        if(log) this.logActivity('WARN', 'Banco de dados resetado para o padrão.');
        this.saveToStorage();
    };
    
    getFullDatabaseBackup = async () => {
        return {
            users: this.users,
            modules: this.modules,
            apiKeys: this.apiKeys,
            dataSources: this.dataSources,
            dashboardWidgets: this.dashboardWidgets,
            systemPrompt: this.systemPrompt,
            dbConfig: this.dbConfig,
            plans: this.plans,
            politicians: this.politicians,
            employees: this.employees,
            companies: this.companies,
            contracts: this.contracts,
            lawsuits: this.lawsuits,
            socialPosts: this.socialPosts,
            timelineEvents: this.timelineEvents
        };
    };
    
    getCompactDatabaseSnapshot = async () => {
        return `
        Users: ${this.users.length}
        Active Modules: ${this.modules.filter(m => m.active).map(m => m.name).join(', ')}
        DB Status: ${this.dbConfig.status}
        Politicians: ${Object.keys(this.politicians).length}
        `;
    };

    getDataSources = async (): Promise<DataSourceCategory[]> => { return this.dataSources; };
    
    addDataSourceCategory = async (name: string) => {
        this.dataSources.push({ id: Date.now(), name, sources: [] });
        this.saveToStorage();
    };
    
    renameDataSourceCategory = async (id: number, name: string) => {
        const cat = this.dataSources.find(c => c.id === id);
        if (cat) {
            cat.name = name;
            this.saveToStorage();
        }
    };
    
    deleteDataSourceCategory = async (id: number) => {
        this.dataSources = this.dataSources.filter(c => c.id !== id);
        this.saveToStorage();
    };
    
    addDataSource = async (categoryId: number, source: any) => {
        const cat = this.dataSources.find(c => c.id === categoryId);
        if (cat) {
            cat.sources.push({ ...source, id: Date.now() });
            this.saveToStorage();
        }
    };
    
    updateDataSource = async (id: number, data: any) => {
        for (const cat of this.dataSources) {
            const source = cat.sources.find(s => s.id === id);
            if (source) {
                Object.assign(source, data);
                this.saveToStorage();
                return;
            }
        }
    };
    
    deleteDataSource = async (id: number) => {
        for (const cat of this.dataSources) {
            cat.sources = cat.sources.filter(s => s.id !== id);
        }
        this.saveToStorage();
    };
    
    toggleDataSourceStatus = async (id: number) => {
        for (const cat of this.dataSources) {
            const source = cat.sources.find(s => s.id === id);
            if (source) {
                source.active = !source.active;
                this.saveToStorage();
                return;
            }
        }
    };
    
    addSourceToCategoryByName = async (suggested: SuggestedSource) => {
        let cat = this.dataSources.find(c => c.name.toLowerCase() === suggested.category.toLowerCase());
        if (!cat) {
            cat = { id: Date.now(), name: suggested.category, sources: [] };
            this.dataSources.push(cat);
        }
        cat.sources.push({
            id: Date.now() + Math.random(),
            name: suggested.name,
            url: suggested.url,
            type: (suggested.type as any) || 'Web Scraping',
            reliability: 'Média',
            active: true,
            status: 'Ativa'
        });
        this.saveToStorage();
    };
    
    validateAllDataSources = async () => {
        await this.delay(true, 1500);
        this.logActivity('INFO', 'Validação de fontes concluída.');
    };

    getDashboardData = async (municipality: string): Promise<DashboardData> => {
        return {
            municipality,
            stats: { facebook: 120, instagram: 80, twitter: 45, judicialProcesses: 5 },
            mayor: { name: 'João Silva', position: 'Prefeito', party: 'ABC', mandate: { start: '2021-01-01', end: '2024-12-31' }, avatarUrl: '' },
            viceMayor: { name: 'Maria Souza', position: 'Vice-Prefeito', party: 'DEF', mandate: { start: '2021-01-01', end: '2024-12-31' }, avatarUrl: '' },
            reputationRadar: { score: 75, tendency: 'Estável', summary: 'Boa reputação geral.' },
            crisisThemes: [],
            sentimentDistribution: { positive: 60, negative: 10, neutral: 30 },
            irregularitiesPanorama: [],
            highImpactNews: [],
            masterItems: [],
            dataSources: []
        };
    };
    
    getDashboardWidgets = async (): Promise<DashboardWidget[]> => { return this.dashboardWidgets; };
    
    saveDashboardWidgets = async (widgets: DashboardWidget[]) => {
        this.dashboardWidgets = widgets;
        this.saveToStorage();
    };
    
    getPoliticianAnalysisData = async (id: string): Promise<PoliticianDataResponse> => {
        let data = this.politicians[id];
        if (!data) {
            // Fallback to first available if specific ID fails, for demo purposes
            const defaultPol = Object.values(this.politicians)[0];
            if (defaultPol) return { data: defaultPol, timestamp: Date.now(), source: 'mock' };
            
             throw new Error("Politician not found");
        }
        return { data, timestamp: Date.now(), source: 'mock' };
    };
    
    refreshPoliticianAnalysisData = async (id: string): Promise<PoliticianDataResponse> => {
        await this.delay(true, 1000);
        if(this.politicians[id]) {
            return { data: this.politicians[id], timestamp: Date.now(), source: 'api' };
        }
        throw new Error("Politician not found");
    }

    getEmployees = async (): Promise<Employee[]> => { return this.employees; };
    getCompanies = async (): Promise<Company[]> => { return this.companies; };
    getContracts = async (): Promise<Contract[]> => { return this.contracts; };
    getLawsuits = async (): Promise<Lawsuit[]> => { return this.lawsuits; };
    getSocialPosts = async (): Promise<SocialPost[]> => { return this.socialPosts; };
    getTimelineEvents = async (): Promise<TimelineEvent[]> => { return this.timelineEvents; };
}

export const dbService = new DbService();
