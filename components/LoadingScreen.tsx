
import React, { useState, useEffect } from 'react';
import type { ViewType } from '../types';
import { viewTitles } from '../constants';

interface LoadingScreenProps {
    municipality: string;
    onComplete: () => void;
    view: ViewType;
}

const getAnalysisSteps = (view: ViewType): string[] => {
    const commonSteps = [
        'Iniciando conexão com portais públicos...',
        'Verificando e enriquecendo fontes de dados do município...',
    ];
    const finalStep = 'Finalizando análise e montando painel...';

    switch (view) {
        case 'political':
            return [...commonSteps, 'Coletando dados de políticos e mandatos...', 'Cruzando informações com processos judiciais...', 'Mapeando conexões de influência...', finalStep];
        case 'employees':
            return [...commonSteps, 'Acessando portal da transparência de funcionários...', 'Analisando vínculos e nomeações...', 'Verificando diários oficiais...', finalStep];
        case 'companies':
            return [...commonSteps, 'Consultando dados de contratos e licitações...', 'Verificando quadro societário de empresas locais...', 'Analisando histórico de doações...', finalStep];
        case 'judicial':
            return [...commonSteps, 'Buscando processos em tribunais de justiça...', 'Correlacionando partes com a base de dados...', 'Analisando andamentos processuais...', finalStep];
        case 'social':
             return [...commonSteps, 'Coletando posts públicos de Facebook e Instagram...', 'Analisando sentimento e relevância...', 'Identificando temas de crise...', finalStep];
        case 'timeline':
            return [...commonSteps, 'Coletando eventos de todas as fontes...', 'Ordenando cronologicamente os fatos...', 'Identificando marcos importantes...', finalStep];
        case 'dashboard':
        default:
            return [
                'Iniciando análise estratégica para o município...',
                'Conectando a portais de transparência e diários oficiais...',
                'Coletando dados de redes sociais (Facebook, Instagram, Twitter)...',
                'Analisando processos judiciais e licitações em andamento...',
                'Cruzando informações de funcionários, empresas e políticos...',
                'Verificando histórico de contratos e aditivos...',
                'Calculando radar de reputação estratégica com IA...',
                'Gerando panorama de irregularidades e pontos de atenção...',
                'Compilando notícias de alto impacto da mídia local e nacional...',
                'Finalizando análise e montando dashboard...'
            ];
    }
}


const LoadingScreen: React.FC<LoadingScreenProps> = ({ municipality, onComplete, view }) => {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);

    const analysisSteps = getAnalysisSteps(view);
    const progress = Math.round(((currentStepIndex + 1) / analysisSteps.length) * 100);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prevTime => prevTime + 1);
        }, 1000);

        const stepTimer = setInterval(() => {
            setCurrentStepIndex(prevIndex => {
                if (prevIndex < analysisSteps.length - 1) {
                    setCompletedSteps(prev => [...prev, analysisSteps[prevIndex]]);
                    return prevIndex + 1;
                } else {
                    setCompletedSteps(prev => [...prev, analysisSteps[prevIndex]]);
                    clearInterval(timer);
                    clearInterval(stepTimer);
                    setTimeout(onComplete, 1200); // Wait a bit before completing
                    return prevIndex;
                }
            });
        }, 800);

        return () => {
            clearInterval(timer);
            clearInterval(stepTimer);
        };
    }, [onComplete, analysisSteps]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="fixed inset-0 bg-brand-primary flex items-center justify-center z-50">
            <div className="bg-brand-secondary p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-brand-accent text-center">
                <h1 className="text-3xl font-bold text-brand-text mb-2">Analisando {viewTitles[view]}</h1>
                <p className="text-brand-light mb-6">Aguarde enquanto o S.I.E. 3.0 coleta e correlaciona as informações para {municipality}.</p>
                
                <div className="relative w-32 h-32 mx-auto mb-6">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-brand-accent" strokeWidth="7" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <circle
                            className="text-brand-blue"
                            strokeWidth="7"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${(2 * Math.PI * 45) - (progress / 100) * (2 * Math.PI * 45)}`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-3xl font-bold">{progress}%</span>
                         <span className="text-sm text-brand-light">{formatTime(elapsedTime)}</span>
                    </div>
                </div>

                <div className="text-left bg-brand-primary p-4 rounded-lg h-48 overflow-y-auto">
                    <p className="font-semibold text-brand-text mb-2 animate-pulse">{analysisSteps[currentStepIndex]}</p>
                    <ul className="space-y-1">
                        {completedSteps.slice(0, -1).map((step, index) => (
                            <li key={index} className="text-sm text-green-400 opacity-70">
                                ✓ {step}
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
};

export default LoadingScreen;