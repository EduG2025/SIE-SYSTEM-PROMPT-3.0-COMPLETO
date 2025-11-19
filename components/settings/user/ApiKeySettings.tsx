

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { dbService } from '../../../services/dbService';
import { validateApiKey } from '../../../services/geminiService';
import { useNotification } from '../../../contexts/NotificationContext';
import ToggleSwitch from '../../common/ToggleSwitch';

const ApiKeySettings: React.FC = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const { notify } = useNotification();
    const [key, setKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [canUse, setCanUse] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setCanUse(!!currentUser.canUseOwnApiKey);
            if (currentUser.apiKey) {
                setKey(currentUser.apiKey); // Em um app real, isso seria mascarado
            }
        }
    }, [currentUser]);

    const handleSave = async () => {
        if (!canUse || !currentUser) return;
        
        setIsSaving(true);
        try {
            // Validação 1: Verifica se o plano do usuário realmente permite esta ação.
            // Isso evita que usuários contornem a UI se houver manipulação local.
            const hasPermission = await dbService.checkUserFeatureAccess(currentUser.id, 'own_api_key');
            
            if (!hasPermission) {
                notify('Atenção: Seu plano atual não permite o uso de chave de API personalizada. Atualize para um plano PRO ou Enterprise.', 'error');
                setIsSaving(false);
                return;
            }

            // Validação 2: Verifica a validade da chave na API do Gemini
            const isValid = await validateApiKey(key);
            if (!isValid) {
                notify('Erro: Chave de API inválida ou inoperante. Verifique se a chave foi copiada corretamente e se possui cota disponível.', 'error');
                setIsSaving(false);
                return;
            }

            await dbService.saveUserApiKey(currentUser.id, key);
            setCurrentUser({ ...currentUser, apiKey: key });
            notify('Chave de API validada e salva com sucesso! O sistema agora utilizará sua chave pessoal.', 'success');
        } catch (error) {
            notify((error as Error).message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async () => {
        if (!currentUser) return;
        if (window.confirm('Remover sua chave de API? O sistema voltará a usar a chave padrão (com limites menores).')) {
            await dbService.removeUserApiKey(currentUser.id);
            setCurrentUser({ ...currentUser, apiKey: undefined });
            setKey('');
            notify('Chave removida. Voltando ao modo de uso padrão.', 'success');
        }
    };

    if (!canUse) {
        return (
            <div className="bg-brand-secondary p-8 rounded-lg shadow-lg text-center animate-fade-in-up">
                <div className="bg-brand-accent/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Recurso Bloqueado</h3>
                <p className="text-brand-light max-w-md mx-auto">
                    O uso de Chave de API Individual é um recurso exclusivo dos planos <strong>Pro</strong> e <strong>Enterprise</strong>. Atualize seu plano para desbloquear limites maiores de análise IA.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-4">Chave de API Individual</h3>
            <p className="text-sm text-brand-light mb-6">
                Utilize sua própria chave do Google Gemini AI para evitar limites de requisição e garantir maior velocidade nas análises do S.I.E.
            </p>

            <div className="space-y-4 max-w-xl">
                <div>
                    <label className="block text-sm font-medium text-brand-light mb-2">Sua Chave de API (Google Gemini)</label>
                    <div className="relative">
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="Cole sua chave aqui (AIza...)"
                            className="w-full bg-brand-primary border border-brand-accent rounded-lg py-2 px-4 text-white font-mono focus:ring-2 focus:ring-brand-blue focus:outline-none pr-24"
                        />
                         {currentUser?.apiKey && (
                             <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                 <span className="text-xs font-bold text-green-400 flex items-center">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                     Ativa
                                 </span>
                             </div>
                         )}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !key.trim()}
                        className="flex-1 bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Validando Permissões...' : 'Salvar Chave'}
                    </button>
                    {currentUser?.apiKey && (
                        <button
                            onClick={handleRemove}
                            className="bg-brand-accent hover:bg-red-600/80 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Remover
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mt-6 p-4 bg-brand-primary rounded-lg border border-brand-accent/50">
                <h4 className="text-sm font-bold text-brand-light mb-2">Como obter uma chave?</h4>
                <ol className="list-decimal list-inside text-xs text-brand-light space-y-1">
                    <li>Acesse o <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">Google AI Studio</a>.</li>
                    <li>Crie um novo projeto ou selecione um existente.</li>
                    <li>Gere uma API Key para o Gemini.</li>
                    <li>Cole a chave acima e salve.</li>
                </ol>
            </div>
        </div>
    );
};

export default ApiKeySettings;