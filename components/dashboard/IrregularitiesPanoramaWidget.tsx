import React from 'react';
import type { Irregularity } from '../../types';
import Card from './Card';
import Spinner from '../common/Spinner';

interface IrregularitiesPanoramaWidgetProps {
    data?: Irregularity[];
    isLoading?: boolean;
}

const getSeverityIcon = (severity: Irregularity['severity']) => {
    const styles: Record<Irregularity['severity'], string> = {
        'Alta': 'text-red-500',
        'Média': 'text-yellow-500',
        'Baixa': 'text-blue-500',
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 flex-shrink-0 ${styles[severity]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    );
};

const IrregularitiesPanoramaWidget: React.FC<IrregularitiesPanoramaWidgetProps> = ({ data, isLoading }) => {
    return (
        <Card 
            title="Panorama de Irregularidades"
            infoTooltip="Gravidade baseada no impacto jurídico e financeiro. Alta: Indícios de improbidade ou ilegalidade. Média: Falhas administrativas ou gestão questionável. Baixa: Erros formais menores."
        >
            {isLoading || !data ? (
                 <div className="h-64 flex items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <div className="space-y-3 h-64 overflow-y-auto pr-2">
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <div key={index} className="flex items-start space-x-3 p-2 bg-brand-primary rounded-md">
                                {getSeverityIcon(item.severity)}
                                <p className="text-sm text-brand-light">{item.description}</p>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-brand-light">Nenhuma irregularidade notável encontrada.</p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default IrregularitiesPanoramaWidget;