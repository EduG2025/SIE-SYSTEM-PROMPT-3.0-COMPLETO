
import React, { lazy } from 'react';
import type { ViewType } from './types';

// O registro mapeia a 'view' de um módulo para o seu componente lazy-loaded.
// Isso permite que o App.tsx renderize dinamicamente qualquer módulo.
export const moduleRegistry: Record<ViewType, React.LazyExoticComponent<React.FC<any>>> = {
  dashboard: lazy(() => import('./components/Dashboard')),
  // Political agora aponta para a visão de Rede (Index), pois PoliticalModule é o detalhe (:id)
  political: lazy(() => import('./components/PoliticalNetwork')), 
  employees: lazy(() => import('./components/EmployeesModule')),
  companies: lazy(() => import('./components/CompaniesModule')),
  contracts: lazy(() => import('./components/ContractsModule')),
  judicial: lazy(() => import('./components/JudicialModule')),
  social: lazy(() => import('./components/SocialMediaModule')),
  timeline: lazy(() => import('./components/TimelineModule')),
  ocr: lazy(() => import('./components/OcrModule')),
  research: lazy(() => import('./components/ResearchModule')),
};
