
export type ViewType = string;

export type AdminViewType = 
  | 'dashboard'
  | 'users'
  | 'plans'
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
  type: 'Político' | 'Empresa' | 'Doador' | 'Laranja' | 'Familiar';
  relationship: string;
  risk: RiskLevel;
  details?: string; // Detalhe da irregularidade ou motivo da conexão
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

// Novos tipos para detalhamento político
export interface VotingRecord {
    title: string;
    date: string;
    vote: 'Favorável' | 'Contrário' | 'Abstenção' | 'Ausente';
    description?: string;
    impact: 'Alto' | 'Médio' | 'Baixo';
}

export interface NewsItem {
    headline: string;
    source: string;
    date: string;
    sentiment: 'Positivo' | 'Negativo' | 'Neutro';
    url: string;
}

// Interface principal para o político
export interface Politician {
  id: string;
  name: string;
  party: string;
  state: string;
  position: string;
  imageUrl: string;
  bio: string;
  salary?: number; // Salário mensal bruto estimado
  socialMedia?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
      followers?: number;
      engagementRate?: string;
  };
  votingHistory?: VotingRecord[]; // Histórico de votações ou decisões administrativas
  latestNews?: NewsItem[]; // Notícias recentes
  monitored?: boolean;
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

export interface PoliticianDataResponse {
  data: Politician;
  timestamp: number;
  source: 'api' | 'mock' | 'cache';
}

// --- Tipos Expandidos para Empresas e Contratos ---

export interface CompanyPartner {
    name: string;
    role: string; // Sócio-Administrador, Sócio, etc.
    isPoliticallyExposed: boolean; // PEP
}

export interface CompanyAlert {
    type: 'Laranja' | 'Conflito de Interesse' | 'Recém-Criada' | 'Capital Incompatível';
    severity: 'Alta' | 'Média' | 'Baixa';
    description: string;
}

export interface Company {
  id: number;
  name:string;
  cnpj: string;
  cnae?: string; // Atividade econômica principal
  foundingDate?: string;
  shareCapital?: number; // Capital Social
  partners?: CompanyPartner[]; // Quadro de Sócios
  totalContractsValue: number;
  riskScore: number;
  alerts?: CompanyAlert[]; // Alertas de irregularidade
  address?: string;
}

export interface Contract {
    id: string;
    companyName: string;
    companyCnpj?: string;
    value: number;
    object: string;
    startDate: string;
    endDate: string;
    status?: 'Ativo' | 'Encerrado' | 'Suspenso';
}

// --- Tipos Expandidos para Jurídico ---

export interface LawsuitParty {
    name: string;
    type: 'Autor' | 'Réu';
    entityType: 'Pessoa' | 'Empresa' | 'Órgão';
    systemId?: string; // ID interno se já existir no sistema
}

export interface Lawsuit {
  id: string;
  parties: string; // String formatada para exibição rápida
  involvedParties?: LawsuitParty[]; // Estruturado para linkagem
  court: string;
  class?: string; // Ação Civil Pública, Improbidade, etc.
  status: 'Ongoing' | 'Finished' | 'Suspended';
  lastUpdate?: string;
  description?: string;
}

export interface EmployeeAlert {
    type: 'Nepotismo' | 'Cargo Crítico' | 'Acúmulo de Cargos' | 'Antecedentes';
    severity: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
    description: string;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  appointedBy: string;
  startDate: string;
  riskScore: number; // 0-10
  riskAnalysis: string; // Resumo curto
  investigationReport?: string; // Relatório detalhado gerado sob demanda
  alerts?: EmployeeAlert[]; // Alertas automáticos
}

// --- Tipos Expandidos para Social Media ---

export interface SocialTrend {
    topic: string;
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    volume: number;
}

export interface SocialAlert {
    id: string;
    type: 'Pico de Negatividade' | 'Acusação Grave' | 'Viral';
    message: string;
    timestamp: string;
    severity?: 'Alta' | 'Média' | 'Baixa';
}

export interface SocialPost {
    id: number;
    platform: 'Facebook' | 'Instagram' | 'Twitter';
    author: string;
    content: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    timestamp: string;
    url?: string;
    likes?: number;
    comments?: number;
    shares?: number;
    thumbnailUrl?: string; // Para vídeos/reels
    isVideo?: boolean;
}

