import React from 'react';

interface AIActionsPanelProps {
    onSearch: () => void;
    onValidate: () => void;
    loading: boolean;
}

const AIActionsPanel: React.FC<AIActionsPanelProps> = ({ onSearch, onValidate, loading }) => {
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-2">Ações Manuais com IA</h3>
            <p className="text-sm text-brand-light mb-4">Execute tarefas de busca e validação de fontes de dados sob demanda.</p>
            <div className="flex items-center gap-4">
                <button onClick={onSearch} disabled={loading} className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    {loading ? 'Buscando...' : 'IA Buscar Novas Fontes'}
                </button>
                <button onClick={onValidate} disabled={loading} className="bg-brand-cyan hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    {loading ? 'Validando...' : 'Validar Fontes Atuais'}
                </button>
            </div>
        </div>
    );
};

export default AIActionsPanel;
