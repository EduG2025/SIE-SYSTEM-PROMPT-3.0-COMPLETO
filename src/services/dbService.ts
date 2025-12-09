
import type {
  User, Module, ApiKey, Politician, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, UserPlan,
  DashboardData, DbConfig, LogEntry, DashboardWidget, AiAutomationSettings, Feature, FeatureKey, SuggestedSource,
  PoliticianDataResponse, ThemeConfig, HomepageConfig, DataSourceCategory, DataSource
} from '../types';

// Configuração padrão caso o backend não responda imediatamente (Fallback)
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

class DbService {
    private getApiUrl(): string {
        // Em produção, o Nginx serve /api como proxy para o backend na porta 3000
        // Em desenvolvimento (Vite), o proxy do vite.config.ts faz o mesmo
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
            let errorMessage = `Erro HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.message) errorMessage = errorData.message;
            } catch (e) { 
                const text = await response.text();
                // Detecção de erro de Proxy (Nginx retornando HTML de erro)
                if (text.includes('<!DOCTYPE html>') || text.includes('Bad Gateway')) {
                    throw new Error('Erro de conexão com o servidor API (Backend Offline/Proxy Error).');
                }
            }
            throw new Error(errorMessage);
        }
        
        // Retorna vazio para 204 No Content
        if (response.status === 204) return {} as T;

        return response.json();
    }

    // --- Infrastructure & Connectivity ---

    async testConnection(): Promise<{ status: string, details: string }> {
        try {
            const response = await fetch(`${this.getApiUrl()}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                return { status: 'Erro Backend', details: `HTTP ${response.status}` };
            }
            
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
            const plans = await this.getPlans();
            const user = await this.request<User>('/auth/me');
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
        // Implementação real usando FormData para a rota /api/modules/install
        const formData = new FormData();
        formData.append('modulePackage', file);
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${this.getApiUrl()}/modules/install`, {
            method: 'POST',
            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Falha na instalação do módulo');
        }
    }

    // --- Upload Logic ---

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

    async uploadFileChunked(file: File, onProgress: (progress: number) => void, cancelSignal?: AbortSignal): Promise<string> {
        // Fallback simples por enquanto, mas preparado para lógica de chunking
        return this.uploadFile(file); 
    }

    // --- System Settings ---

    async getTheme(): Promise<ThemeConfig> { return this.request('/settings/theme'); }
    async saveTheme(config: ThemeConfig, user: string) { return this.request('/settings/theme', { method: 'POST', body: JSON.stringify(config) }); }
    async getHomepageConfig(): Promise<HomepageConfig> { return this.request('/settings/homepage'); }
    async saveHomepageConfig(config: HomepageConfig, user: string) { return this.request('/settings/homepage', { method: 'POST', body: JSON.stringify(config) }); }
    
    async getSystemPrompt(): Promise<string> { return this.request<{systemPrompt: string}>('/settings/ai').then(r => r.systemPrompt); }
    async setSystemPrompt(prompt: string, user: string) { return this.request('/settings/ai', { method: 'POST', body: JSON.stringify({ systemPrompt: prompt }) }); }
    
    async getAiAutomationSettings(): Promise<AiAutomationSettings> { 
        return this.request<{automation: AiAutomationSettings}>('/settings/ai').then(r => r.automation); 
    }
    
    async saveAiAutomationSettings(settings: AiAutomationSettings) { 
        return this.request('/settings/ai/automation', { method: 'POST', body: JSON.stringify(settings) }); 
    }
    
    async runAiAutomationTask() { 
        return this.request('/settings/ai/run', { method: 'POST' }); 
    }
    
    // Proxy para chamar a IA Gemini através do backend (segurança de chave)
    async proxyAiRequest(payload: any) { 
        return this.request<any>('/ai/generate', { method: 'POST', body: JSON.stringify(payload) }); 
    }

    async getApiKeys(): Promise<ApiKey[]> { return this.request('/settings/keys'); }
    async addApiKey(key: string, username: string) { return this.request('/settings/keys', { method: 'POST', body: JSON.stringify({ key }) }); }
    async removeApiKey(id: number, username: string) { return this.request(`/settings/keys/${id}`, { method: 'DELETE' }); }
    async toggleApiKeyStatus(id: number, username: string) { return this.request(`/settings/keys/${id}/toggle`, { method: 'PUT' }); }
    async setApiKeyStatus(id: number, status: string) { return this.request(`/settings/keys/${id}/toggle`, { method: 'PUT' }); }
    async saveUserApiKey(userId: number, key: string) { return this.updateUserProfile(userId, { apiKey: key, canUseOwnApiKey: true }); }
    async removeUserApiKey(userId: number) { return this.updateUserProfile(userId, { apiKey: '', canUseOwnApiKey: false }); }

    // --- Data Sources Management ---
    
    async getDataSources(): Promise<DataSourceCategory[]> { return this.request('/datasources'); }
    
    async addDataSource(categoryId: number, source: any) { 
        return this.request(`/datasources/categories/${categoryId}/sources`, { method: 'POST', body: JSON.stringify(source) }); 
    }
    
    async updateDataSource(id: number, updates: any) { 
        return this.request(`/datasources/sources/${id}`, { method: 'PUT', body: JSON.stringify(updates) }); 
    }
    
    async deleteDataSource(id: number) { 
        return this.request(`/datasources/sources/${id}`, { method: 'DELETE' }); 
    }
    
    async toggleDataSourceStatus(id: number) { 
        return this.request(`/datasources/sources/${id}/toggle`, { method: 'PUT' }); 
    }
    
    async addDataSourceCategory(name: string) { 
        return this.request('/datasources/categories', { method: 'POST', body: JSON.stringify({ name }) }); 
    }
    
    async renameDataSourceCategory(id: number, name: string) { 
        return this.request(`/datasources/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }); 
    }
    
    async deleteDataSourceCategory(id: number) { 
        return this.request(`/datasources/categories/${id}`, { method: 'DELETE' }); 
    }
    
    async addSourceToCategoryByName(source: SuggestedSource) { 
        return this.request('/datasources/suggested', { method: 'POST', body: JSON.stringify(source) }); 
    }
    
    async validateAllDataSources() { 
        return this.request('/datasources/validate', { method: 'POST' }); 
    }

    // --- Domain Data (Intelligence) ---

    async getEmployees(refresh = false): Promise<Employee[]> { 
        if (refresh) {
            const municipality = localStorage.getItem('selectedMunicipality');
            if (municipality) {
                // Aciona a IA no backend para varrer diários oficiais
                await this.request('/domain/employees/scan', { method: 'POST', body: JSON.stringify({ municipality }) });
            }
        }
        return this.request('/domain/employees'); 
    }
    
    async getCompanies(): Promise<Company[]> { return this.request('/domain/companies'); }
    async getContracts(): Promise<Contract[]> { return this.request('/domain/contracts'); }
    async getLawsuits(): Promise<Lawsuit[]> { return this.request('/domain/judicial'); }
    async getSocialPosts(): Promise<SocialPost[]> { return this.request('/domain/social'); }
    async getTimelineEvents(): Promise<TimelineEvent[]> { return this.request('/domain/timeline'); }
    
    async getAllPoliticians(): Promise<Politician[]> { return this.request('/domain/politicians'); }
    
    async getDashboardData(municipality: string, refresh: boolean): Promise<DashboardData> {
        const url = `/dashboard/${encodeURIComponent(municipality)}`;
        if (refresh) {
            // POST aciona o backend AI para recalcular
            return this.request(url, { method: 'POST' });
        }
        return this.request(url);
    }

    async getPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> { 
        try {
            const p = await this.request<Politician>(`/domain/politicians/${id}`);
            return { data: p, timestamp: Date.now(), source: 'api' };
        } catch (e) { throw e; }
    }
    
    async refreshPoliticianAnalysisData(id: string): Promise<PoliticianDataResponse> { 
        // Em um sistema real, isso poderia acionar uma nova varredura específica para este ID
        return this.getPoliticianAnalysisData(id); 
    }

    async scanPoliticalSquad(municipality: string) { 
        // Aciona IA no backend para listar vereadores e secretários
        return this.request('/domain/politicians/scan', { 
            method: 'POST', 
            body: JSON.stringify({ municipality }) 
        }); 
    }
    
    async ensurePoliticalLeadership(municipality: string): Promise<Politician[]> {
        const data = await this.getAllPoliticians();
        if (data.length === 0) {
            await this.scanPoliticalSquad(municipality);
            return this.getAllPoliticians();
        }
        return data;
    }

    async togglePoliticianMonitoring(id: string) { 
        const p = await this.request<Politician>(`/domain/politicians/${id}`);
        if (p) {
            p.monitored = !p.monitored;
            await this.request('/domain/politicians', { method: 'POST', body: JSON.stringify(p) });
        }
    }

    // --- System Stats & Utils ---

    async getDashboardWidgets(): Promise<DashboardWidget[]> {
        const stored = localStorage.getItem('dashboard_widgets');
        return stored ? JSON.parse(stored) : DEFAULT_DASHBOARD_WIDGETS;
    }
    async saveDashboardWidgets(widgets: DashboardWidget[]) { localStorage.setItem('dashboard_widgets', JSON.stringify(widgets)); }

    async getLogs(): Promise<LogEntry[]> { return this.request('/logs'); }
    async logActivity(level: string, message: string, user: string) { 
        this.request('/logs', { method: 'POST', body: JSON.stringify({ level, message, user }) }).catch(console.error); 
    }
    
    async getSystemDashboardStats() { return this.request<any>('/system/status'); } 
    async getStats() { 
        try {
            const status = await this.getSystemDashboardStats();
            return status.system || {};
        } catch (e) { return {}; }
    }
    
    async getDbConfig(): Promise<DbConfig> { 
        const connection = await this.testConnection();
        return { status: connection.status as any, apiUrl: '/api', apiToken: '***' }; 
    }
    async saveDbConfig(config: DbConfig, user: string) { return Promise.resolve(); }

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

    async checkForRemoteUpdates() { return { updated: false, message: "Sistema atualizado.", version: "3.1.0" }; }
    async executeServerCommand(cmd: string) { return { success: false, output: "Comando não permitido via API pública." }; }
    async getFeatures(): Promise<Feature[]> { return INITIAL_FEATURES; }
    async getUserUsageStats(id: number) { return { usage: 0, limit: 100 }; }
}

export const dbService = new DbService();