export interface TimelineEvent {
  id: number;
  date: string;
  title: string;
  description: string;
  category: 'Nomination' | 'Contract' | 'Lawsuit' | 'Social Media' | 'Political';
  icon: string;
  relatedId?: string; 
  relatedModule?: string; 
}

export interface ChatMessage {
    id: number;
    sender: 'user' | 'ai';
    text: string;
}

export type UserRole = 'admin' | 'user';

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
    modules: string[]; 
    requestLimit: number; 
}

export interface User {
    id: number;
    username: string;
    password?: string;
    email?: string; 
    avatarUrl?: string; 
    role: UserRole;
    status: 'Ativo' | 'Inativo';
    planId: string; 
    planExpiration?: string; 
    apiKey?: string; 
    canUseOwnApiKey?: boolean; 
    usage: number; 
    lastUsageReset?: string; 
}

export interface ApiKey {
  id: number;
  key: string;
  status: 'Ativa' | 'Inativa';
  type: 'System' | 'User'; 
  usageCount: number; 
  lastUsed?: string; 
}

export interface DbConfig {
  apiUrl: string;
  apiToken: string;
  status: 'Conectado' | 'Desconectado' | 'Sincronizando' | 'Erro';
  lastSync?: string;
  // Configurações MySQL
  host?: string;
  port?: string;
  user?: string;
  password?: string;
  database?: string;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  blue: string;
}

export interface HomepageConfig {
  active: boolean;
  title: string;
  subtitle: string;
  heroImageUrl: string;
  logoUrl: string;
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
  rules?: string; 
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
  avatarUrl: string; 
  politicianId?: string; 
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
  // Campos para controle de atualização e cache
  lastAnalysis: string; // ISO Timestamp da última execução da IA
  nextUpdate: string;   // ISO Timestamp da próxima execução automática
}

export interface DashboardWidget {
    id: string;
    title: string;
    visible: boolean;
}

export interface PoliticalModuleRules {
    priority_risk_areas: string[]; 
    weight_judicial_risk: number; 
    network_depth_level: number; 
    min_connection_value: number; 
    nepotism_window_months: number;
    critical_positions: string[]; 
    mandatory_cpf_cnpj_check: boolean;
    timeline_event_filter: string[]; 
    timeline_max_years: number;
}

export interface SearchFilters {
    fileType: 'any' | 'pdf' | 'xlsx' | 'docx';
    sourceType: 'any' | 'official' | 'news' | 'social';
    dateRange: 'any' | '24h' | 'week' | 'month' | 'year';
    domain?: string;
}

export interface SearchSource {
    title: string;
    uri: string;
    snippet?: string;
    date?: string;
}

export interface InvestigativeRedFlag {
    title: string;
    severity: 'Crítico' | 'Alto' | 'Médio';
    description: string;
    sourceIndex?: number; 
}

export interface InvestigativeFact {
    date: string;
    description: string;
    sourceIndex?: number;
}

// Tipos atualizados para pesquisa forense rica
export interface InvestigativeMedia {
    type: 'Image' | 'Video';
    url: string;
    description?: string;
    sourceUrl?: string;
}

export interface InvestigativeProfile {
    name: string;
    role: string;
    riskLevel: 'Alto' | 'Médio' | 'Baixo';
    matchType: 'Exact' | 'Partial' | 'New'; // Se já existe no DB
    dbId?: string;
}

export interface InvestigativeConnection {
    name: string;
    role: string;
    type: 'Pessoa' | 'Empresa' | 'Órgão';
    linkToModule?: string; 
    dbMatchId?: string;
    isMonitored?: boolean;
}

export interface SentimentAnalysisResult {
    score: number; 
    label: 'Positivo' | 'Neutro' | 'Negativo';
    summary: string;
}

export interface InvestigationReport {
    query: string;
    timestamp: string;
    executiveSummary: string; 
    sentiment: SentimentAnalysisResult;
    redFlags: InvestigativeRedFlag[];
    timeline: InvestigativeFact[];
    connections: InvestigativeConnection[];
    sources: SearchSource[];
    media?: InvestigativeMedia[];
    detectedProfiles?: InvestigativeProfile[];
    followUpActions: string[];
}

// --- Tipos do Auto-Updater ---
export type UpdateStageType = 
    | 'init' 
    | 'analysis' 
    | 'detection' 
    | 'correction' 
    | 'rewrite' 
    | 'standardization' 
    | 'validation' 
    | 'report';

export interface UpdateStage {
    id: UpdateStageType;
    label: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    progress: number;
}

export interface UpdateLog {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}
