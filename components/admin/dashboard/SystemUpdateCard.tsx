

import React, { useState, useEffect } from 'react';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'updating' | 'updated' | 'error';

const SystemUpdateCard: React.FC = () => {
    const [currentVersion, setCurrentVersion] = useState('3.0.0');
    const [newVersion, setNewVersion] = useState('3.1.0');
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // FIX: Replaced NodeJS.Timeout with browser-compatible timer handling.
        // The timer is now scoped within the condition that creates it, and a cleanup function is returned directly.
        // This avoids type errors and potential issues with uninitialized variables.
        if (status === 'updating' && progress < 100) {
            const timer = setTimeout(() => setProgress(prev => prev + 1), 50);
            return () => clearTimeout(timer);
        } else if (status === 'updating' && progress >= 100) {
            setStatus('updated');
            setCurrentVersion(newVersion);
        }
    }, [status, progress, newVersion]);

    const handleCheckForUpdates = () => {
        setStatus('checking');
        setTimeout(() => {
            // Simulate finding an update
            setStatus('available');
        }, 2000);
    };

    const handleUpdate = () => {
        setStatus('updating');
        setProgress(0);
    };

    const renderContent = () => {
        switch (status) {
            case 'checking':
                return (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-light mr-3"></div>
                        <p>Verificando atualizações nos servidores S.I.E...</p>
                    </div>
                );
            case 'available':
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg text-brand-yellow">Nova versão disponível!</p>
                            <p className="text-sm text-brand-light">Uma nova versão ({newVersion}) está pronta para ser instalada.</p>
                        </div>
                        <button onClick={handleUpdate} className="bg-brand-yellow text-brand-primary font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0">
                            Atualizar Agora
                        </button>
                    </div>
                );
            case 'updating':
                return (
                    <div>
                        <p className="font-semibold mb-2">Atualizando sistema para a versão {newVersion}...</p>
                        <div className="w-full bg-brand-primary rounded-full h-4">
                            <div className="bg-brand-blue h-4 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
                        </div>
                        <p className="text-center text-sm mt-2">{progress}%</p>
                    </div>
                );
            case 'updated':
                 return (
                    <div className="flex items-center text-brand-green">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="font-semibold text-lg">Sistema atualizado com sucesso!</p>
                    </div>
                );
             case 'error':
                 return <p className="text-brand-red">Ocorreu um erro ao tentar atualizar.</p>;
            case 'idle':
            default:
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <p>Você está executando a versão mais recente do sistema (3.0.0).</p>
                        <button onClick={handleCheckForUpdates} className="bg-brand-accent hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0">
                            Verificar Atualizações
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Atualização do Sistema</h3>
                <span className="text-sm bg-brand-primary text-brand-light px-3 py-1 rounded-full">Versão Atual: {currentVersion}</span>
            </div>
            <div className="bg-brand-primary p-4 rounded-md">
                {renderContent()}
            </div>
        </div>
    );
};

export default SystemUpdateCard;