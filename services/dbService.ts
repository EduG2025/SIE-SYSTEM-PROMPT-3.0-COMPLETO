
import { initialUsers } from '../data/mock/users';
import { initialModules } from '../data/mock/modules';
import { initialApiKeys } from '../data/mock/apiKeys';
import { initialDataSources } from '../data/mock/dataSources';
import { initialTimelineEvents } from '../data/mock/timelineData';
// Import types
import type {
  User, Module, ApiKey, DataSourceCategory, Politician, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, UserPlan,
  DashboardData, DbConfig, LogEntry, DashboardWidget, AiAutomationSettings, Feature, FeatureKey, SuggestedSource,
  PoliticianDataResponse
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

// Define Mock Data for things not in separate files yet or just placeholders
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

const STORAGE_KEY = 'sie_db_v3';

interface DatabaseSchema {
    users: User[];
    modules: Module[];
    apiKeys: ApiKey[];
    dataSources: DataSourceCategory[];
    plans: UserPlan[];
    politicians: Politician[]; // Simplified for storage, expanded in memory map
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
}

class DbService {
    private data: DatabaseSchema | null = null;
    private initialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            await this.resetDatabase();
        }
        this.initialized = true;
    }

    private async ensureReady() {
        if (!this.initialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!this.data) await this.init();
        }
    }

    private async saveToStorage() {
        if (this.data) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        }
    }

    async resetDatabase() {
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
            dbConfig: { apiUrl: '', apiToken: '', status: 'Desconectado' },
            systemPrompt: 'Você é um analista de inteligência estratégica governamental.',
            logs: [],
            aiAutomationSettings: { isEnabled: false, frequency: 'daily' }
        };
        await this.saveToStorage();
    }

    // --- Users & Auth ---
    async getUsers(): Promise<User[]> { await this.ensureReady(); return this.data!.users; }
    
    async saveUser(user: User, adminUsername: string) {
        await this.ensureReady();
        const index = this.data!.users.findIndex(u => u.id === user.id);
        if (index >= 0) {
            this.data!.users[index] = user;
            this.logActivity('INFO', `Usuário atualizado: ${user.username}`, adminUsername);
        } else {
            this.data!.users.push(user);
            this.logActivity('INFO', `Novo usuário criado: ${user.username}`, adminUsername);
        }
        await this.saveToStorage();
    }

    async deleteUser(id: number, adminUsername: string): Promise<boolean> {
        await this.ensureReady();
        const initialLen = this.data!.users.length;
        this.data!.users = this.data!.users.filter(u => u.id !== id);
        if (this.data!.users.length < initialLen) {
            this.logActivity('WARN', `Usuário deletado ID: ${id}`, adminUsername);
            await this.saveToStorage();
            return true;
        }
        return false;
    }

    async updateUserProfile(id: number, updates: Partial<User>): Promise<User> {
         await this.ensureReady();
         const user = this.data!.users.find(u => u.id === id);
         if (!user) throw new Error("User not found");
         Object.assign(user, updates);
         await this.saveToStorage();
         return user;
    }
    
    async saveUserApiKey(userId: number, key: string) {
        await this.ensureReady();
        const user = this.data!.users.find(u => u.id === userId);
        if (user) {
            user.apiKey = key;
            user.canUseOwnApiKey = true; // Implicitly allowed if they can save it via UI
            await this.saveToStorage();
        }
    }

    async removeUserApiKey(userId: number) {
        await this.ensureReady();
        const user = this.data!.users.find(u => u.id === userId);
        if (user) {
            user.apiKey = undefined;
            await this.saveToStorage();
        }
    }

    async getUserActiveModules(user: User): Promise<Module[]> {
        await this.ensureReady();
        const plan = this.data!.plans.find(p => p.id === user.planId);
        const allowedModules = plan ? plan.modules : [];
        return this.data!.modules.filter(m => m.active && allowedModules.includes(m.id));
    }
    
    async getUserPlanDetails(user: User) {
        await this.ensureReady();
        const plan = this.data!.plans.find(p => p.id === user.planId);
        if(!plan) throw new Error("Plan not found");
        
        const features = initialFeatures.map(f => ({
            ...f,
            isActive: plan.features.includes(f.key)
        }));
        
        return { plan, features };
    }

    async checkUserFeatureAccess(userId: number, featureKey: FeatureKey): Promise<boolean> {
        await this.ensureReady();
        const user = this.data!.users.find(u => u.id === userId);
        if (!user) return false;
        const plan = this.data!.plans.find(p => p.id === user.planId);
        return plan ? plan.features.includes(featureKey) : false;
    }

    async checkAndIncrementQuota(userId: number, isAiRequest: boolean): Promise<{ allowed: boolean, usage: number, limit: number }> {
        await this.ensureReady();
        const user = this.data!.users.find(u => u.id === userId);
        if (!user) return { allowed: false, usage: 0, limit: 0 };
        
        const plan = this.data!.plans.find(p => p.id === user.planId);
        const limit = plan ? plan.requestLimit : 100;

        if (limit === -1) return { allowed: true, usage: user.usage, limit: -1 };

        if (isAiRequest) {
            if (user.usage >= limit) {
                return { allowed: false, usage: user.usage, limit };
            }
            user.usage++;
            await this.saveToStorage();
        }
        return { allowed: true, usage: user.usage, limit };
    }

    async getUserUsageStats(userId: number) {
        await this.ensureReady();
        const user = this.data!.users.find(u => u.id === userId);
        const plan = this.data!.plans ? this.data!.plans.find(p => p.id === user?.planId) : null;
        return { usage: user?.usage || 0, limit: plan?.requestLimit || 100 };
    }

    // --- Plans ---
    async getPlans(): Promise<UserPlan[]> { await this.ensureReady(); return this.data!.plans; }
    async getFeatures(): Promise<Feature[]> { return initialFeatures; }
    async savePlan(plan: UserPlan) {
        await this.ensureReady();
        const idx = this.data!.plans.findIndex(p => p.id === plan.id);
        if (idx >= 0) this.data!.plans[idx] = plan;
        else this.data!.plans.push(plan);
        await this.saveToStorage();
    }
    async deletePlan(id: string) {
        await this.ensureReady();
        this.data!.plans = this.data!.plans.filter(p => p.id !== id);
        await this.saveToStorage();
    }

    // --- API Keys ---
    async getApiKeys(): Promise<ApiKey[]> { await this.ensureReady(); return this.data!.apiKeys; }
    async addApiKey(key: string, username: string) {
        await this.ensureReady();
        this.data!.apiKeys.push({
            id: Date.now(),
            key,
            status: 'Ativa',
            type: 'User',
            usageCount: 0
        });
        this.logActivity('INFO', `Nova chave de API adicionada`, username);
        await this.saveToStorage();
    }
    async removeApiKey(id: number, username: string) {
        await this.ensureReady();
        this.data!.apiKeys = this.data!.apiKeys.filter(k => k.id !== id);
        this.logActivity('WARN', `Chave de API removida: ${id}`, username);
        await this.saveToStorage();
    }
    async toggleApiKeyStatus(id: number, username: string) {
        await this.ensureReady();
        const key = this.data!.apiKeys.find(k => k.id === id);
        if (key) {
            key.status = key.status === 'Ativa' ? 'Inativa' : 'Ativa';
            this.logActivity('INFO', `Status da chave API ${id} alterado para ${key.status}`, username);
            await this.saveToStorage();
        }
    }
    async setApiKeyStatus(id: number, status: 'Ativa' | 'Inativa') {
        await this.ensureReady();
        const key = this.data!.apiKeys.find(k => k.id === id);
        if (key) {
            key.status = status;
            await this.saveToStorage();
        }
    }
    async getNextSystemApiKey(): Promise<string> {
        await this.ensureReady();
        const activeKeys = this.data!.apiKeys.filter(k => k.status === 'Ativa');
        if (activeKeys.length === 0) throw new Error("No active API keys available");
        
        // Simple Round Robin or Random
        const key = activeKeys[Math.floor(Math.random() * activeKeys.length)];
        key.usageCount++;
        key.lastUsed = new Date().toISOString();
        await this.saveToStorage();
        return key.key;
    }

    // --- Modules ---
    async getModules(): Promise<Module[]> { await this.ensureReady(); return this.data!.modules; }
    async getModule(view: string): Promise<Module | undefined> {
        await this.ensureReady();
        return this.data!.modules.find(m => m.view === view);
    }
    async updateModuleStatus(id: string, active: boolean) {
        await this.ensureReady();
        const mod = this.data!.modules.find(m => m.id === id);
        if (mod) {
            mod.active = active;
            await this.saveToStorage();
        }
    }
    async saveModuleConfig(id: string, updates: Partial<Module>) {
        await this.ensureReady();
        const mod = this.data!.modules.find(m => m.id === id);
        if (mod) {
            Object.assign(mod, updates);
            await this.saveToStorage();
        }
    }
    async saveModuleRules(view: string, rules: string) {
        await this.ensureReady();
        const mod = this.data!.modules.find(m => m.view === view);
        if (mod) {
            mod.rules = rules;
            await this.saveToStorage();
        }
    }
    async deleteModule(id: string) {
        await this.ensureReady();
        this.data!.modules = this.data!.modules.filter(m => m.id !== id);
        await this.saveToStorage();
    }
    async addModule(module: Module) {
        await this.ensureReady();
        this.data!.modules.push(module);
        await this.saveToStorage();
    }

    // --- Data Sources ---
    async getDataSources(): Promise<DataSourceCategory[]> { await this.ensureReady(); return this.data!.dataSources; }
    async addDataSource(categoryId: number, source: any) {
        await this.ensureReady();
        const cat = this.data!.dataSources.find(c => c.id === categoryId);
        if (cat) {
            cat.sources.push({ ...source, id: Date.now() });
            await this.saveToStorage();
        }
    }
    async updateDataSource(id: number, updates: any) {
        await this.ensureReady();
        for (const cat of this.data!.dataSources) {
            const src = cat.sources.find(s => s.id === id);
            if (src) {
                Object.assign(src, updates);
                await this.saveToStorage();
                return;
            }
        }
    }
    async deleteDataSource(id: number) {
        await this.ensureReady();
        for (const cat of this.data!.dataSources) {
            cat.sources = cat.sources.filter(s => s.id !== id);
        }
        await this.saveToStorage();
    }
    async toggleDataSourceStatus(id: number) {
        await this.ensureReady();
        for (const cat of this.data!.dataSources) {
            const src = cat.sources.find(s => s.id === id);
            if (src) {
                src.active = !src.active;
                src.status = src.active ? 'Ativa' : 'Inativa';
                await this.saveToStorage();
                return;
            }
        }
    }
    async addDataSourceCategory(name: string) {
        await this.ensureReady();
        this.data!.dataSources.push({ id: Date.now(), name, sources: [] });
        await this.saveToStorage();
    }
    async renameDataSourceCategory(id: number, name: string) {
        await this.ensureReady();
        const cat = this.data!.dataSources.find(c => c.id === id);
        if (cat) {
            cat.name = name;
            await this.saveToStorage();
        }
    }
    async deleteDataSourceCategory(id: number) {
        await this.ensureReady();
        this.data!.dataSources = this.data!.dataSources.filter(c => c.id !== id);
        await this.saveToStorage();
    }
    async addSourceToCategoryByName(suggested: SuggestedSource) {
        await this.ensureReady();
        let cat = this.data!.dataSources.find(c => c.name.toLowerCase() === suggested.category.toLowerCase());
        if (!cat) {
            // Fallback or create new? For now put in first or create 'Sugestões'
            cat = this.data!.dataSources[0];
        }
        cat.sources.push({
            id: Date.now(),
            name: suggested.name,
            url: suggested.url,
            type: suggested.type as any,
            reliability: 'Média',
            active: true,
            status: 'Ativa'
        });
        await this.saveToStorage();
    }
    async validateAllDataSources() {
        // Simulate validation
        await this.ensureReady();
        for (const cat of this.data!.dataSources) {
            for (const src of cat.sources) {
                // Basic check: simulate random error if not gov.br
                if (!src.url.includes('gov.br') && Math.random() > 0.8) {
                    src.status = 'Com Erro';
                } else {
                    src.status = 'Ativa';
                }
            }
        }
        await this.saveToStorage();
    }
    
    // --- Automation ---
    async getAiAutomationSettings(): Promise<AiAutomationSettings> { await this.ensureReady(); return this.data!.aiAutomationSettings; }
    async saveAiAutomationSettings(settings: AiAutomationSettings) {
        await this.ensureReady();
        this.data!.aiAutomationSettings = settings;
        await this.saveToStorage();
    }
    async runAiAutomationTask() {
        await this.ensureReady();
        // Simulate task
        this.data!.aiAutomationSettings.lastRun = new Date().toISOString();
        this.data!.aiAutomationSettings.lastRunResult = 'Executado com sucesso. 0 novas fontes.';
        await this.saveToStorage();
    }

    // --- Dashboard ---
    async getDashboardWidgets(): Promise<DashboardWidget[]> { await this.ensureReady(); return this.data!.dashboardWidgets; }
    async saveDashboardWidgets(widgets: DashboardWidget[]) {
        await this.ensureReady();
        this.data!.dashboardWidgets = widgets;
        await this.saveToStorage();
    }
    
    async getDashboardData(municipality: string, refresh: boolean): Promise<DashboardData> {
        await this.ensureReady();
        // Cache check
        if (!refresh && this.data!.dashboardData[municipality]) {
            return this.data!.dashboardData[municipality];
        }
        
        // Generate new data
        const newData = await generateFullDashboardData(municipality);
        this.data!.dashboardData[municipality] = newData;
        await this.saveToStorage();
        return newData;
    }

    // --- Domain Data ---
    async getEmployees(forceRefresh = false): Promise<Employee[]> {
        await this.ensureReady();
        if (this.data!.employees.length === 0 || forceRefresh) {
             const municipality = Object.keys(this.data!.dashboardData)[0] || 'Example City';
             const newEmployees = await generateRealEmployees(municipality);
             this.data!.employees = newEmployees;
             await this.saveToStorage();
        }
        return this.data!.employees;
    }
    
    async getCompanies(): Promise<Company[]> {
        await this.ensureReady();
        if (this.data!.companies.length === 0) {
             const municipality = Object.keys(this.data!.dashboardData)[0] || 'Example City';
             const newCos = await generateRealCompanies(municipality);
             this.data!.companies = newCos;
             await this.saveToStorage();
        }
        return this.data!.companies;
    }
    
    async getContracts(): Promise<Contract[]> {
        await this.ensureReady();
        if (this.data!.contracts.length === 0) {
             const municipality = Object.keys(this.data!.dashboardData)[0] || 'Example City';
             const newConts = await generateRealContracts(municipality);
             this.data!.contracts = newConts;
             await this.saveToStorage();
        }
        return this.data!.contracts;
    }

    async getLawsuits(): Promise<Lawsuit[]> {
        await this.ensureReady();
        if (this.data!.lawsuits.length === 0) {
             const municipality = Object.keys(this.data!.dashboardData)[0] || 'Example City';
             const newLaws = await generateRealLawsuits(municipality);
             this.data!.lawsuits = newLaws;
             await this.saveToStorage();
        }
        return this.data!.lawsuits;
    }

    async getSocialPosts(): Promise<SocialPost[]> {
        await this.ensureReady();
        if (this.data!.socialPosts.length === 0) {
             const municipality = Object.keys(this.data!.dashboardData)[0] || 'Example City';
             const newPosts = await generateRealSocialPosts(municipality);
             this.data!.socialPosts = newPosts;
             await this.saveToStorage();
        }
        return this.data!.socialPosts;
    }

    async getTimelineEvents(): Promise<TimelineEvent[]> {
        await this.ensureReady();
        if (this.data!.timelineEvents.length === 0) {
             const municipality = Object.keys(this.data!.dashboardData)[0] || 'Example City';
             const newTimeline = await generateRealTimeline(municipality);
             this.data!.timelineEvents = newTimeline;
             await this.saveToStorage();
        }
        return this.data!.timelineEvents;
    }
    
    // --- Political ---
    async getAllPoliticians(): Promise<Politician[]> { await this.ensureReady(); return this.data!.politicians; }
    
    async getPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> {
        await this.ensureReady();
        const p = this.data!.politicians.find(pol => pol.id === id);
        if (!p) throw new Error("Politician not found");
        return { data: p, timestamp: Date.now(), source: 'cache' };
    }
    
    async refreshPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> {
        await this.ensureReady();
        let p = this.data!.politicians.find(pol => pol.id === id);
        if (p) {
             const updated = await generateDeepPoliticianAnalysis(p);
             Object.assign(p, updated);
             await this.saveToStorage();
             return { data: p, timestamp: Date.now(), source: 'api' };
        }
        throw new Error("Politician not found");
    }

    async ensurePoliticalLeadership(municipality: string): Promise<Politician[]> {
        await this.ensureReady();
        if (this.data!.politicians.length === 0) {
             const leaders = await generatePoliticalLeadership(municipality);
             this.data!.politicians = leaders;
             await this.saveToStorage();
             return leaders;
        }
        return this.data!.politicians;
    }

    async scanPoliticalSquad(municipality: string) {
        await this.ensureReady();
        const squad = await generatePoliticalSquad(municipality);
        // Merge without duplicates
        for (const p of squad) {
            if (!this.data!.politicians.find(ex => ex.id === p.id)) {
                this.data!.politicians.push(p);
            }
        }
        await this.saveToStorage();
    }

    async togglePoliticianMonitoring(id: string) {
        await this.ensureReady();
        const p = this.data!.politicians.find(pol => pol.id === id);
        if (p) {
            p.monitored = !p.monitored;
            await this.saveToStorage();
        }
    }
    
    // --- System ---
    async getDbConfig(): Promise<DbConfig> { await this.ensureReady(); return this.data!.dbConfig; }
    async saveDbConfig(config: DbConfig, username: string) {
        await this.ensureReady();
        this.data!.dbConfig = config;
        this.logActivity('AUDIT', `Configuração de DB alterada`, username);
        await this.saveToStorage();
    }

    async getSystemPrompt(): Promise<string> { await this.ensureReady(); return this.data!.systemPrompt; }
    async setSystemPrompt(prompt: string, username: string) {
        await this.ensureReady();
        this.data!.systemPrompt = prompt;
        this.logActivity('AUDIT', `System prompt atualizado`, username);
        await this.saveToStorage();
    }

    async getCompactDatabaseSnapshot(): Promise<string> {
        await this.ensureReady();
        return JSON.stringify({
            politicians: this.data!.politicians.map(p => p.name),
            companies: this.data!.companies.map(c => c.name),
            contracts_count: this.data!.contracts.length,
            lawsuits_count: this.data!.lawsuits.length
        });
    }

    logActivity(level: LogEntry['level'], message: string, user: string) {
        // Assuming data might not be ready if called synchronously in constructor or similar (rare)
        // But logActivity is mostly called after init.
        if (this.data) {
            this.data.logs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), level, message, user });
            if (this.data.logs.length > 100) this.data.logs.pop();
            // Fire and forget save, usually
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        }
    }
    
    async getLogs(): Promise<LogEntry[]> { await this.ensureReady(); return this.data!.logs; }

    async getStats() {
        await this.ensureReady();
        return {
            users: this.data!.users.length,
            modules: this.data!.modules.filter(m => m.active).length,
            totalModules: this.data!.modules.length,
            apiKeys: this.data!.apiKeys.length,
            dbStatus: this.data!.dbConfig.status,
            politicians: this.data!.politicians.length,
            employees: this.data!.employees.length,
            companies: this.data!.companies.length,
            lawsuits: this.data!.lawsuits.length,
        };
    }
    
    // --- Maintenance ---
    async getFullDatabaseBackup() {
        await this.ensureReady();
        return this.data;
    }
    
    async downloadMysqlInstaller() {
        await this.ensureReady();
        if(!this.data) return;
        const sql = generateMysqlInstaller('sie_datalake', {
            users: this.data.users,
            modules: this.data.modules,
            apiKeys: this.data.apiKeys,
            dataSources: this.data.dataSources,
            plans: this.data.plans,
            politicians: this.data.politicians.reduce((acc, p) => ({...acc, [p.id]: p}), {}),
            employees: this.data.employees,
            companies: this.data.companies,
            contracts: this.data.contracts,
            lawsuits: this.data.lawsuits,
            socialPosts: this.data.socialPosts,
            timelineEvents: this.data.timelineEvents
        });
        
        const blob = new Blob([sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'install.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async checkForRemoteUpdates() {
         return { updated: false, message: "Sistema atualizado (Versão Local)." };
    }

    async executeServerCommand(cmd: string) {
        return { success: true, output: `Comando '${cmd}' simulado com sucesso no ambiente local.` };
    }
}

export const dbService = new DbService();
