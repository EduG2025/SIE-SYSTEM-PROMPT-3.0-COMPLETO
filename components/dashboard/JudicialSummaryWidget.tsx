import React from 'react';
import type { JudicialWidgetData } from '../../types';
import WidgetWrapper from './WidgetWrapper';

const JudicialSummaryWidget: React.FC<{ data: JudicialWidgetData }> = ({ data }) => {
    const icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.5h8.527M12 20.5V16.5m0 0V3m0 0l3 3m-3-3l-3 3" /></svg>;
    
    return (
        <WidgetWrapper icon={icon} title="Resumo Judicial">
             <div className="space-y-3">
                 {data.ongoingLawsuits.length > 0 ? (
                    data.ongoingLawsuits.map((l, index) => (
                        <div key={index} className="bg-brand-primary p-3 rounded-lg text-sm">
                            <p className="font-mono text-xs text-brand-light">{l.id}</p>
                            <p className="font-semibold text-white truncate" title={l.parties}>{l.parties}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-brand-light text-center py-4">Nenhum processo em andamento relevante.</p>
                )}
            </div>
        </WidgetWrapper>
    );
};

export default JudicialSummaryWidget;
