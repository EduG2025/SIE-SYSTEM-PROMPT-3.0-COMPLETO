import React from 'react';
import type { PoliticalWidgetData } from '../../types';
import WidgetWrapper from './WidgetWrapper';

const PoliticalSummaryWidget: React.FC<{ data: PoliticalWidgetData }> = ({ data }) => {
    const icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

    return (
        <WidgetWrapper icon={icon} title="Resumo Político">
            <div className="space-y-3">
                {data.highRiskPoliticians.length > 0 ? (
                    data.highRiskPoliticians.map((p, index) => (
                        <div key={index} className="bg-brand-primary p-3 rounded-lg">
                            <p className="font-semibold text-white">{p.name}</p>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-brand-light">{p.party}</span>
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-400">
                                    Risco {p.riskLevel}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-brand-light text-center py-4">Nenhum político de alto risco detectado.</p>
                )}
            </div>
        </WidgetWrapper>
    );
};

export default PoliticalSummaryWidget;
