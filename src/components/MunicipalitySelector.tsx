import React, { useState, useContext } from 'react';
import { MunicipalityContext, MunicipalityContextType } from '../contexts/MunicipalityContext';

interface MunicipalitySelectorProps {
    onSelect: (municipality: string) => void;
}

const MunicipalitySelector: React.FC<MunicipalitySelectorProps> = ({ onSelect }) => {
    const [value, setValue] = useState('');
    const { municipalities } = useContext(MunicipalityContext) as MunicipalityContextType;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSelect(value.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
            <div className="bg-brand-secondary p-8 rounded-lg shadow-2xl w-full max-w-md border border-brand-accent">
                 <div className="flex items-center mb-6">
                    <div className="bg-brand-blue p-2 rounded-lg mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10l-2 2m0 0l-2-2m2 2V3" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-brand-text">S.I.E. 3.1</h1>
                </div>
                <h2 className="text-xl font-semibold text-brand-text mb-2">Qual município deseja analisar?</h2>
                <p className="text-brand-light mb-6">Insira a cidade e o estado para iniciar a coleta e análise de dados.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Ex: Japeri, RJ"
                        className="w-full bg-brand-primary border border-brand-accent rounded-lg py-3 px-4 text-brand-text placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-brand-blue mb-4"
                        autoFocus
                        list="municipalities"
                    />
                    <datalist id="municipalities">
                        {municipalities.map(m => <option key={m} value={m} />)}
                    </datalist>
                    <button
                        type="submit"
                        className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-brand-accent disabled:cursor-not-allowed"
                        disabled={!value.trim()}
                    >
                        Analisar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MunicipalitySelector;