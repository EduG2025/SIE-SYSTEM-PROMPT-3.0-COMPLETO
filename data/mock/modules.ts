
import type { Module } from '../../types';

// Regras padrão para o módulo político (JSON stringified para persistência genérica)
const defaultPoliticalRules = JSON.stringify({
    priority_risk_areas: ['Judicial', 'Financeiro'],
    weight_judicial_risk: 8,
    network_depth_level: 2,
    min_connection_value: 5000,
    nepotism_window_months: 48,
    critical_positions: ['Secretário de Finanças', 'Chefe de Gabinete', 'Presidente da Comissão de Licitação'],
    mandatory_cpf_cnpj_check: true,
    timeline_event_filter: ['Homenagens', 'Eventos Sociais'],
    timeline_max_years: 5
});

export const initialModules: Module[] = [
    { id: 'mod-dash', name: 'Dashboard', view: 'dashboard', icon: 'dashboard', active: true, hasSettings: true, updateFrequency: '12h', lastUpdate: new Date().toISOString() },
    { id: 'mod-res', name: 'Pesquisa (IA)', view: 'research', icon: 'search-circle', active: true, hasSettings: false, updateFrequency: 'realtime', lastUpdate: new Date().toISOString() },
    { id: 'mod-poli', name: 'Político', view: 'political', icon: 'political', active: true, hasSettings: true, rules: defaultPoliticalRules, updateFrequency: '24h', lastUpdate: new Date().toISOString() },
    { id: 'mod-func', name: 'Funcionários', view: 'employees', icon: 'employees', active: true, hasSettings: true, updateFrequency: 'weekly', lastUpdate: new Date().toISOString() },
    { id: 'mod-empr', name: 'Empresas', view: 'companies', icon: 'companies', active: true, hasSettings: true, updateFrequency: '24h', lastUpdate: new Date().toISOString() },
    { id: 'mod-cont', name: 'Contratos e Licitações', view: 'contracts', icon: 'contracts', active: true, hasSettings: true, updateFrequency: '6h', lastUpdate: new Date().toISOString() },
    { id: 'mod-judi', name: 'Judicial', view: 'judicial', icon: 'judicial', active: true, hasSettings: true, updateFrequency: '24h', lastUpdate: new Date().toISOString() },
    { id: 'mod-soci', name: 'Redes Sociais', view: 'social', icon: 'social', active: true, hasSettings: true, updateFrequency: '1h', lastUpdate: new Date().toISOString() },
    { id: 'mod-time', name: 'Linha do Tempo', view: 'timeline', icon: 'timeline', active: true, hasSettings: true, updateFrequency: '24h', lastUpdate: new Date().toISOString() },
];
