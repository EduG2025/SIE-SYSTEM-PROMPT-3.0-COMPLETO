import type {
  User, Module, ApiKey, DataSourceCategory, Politician, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, UserPlan,
  DashboardData, DbConfig, LogEntry, DashboardWidget, AiAutomationSettings, Feature, FeatureKey, SuggestedSource,
  PoliticianDataResponse, ThemeConfig, HomepageConfig
} from '../types';

const DEFAULT_DASHBOARD_WIDGETS: DashboardWidget[] = [
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

const INITIAL_FEATURES: Feature[] = [
    { key: 'ai_analysis', name: 'Análise IA', description: 'Acesso aos modelos Gemini para insights.' },
    { key: 'advanced_search', name: 'Busca Avançada', description: 'Filtros complexos e busca forense.' },
    { key: 'data_export', name: 'Exportação de Dados', description: 'Download em CSV, JSON e PDF.' },
    { key: 'own_api_key', name: 'Chave de API Própria', description: 'Use sua própria cota do Google Cloud.' },
    { key: 'priority_support', name: 'Suporte Prioritário', description: 'Atendimento dedicado.' },
];

const CURRENT_VERSION = '3.1.0'; 

class DbService {
    private getApiUrl(): string {
        return '/api'; 
    }

    private getApiHeaders(): HeadersInit {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.getApiUrl()}${endpoint}`, {
            ...options,
            headers: { ...this.getApiHeaders(), ...options.headers }
        });

        if (!response.ok) {
            // Try to parse error message from JSON, fallback to status text
            let errorMessage = `Erro HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message) errorMessage = errorData.message;
            } catch (e) { /* ignore JSON parse error */ }
            
            throw new Error(errorMessage);
        }
        
        // Handle 204 No Content
        if (response.status === 204) return {} as T;

        return response.json();
    }

    // --- Infrastructure & Connectivity ---

    async testConnection(): Promise<{ status: string, details: string }> {
        try {
            const response = await fetch(`${this.getApiUrl()}/system/status`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) {
                 return { status: 'Falha', details: 'ERRO DE PROXY: Nginx retornou HTML.' };
            }
            
            if (!response.ok) return { status: 'Erro Backend', details: `HTTP ${response.status}` };
            
            return { status: 'Conectado', details: `Online` };
        } catch (e) {
            return { status: 'Offline', details: 'Servidor inalcançável.' };
        }
    }

    // --- Authentication ---

    async login(username: string, password: string): Promise<User> { 
        const res = await this.request<{user: User, token: string}>('/auth/login', { 
            method: 'POST', 
            body: JSON.stringify({ username, password }) 
        });
        if (res.token) localStorage.setItem('auth_token', res.token);
        return res.user;
    }

    async validateSession(): Promise<User | null> {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;
        try {
            return await this.request<User>('/auth/me');
        } catch (error) {
            localStorage.removeItem('auth_token');
            return null;
        }
    }

    // --- User Management ---

    async getUsers(): Promise<User[]> { return this.request('/users'); }
    async saveUser(user: User, adminUsername: string) { return this.request('/users', { method: 'POST', body: JSON.stringify(user) }); }
    async deleteUser(id: number, adminUsername: string): Promise<boolean> { return this.request(`/users/${id}`, { method: 'DELETE' }).then(() => true).catch(() => false); }
    async updateUserProfile(id: number, updates: Partial<User>): Promise<User> { return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(updates) }); }

    // --- Modules & Plans ---

    async getModules(): Promise<Module[]> { return this.request('/modules'); }
    async getPlans(): Promise<UserPlan[]> { return this.request('/plans'); }
    async savePlan(plan: UserPlan) { return this.request('/plans', { method: 'POST', body: JSON.stringify(plan) }); }
    async deletePlan(id: string) { return this.request(`/plans/${id}`, { method: 'DELETE' }); }
    
    async getUserActiveModules(user: User): Promise<Module[]> {
        try {
            const [modules, plans] = await Promise.all([this.getModules(), this.getPlans()]);
            const plan = plans.find(p => p.id === user.planId);
            if (!plan) return [];
            // Return active modules that are included in the user's plan
            return modules.filter(m => m.active && plan.modules.includes(m.id));
        } catch (e) { return []; }
    }

    async getUserPlanDetails(user: User) {
        const plans = await this.getPlans();
        const plan = plans.find(p => p.id === user.planId);
        if (!plan) throw new Error("Plan not found");
        return { plan, features: INITIAL_FEATURES.map(f => ({ ...f, isActive: plan.features.includes(f.key) })) };
    }

    async checkUserFeatureAccess(userId: number, featureKey: FeatureKey): Promise<boolean> {
        try {
            const user = await this.request<User>(`/auth/me`); // Or fetch generic user if needed
            const plans = await this.getPlans();
            const plan = plans.find(p => p.id === user.planId);
            return plan ? plan.features.includes(featureKey) : false;
        } catch (e) { return false; }
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

    // --- System Settings ---

    async getTheme(): Promise<ThemeConfig> { return this.request('/settings/theme'); }
    async saveTheme(config: ThemeConfig, user: string) { return this.request('/settings/theme', { method: 'POST', body: JSON.stringify(config) }); }
    async getHomepageConfig(): Promise<HomepageConfig> { return this.request('/settings/homepage'); }
    async saveHomepageConfig(config: HomepageConfig, user: string) { return this.request('/settings/homepage', { method: 'POST', body: JSON.stringify(config) }); }
    
    async getSystemPrompt(): Promise<string> { return this.request<{systemPrompt: string}>('/settings/ai').then(r => r.systemPrompt); }
    async setSystemPrompt(prompt: string, user: string) { return this.request('/settings/ai', { method: 'POST', body: JSON.stringify({ systemPrompt: prompt }) }); }
    async getAiAutomationSettings(): Promise<AiAutomationSettings> { return this.request<{automation: AiAutomationSettings}>('/settings/ai').then(r => r.automation); }
    async saveAiAutomationSettings(settings: AiAutomationSettings) { return this.request('/settings/ai/automation', { method: 'POST', body: JSON.stringify(settings) }); }
    async runAiAutomationTask() { return this.request('/settings/ai/run', { method: 'POST' }); }
    
    // AI Proxy (Frontend -> Backend -> Google)
    async proxyAiRequest(payload: any) { return this.request<any>('/ai/generate', { method: 'POST', body: JSON.stringify(payload) }); }

    async getApiKeys(): Promise<ApiKey[]> { return this.request('/settings/keys'); }
    async addApiKey(key: string, username: string) { return this.request('/settings/keys', { method: 'POST', body: JSON.stringify({ key }) }); }
    async removeApiKey(id: number, username: string) { return this.request(`/settings/keys/${id}`, { method: 'DELETE' }); }
    async toggleApiKeyStatus(id: number, username: string) { return this.request(`/settings/keys/${id}/toggle`, { method: 'PUT' }); }
    async setApiKeyStatus(id: number, status: string) { return this.request(`/settings/keys/${id}/toggle`, { method: 'PUT' }); }
    async saveUserApiKey(userId: number, key: string) { return this.updateUserProfile(userId, { apiKey: key, canUseOwnApiKey: true }); }
    async removeUserApiKey(userId: number) { return this.updateUserProfile(userId, { apiKey: '', canUseOwnApiKey: false }); }

    // --- Domain Data (Intelligence) ---

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
            // Trigger POST to regenerate data via AI
            return this.request(url, { method: 'POST' }); // Backend returns the new data
        }
        return this.request(url);
    }

    async getPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> { 
        try {
            const p = await this.request<Politician>(`/domain/politicians/${id}`);
            return { data: p, timestamp: Date.now(), source: 'api' };
        } catch (e) { throw e; }
    }
    
    async refreshPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> { return this.getPoliticianAnalysisData(id); }

    // --- System Stats & Utils ---

    async getDashboardWidgets(): Promise<DashboardWidget[]> {
        const stored = localStorage.getItem('dashboard_widgets');
        return stored ? JSON.parse(stored) : DEFAULT_DASHBOARD_WIDGETS;
    }
    async saveDashboardWidgets(widgets: DashboardWidget[]) { localStorage.setItem('dashboard_widgets', JSON.stringify(widgets)); }

    async getLogs(): Promise<LogEntry[]> { return this.request('/logs'); }
    async logActivity(level: string, message: string, user: string) { 
        // Fire and forget to avoid blocking UI
        this.request('/logs', { method: 'POST', body: JSON.stringify({ level, message, user }) }).catch(console.error); 
    }
    
    async getSystemDashboardStats() { return this.request<any>('/system/status'); } 
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
    
    async resetDatabase() { 
        const confirmed = window.confirm("ATENÇÃO: Isso irá apagar TODOS os dados do Banco de Dados MySQL. Tem certeza?");
        if(confirmed) {
            return this.request('/data/reset', { method: 'POST' });
        }
    }

    // --- Stubbed / Deprecated Methods (Kept for Interface Compatibility) ---
    async getDataSources(): Promise<DataSourceCategory[]> { return []; }
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
    async checkForRemoteUpdates() { return { updated: false, message: "Sistema atualizado.", version: CURRENT_VERSION }; }
    async executeServerCommand(cmd: string) { return { success: false, output: "Comando não permitido via API pública." }; }
    async scanPoliticalSquad(municipality: string) { /* Stub: Back-end handles this now */ }
    async ensurePoliticalLeadership(municipality: string) { return this.getAllPoliticians(); }
    async togglePoliticianMonitoring(id: string) { /* Stub */ }
    async getFeatures(): Promise<Feature[]> { return INITIAL_FEATURES; }
    async getUserUsageStats(id: number) { return { usage: 0, limit: 100 }; }
}

export const dbService = new DbService();