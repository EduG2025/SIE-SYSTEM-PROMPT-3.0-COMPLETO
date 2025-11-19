import React from 'react';
import type { SuggestedSource } from '../../../types';
import Modal from '../../common/Modal';

interface SuggestedSourcesModalProps {
    sources: SuggestedSource[];
    onClose: () => void;
    onAddSource: (source: SuggestedSource) => void;
    onAddAll: () => void;
    loading: boolean;
}

const SuggestedSourcesModal: React.FC<SuggestedSourcesModalProps> = ({ sources, onClose, onAddSource, onAddAll, loading }) => {
    return (
         <Modal title="Fontes Encontradas pela IA" onClose={onClose} size="4xl">
             <div className="max-h-[60vh] overflow-y-auto">
                {sources.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-brand-accent sticky top-0 bg-brand-secondary">
                        <tr>
                            <th className="p-3">Nome</th>
                            <th className="p-3">URL</th>
                            <th className="p-3">Categoria Sugerida</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3 text-right">Ação</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sources.map((source, index) => (
                            <tr key={`${source.url}-${index}`} className="border-b border-brand-accent/50">
                                <td className="p-3 font-medium">{source.name}</td>
                                <td className="p-3 text-brand-light truncate max-w-xs" title={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{source.url}</a></td>
                                <td className="p-3 text-brand-light">{source.category}</td>
                                <td className="p-3 text-brand-light">{source.type}</td>
                                <td className="p-3 text-right">
                                    <button
                                        onClick={() => onAddSource(source)}
                                        disabled={loading}
                                        className="text-xs bg-brand-blue text-white py-1 px-3 rounded-full hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        Adicionar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center p-8 text-brand-light">Todas as fontes sugeridas foram adicionadas.</p>
                )}
             </div>
             {sources.length > 0 && (
                <div className="flex justify-end pt-4 mt-4 border-t border-brand-accent">
                    <button
                        onClick={onAddAll}
                        disabled={loading}
                        className="bg-brand-green text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-brand-accent disabled:cursor-not-allowed"
                    >
                        {loading ? 'Adicionando...' : 'Adicionar Todas'}
                    </button>
                </div>
             )}
         </Modal>
    );
};

export default SuggestedSourcesModal;