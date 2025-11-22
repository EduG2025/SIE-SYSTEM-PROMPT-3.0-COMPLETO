
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { dbService } from '../../../services/dbService';
import { validateApiKey } from '../../../services/geminiService';
import { useNotification } from '../../../contexts/NotificationContext';

const ApiKeySettings: React.FC = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const { notify } = useNotification();
    const [key, setKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [canUse, setCanUse] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setCanUse(!!currentUser.canUseOwnApiKey);
            if (currentUser.apiKey) setKey(currentUser.apiKey);
        }
    }, [currentUser]);

    const handleSave = async () => {
        if (!canUse || !currentUser) return;
        setIsSaving(true);
        try {
            if (!await dbService.checkUserFeatureAccess(currentUser.id, 'own_api_key')) {
                throw new Error('Seu plano não permite chaves personalizadas.');
            }
            if (!await validateApiKey(key)) {
                throw new Error('Chave inválida ou sem cota.');
            }
            await dbService.saveUserApiKey(currentUser.id, key);
            setCurrentUser({ ...currentUser, apiKey: key });
            notify('Chave vinculada com sucesso!', 'success');
        } catch (error) {
            notify((error as Error).message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!currentUser) return;
        if (window.confirm('Remover chave?')) {
            await dbService.removeUserApiKey(currentUser.id);
            setCurrentUser({ ...currentUser, apiKey: undefined });
            setKey('');
            notify('Chave removida.', 'success');
        }
    };

    if (!canUse) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-brand-primary/20 rounded-xl border border-brand-accent border-dashed">
                <div className="bg-brand-accent/50 p-4 rounded-full mb-4 text-brand-light">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white">Recurso Bloqueado</h3>
                <p className="text-brand-light mt-2 max-w-md">
                    A atualização para o plano <strong>Pro</strong> ou <strong>Enterprise</strong> é necessária para usar sua própria chave de API e remover os limites de uso.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-gradient-to-r from-brand-blue/20 to-brand-secondary border border-brand-blue/30 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Modo Turbo Ativado
                </h3>
                <p className="text-sm text-brand-light">
                    Ao usar sua própria chave, você ignora as cotas do sistema e utiliza diretamente os limites da sua conta Google Cloud.
                </p>
            </div>

            <div>
                <label className="block text-sm font-bold text-brand-light mb-2">Sua Chave de API (Google AI Studio)</label>
                <div className="flex gap-3">
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="flex-grow bg-brand-primary border border-brand-accent rounded-lg px-4 py-3 text-white font-mono focus:ring-2 focus:ring-brand-blue outline-none shadow-inner"
                    />
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !key}
                        className="bg-brand-blue hover:bg-blue-600 text-white font-bold px-6 rounded-lg transition-colors disabled:opacity-50 shadow-lg"
                    >
                        {isSaving ? 'Validando...' : 'Salvar'}
                    </button>
                </div>
                {currentUser?.apiKey && (
                    <div className="flex justify-between items-center mt-3 text-xs">
                        <span className="text-green-400 flex items-center font-bold">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            Chave Ativa e Validada
                        </span>
                        <button onClick={handleRemove} className="text-red-400 hover:underline">Desvincular Chave</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiKeySettings;
