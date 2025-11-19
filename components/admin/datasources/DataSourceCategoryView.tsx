
import React from 'react';
import type { DataSource, DataSourceCategory } from '../../../types';
import ToggleSwitch from '../../common/ToggleSwitch';

interface DataSourceCategoryViewProps {
    category: DataSourceCategory;
    onEditSource: (source: DataSource, categoryId: number) => void;
    onAddSource: (categoryId: number) => void;
    onDeleteSource: (sourceId: number) => void;
    onToggleActive: (sourceId: number) => void;
    onRenameCategory: (category: DataSourceCategory) => void;
    onDeleteCategory: (categoryId: number) => void;
}

const getStatusPill = (status: DataSource['status']) => {
    const styles: Record<DataSource['status'], string> = {
        'Ativa': 'bg-green-500/20 text-green-400',
        'Inativa': 'bg-gray-500/20 text-gray-400',
        'Com Erro': 'bg-red-500/20 text-red-400',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>;
};

const DataSourceCategoryView: React.FC<DataSourceCategoryViewProps> = ({
    category,
    onEditSource,
    onAddSource,
    onDeleteSource,
    onToggleActive,
    onRenameCategory,
    onDeleteCategory,
}) => {
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-brand-blue">{category.name}</h3>
                <div className="space-x-2">
                    <button onClick={() => onAddSource(category.id)} className="text-xs bg-brand-blue text-white py-1 px-3 rounded-full hover:bg-blue-600">Add Fonte</button>
                    <button onClick={() => onRenameCategory(category)} className="text-xs bg-brand-accent text-white py-1 px-3 rounded-full hover:bg-brand-blue">Renomear</button>
                    <button onClick={() => onDeleteCategory(category.id)} className="text-xs bg-brand-red text-white py-1 px-3 rounded-full hover:bg-red-600">Excluir</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                     <thead className="border-b border-brand-accent bg-brand-secondary">
                        <tr>
                            <th className="p-3 w-1/12">Ativa</th>
                            <th className="p-3 w-3/12">Nome</th>
                            <th className="p-3 w-1/12">Tipo</th>
                            <th className="p-3 w-1/12">Confia.</th>
                            <th className="p-3 w-1/12">Status</th>
                            <th className="p-3 w-3/12">URL</th>
                            <th className="p-3 w-2/12 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {category.sources.map(source => (
                            <tr key={source.id} className="border-b border-brand-accent/50 hover:bg-brand-accent/30 even:bg-brand-accent/10">
                                <td className="p-3">
                                    <ToggleSwitch checked={source.active} onChange={() => onToggleActive(source.id)} />
                                </td>
                                <td className="p-3 font-medium">{source.name}</td>
                                <td className="p-3 text-brand-light">{source.type}</td>
                                <td className="p-3 text-brand-light">{source.reliability}</td>
                                <td className="p-3">{getStatusPill(source.status)}</td>
                                <td className="p-3 text-brand-light truncate max-w-xs"><a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{source.url}</a></td>
                                <td className="p-3 space-x-2 text-right">
                                    <button onClick={() => onEditSource(source, category.id)} className="text-xs bg-brand-accent text-white py-1 px-3 rounded-full hover:bg-brand-blue">Editar</button>
                                    <button onClick={() => onDeleteSource(source.id)} className="text-xs bg-brand-red text-white py-1 px-3 rounded-full hover:bg-red-600">Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataSourceCategoryView;
