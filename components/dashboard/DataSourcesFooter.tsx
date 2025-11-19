
import React from 'react';
import Spinner from '../common/Spinner';

interface DataSourcesFooterProps {
    sources?: string[];
    isLoading?: boolean;
}

const DataSourcesFooter: React.FC<DataSourcesFooterProps> = ({ sources, isLoading }) => {
    if (isLoading || !sources) {
        return (
            <div className="bg-brand-secondary p-4 rounded-lg mt-6 flex justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="bg-brand-secondary p-4 rounded-lg mt-6">
            <h4 className="font-semibold text-brand-text mb-2">Fontes de Dados Utilizadas pela IA</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-1">
                {sources.map((source, index) => (
                    <a 
                        key={index}
                        href={source.startsWith('http') ? source : `https://${source}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-light hover:text-brand-blue hover:underline truncate"
                        title={source}
                    >
                        {source}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default DataSourcesFooter;
