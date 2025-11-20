
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../../services/dbService';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'updating' | 'updated' | 'error';
type Tab = 'intelligence' | 'infrastructure';

const SystemUpdateCard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('infrastructure'); // Default to Infrastructure for clarity
    const [currentVersion, setCurrentVersion] = useState('3.0.2');
    const [remoteVersion, setRemoteVersion] = useState('');
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [updateMessage, setUpdateMessage] = useState('');
    
    // Terminal State
    const [terminalOutput, setTerminalOutput] = useState<string[]>(['> Pronto para comandos.']);
    const [isExecuting, setIsExecuting] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll terminal to bottom
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalOutput]);

    useEffect(() => {
        if (status === 'updating' && progress < 100) {
            const timer = setTimeout(() => setProgress(prev => prev + 5), 100);
            return () => clearTimeout(timer);
        }
    }, [status, progress]);

    // --- Intelligence Update (GitHub JSON) ---
    const handleCheckForUpdates = async () => {
        setStatus('checking');
        setUpdateMessage("Verificando...");
        
        try {
            const result = await dbService.checkForRemoteUpdates();
            if (result.updated) {
                setStatus('available');
                setRemoteVersion(result.version || 'Desconhecida');
                setUpdateMessage(result.message);
            } else {
                setStatus('updated');
                setUpdateMessage("O sistema já está na versão mais recente.");
            }
        } catch (e) {
            setStatus('error');
            setUpdateMessage("Falha ao conectar ao repositório.");
        }
    };

    // --- Infrastructure Update (VPS Commands) ---
    const executeCommand = async (cmd: 'update' | 'restart' | 'fix_permissions') => {
        setIsExecuting(true);
        let cmdLabel = cmd.toUpperCase();
        if (cmd === 'update') cmdLabel = "ATUALIZAR SISTEMA (DEPLOY)";
        if (cmd === 'fix_permissions') cmdLabel = "CORRIGIR PERMISSÕES";
        
        setTerminalOutput(prev => [...prev, `> [${new Date().toLocaleTimeString()}] Iniciando: ${cmdLabel}...`]);
        
        try {
            const result = await dbService.executeServerCommand(cmd);
            
            if (result.success) {
                setTerminalOutput(prev => [
                    ...prev, 
                    `> Comando enviado com sucesso.`, 
                    `> Retorno do Servidor:`, 
                    ...result.output.split('\n')
                ]);
            } else {
                setTerminalOutput(prev => [...prev, `> ERRO CRÍTICO: ${result.output}`]);
            }
        } catch (error) {
            setTerminalOutput(prev => [...prev, `> ERRO DE CONEXÃO: ${(error as Error).message}`]);
        } finally {
            setTerminalOutput(prev => [...prev, `> Operação finalizada.`]);
            setIsExecuting(false);
        }
    };

    const renderIntelligenceContent = () => {
        switch (status) {
            case 'checking':
                return (
                    <div className="flex items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-light mr-3"></div>
                        <p className="text-brand-light">Verificando metadados no GitHub...</p>
                    </div>
                );
            case 'available':
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between py-2">
                        <div>
                            <p className="font-semibold text-lg text-brand-yellow">Nova Versão: {remoteVersion}</p>
                            <p className="text-sm text-brand-light">{updateMessage}</p>
                        </div>
                        <button onClick={() => { setActiveTab('infrastructure'); executeCommand('update'); }} className="bg-brand-yellow text-brand-primary font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0 hover:bg-yellow-400 transition-colors shadow-lg">
                            Ir para Instalação
                        </button>
                    </div>
                );
             case 'error':
                 return (
                    <div className="text-brand-red py-2">
                        <p className="font-bold">Erro na verificação.</p>
                        <button onClick={handleCheckForUpdates} className="text-xs underline mt-2 hover:text-white">Tentar novamente</button>
                    </div>
                 );
            case 'updated':
                 return (
                    <div className="py-2">
                        <p className="text-green-400 font-bold flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Tudo atualizado.
                        </p>
                    </div>
                 );
            case 'idle':
            default:
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between py-2">
                        <div>
                            <p className="text-white">Versão Local: <span className="font-mono text-brand-cyan">{currentVersion}</span></p>
                        </div>
                        <button onClick={handleCheckForUpdates} className="bg-brand-accent hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0 transition-colors text-xs">
                            Verificar Versão
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-accent/50">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    Gerenciador de Atualizações (Git/VPS)
                </h3>
                <div className="flex space-x-2 bg-brand-primary rounded-lg p-1 border border-brand-accent">
                    <button 
                        onClick={() => setActiveTab('infrastructure')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeTab === 'infrastructure' ? 'bg-brand-blue text-white shadow' : 'text-brand-light hover:text-white'}`}
                    >
                        Controle VPS
                    </button>
                    <button 
                        onClick={() => setActiveTab('intelligence')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeTab === 'intelligence' ? 'bg-brand-blue text-white shadow' : 'text-brand-light hover:text-white'}`}
                    >
                        Versões
                    </button>
                </div>
            </div>
            
            <div className="bg-brand-primary/50 p-4 rounded-lg border border-brand-accent/30 min-h-[150px]">
                {activeTab === 'intelligence' ? renderIntelligenceContent() : (
                    <div className="flex flex-col h-full">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <button 
                                onClick={() => executeCommand('update')}
                                disabled={isExecuting}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex flex-col items-center justify-center shadow-lg group relative overflow-hidden"
                                title="Executa 'git pull', 'npm install' e 'npm run build'"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                {isExecuting ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                                <span className="text-sm">Forçar Atualização (Deploy)</span>
                                <span className="text-[10px] opacity-70 font-normal mt-1">Baixa código novo do GitHub e Recompila</span>
                            </button>
                            
                            <button 
                                onClick={() => executeCommand('fix_permissions')}
                                disabled={isExecuting}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex flex-col items-center justify-center shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h7.5a6 6 0 016 6z" /></svg>
                                <span className="text-sm">Corrigir Permissões</span>
                                <span className="text-[10px] opacity-70 font-normal mt-1">Resolve erros de acesso a arquivos</span>
                            </button>

                            <button 
                                onClick={() => executeCommand('restart')}
                                disabled={isExecuting}
                                className="bg-brand-accent hover:bg-brand-light text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 border border-brand-light/30 flex flex-col items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" /></svg>
                                <span className="text-sm">Reiniciar Servidor</span>
                                <span className="text-[10px] opacity-70 font-normal mt-1">Reinicia o processo Node.js</span>
                            </button>
                        </div>
                        
                        {/* Terminal View */}
                        <div className="flex-grow flex flex-col">
                            <div className="text-xs text-brand-light mb-1 font-mono">Console do Servidor Remoto:</div>
                            <div 
                                ref={terminalRef}
                                className="bg-black rounded-lg p-3 font-mono text-xs text-green-400 h-48 overflow-y-auto border border-brand-accent/50 shadow-inner"
                            >
                                {terminalOutput.map((line, i) => (
                                    <div key={i} className="whitespace-pre-wrap leading-tight mb-1 border-b border-gray-800/50 pb-0.5">{line}</div>
                                ))}
                                {isExecuting && <div className="animate-pulse mt-2">_ Processando comando...</div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemUpdateCard;
