import React from 'react';
import type { RiskLevel } from '../../types';

interface RiskIndicatorProps {
    level: RiskLevel;
    title: string;
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ level, title }) => {
    const riskColors: Record<RiskLevel, string> = {
        'Baixo': 'bg-green-500/20 text-green-300 border-green-500/30',
        'Médio': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'Alto': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        'Crítico': 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    const riskTextColors: Record<RiskLevel, string> = {
        'Baixo': 'text-green-300',
        'Médio': 'text-yellow-300',
        'Alto': 'text-orange-300',
        'Crítico': 'text-red-300',
    };

    // If there is no title, render a more compact version
    if (!title) {
        return (
             <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${riskColors[level]}`}>
                {level}
            </span>
        )
    }

    return (
        <div className={`p-3 rounded-lg border text-center ${riskColors[level]}`}>
            <p className="font-bold text-sm">{level}</p>
            <p className="text-xs opacity-80">{title}</p>
        </div>
    );
};

export default RiskIndicator;
