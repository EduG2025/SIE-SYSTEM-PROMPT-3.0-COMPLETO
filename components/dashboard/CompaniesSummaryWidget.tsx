import React from 'react';
import type { CompaniesWidgetData } from '../../types';
import WidgetWrapper from './WidgetWrapper';

const CompaniesSummaryWidget: React.FC<{ data: CompaniesWidgetData }> = ({ data }) => {
    const icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    
    return (
        <WidgetWrapper icon={icon} title="Resumo de Empresas">
            <div className="space-y-3">
                 {data.topContracts.length > 0 ? (
                    data.topContracts.map((c, index) => (
                        <div key={index} className="bg-brand-primary p-3 rounded-lg">
                            <p className="font-semibold text-white truncate" title={c.name}>{c.name}</p>
                            <p className="text-sm text-brand-cyan font-bold">
                                {c.totalContractsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-brand-light text-center py-4">Nenhum contrato de alto valor encontrado.</p>
                )}
            </div>
        </WidgetWrapper>
    );
};

export default CompaniesSummaryWidget;
