
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ModuleSettingsLayoutProps {
    children: React.ReactNode;
    moduleName: string;
    onSave: () => void;
    isSaving: boolean;
}

const ModuleSettingsLayout: React.FC<ModuleSettingsLayoutProps> = ({ children, moduleName, onSave, isSaving }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg animate-fade-in-up">
            <div className="flex items-center mb-6 border-b border-brand-accent pb-4">
                <button onClick={() => navigate(-1)} className="text-brand-light hover:text-white mr-4 p-2 rounded-full hover:bg-brand-accent transition-colors" aria-label="Voltar">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h2 className="text-2xl font-bold text-white">Configurações: {moduleName}</h2>
            </div>
            <div className="space-y-8">
                {children}
            </div>
            <div className="mt-8 pt-4 border-t border-brand-accent flex justify-end">
                <button 
                    onClick={onSave}
                    disabled={isSaving}
                    className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-brand-accent disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
};

export default ModuleSettingsLayout;
