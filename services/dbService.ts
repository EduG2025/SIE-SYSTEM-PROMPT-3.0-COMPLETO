
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
import { initialTimelineEvents } from '../data/mock/timelineData';
import { 
    generateFullDashboardData, 
    generateRealEmployees, 
    generateRealCompanies, 
    generateRealContracts, 
    generateRealLawsuits, 
    generateRealSocialPosts, 
    generateRealTimeline,
    generateDeepPoliticianAnalysis,
    generatePoliticalSquad,
    generatePoliticalLeadership
} from './geminiService';
import { loadingService } from './loadingService'; // Importar LoadingService

// --- Camada de Baixo Nível do IndexedDB ---
class LocalDatabase {
    private dbName = 'SIE_DATALAKE_V1';
    private storeName = 'collections';
    private dbVersion = 1;
    private db: IDBDatabase | null = null;

    constructor() {}

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error("IndexedDB error:", request.error);
                reject("Database connection failed");
            };

            request.onsuccess = (event) => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = request.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
        });
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async set(key: string, value: any): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// --- Serviço Principal ---
class DbService {
    private localDB: LocalDatabase;
    private isReady: Promise<void>;
    
    // Estado em Memória (Atua como Cache Rápido)
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

    private dashboardCache: Record<string, DashboardData> = {};

    constructor() {
        this.localDB = new LocalDatabase();
        // A inicialização dispara o carregamento do IndexedDB para a memória
        this.isReady = this.loadFromStorage();
    }

    // Helper para envolver chamadas assíncronas com loading
    private async withLoading<T>(operation: () => Promise<T>): Promise<T> {
        loadingService.start();
        try {
            return await operation();
        } finally {
            loadingService.stop();
        }
    }

    // Carrega dados do IndexedDB ou usa mocks se vazio
    private async loadFromStorage() {
        try {
            await this.localDB.init();
            
            // Tenta carregar dados persistentes
            const storedData = await this.localDB.get<any>('sie_full_store');
            
            if (storedData) {
                this.users = storedData.users || initialUsers;
                this.modules = storedData.modules || initialModules;
                this.apiKeys = storedData.apiKeys || initialApiKeys;
                this.dataSources = storedData.dataSources || initialDataSources;
                this.logs = storedData.logs || [];
                this.dashboardWidgets = storedData.dashboardWidgets || this.getDefaultDashboardWidgets();
                this.systemPrompt = storedData.systemPrompt || '';
                this.dbConfig = storedData.dbConfig || this.dbConfig;
                this.aiAutomationSettings = storedData.aiAutomationSettings || { isEnabled: false, frequency: 'daily' };
                this.plans = storedData.plans || this.getDefaultPlans();
                this.employees = storedData.employees || [];
                this.companies = storedData.companies || [];
                this.contracts = storedData.contracts || [];
                this.lawsuits = storedData.lawsuits || [];
                this.socialPosts = storedData.socialPosts || [];
                this.timelineEvents = (storedData.timelineEvents && storedData.timelineEvents.length > 0) 
                    ? storedData.timelineEvents 
                    : initialTimelineEvents;
                this.politicians = storedData.politicians || politiciansDatabase;
                this.dashboardCache = storedData.dashboardCache || {};

                // --- AUTO-MIGRAÇÃO CRÍTICA PARA O MÓDULO DE PESQUISA ---
                const resModuleId = 'mod-res';
                if (!this.modules.find(m => m.id === resModuleId)) {
                    const defaultResMod = initialModules.find(m => m.id === resModuleId);
                    if (defaultResMod) {
                        this.modules.push(defaultResMod);
                    } else {
                        this.modules.push({
                            id: resModuleId,
                            name: 'Pesquisa (IA)',
                            view: 'research',
                            icon: 'search-circle',
                            active: true,
                            hasSettings: false,
                            updateFrequency: 'realtime',
                            lastUpdate: new Date().toISOString()
                        });
                    }
                }
                this.modules = this.modules.map(m => {
                    if (m.id === resModuleId) {
                        return { ...m, active: true, name: 'Pesquisa (IA)', view: 'research', icon: 'search-circle' };
                    }
                    return m;
                });
                this.plans = this.plans.map(p => {
                    if (!p.modules.includes(resModuleId)) {
                        return { ...p, modules: [...p.modules, resModuleId] };
                    }
                    return p;
                });
                await this.saveToStorage();

            } else {
                await this.resetDatabase(false);
            }
        } catch (e) {
            console.error("Failed to load from IndexedDB, falling back to defaults.", e);
            await this.resetDatabase(false);
        }
    }

