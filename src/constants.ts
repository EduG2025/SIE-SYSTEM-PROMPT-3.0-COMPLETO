
import type { AdminViewType, ViewType } from './types';

// Extended to include 'plans' which might be added to AdminViewType later or treated as extended key
export const adminViewTitles: Record<string, string> = {
    dashboard: 'Visão Geral do Sistema',
    users: 'Gerenciamento de Usuários',
    plans: 'Gerenciamento de Planos',
    system: 'Configurações do Sistema',
    modules: 'Gerenciamento de Módulos',
    data: 'Gerenciamento do Banco de Dados',
    datasources: 'Gerenciamento de Fontes de Dados',
    updates: 'Gerenciador de Atualizações',
    themes: 'Temas & Aparência'
};

export const viewTitles: Record<ViewType, string> = {
    dashboard: 'Dashboard de Análise',
    political: 'Políticos Monitorados',
    employees: 'Funcionários Públicos',
    companies: 'Empresas e Contratos',
    contracts: 'Contratos e Licitações',
    judicial: 'Processos Judiciais',
    social: 'Monitoramento de Redes Sociais',
    timeline: 'Linha do Tempo de Eventos Críticos',
    ocr: 'OCR Jurídico',
    research: 'Investigação Profunda',
};
