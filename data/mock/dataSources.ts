import type { DataSourceCategory } from '../../types';

export const initialDataSources: DataSourceCategory[] = [
    {
        id: 1,
        name: 'Fontes Governamentais',
        sources: [
            { id: 1, name: 'Portal da Transparência Federal', url: 'https://transparencia.gov.br', active: true, type: 'Web Scraping', reliability: 'Alta', status: 'Ativa' },
            { id: 2, name: 'TSE - DivulgaCand', url: 'https://divulgacandcontas.tse.jus.br', active: true, type: 'Banco de Dados', reliability: 'Alta', status: 'Ativa' },
            { id: 3, name: 'Câmara dos Deputados - Dados Abertos', url: 'https://dadosabertos.camara.leg.br', active: false, type: 'API', reliability: 'Alta', status: 'Inativa' },
        ],
    },
    {
        id: 2,
        name: 'Mídia e Imprensa',
        sources: [
            { id: 4, name: 'G1 Política', url: 'https://g1.globo.com/politica/', active: true, type: 'RSS', reliability: 'Média', status: 'Ativa' },
            { id: 5, name: 'Estadão Política', url: 'https://politica.estadao.com.br/', active: true, type: 'Web Scraping', reliability: 'Média', status: 'Com Erro' },
        ],
    },
];
