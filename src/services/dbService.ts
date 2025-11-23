
import { 
    initialUsers, initialModules, initialApiKeys, initialDataSources, 
    initialTimelineEvents, initialPlans, initialThemeConfig, initialHomepageConfig 
} from '../data/seedData';

import type {
  User, Module, ApiKey, DataSourceCategory, Politician, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, UserPlan,
  DashboardData, DbConfig, LogEntry, DashboardWidget, AiAutomationSettings, Feature, FeatureKey,
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

import { generateMysqlInstaller } from './sqlGenerator';

const DEFAULT_DB_STATE = {
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
    themeConfig: initialThemeConfig,
    homepageConfig: initialHomepageConfig
};

class DbService {
    private data: any = null;
    private initialized = false;
    private syncTimeout: any = null;
    private API_URL = '/api'; 

    constructor() {
        this.init();
    }

    private async init() {
        console.log('[DB] Inicializando serviço de banco de dados...');
        try {
            // Passo 1: Verificar conectividade básica antes de tentar sync
            const connectionStatus = await this.testConnection();
            
            if (connectionStatus.status !== 'Conectado') {
                console.warn(`[DB] Backend Offline ou Inacessível: ${connectionStatus.details}`);
                console.info('[DB] Inicializando com dados padrão em memória (Modo Offline).');
                this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE));
                this.data.dbConfig.status = 'Erro';
                this.initialized = true;
                return;
            }

            // Passo 2: Se conectado, tentar carregar estado total
            const response = await fetch(`${this.API_URL}/state`);
            
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                 throw new Error('Endpoint /state retornou HTML (Erro de Proxy).');
            }

            if (response.ok) {
                const remoteData = await response.json();
                // Se o backend retornar dados vazios (primeira instalação), usa o default
                if (remoteData && (remoteData.users || []).length > 0) {
                    this.data = { ...DEFAULT_DB_STATE, ...remoteData };
                    this.data.dbConfig.status = 'Conectado';
                    console.log('[DB] Sincronizado com sucesso com o Backend (MySQL).');
                } else {
                    console.log('[DB] Backend conectado mas vazio. Inicializando seed...');
                    this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE));
                    this.data.dbConfig.status = 'Conectado';
                    // Opcional: Persistir o seed inicial
                    // this.persistState(); 
                }
            } else {
                throw new Error(`Erro HTTP ao buscar estado: ${response.status}`);
            }
        } catch (e: any) {
            console.error('[DB] Erro crítico de inicialização:', e.message);
            this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE));
            this.data.dbConfig.status = 'Erro';
        }
        this.initialized = true;
    }

    private async ensureReady() {
        if (!this.initialized || !this.data) {
            let attempts = 0;
            while (!this.initialized && attempts < 20) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }
            if (!this.data) {
                this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE));
                this.initialized = true;
            }
        }
    }

    private async persistState() {
        if (!this.data) return;
        // Não tenta salvar se já sabemos que o backend está offline ou se é apenas leitura
        // No modelo híbrido, a persistência é delegada aos métodos saveUser, savePlan, etc.
    }

    async login(username: string, password: string): Promise<User> {
        try {
            const response = await fetch(`${this.API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                throw new Error('Erro de Conexão: A API retornou HTML. O backend pode estar desligado ou o proxy incorreto.');
            }

            if (response.ok) {
                const data = await response.json();
                if (data.token) localStorage.setItem('auth_token', data.token);
                return data.user;
            } else {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Falha na autenticação');
            }
        } catch (e: any) {
            console.warn('[DB] Login offline fallback:', e.message);
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

        if (!response.ok) throw new Error(`AI Request Failed: ${response.statusText}`);
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
        
        await this.ensureReady();
        return {
            server: { cpuLoad: 0, memoryUsage: 0, totalMemoryGB: "0", uptimeSeconds: 0, platform: "offline" },
            system: {
                usersTotal: this.data.users.length,
                usersActive: 0,
                modulesTotal: this.data.modules.length,
                modulesActive: this.data.modules.filter((m: any) => m.active).length,
                logsTotal: this.data.logs.length,
                version: "3.1.0"
            }
        };
    }

    // --- Methods (Híbrido: API se online, Cache se offline) ---

    async getUsers(): Promise<User[]> { await this.ensureReady(); return this.data.users; }
    
    async saveUser(user: User, adminUsername: string) {
        await this.ensureReady();
        // Optimistic UI update
        const index = this.data.users.findIndex((u: User) => u.id === user.id);
        if (index >= 0) this.data.users[index] = user;
        else this.data.users.push(user);
        
        // API Call
        try {
            await fetch(`${this.API_URL}/domain/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify(user)
            });
        } catch(e) { console.error("API Save failed", e); }
    }

    async deleteUser(id: number, adminUsername: string): Promise<boolean> {
        await this.ensureReady();
        this.data.users = this.data.users.filter((u: User) => u.id !== id);
        try {
            await fetch(`${this.API_URL}/domain/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
        } catch(e) { console.error("API Delete failed", e); }
        return true;
    }

    async getPlans(): Promise<UserPlan[]> { await this.ensureReady(); return this.data.plans; }
    async getFeatures(): Promise<Feature[]> { return [{ key: 'ai_analysis', name: 'Análise IA', description: 'Gemini' }, { key: 'own_api_key', name: 'Chave Própria', description: 'BYOK' }]; }

    async getModules(): Promise<Module[]> { await this.ensureReady(); return this.data.modules; }
    async getModule(view: string): Promise<Module | undefined> { await this.ensureReady(); return this.data.modules.find((m: Module) => m.view === view); }
    
    async getDashboardData(municipality: string, refresh: boolean): Promise<DashboardData> {
        await this.ensureReady();
        if (!refresh && this.data.dashboardData[municipality]) return this.data.dashboardData[municipality];
        const newData = await generateFullDashboardData(municipality);
        this.data.dashboardData[municipality] = newData;
        return newData;
    }

    async getDashboardWidgets(): Promise<DashboardWidget[]> { await this.ensureReady(); return this.data.dashboardWidgets; }
    async saveDashboardWidgets(widgets: DashboardWidget[]) {
        await this.ensureReady();
        this.data.dashboardWidgets = widgets;
        // Salvar em userSettings no futuro
    }

    async getEmployees(refresh = false): Promise<Employee[]> {
        await this.ensureReady();
        if (this.data.employees.length === 0 || refresh) {
             const municipality = Object.keys(this.data.dashboardData)[0] || 'Local';
             this.data.employees = await generateRealEmployees(municipality);
        }
        return this.data.employees;
    }

    async getCompanies(): Promise<Company[]> {
        await this.ensureReady();
        if (this.data.companies.length === 0) {
             const municipality = Object.keys(this.data.dashboardData)[0] || 'Local';
             this.data.companies = await generateRealCompanies(municipality);
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
        let p = this.data.politicians.find((pol: Politician) => pol.id === id);
        if (p) {
             const updated = await generateDeepPoliticianAnalysis(p);
             Object.assign(p, updated);
             return { data: p, timestamp: Date.now(), source: 'api' };
        }
        throw new Error("Politician not found");
    }

    async ensurePoliticalLeadership(municipality: string): Promise<Politician[]> {
        await this.ensureReady();
        if (this.data.politicians.length === 0) {
             const leaders = await generatePoliticalLeadership(municipality);
             this.data.politicians = leaders;
        }
        return this.data.politicians;
    }

    async scanPoliticalSquad(municipality: string) {
        await this.ensureReady();
        const squad = await generatePoliticalSquad(municipality);
        squad.forEach(p => {
            if (!this.data.politicians.find((ex: Politician) => ex.id === p.id)) this.data.politicians.push(p);
        });
    }

    async togglePoliticianMonitoring(id: string) {
        await this.ensureReady();
        const p = this.data.politicians.find((pol: Politician) => pol.id === id);
        if (p) { p.monitored = !p.monitored; }
    }
    
    async getDbConfig(): Promise<DbConfig> { await this.ensureReady(); return this.data.dbConfig; }
    async saveDbConfig(config: DbConfig, username: string) { /* Impl */ }
    async getSystemPrompt(): Promise<string> { await this.ensureReady(); return this.data.systemPrompt; }
    async setSystemPrompt(prompt: string, user: string) { 
        await this.ensureReady(); 
        this.data.systemPrompt = prompt;
        // API Call
        try {
            await fetch(`${this.API_URL}/settings/ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify({ systemPrompt: prompt })
            });
        } catch(e) {}
    }

    async getUserActiveModules(user: User): Promise<Module[]> {
        await this.ensureReady();
        const plan = this.data.plans.find((p: any) => p.id === user.planId);
        if (!plan) return []; 
        const allowedIds = plan.modules || [];
        return this.data.modules.filter((m: Module) => allowedIds.includes(m.id) && m.active);
    }

    async checkAndIncrementQuota(userId: number, isAi: boolean) { return { allowed: true, usage: 0, limit: 1000 }; }
    async getUserUsageStats(userId: number) { return { usage: 0, limit: 1000 }; }
    async getNextSystemApiKey() { throw new Error("Use proxyAiRequest"); }

    logActivity(level: string, message: string, user: string) {
        if (!this.data) return;
        this.data.logs.unshift({ id: Date.now(), timestamp: new Date().toISOString(), level, message, user });
        if (this.data.logs.length > 100) this.data.logs.pop();
    }

    async getStats() { await this.ensureReady(); return { users: this.data.users.length, dbStatus: this.data.dbConfig.status }; }
    async getLogs() { await this.ensureReady(); return this.data.logs; }
    async getApiKeys() { await this.ensureReady(); return this.data.apiKeys; }
    
    async getTheme() { await this.ensureReady(); return this.data.themeConfig; }
    async saveTheme(config: ThemeConfig, username: string) {
        await this.ensureReady();
        this.data.themeConfig = config;
        localStorage.setItem('sie_theme', JSON.stringify(config));
        try {
            await fetch(`${this.API_URL}/settings/theme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify(config)
            });
        } catch(e) {}
    }

    async getHomepageConfig() { await this.ensureReady(); return this.data.homepageConfig; }
    async saveHomepageConfig(config: HomepageConfig, username: string) {
        await this.ensureReady();
        this.data.homepageConfig = config;
        try {
            await fetch(`${this.API_URL}/settings/homepage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
                body: JSON.stringify(config)
            });
        } catch(e) {}
    }

    async getAiAutomationSettings() { await this.ensureReady(); return this.data.aiAutomationSettings; }
    async saveAiAutomationSettings(s: any) { await this.ensureReady(); this.data.aiAutomationSettings = s; }
    async getDataSources() { await this.ensureReady(); return this.data.dataSources; }
    async addDataSource(catId: number, src: any) { /* Impl */ }
    async updateDataSource(id: number, src: any) { /* Impl */ }
    async deleteDataSource(id: number) { /* Impl */ }
    async addDataSourceCategory(n: string) { /* Impl */ }
    async renameDataSourceCategory(id: number, n: string) { /* Impl */ }
    async deleteDataSourceCategory(id: number) { /* Impl */ }
    async addSourceToCategoryByName(s: any) { /* Impl */ }
    async validateAllDataSources() { /* Impl */ }
    async runAiAutomationTask() { /* Impl */ }
    async saveUserApiKey(uid: number, key: string) { await this.ensureReady(); const u = this.data.users.find((x:any)=>x.id===uid); if(u) u.apiKey = key; }
    async removeUserApiKey(uid: number) { await this.ensureReady(); const u = this.data.users.find((x:any)=>x.id===uid); if(u) u.apiKey = null; }
    async checkUserFeatureAccess(uid: number, f: string) { return true; }
    async updateUserProfile(uid: number, updates: any) { await this.ensureReady(); const u = this.data.users.find((x:any)=>x.id===uid); Object.assign(u, updates); return u; }
    async getUserPlanDetails(u: User) { return { plan: { name: 'Enterprise' }, features: [] }; }
    async addApiKey(k: string, u: string) { /* Impl */ }
    async removeApiKey(id: number, u: string) { /* Impl */ }
    async toggleApiKeyStatus(id: number, u: string) { /* Impl */ }
    async setApiKeyStatus(id: number, s: string) { /* Impl */ }
    async savePlan(p: any) { /* Impl */ }
    async deletePlan(id: string) { /* Impl */ }
    async saveModuleRules(view: string, rules: string) { await this.ensureReady(); const m = this.data.modules.find((x:any)=>x.view===view); if(m) m.rules = rules; }
    async updateModuleStatus(id: string, active: boolean) { await this.ensureReady(); const m = this.data.modules.find((x:any)=>x.id===id); if(m) m.active = active; }
    async saveModuleConfig(id: string, updates: any) { await this.ensureReady(); const m = this.data.modules.find((x:any)=>x.id===id); if(m) Object.assign(m, updates); }
    async deleteModule(id: string) { /* Impl */ }
    async addModule(m: any) { /* Impl */ }
    async getCompactDatabaseSnapshot() { return "{}"; }
    
    async uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('module', 'general');

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'Falha no upload');
            }
            
            const data = await response.json();
            return data.file.url; // Retorna URL relativa /media/...
        } catch (error: any) {
            console.error("Upload error:", error);
            // Em modo offline/dev, retorna Base64 fake para não travar UI
            if (this.data.dbConfig.status !== 'Conectado') {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                });
            }
            throw error;
        }
    }

    async executeServerCommand(c: string) { return { success: true, output: "Simulado" }; }
    async checkForRemoteUpdates() { return { updated: false }; }
    async getFullDatabaseBackup() { return this.data; }
    async resetDatabase() { this.data = JSON.parse(JSON.stringify(DEFAULT_DB_STATE)); }
    async downloadMysqlInstaller() { 
        if(this.data) {
            const sql = generateMysqlInstaller('sie_datalake', this.data);
            const blob = new Blob([sql], { type: 'text/sql' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'install.sql';
            document.body.appendChild(a);
            a.click();
        }
    }
    
    async testConnection(): Promise<{ status: string, details: string }> {
        try {
            // Adiciona timestamp para evitar cache de navegador
            const res = await fetch(`${this.API_URL}/status?t=${Date.now()}`);
            const contentType = res.headers.get("content-type");
            
            if (contentType && contentType.includes("text/html")) {
                 const text = await res.text();
                 // Se retorna a tag title do SPA, é porque o Nginx mandou para index.html
                 if (text.includes("<title>") || text.includes("S.I.E.")) {
                     return { 
                         status: 'Falha', 
                         details: 'O endpoint retornou HTML (Erro de Proxy Nginx). Verifique se o bloco "location /api" existe e aponta para a porta 3000.' 
                     };
                 }
                 return { 
                     status: 'Falha', 
                     details: 'Erro de Gateway: O servidor retornou HTML genérico.' 
                 };
            }

            if (res.ok) {
                try {
                    const data = await res.json();
                    return { 
                        status: 'Conectado', 
                        details: `API: Online. DB: ${data.database || 'MySQL'}` 
                    };
                } catch (jsonError) {
                    return { status: 'Falha', details: 'Resposta inválida JSON.' };
                }
            }
            
            return { status: 'Erro', details: `HTTP ${res.status}` };
        } catch (e: any) {
            return { 
                status: 'Desconectado', 
                details: `Falha de Rede: ${e.message}. Backend pode estar offline.` 
            };
        }
    }
}

export const dbService = new DbService();
