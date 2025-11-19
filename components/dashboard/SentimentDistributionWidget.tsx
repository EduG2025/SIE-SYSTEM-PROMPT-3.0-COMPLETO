
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { SentimentDistribution } from '../../types';
import Card from './Card';
import Spinner from '../common/Spinner';

interface SentimentDistributionWidgetProps {
    data?: SentimentDistribution;
    isLoading?: boolean;
}

const SentimentDistributionWidget: React.FC<SentimentDistributionWidgetProps> = ({ data, isLoading }) => {
    const chartData = data ? [
        { name: 'Positivo', value: data.positive },
        { name: 'Negativo', value: data.negative },
        { name: 'Neutro', value: data.neutral },
    ] : [];

    const COLORS = {
        'Positivo': '#22C55E',
        'Negativo': '#EF4444',
        'Neutro': '#8B949E'
    };

    return (
        <Card title="Distribuição de Sentimento Geral">
            {isLoading || !data ? (
                <div className="h-[250px] flex items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                        >
                            {chartData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D' }} 
                            itemStyle={{ color: '#E6EDF3' }}
                        />
                        <Legend 
                            iconType="circle"
                            formatter={(value) => <span style={{ color: '#8B949E' }}>{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
};

export default SentimentDistributionWidget;
