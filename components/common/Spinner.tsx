import React from 'react';

const Spinner: React.FC = () => {
    return (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue" role="status">
            <span className="sr-only">Carregando...</span>
        </div>
    );
};

export default Spinner;
