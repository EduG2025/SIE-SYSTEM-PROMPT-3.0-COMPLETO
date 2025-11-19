
import type { User } from '../../types';

export const initialUsers: User[] = [
    { id: 1, username: 'admin', password: '123', email: 'admin@sie.gov.br', role: 'admin', status: 'Ativo', planId: 'enterprise', planExpiration: '2030-12-31', canUseOwnApiKey: true, usage: 0, avatarUrl: '' },
    { id: 2, username: 'jornalista1', password: '123', email: 'jornal@media.com', role: 'user', status: 'Ativo', planId: 'pro', planExpiration: '2025-12-31', canUseOwnApiKey: true, usage: 0, avatarUrl: '' },
    { id: 3, username: 'pesquisador', password: '123', email: 'pesquisa@univ.edu', role: 'user', status: 'Inativo', planId: 'starter', planExpiration: '2024-12-31', canUseOwnApiKey: false, usage: 0, avatarUrl: '' },
];
