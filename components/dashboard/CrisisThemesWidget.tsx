
import React, { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CrisisTheme } from '../../types';
import Card from './Card';
import Spinner from '../common/Spinner';

interface CrisisThemesWidgetProps {
    data?: CrisisTheme[];
    isLoading?: boolean;
}

const CrisisThemesWidget: React.FC<CrisisThemesWidgetProps> = ({ data, isLoading }) => {
    const colors = ['#3B82F6', '#EF4444', '#EAB308', '#22C55E', '#8B5CF6'];
    
    return (
        <Card title="Temas de Crise Mais Frequentes">
            {isLoading || !data ? (
                <div className="h-[250px] flex items-center justify-center">
                    <Spinner />
                </div>
            ) : data.length === 0 ? (
                 <div className="h-[250px] flex items-center justify-center text-brand-light text-sm">
                    Nenhum tema de crise identificado.
                 </div>
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="theme" 
                            type="category" 
                            width={100} 
                            tick={{ fill: '#8B949E', fontSize: 12 }} 
                            axisLine={false} 
                            tickLine={false}
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                            contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', color: '#E6EDF3' }}
                            labelStyle={{ color: '#E6EDF3' }}
                        />
                        <Bar dataKey="occurrences" name="Ocorrências" barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
};

export default memo(CrisisThemesWidget);
