
export type ViewType = string;

export type AdminViewType = 
  | 'dashboard'
  | 'users'
  | 'system'
  | 'modules'
  | 'data'
  | 'datasources';

// --- Tipos para o novo Módulo de Análise Política ---

export type RiskLevel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

export interface ReputationData {
  area: string;
  score: number; // 0-100
}

export interface Connection {
  id: string; // Pode ser ID de outro político ou CNPJ de empresa
  name: string;
  type: 'Político' | 'Empresa' | 'Doador';
  relationship: string;
  risk: RiskLevel;
}

export interface GeminiAnalysisResult {
  summary: string;
  riskAnalysis: string;
  connectionAnalysis: string;
  campaignStrategy: string;
  overallAssessment: string;
}

export interface ElectoralHistoryEntry {
  year: number;
  position: string;
  result: 'Eleito' | 'Não Eleito';
  votes: number;
  party: string;
}

export interface PartyHistoryEntry {
  year: number;
  party: string;
  action: 'Filiou-se' | 'Desfiliou-se';
}

export interface Donation {
  id: string;
  donorName: string;
  donorId: string; // CPF ou CNPJ
  amount: number;
  type: 'Pessoa Física' | 'Pessoa Jurídica';
  risk: RiskLevel;
}

export interface Asset {
  year: number;
  description: string;
  value: number;
}

export interface ElectoralMapData {
  imageUrl: string;
  description: string;
}

// Interface principal para o político, agora muito mais detalhada.
export interface Politician {
  id: string;
  name: string;
  party: string;
  state: string;
  position: string;
  imageUrl: string;
  bio: string;
  risks: {
    judicial: RiskLevel;
    financial: RiskLevel;
    media: RiskLevel;
  };
  reputation: ReputationData[];
  connections: Connection[];
  electoralHistory: ElectoralHistoryEntry[];
  partyHistory: PartyHistoryEntry[];
  donations: {
    received: Donation[];
  };
  assets: {
    growthPercentage: number;
    declarations: Asset[];
  };
  electoralMap: ElectoralMapData;
}

// Resposta do serviço de dados para o módulo político
export interface PoliticianDataResponse {
  data: Politician;
  timestamp: number;
  source: 'api' | 'mock' | 'cache';
}

// --- Fim dos Tipos do Módulo de Análise Política ---


export interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  appointedBy: string;
  startDate: string;
  riskScore: number; // 0-10
  riskAnalysis: string;
}

export interface Company {
  id: number;
  name:string;
  cnpj: string;
  totalContractsValue: number;
  riskScore: number;
}

export interface Contract {
    id: string;
    companyName: string;
    value: number;
    object: string;
    startDate: string;
    endDate: string;
}

export interface Lawsuit {
  id: string;
  parties: string;
  court: string;
  status: 'Ongoing' | 'Finished' | 'Suspended';
}

export interface SocialPost {
    id: number;
    platform: 'Facebook' | 'Instagram';
    author: string;
    content: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    timestamp: string;
}

export interface TimelineEvent {
  id: number;
  date: string;
  title: string;
  description: string;
  category: 'Nomination' | 'Contract' | 'Lawsuit' | 'Social Media';
  icon: string;
}

export interface ChatMessage {
    id: number;
    sender: 'user' | 'ai';
    text: string;
}

export type UserRole = 'admin' | 'user';

// --- NOVOS TIPOS PARA PLANOS E RECURSOS ---
export type FeatureKey = 'ai_analysis' | 'advanced_search' | 'data_export' | 'own_api_key' | 'priority_support';

export interface Feature {
    key: FeatureKey;
    name: string;
    description: string;
}

export interface UserPlan {
    id: string;
    name: string;
    features: FeatureKey[];
    modules: string[]; // Lista de IDs dos módulos permitidos para este plano
    requestLimit: number; // Limite de requisições diárias (-1 para ilimitado)
}
// ------------------------------------------

export interface User {
    id: number;
    username: string;
    password?: string; // Adicionado senha (opcional na interface, mas usado na lógica)
    email?: string; 
    avatarUrl?: string; // Adicionado Avatar
    role: UserRole;
    status: 'Ativo' | 'Inativo';
    planId: string; 
    planExpiration?: string; 
    
    // Configurações pessoais e uso
    apiKey?: string; 
    canUseOwnApiKey?: boolean; 
    
    usage: number; 
    lastUsageReset?: string; 
}

export interface ApiKey {
  id: number;
  key: string;
  status: 'Ativa' | 'Inativa';
  type: 'System' | 'User'; // System keys cannot be deleted easily
  usageCount: number; // For monitoring
  lastUsed?: string; // Timestamp
}

