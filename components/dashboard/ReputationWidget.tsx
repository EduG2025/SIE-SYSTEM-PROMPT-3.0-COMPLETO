import React from 'react';
import type { ReputationWidgetData } from '../../types';
import WidgetWrapper from './WidgetWrapper';

interface ReputationWidgetProps {
    data: ReputationWidgetData;
}

const getReputationColor = (level: ReputationWidgetData['level']) => ({ 
    'Crítico': 'text-brand-red', 
    'Alto': 'text-brand-orange', 
    'Médio': 'text-brand-yellow', 
    'Baixo': 'text-brand-green'
}[level]);

const ReputationWidget: React.FC<ReputationWidgetProps> = ({ data }) => {
    const icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
    
    return (
        <WidgetWrapper icon={icon} title="Radar de Reputação">
            <div className="text-center my-2 flex flex-col justify-center items-center h-full">
                <p className={`text-6xl font-bold ${getReputationColor(data.level)}`}>
                    {data.score}
                    <span className="text-3xl text-brand-light">/100</span>
                </p>
                <p className={`font-semibold text-lg ${getReputationColor(data.level)}`}>{data.level}</p>
                <p className="text-xs text-brand-light mt-2">{data.summary}</p>
            </div>
        </WidgetWrapper>
    );
};

export default ReputationWidget;
