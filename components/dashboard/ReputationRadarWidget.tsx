
import React from 'react';
import type { ReputationRadar } from '../../types';
import Card from './Card';
import Spinner from '../common/Spinner';

interface ReputationRadarWidgetProps {
    data?: ReputationRadar;
    isLoading?: boolean;
}

const getTendencyIcon = (tendency: ReputationRadar['tendency']) => {
    switch(tendency) {
        case 'Positiva':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>;
        case 'Negativa':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
        case 'Estável':
        default:
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>;
    }
};

const ReputationRadarWidget: React.FC<ReputationRadarWidgetProps> = ({ data, isLoading }) => {
    return (
        <Card title="Radar de Reputação Estratégico" contentClassName="flex flex-col items-center justify-center text-center h-full">
            {isLoading || !data ? (
                <Spinner />
            ) : (
                <>
                    <div className="relative">
                         <p className="text-7xl font-bold text-white">{data.score}<span className="text-3xl text-brand-light">/100</span></p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                        <p className="font-semibold text-brand-light">Tendência:</p>
                        {getTendencyIcon(data.tendency)}
                        <p className="font-bold text-white">{data.tendency}</p>
                    </div>
                    <p className="text-sm text-brand-light mt-4 px-4">{data.summary}</p>
                </>
            )}
        </Card>
    );
};

export default ReputationRadarWidget;
