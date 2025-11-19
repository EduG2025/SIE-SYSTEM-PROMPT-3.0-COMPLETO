
import type { TimelineEvent } from '../../types';

export const initialTimelineEvents: TimelineEvent[] = [
    { 
        id: 1, 
        date: '2023-05-20', 
        title: 'Processo LS-001 Iniciado', 
        description: 'Ministério Público inicia processo contra João da Silva por improbidade administrativa.', 
        category: 'Lawsuit', 
        icon: 'lawsuit' 
    },
    { 
        id: 2, 
        date: '2023-05-15', 
        title: 'Contrato de R$1.5M Assinado', 
        description: 'Construtora ABC Ltda vence licitação para obra da nova escola.', 
        category: 'Contract', 
        icon: 'contract' 
    },
    { 
        id: 3, 
        date: '2023-02-01', 
        title: 'Nomeação de Secretária', 
        description: 'Fernanda Souza é nomeada Secretária de Saúde.', 
        category: 'Nomination', 
        icon: 'nomination' 
    },
];
