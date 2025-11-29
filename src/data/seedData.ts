
import type { User, Module, ApiKey, DataSourceCategory, TimelineEvent, UserPlan, ThemeConfig, HomepageConfig } from '../types';

// --- CONFIGURAÇÕES GLOBAIS ---
export const initialThemeConfig: ThemeConfig = {
    primary: '#0D1117',
    secondary: '#161B22',
    accent: '#30363D',
    text: '#E6EDF3',
    blue: '#3B82F6'
};

export const initialHomepageConfig: HomepageConfig = {
    active: true,
    theme: 'modern',
    title: 'S.I.E. 3.1',
    subtitle: 'Sistema de Investigação Estratégica Governamental',
    heroImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    logoUrl: '',
    features: [
        { title: 'Auditoria IA', description: 'Análise automática de diários oficiais.', icon: 'search' },
        { title: 'Redes Complexas', description: 'Mapeamento de conexões políticas.', icon: 'chart' },
        { title: 'Segurança', description: 'Proteção de dados nível governamental.', icon: 'shield' }
    ],
    customColors: { background: '#000000', text: '#ffffff', primary: '#3B82F6' }
};

// --- DADOS DE USUÁRIO ---
export const initialUsers: User[] = [
    { id: 1, username: 'admin', password: '123', email: 'admin@sie.gov.br', role: 'admin', status: 'Ativo', planId: 'enterprise', planExpiration: '2030-12-31', canUseOwnApiKey: true, usage: 0, avatarUrl: '' },
    { id: 2, username: 'jornalista', password: '123', email: 'news@media.com', role: 'user', status: 'Ativo', planId: 'pro', planExpiration: '2025-12-31', canUseOwnApiKey: true, usage: 0, avatarUrl: '' },
];

export const initialApiKeys: ApiKey[] = [
    { id: 1, key: 'AIzaSy_SYSTEM_DEFAULT_KEY_PLACEHOLDER', status: 'Ativa', type: 'System', usageCount: 0, lastUsed: '' }
];

// --- MÓDULOS E REGRAS ---
const politicalRules = JSON.stringify({
    priority_risk_areas: ['Judicial', 'Financeiro'],
    weight_judicial_risk: 8,
    network_depth_level: 2,
    min_connection_value: 5000,
    nepotism_window_months: 48,
    critical_positions: ['Secretário', 'Tesoureiro', 'Licitação'],
    mandatory_cpf_cnpj_check: true,
    timeline_event_filter: ['Homenagens'],
    timeline_max_years: 5
});

export const initialModules: Module[] = [
    { id: 'mod-dash', name: 'Dashboard', view: 'dashboard', icon: 'dashboard', active: true, hasSettings: true, category: 'strategy', updateFrequency: '12h' },
    { id: 'mod-res', name: 'Pesquisa IA', view: 'research', icon: 'search-circle', active: true, hasSettings: false, category: 'strategy', updateFrequency: 'realtime' },
    { id: 'mod-poli', name: 'Político', view: 'political', icon: 'political', active: true, hasSettings: true, rules: politicalRules, category: 'entities', updateFrequency: '24h' },
    { id: 'mod-func', name: 'Funcionários', view: 'employees', icon: 'employees', active: true, hasSettings: true, category: 'entities', updateFrequency: 'weekly' },
    { id: 'mod-empr', name: 'Empresas', view: 'companies', icon: 'companies', active: true, hasSettings: true, category: 'entities', updateFrequency: '24h' },
    { id: 'mod-cont', name: 'Contratos', view: 'contracts', icon: 'contracts', active: true, hasSettings: true, category: 'intelligence', updateFrequency: '6h' },
    { id: 'mod-judi', name: 'Judicial', view: 'judicial', icon: 'judicial', active: true, hasSettings: true, category: 'intelligence', updateFrequency: '24h' },
    { 
        id: 'mod-soci', 
        name: 'Módulo de Monitoramento de Redes Sociais', 
        view: 'social', 
        icon: 'social', 
        active: true, 
        hasSettings: true, 
        category: 'intelligence', 
        updateFrequency: '1h',
        rules: "Monitore as principais plataformas (Facebook, Instagram, X, TikTok) em busca de menções ao município e administração. Realize análise de sentimento avançada, detectando ironia, insatisfação popular e tendências virais. Classifique como Positivo, Negativo ou Neutro."
    },
    { id: 'mod-time', name: 'Timeline', view: 'timeline', icon: 'timeline', active: true, hasSettings: true, category: 'intelligence', updateFrequency: '24h' },
    { id: 'mod-ocr', name: 'OCR Jurídico', view: 'ocr', icon: 'document-text', active: true, hasSettings: false, category: 'intelligence', updateFrequency: 'realtime' },
];

export const initialPlans: UserPlan[] = [
    { id: 'starter', name: 'Starter', features: [], modules: ['mod-dash'], requestLimit: 100 },
    { id: 'pro', name: 'Pro', features: ['ai_analysis', 'own_api_key'], modules: ['mod-dash', 'mod-poli', 'mod-func', 'mod-soci'], requestLimit: 500 },
    { id: 'enterprise', name: 'Enterprise', features: ['ai_analysis', 'advanced_search', 'data_export', 'own_api_key', 'priority_support'], modules: initialModules.map(m => m.id), requestLimit: -1 }
];

export const initialDataSources: DataSourceCategory[] = [
    {
        id: 1,
        name: 'Fontes Oficiais',
        sources: [
            { id: 1, name: 'Portal da Transparência', url: 'https://transparencia.gov.br', active: true, type: 'Web Scraping', reliability: 'Alta', status: 'Ativa' },
            { id: 2, name: 'TSE DivulgaCand', url: 'https://divulgacandcontas.tse.jus.br', active: true, type: 'Banco de Dados', reliability: 'Alta', status: 'Ativa' }
        ]
    }
];

export const initialTimelineEvents: TimelineEvent[] = [
    { id: 1, date: '2024-01-01', title: 'Início do Ano Fiscal', description: 'Abertura do orçamento municipal.', category: 'Political', icon: 'flag' }
];
