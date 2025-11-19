

import React, { useState, useEffect } from 'react';
import { dbService } from '../../../services/dbService';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'updating' | 'updated' | 'error';

const SystemUpdateCard: React.FC = () => {
    const [currentVersion, setCurrentVersion] = useState('3.0.0');
    const [newVersion, setNewVersion] = useState('3.1.0');
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [updateMessage, setUpdateMessage] = useState('');

    useEffect(() => {
        // Timer de animação visual para o progresso
        if (status === 'updating' && progress < 100) {
            const timer = setTimeout(() => setProgress(prev => prev + 2), 50);
            return () => clearTimeout(timer);
        } else if (status === 'updating' && progress >= 100) {
            // Quando o progresso visual termina, finaliza o status
            // A lógica real é controlada pelo handleUpdate
        }
    }, [status, progress]);

    const handleCheckForUpdates = async () => {
        setStatus('checking');
        
        // Simula tempo de verificação de rede
        setTimeout(async () => {
            // Em um cenário real, aqui verificaríamos o manifesto do GitHub
            // Para esta demo, assumimos que sempre há uma "versão de inteligência" disponível
            setStatus('available');
            setNewVersion('3.1.0 (AI Intel)');
        }, 1500);
    };

    const handleUpdate = async () => {
        setStatus('updating');
        setProgress(0);
        setUpdateMessage("Iniciando conexão com repositório GitHub...");

        try {
            // 1. Aciona a atualização remota no serviço de dados
            const result = await dbService.checkForRemoteUpdates();
            
            // Força o progresso visual para 100% após o término da operação async
            setProgress(100);
            
            if (result.updated) {
                setStatus('updated');
                setCurrentVersion(newVersion);
                setUpdateMessage(result.message);
            } else {
                // Mesmo se não houver update, tratamos como sucesso da operação de check
                setStatus('updated');
                setUpdateMessage(result.message);
            }

        } catch (error) {
            console.error(error);
            setStatus('error');
            setUpdateMessage("Falha na conexão segura com o repositório.");
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'checking':
                return (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-light mr-3"></div>
                        <p>Conectando ao repositório oficial (EduG2025)...</p>
                    </div>
                );
            case 'available':
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <div>
                            <p className="font-semibold text-lg text-brand-yellow">Nova Inteligência Disponível!</p>
                            <p className="text-sm text-brand-light">Atualização de System Prompts e Regras (v{newVersion}).</p>
                        </div>
                        <button onClick={handleUpdate} className="bg-brand-yellow text-brand-primary font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0 hover:bg-yellow-400 transition-colors">
                            Baixar e Aplicar
                        </button>
                    </div>
                );
            case 'updating':
                return (
                    <div>
                        <p className="font-semibold mb-2 text-brand-blue">{updateMessage || "Atualizando definições de IA..."}</p>
                        <div className="w-full bg-brand-primary rounded-full h-4 overflow-hidden border border-brand-accent">
                            <div className="bg-brand-blue h-4 rounded-full relative" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                        <p className="text-center text-xs mt-2 text-brand-light font-mono">{progress}% - Preservando banco de dados local...</p>
                    </div>
                );
            case 'updated':
                 return (
                    <div className="flex flex-col items-start">
                        <div className="flex items-center text-brand-green mb-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="font-semibold text-lg">Sistema Atualizado!</p>
                        </div>
                        <p className="text-sm text-brand-light">{updateMessage}</p>
                    </div>
                );
             case 'error':
                 return (
                    <div className="text-brand-red">
                        <p className="font-bold flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Erro na atualização.</p>
                        <p className="text-sm mt-1 opacity-80">{updateMessage}</p>
                    </div>
                 );
            case 'idle':
            default:
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <div>
                            <p className="text-white">Versão Instalada: <span className="font-mono text-brand-cyan">{currentVersion}</span></p>
                            <p className="text-xs text-brand-light mt-1">Fonte: github.com/EduG2025/SIE-SYSTEM-PROMPT-3.0-COMPLETO</p>
                        </div>
                        <button onClick={handleCheckForUpdates} className="bg-brand-accent hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0 transition-colors flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" /></svg>
                            Verificar GitHub
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-accent/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    Atualização do Sistema (OTA)
                </h3>
                {status === 'idle' && <span className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20">Online</span>}
            </div>
            <div className="bg-brand-primary/50 p-4 rounded-lg border border-brand-accent/30">
                {renderContent()}
            </div>
        </div>
    );
};

export default SystemUpdateCard;
