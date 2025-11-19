
import React from 'react';
import type { WelcomeWidgetData } from '../../types';
import WidgetWrapper from './WidgetWrapper';

interface WelcomeWidgetProps {
    data: WelcomeWidgetData;
}

const WelcomeWidget: React.FC<WelcomeWidgetProps> = ({ data }) => {
    const icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.93L5 10m7 0a2 2 0 012 2v3m0 0h4" /></svg>;

    return (
        <WidgetWrapper icon={icon} title={`Bem-vindo ao S.I.E. 3.0`}>
            <div className="space-y-3 text-brand-light">
                <p>
                    Este é o seu centro de comando para a análise estratégica de <span className="font-bold text-white">{data.municipality}</span>.
                </p>
                <p>
                    Abaixo você encontra resumos inteligentes gerados a partir dos seus módulos ativos.
                </p>
                <div className="bg-brand-primary p-3 rounded-lg text-center">
                    <p className="font-bold text-white text-lg">{data.activeModulesCount} / {data.totalModulesCount}</p>
                    <p className="text-sm">Módulos de Análise Ativos</p>
                </div>
                <p className="text-xs">
                    Para uma visão mais completa, considere ativar mais módulos no painel de administração.
                </p>
            </div>
        </WidgetWrapper>
    );
};

export default WelcomeWidget;