import React, { useState } from 'react';
import type { DataSource, DataSourceCategory } from '../../../types';
import { useUrlValidation } from '../../../hooks/useUrlValidation';

interface DataSourceFormProps {
    source?: Partial<DataSource>;
    categories: DataSourceCategory[];
    onSave: (source: Omit<DataSource, 'id' | 'active' | 'status'>, categoryId: number) => void;
    onCancel: () => void;
    initialCategoryId?: number;
}

const DataSourceForm: React.FC<DataSourceFormProps> = ({ source, categories, onSave, onCancel, initialCategoryId }) => {
    const [formData, setFormData] = useState({
        name: source?.name || '',
        type: source?.type || 'Web Scraping',
        reliability: source?.reliability || 'Média',
        categoryId: initialCategoryId || categories[0]?.id || 0,
    });
    
    const { url, setUrl, validation, isInvalid, isChecking } = useUrlValidation(source?.url || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'url') {
            setUrl(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { categoryId, ...sourceData } = formData;
        onSave(
            { ...sourceData, url } as Omit<DataSource, 'id' | 'active' | 'status'>,
            Number(categoryId)
        );
    };

    const isSaveDisabled = isInvalid || isChecking;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-brand-light mb-1 block">Nome da Fonte</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent" required />
                </div>
                <div>
                    <label className="text-sm text-brand-light mb-1 block">URL</label>
                    <div className="relative">
                        <input
                            type="url"
                            name="url"
                            value={url}
                            onChange={handleChange}
                            className={`w-full bg-brand-primary p-2 rounded border pr-10 ${isInvalid ? 'border-brand-red' : 'border-brand-accent'}`}
                            required
                        />
                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            {isChecking && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-light"></div>}
                            {validation.status === 'valid' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                            {isInvalid && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                        </div>
                    </div>
                     {validation.status !== 'idle' && (
                        <p className={`text-xs mt-1 ${
                            validation.status === 'valid' ? 'text-brand-green' : 
                            isInvalid ? 'text-brand-red' : 'text-brand-light'
                        }`}>
                            {validation.message}
                        </p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="text-sm text-brand-light mb-1 block">Categoria</label>
                    <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent">
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-brand-light mb-1 block">Tipo</label>
                     <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent">
                        {['API', 'Web Scraping', 'RSS', 'Banco de Dados', 'CSV', 'JSON', 'Manual'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm text-brand-light mb-1 block">Confiabilidade</label>
                     <select name="reliability" value={formData.reliability} onChange={handleChange} className="w-full bg-brand-primary p-2 rounded border border-brand-accent">
                        <option value="Alta">Alta</option>
                        <option value="Média">Média</option>
                        <option value="Baixa">Baixa</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={onCancel} className="bg-brand-accent text-white px-4 py-2 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-lg disabled:bg-brand-accent disabled:cursor-not-allowed" disabled={isSaveDisabled}>Salvar</button>
            </div>
        </form>
    );
};

export default DataSourceForm;