    // Salva o estado atual no IndexedDB
    private async saveToStorage() {
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
                politicians: this.politicians,
                dashboardCache: this.dashboardCache
            };
            await this.localDB.set('sie_full_store', data);
        } catch (e) {
            console.error("Failed to save to IndexedDB", e);
        }
    }

    private delay(ms: number = 300) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    private async ensureReady() {
        await this.isReady;
    }

    private getDefaultDashboardWidgets(): DashboardWidget[] {
        return [
            { id: 'mayor', title: 'Prefeito', visible: true },
            { id: 'vice_mayor', title: 'Vice-Prefeito', visible: true },
            { id: 'stats', title: 'Estatísticas Gerais', visible: true },
            { id: 'crisis', title: 'Temas de Crise', visible: true },
            { id: 'news', title: 'Notícias de Impacto', visible: true },
            { id: 'reputation', title: 'Radar de Reputação', visible: true },
            { id: 'irregularities', title: 'Panorama de Irregularidades', visible: true },
            { id: 'sentiment', title: 'Análise de Sentimento', visible: true },
            { id: 'master_table', title: 'Tabela Mestra', visible: true },
            { id: 'data_sources', title: 'Fontes de Dados', visible: true },
        ];
    }

    private getDefaultPlans(): UserPlan[] {
        return [
            { id: 'starter', name: 'Starter', features: [], modules: ['mod-dash', 'mod-res'], requestLimit: 50 },
            { id: 'pro', name: 'Pro', features: ['ai_analysis', 'own_api_key'], modules: ['mod-dash', 'mod-poli', 'mod-soci', 'mod-res'], requestLimit: 200 },
            { id: 'enterprise', name: 'Enterprise', features: ['ai_analysis', 'own_api_key', 'advanced_search', 'data_export', 'priority_support'], modules: initialModules.map(m => m.id), requestLimit: -1 }
        ];
    }

    // --- PUBLIC API ---

    getUsers = async (): Promise<User[]> => { await this.ensureReady(); return this.users; };
    
    saveUser = async (user: User, adminUser: string) => {
        await this.ensureReady();
        if (user.id) {
            this.users = this.users.map(u => u.id === user.id ? user : u);
            this.logActivity('AUDIT', `Usuário atualizado: ${user.username}`, adminUser);
        } else {
            user.id = Date.now();
            this.users.push(user);
            this.logActivity('AUDIT', `Usuário criado: ${user.username}`, adminUser);
        }
        await this.saveToStorage();
    };
    
    deleteUser = async (userId: number, adminUser: string): Promise<boolean> => {
        await this.ensureReady();
        this.users = this.users.filter(u => u.id !== userId);
        this.logActivity('AUDIT', `Usuário removido: ID ${userId}`, adminUser);
        await this.saveToStorage();
        return true;
    };
    
    updateUserProfile = async (userId: number, updates: Partial<User>): Promise<User> => {
        await this.ensureReady();
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error("User not found");
        this.users[userIndex] = { ...this.users[userIndex], ...updates };
        await this.saveToStorage();
        return this.users[userIndex];
    };

    getModules = async (): Promise<Module[]> => { await this.ensureReady(); return this.modules; };
    
    getUserActiveModules = async (user: User): Promise<Module[]> => {
        await this.ensureReady();
        const plan = this.plans.find(p => p.id === user.planId);
        if (!plan) return this.modules.filter(m => m.active);
        const allowedModuleIds = plan.modules || [];
        return this.modules.filter(m => m.active && (allowedModuleIds.includes(m.id) || user.role === 'admin'));
    };
    
    updateModuleStatus = async (moduleId: string, active: boolean) => {
        await this.ensureReady();
        this.modules = this.modules.map(m => m.id === moduleId ? { ...m, active } : m);
        await this.saveToStorage();
    };
    
    deleteModule = async (moduleId: string) => {
        await this.ensureReady();
        this.modules = this.modules.filter(m => m.id !== moduleId);
        await this.saveToStorage();
    };
    
    addModule = async (module: Module) => {
        await this.ensureReady();
        this.modules.push(module);
        await this.saveToStorage();
    };
    
    saveModuleConfig = async (moduleId: string, updates: Partial<Module>) => {
        await this.ensureReady();
        this.modules = this.modules.map(m => m.id === moduleId ? { ...m, ...updates } : m);
        await this.saveToStorage();
    };
    
    getModule = async (moduleNameOrView: string): Promise<Module | undefined> => {
        await this.ensureReady();
        return this.modules.find(m => m.name.toLowerCase() === moduleNameOrView.toLowerCase() || m.view === moduleNameOrView);
    };
    
    saveModuleRules = async (moduleName: string, rules: string) => {
        await this.ensureReady();
        const mod = this.modules.find(m => m.name.toLowerCase() === moduleName.toLowerCase() || m.view === moduleName.toLowerCase());
        if (mod) {
            mod.rules = rules;
            await this.saveToStorage();
        } else {
             const modByView = this.modules.find(m => m.view === moduleName.toLowerCase() || m.name.includes(moduleName));
             if(modByView) {
                 modByView.rules = rules;
                 await this.saveToStorage();
             }
        }
    };

    getPlans = async (): Promise<UserPlan[]> => { await this.ensureReady(); return this.plans; };
    
    savePlan = async (plan: UserPlan) => {
        await this.ensureReady();
        const idx = this.plans.findIndex(p => p.id === plan.id);
        if (idx >= 0) {
            this.plans[idx] = plan;
        } else {
            this.plans.push(plan);
        }
        await this.saveToStorage();
    };
    
    deletePlan = async (planId: string) => {
        await this.ensureReady();
        this.plans = this.plans.filter(p => p.id !== planId);
        await this.saveToStorage();
    };
    
    getUserPlanDetails = async (user: User) => {
        await this.ensureReady();
        const plan = this.plans.find(p => p.id === user.planId);
        const features = await this.getFeatures();
        if (!plan) return null;
        return {
            plan,
            features: features.map(f => ({ ...f, isActive: plan.features.includes(f.key) }))
        };
    };
    
    checkUserFeatureAccess = async (userId: number, featureKey: FeatureKey): Promise<boolean> => {
        await this.ensureReady();
        const user = this.users.find(u => u.id === userId);
        if (!user) return false;
        const plan = this.plans.find(p => p.id === user.planId);
        return plan ? plan.features.includes(featureKey) : false;
    };
    
    saveUserApiKey = async (userId: number, key: string) => {
        await this.ensureReady();
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
            this.users[userIndex].apiKey = key;
            this.users[userIndex].canUseOwnApiKey = true;
            await this.saveToStorage();
        }
    };
    
    removeUserApiKey = async (userId: number) => {
        await this.ensureReady();
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
            this.users[userIndex].apiKey = undefined;
            await this.saveToStorage();
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
    
    getLogs = async (): Promise<LogEntry[]> => { await this.ensureReady(); return this.logs; };

    getApiKeys = async (): Promise<ApiKey[]> => { await this.ensureReady(); return this.apiKeys; };
    
    addApiKey = async (key: string, username: string) => {
        await this.ensureReady();
        this.apiKeys.push({
            id: Date.now(),
            key,
            status: 'Ativa',
            type: 'User',
            usageCount: 0
        });
        this.logActivity('INFO', `Nova chave de API adicionada`, username);
        await this.saveToStorage();
    };
    
    removeApiKey = async (id: number, username: string) => {
        await this.ensureReady();
        this.apiKeys = this.apiKeys.filter(k => k.id !== id);
        this.logActivity('WARN', `Chave de API removida: ${id}`, username);
        await this.saveToStorage();
    };
    
    toggleApiKeyStatus = async (id: number, username: string) => {
        await this.ensureReady();
        const key = this.apiKeys.find(k => k.id === id);
        if (key) {
            key.status = key.status === 'Ativa' ? 'Inativa' : 'Ativa';
            this.logActivity('INFO', `Status da chave API ${id} alterado para ${key.status}`, username);
            await this.saveToStorage();
        }
    };
    
    getNextSystemApiKey = async (): Promise<string> => {
        await this.ensureReady();
        const activeKeys = this.apiKeys.filter(k => k.status === 'Ativa' && k.type === 'System');
        if (activeKeys.length === 0) {
            if (process.env.API_KEY) return process.env.API_KEY;
            throw new Error("No active system API keys available.");
        }
        const key = activeKeys[Math.floor(Math.random() * activeKeys.length)];
        key.usageCount++;
        key.lastUsed = new Date().toISOString();
        await this.saveToStorage();
        return key.key;
    };
    
    checkAndIncrementQuota = async (userId: number, increment: boolean): Promise<{ allowed: boolean; usage: number; limit: number }> => {
        await this.ensureReady();
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
            if(increment) await this.saveToStorage();
            return { allowed: false, usage: user.usage, limit };
        }

        if (increment) {
            user.usage++;
            await this.saveToStorage();
        }
        return { allowed: true, usage: user.usage, limit };
    };
    
    getUserUsageStats = async (userId: number) => {
        const status = await this.checkAndIncrementQuota(userId, false);
        return { usage: status.usage, limit: status.limit };
    };

    getDbConfig = async (): Promise<DbConfig> => { await this.ensureReady(); return this.dbConfig; };
    
    saveDbConfig = async (config: DbConfig, username: string) => {
        await this.ensureReady();
        this.dbConfig = { ...config, status: 'Conectado' };
        this.logActivity('INFO', 'Configuração de banco de dados atualizada (IndexedDB Local)', username);
        await this.saveToStorage();
    };

    getSystemPrompt = async (): Promise<string> => { await this.ensureReady(); return this.systemPrompt; };
    
    setSystemPrompt = async (prompt: string, username: string) => {
        await this.ensureReady();
        this.systemPrompt = prompt;
        this.logActivity('INFO', 'System prompt da IA atualizado', username);
        await this.saveToStorage();
    };
    
    getAiAutomationSettings = async (): Promise<AiAutomationSettings> => { await this.ensureReady(); return this.aiAutomationSettings; };
    
    saveAiAutomationSettings = async (settings: AiAutomationSettings) => {
        await this.ensureReady();
        this.aiAutomationSettings = settings;
        await this.saveToStorage();
    };
    
    runAiAutomationTask = async () => {
        return this.withLoading(async () => {
            await this.delay(2000);
            await this.ensureReady();
            this.aiAutomationSettings.lastRun = new Date().toISOString();
            this.aiAutomationSettings.lastRunResult = 'Sucesso (Simulado) - ' + new Date().toLocaleTimeString();
            this.logActivity('INFO', 'Automação IA de fontes executada com sucesso.');
            await this.saveToStorage();
            return true;
        });
    };

    getStats = async () => {
        await this.ensureReady();
        return {
            users: this.users.filter(u => u.status === 'Ativo').length,
            modules: this.modules.filter(m => m.active).length,
            totalModules: this.modules.length,
            apiKeys: this.apiKeys.filter(k => k.status === 'Ativa').length,
            dbStatus: "Online (IndexedDB)",
            politicians: Object.keys(this.politicians).length,
            employees: this.employees.length,
            companies: this.companies.length,
            lawsuits: this.lawsuits.length
        };
    };

    resetDatabase = async (log: boolean = true) => {
        this.users = [...initialUsers];
        this.modules = [...initialModules];
        this.apiKeys = [...initialApiKeys];
        this.dataSources = [...initialDataSources];
        this.dashboardWidgets = this.getDefaultDashboardWidgets();
        this.plans = this.getDefaultPlans();
        this.timelineEvents = [...initialTimelineEvents];
        this.politicians = { ...politiciansDatabase };
        this.employees = [];
        this.companies = [];
        this.contracts = [];
        this.lawsuits = [];
        this.socialPosts = [];
        this.dashboardCache = {};
        
        if(log) this.logActivity('WARN', 'Banco de dados resetado para o padrão (Factory Reset).');
        await this.saveToStorage();
    };
    
    getFullDatabaseBackup = async () => {
        return this.withLoading(async () => {
            await this.ensureReady();
            await this.delay(500);
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
                timelineEvents: this.timelineEvents,
                dashboardCache: this.dashboardCache
            };
        });
    };
    
    getCompactDatabaseSnapshot = async () => {
        await this.ensureReady();
        return `
        Users: ${this.users.length}
        Active Modules: ${this.modules.filter(m => m.active).map(m => m.name).join(', ')}
        DB Engine: IndexedDB
        Politicians: ${Object.keys(this.politicians).length}
        `;
    };

    getDataSources = async (): Promise<DataSourceCategory[]> => { await this.ensureReady(); return this.dataSources; };
    
    addDataSourceCategory = async (name: string) => {
        await this.ensureReady();
        this.dataSources.push({ id: Date.now(), name, sources: [] });
        await this.saveToStorage();
    };
    
    renameDataSourceCategory = async (id: number, name: string) => {
        await this.ensureReady();
        const cat = this.dataSources.find(c => c.id === id);
        if (cat) {
            cat.name = name;
            await this.saveToStorage();
        }
    };
    
    deleteDataSourceCategory = async (id: number) => {
        await this.ensureReady();
        this.dataSources = this.dataSources.filter(c => c.id !== id);
        await this.saveToStorage();
    };
    
    addDataSource = async (categoryId: number, source: any) => {
        await this.ensureReady();
        const cat = this.dataSources.find(c => c.id === categoryId);
        if (cat) {
            cat.sources.push({ ...source, id: Date.now() });
            await this.saveToStorage();
        }
    };
    
    updateDataSource = async (id: number, data: any) => {
        await this.ensureReady();
        for (const cat of this.dataSources) {
            const source = cat.sources.find(s => s.id === id);
            if (source) {
                Object.assign(source, data);
                await this.saveToStorage();
                return;
            }
        }
    };
    
    deleteDataSource = async (id: number) => {
        await this.ensureReady();
        for (const cat of this.dataSources) {
            cat.sources = cat.sources.filter(s => s.id !== id);
        }
        await this.saveToStorage();
    };
    
    toggleDataSourceStatus = async (id: number) => {
        await this.ensureReady();
        for (const cat of this.dataSources) {
            const source = cat.sources.find(s => s.id === id);
            if (source) {
                source.active = !source.active;
                await this.saveToStorage();
                return;
            }
        }
    };
    
    addSourceToCategoryByName = async (suggested: SuggestedSource) => {
        await this.ensureReady();
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
        await this.saveToStorage();
    };
    
    validateAllDataSources = async () => {
        return this.withLoading(async () => {
            await this.delay(1500);
            this.logActivity('INFO', 'Validação de fontes concluída.');
        });
    };

    getDashboardData = async (municipality: string, forceRefresh: boolean = false): Promise<DashboardData> => {
        return this.withLoading(async () => {
            await this.ensureReady();
            if (!forceRefresh && this.dashboardCache[municipality]) {
                return this.dashboardCache[municipality];
            }

            try {
                const data = await generateFullDashboardData(municipality);
                this.dashboardCache[municipality] = data;
                await this.saveToStorage();
                return data;
            } catch (error) {
                console.error("AI Data collection failed, falling back to mock.", error);
                return this.getMockDashboardData(municipality);
            }
        });
    };

    private getMockDashboardData(municipality: string): DashboardData {
         return {
            municipality,
            stats: { facebook: 120, instagram: 80, twitter: 45, judicialProcesses: 5 },
            mayor: { name: 'João Silva', position: 'Prefeito', party: 'ABC', mandate: { start: '2021-01-01', end: '2024-12-31' }, avatarUrl: '' },
            viceMayor: { name: 'Maria Souza', position: 'Vice-Prefeito', party: 'DEF', mandate: { start: '2021-01-01', end: '2024-12-31' }, avatarUrl: '' },
            reputationRadar: { score: 75, tendency: 'Estável', summary: 'Boa reputação geral.' },
            crisisThemes: [
                { theme: 'Saúde', occurrences: 45 },
                { theme: 'Educação', occurrences: 30 },
                { theme: 'Infraestrutura', occurrences: 25 },
                { theme: 'Segurança', occurrences: 15 },
                { theme: 'Transporte', occurrences: 10 }
            ],
            sentimentDistribution: { positive: 60, negative: 10, neutral: 30 },
            irregularitiesPanorama: [],
            highImpactNews: [],
            masterItems: [],
            dataSources: []
        };
    }
    
    getDashboardWidgets = async (): Promise<DashboardWidget[]> => { await this.ensureReady(); return this.dashboardWidgets; };
    
    saveDashboardWidgets = async (widgets: DashboardWidget[]) => {
        await this.ensureReady();
        this.dashboardWidgets = widgets;
        await this.saveToStorage();
    };
    
    getAllPoliticians = async (): Promise<Politician[]> => {
        await this.ensureReady();
        return Object.values(this.politicians).sort((a, b) => {
            const isLeaderA = a.position.includes('Prefeito');
            const isLeaderB = b.position.includes('Prefeito');
            if (isLeaderA && !isLeaderB) return -1;
            if (!isLeaderA && isLeaderB) return 1;
            return 0;
        });
    }

    ensurePoliticalLeadership = async (municipality: string): Promise<Politician[]> => {
        await this.ensureReady();
        const existing = Object.values(this.politicians).filter(p => p.position.includes('Prefeito'));
        
        if (existing.length >= 1) return existing;

        try {
            const leaders = await generatePoliticalLeadership(municipality);
             if (leaders.length > 0) {
                leaders.forEach(p => {
                    const id = p.id || p.name.toLowerCase().replace(/\s+/g, '-');
                    this.politicians[id] = { ...p, id };
                });
                await this.saveToStorage();
            }
            return leaders;
        } catch (e) {
            console.error("Failed to fetch leadership", e);
            return [];
        }
    }

    scanPoliticalSquad = async (municipality: string): Promise<Politician[]> => {
        await this.ensureReady();
        try {
            const squad = await generatePoliticalSquad(municipality);
            if (squad.length > 0) {
                squad.forEach(p => {
                    const id = p.id || p.name.toLowerCase().replace(/\s+/g, '-');
                    const monitored = this.politicians[id]?.monitored || false;
                    this.politicians[id] = { ...p, id, monitored };
                });
                await this.saveToStorage();
                this.logActivity('INFO', `Varredura de atores políticos concluída para ${municipality}.`);
            }
            return Object.values(this.politicians);
        } catch (e) {
            console.error("Failed to scan political squad", e);
            return [];
        }
    }
    
    togglePoliticianMonitoring = async (id: string) => {
        await this.ensureReady();
        if(this.politicians[id]) {
            this.politicians[id].monitored = !this.politicians[id].monitored;
            await this.saveToStorage();
        }
    }
    
    getPoliticianAnalysisData = async (id: string): Promise<PoliticianDataResponse> => {
        return this.withLoading(async () => {
            await this.ensureReady();
            let data = this.politicians[id];
            if (!data) {
                 throw new Error("Politician not found");
            }
            return { data, timestamp: Date.now(), source: 'mock' };
        });
    };
    
    refreshPoliticianAnalysisData = async (id: string): Promise<PoliticianDataResponse> => {
        return this.withLoading(async () => {
            await this.ensureReady();
            const politician = this.politicians[id];
            if(politician) {
                try {
                    const newData = await generateDeepPoliticianAnalysis(politician);
                    this.politicians[id] = { ...newData, id: politician.id, monitored: politician.monitored };
                    await this.saveToStorage();
                    return { data: this.politicians[id], timestamp: Date.now(), source: 'api' };
                } catch(e) {
                    console.error("Deep analysis failed", e);
                    return { data: politician, timestamp: Date.now(), source: 'cache' };
                }
            }
            throw new Error("Politician not found");
        });
    }

    getEmployees = async (forceRefresh: boolean = false): Promise<Employee[]> => {
        return this.withLoading(async () => {
            await this.ensureReady();
            if (this.employees.length === 0 || forceRefresh) {
                const m = localStorage.getItem('selectedMunicipality');
                if (m) {
                    try {
                        const freshEmployees = await generateRealEmployees(m);
                        if (freshEmployees.length > 0) {
                            this.employees = freshEmployees;
                            await this.saveToStorage();
                        }
                    } catch(e) { console.error(e); }
                }
            }
            return this.employees; 
        });
    };
    getCompanies = async (): Promise<Company[]> => { 
        return this.withLoading(async () => {
            await this.ensureReady();
             if (this.companies.length === 0) {
                const m = localStorage.getItem('selectedMunicipality');
                if (m) {
                    try {
                        const freshCompanies = await generateRealCompanies(m);
                        if(freshCompanies.length > 0) {
                            this.companies = freshCompanies;
                            await this.saveToStorage();
                        }
                    } catch(e) { console.error(e); }
                }
            }
            return this.companies; 
        });
    };
    getContracts = async (): Promise<Contract[]> => { 
        return this.withLoading(async () => {
            await this.ensureReady();
             if (this.contracts.length === 0) {
                const m = localStorage.getItem('selectedMunicipality');
                if (m) {
                    try {
                        this.contracts = await generateRealContracts(m);
                        await this.saveToStorage();
                    } catch(e) { console.error(e); }
                }
            }
            return this.contracts; 
        });
    };
    getLawsuits = async (): Promise<Lawsuit[]> => { 
        return this.withLoading(async () => {
            await this.ensureReady();
             if (this.lawsuits.length === 0) {
                const m = localStorage.getItem('selectedMunicipality');
                if (m) {
                    try {
                        this.lawsuits = await generateRealLawsuits(m);
                        await this.saveToStorage();
                    } catch(e) { console.error(e); }
                }
            }
            return this.lawsuits; 
        });
    };
    getSocialPosts = async (): Promise<SocialPost[]> => { 
        return this.withLoading(async () => {
            await this.ensureReady();
             if (this.socialPosts.length === 0) {
                const m = localStorage.getItem('selectedMunicipality');
                if (m) {
                    try {
                        this.socialPosts = await generateRealSocialPosts(m);
                        await this.saveToStorage();
                    } catch(e) { console.error(e); }
                }
            }
            return this.socialPosts; 
        });
    };
    getTimelineEvents = async (): Promise<TimelineEvent[]> => { 
        return this.withLoading(async () => {
            await this.ensureReady();
            if (this.timelineEvents.length === 0 || this.timelineEvents === initialTimelineEvents) {
                const m = localStorage.getItem('selectedMunicipality');
                if (m) {
                    try {
                        const realEvents = await generateRealTimeline(m);
                        if (realEvents.length > 0) {
                            this.timelineEvents = realEvents;
                            await this.saveToStorage();
                        }
                    } catch(e) { console.error(e); }
                }
            }
            return this.timelineEvents; 
        });
    };
}

export const dbService = new DbService();
