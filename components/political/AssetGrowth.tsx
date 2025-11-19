
import React, { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Politician } from '../../types';
import Section from './Section';
import Spinner from '../common/Spinner';

interface AssetGrowthProps {
    assets: Politician['assets'];
}

const ChartBarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const AssetGrowth: React.FC<AssetGrowthProps> = ({ assets }) => {
    const [isChartReady, setIsChartReady] = useState(false);

    // Otimização: Renderização diferida para não bloquear a thread principal
    // durante o carregamento inicial do componente pai.
    useEffect(() => {
        const timer = requestAnimationFrame(() => {
            setIsChartReady(true);
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    const formatCurrency = (value: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    // Memoiza e ordena os dados para garantir a integridade do gráfico e evitar re-renderizações
    const chartData = useMemo(() => {
        return [...assets.declarations].sort((a, b) => a.year - b.year);
    }, [assets.declarations]);

    // Define um limiar para ativar otimizações agressivas em grandes volumes de dados
    const isLargeDataset = chartData.length > 30;

    return (
        <Section icon={<ChartBarIcon />} title="Evolução Patrimonial">
            <div className="text-center mb-4">
                <p className="text-sm text-brand-light">Crescimento Declarado</p>
                <p className={`text-3xl font-bold ${assets.growthPercentage > 100 ? 'text-orange-400' : 'text-green-400'}`}>
                    +{assets.growthPercentage}%
                </p>
            </div>
            <div className="h-48 relative">
                {isChartReady ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis 
                                dataKey="year" 
                                stroke="#8B949E" 
                                fontSize={12} 
                                // Em datasets grandes, evita sobreposição de labels no eixo X
                                interval={isLargeDataset ? 'preserveStartEnd' : 0}
                            />
                            <YAxis 
                                stroke="#8B949E" 
                                fontSize={12} 
                                tickFormatter={(value) => new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} 
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }}
                                labelStyle={{ color: '#E6EDF3' }}
                                formatter={(value) => [formatCurrency(value as number), 'Valor']}
                                // Melhora performance do tooltip em movimentos rápidos
                                isAnimationActive={!isLargeDataset}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3B82F6" 
                                strokeWidth={2} 
                                // Otimização: Remove os pontos para datasets grandes, melhorando a performance de renderização SVG
                                dot={isLargeDataset ? false : { r: 4 }} 
                                activeDot={{ r: 6 }} 
                                // Otimização: Desativa a animação inicial se houver muitos dados para evitar "jank"
                                isAnimationActive={!isLargeDataset}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Spinner />
                    </div>
                )}
            </div>
        </Section>
    );
};

export default AssetGrowth;