export interface DbConfig {
  host: string;
  port: string;
  user: string;
  password?: string;
  status: 'Conectado' | 'Desconectado';
}

export interface DataSource {
  id: number;
  name: string;
  url: string;
  active: boolean;
  type: 'API' | 'Web Scraping' | 'RSS' | 'Banco de Dados' | 'CSV' | 'JSON' | 'Manual';
  reliability: 'Alta' | 'Média' | 'Baixa';
  status: 'Ativa' | 'Inativa' | 'Com Erro';
}

export interface DataSourceCategory {
  id: number;
  name: string;
  sources: DataSource[];
}

export interface SuggestedSource {
  name: string;
  url: string;
  category: string;
  type: 'API' | 'Web Scraping' | 'RSS' | 'Banco de Dados' | 'CSV' | 'JSON' | 'Manual';
}

export interface AiAutomationSettings {
  isEnabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun?: string;
  lastRunResult?: string;
}

export type UpdateFrequency = 'realtime' | '1h' | '6h' | '12h' | '24h' | 'weekly';

export interface Module {
  id: string;
  name: string;
  view: ViewType;
  icon: string;
  active: boolean;
  hasSettings?: boolean;
  rules?: string; // Regras específicas da IA para este módulo (pode ser JSON stringified)
  updateFrequency?: UpdateFrequency;
  lastUpdate?: string; 
}

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';
  message: string;
  user?: string;
}

// --- Tipos do Dashboard (versão antiga, para compatibilidade) ---
export interface WelcomeWidgetData {
  municipality: string;
  activeModulesCount: number;
  totalModulesCount: number;
}
export interface ReputationWidgetData {
  level: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  score: number;
  summary: string;
}
export interface PoliticalWidgetData {
  highRiskPoliticians: { name: string; party: string; riskLevel: string }[];
}
export interface CompaniesWidgetData {
  topContracts: { name: string; totalContractsValue: number }[];
}
export interface JudicialWidgetData {
  ongoingLawsuits: { id: string; parties: string }[];
}
export interface SocialWidgetData {
  latestNegativePosts: { author: string; platform: string; content: string }[];
}


// --- Tipos do Dashboard de Análise Estratégica ---

export interface DashboardStats {
  facebook: number;
  instagram: number;
  twitter: number;
  judicialProcesses: number;
}

export interface Official {
  name: string;
  position: string;
  party: string;
  mandate: {
    start: string;
    end: string;
  };
  avatarUrl: string; // URL para uma imagem de avatar genérica ou real
  politicianId?: string; // ID para ligar ao módulo de análise política
}

export interface ReputationRadar {
  score: number;
  tendency: 'Estável' | 'Positiva' | 'Negativa';
  summary: string;
}

export interface CrisisTheme {
  theme: string;
  occurrences: number;
}

export interface SentimentDistribution {
  positive: number;
  negative: number;
  neutral: number;
}

export interface Irregularity {
  severity: 'Alta' | 'Média' | 'Baixa';
  description: string;
}

export interface HighImpactNews {
  title: string;
  source: string;
  date: string;
  impact: 'Alto' | 'Crítico' | 'Médio';
  url: string;
}

export interface MasterItem {
  date: string;
  title: string;
  source: string;
  platform: 'Notícia' | 'Diário Oficial' | 'Rede Social';
  sentiment: 'Positivo' | 'Negativo' | 'Neutro';
  impact: 'Alto' | 'Médio' | 'Baixo' | 'Crítico';
  url: string;
  reliability?: 'Alta' | 'Média' | 'Baixa';
  riskScore?: number;
  detectionSource?: string;
}

export interface DashboardData {
  municipality: string;
  stats: DashboardStats;
  mayor: Official;
  viceMayor: Official;
  reputationRadar: ReputationRadar;
  crisisThemes: CrisisTheme[];
  sentimentDistribution: SentimentDistribution;
  irregularitiesPanorama: Irregularity[];
  highImpactNews: HighImpactNews[];
  masterItems: MasterItem[];
  dataSources: string[];
}

export interface DashboardWidget {
    id: string;
    title: string;
    visible: boolean;
}

// Interface completa para as regras administrativas do Módulo Político
export interface PoliticalModuleRules {
    // Risco
    priority_risk_areas: string[]; // ['Judicial', 'Financeiro', 'Mídia', 'Social']
    weight_judicial_risk: number; // 1-10
    network_depth_level: number; // 1-3
    min_connection_value: number; // valor monetário
    
    // Irregularidades
    nepotism_window_months: number;
    critical_positions: string[]; 
    mandatory_cpf_cnpj_check: boolean;

    // Timeline
    timeline_event_filter: string[]; // ['Homenagens', 'Eventos Sociais', 'Administrativo', 'Judicial']
    timeline_max_years: number;
}
