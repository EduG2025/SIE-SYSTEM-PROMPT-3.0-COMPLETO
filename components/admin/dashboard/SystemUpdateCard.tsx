
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../../services/dbService';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'updating' | 'updated' | 'error';
type Tab = 'intelligence' | 'infrastructure';

const SystemUpdateCard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('intelligence');
    const [currentVersion, setCurrentVersion] = useState('3.0.1');
    const [remoteVersion, setRemoteVersion] = useState('');
    const [status, setStatus] = useState<UpdateStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [updateMessage, setUpdateMessage] = useState('');
    
    // Terminal State
    const [terminalOutput, setTerminalOutput] = useState<string[]>(['> Aguardando conexão com o servidor...']);
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

    const handleUpdateIntelligence = async () => {
        // Como o frontend é desacoplado, esta ação geralmente envolve
        // apenas baixar novas regras JSON, mas aqui simulamos o fluxo
        // completo de atualização via Git no backend se necessário.
        setStatus('updating');
        setProgress(0);
        setUpdateMessage("Baixando definições de inteligência...");

        // Em um sistema real, aqui faríamos um merge de dados.
        // Como estamos usando o git pull no backend, podemos chamar o comando.
        await executeCommand('update');
        
        setStatus('updated');
        setCurrentVersion(remoteVersion);
        setUpdateMessage("Inteligência atualizada com sucesso.");
    };

    // --- Infrastructure Update (VPS Commands) ---
    const executeCommand = async (cmd: 'update' | 'restart' | 'fix_permissions') => {
        setIsExecuting(true);
        let cmdLabel = cmd.toUpperCase();
        if (cmd === 'fix_permissions') cmdLabel = "CORRIGIR PERMISSÕES";
        
        setTerminalOutput(prev => [...prev, `> Enviando comando: ${cmdLabel}...`]);
        
        try {
            const result = await dbService.executeServerCommand(cmd);
            
            if (result.success) {
                setTerminalOutput(prev => [
                    ...prev, 
                    `> Comando recebido pelo servidor.`, 
                    `> Output:`, 
                    ...result.output.split('\n')
                ]);
            } else {
                setTerminalOutput(prev => [...prev, `> ERRO: ${result.output}`]);
            }
        } catch (error) {
            setTerminalOutput(prev => [...prev, `> ERRO DE REDE: ${(error as Error).message}`]);
        } finally {
            setTerminalOutput(prev => [...prev, `> Processo finalizado.`]);
            setIsExecuting(false);
        }
    };

    const renderIntelligenceContent = () => {
        switch (status) {
            case 'checking':
                return (
                    <div className="flex items-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-light mr-3"></div>
                        <p className="text-brand-light">Verificando repositório oficial...</p>
                    </div>
                );
            case 'available':
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between py-2">
                        <div>
                            <p className="font-semibold text-lg text-brand-yellow">Nova Versão Disponível: {remoteVersion}</p>
                            <p className="text-sm text-brand-light">{updateMessage}</p>
                        </div>
                        <button onClick={handleUpdateIntelligence} className="bg-brand-yellow text-brand-primary font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0 hover:bg-yellow-400 transition-colors shadow-lg">
                            Baixar e Aplicar
                        </button>
                    </div>
                );
            case 'updating':
                return (
                    <div className="py-2">
                        <p className="font-semibold mb-2 text-brand-blue">{updateMessage}</p>
                        <div className="w-full bg-brand-primary rounded-full h-4 overflow-hidden border border-brand-accent">
                            <div className="bg-brand-blue h-4 rounded-full relative" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                );
            case 'updated':
                 return (
                    <div className="flex flex-col items-start py-2">
                        <div className="flex items-center text-brand-green mb-2">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="font-semibold text-lg">Sistema Atualizado!</p>
                        </div>
                        <p className="text-sm text-brand-light">{updateMessage}</p>
                    </div>
                );
             case 'error':
                 return (
                    <div className="text-brand-red py-2">
                        <p className="font-bold flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Erro na atualização.</p>
                        <p className="text-sm mt-1 opacity-80">{updateMessage}</p>
                        <button onClick={handleCheckForUpdates} className="text-xs underline mt-2 hover:text-white">Tentar novamente</button>
                    </div>
                 );
            case 'idle':
            default:
                return (
                    <div className="flex flex-col sm:flex-row items-center justify-between py-2">
                        <div>
                            <p className="text-white">Versão Atual: <span className="font-mono text-brand-cyan">{currentVersion}</span></p>
                            <p className="text-xs text-brand-light mt-1">Fonte: github.com/EduG2025</p>
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
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    Atualização do Sistema (OTA)
                </h3>
                <div className="flex space-x-2 bg-brand-primary rounded-lg p-1 border border-brand-accent">
                    <button 
                        onClick={() => setActiveTab('intelligence')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeTab === 'intelligence' ? 'bg-brand-blue text-white shadow' : 'text-brand-light hover:text-white'}`}
                    >
                        Inteligência
                    </button>
                    <button 
                        onClick={() => setActiveTab('infrastructure')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${activeTab === 'infrastructure' ? 'bg-brand-blue text-white shadow' : 'text-brand-light hover:text-white'}`}
                    >
                        Infraestrutura
                    </button>
                </div>
            </div>
            
            <div className="bg-brand-primary/50 p-4 rounded-lg border border-brand-accent/30 min-h-[150px]">
                {activeTab === 'intelligence' ? renderIntelligenceContent() : (
                    <div className="flex flex-col h-full">
                        <div className="flex flex-wrap gap-4 mb-4">
                            <button 
                                onClick={() => executeCommand('update')}
                                disabled={isExecuting}
                                className="flex-grow bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg"
                            >
                                {isExecuting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                                Atualizar VPS (Git Pull)
                            </button>
                            
                            <button 
                                onClick={() => executeCommand('fix_permissions')}
                                disabled={isExecuting}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center shadow-lg"
                                title="Tenta corrigir erros de permissão de arquivo (MIME type error)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h7.5a6 6 0 016 6z" /></svg>
                                Corrigir Permissões
                            </button>

                            <button 
                                onClick={() => executeCommand('restart')}
                                disabled={isExecuting}
                                className="bg-brand-accent hover:bg-brand-light text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 border border-brand-light/30"
                            >
                                Reiniciar
                            </button>
                        </div>
                        
                        {/* Terminal View */}
                        <div 
                            ref={terminalRef}
                            className="bg-black rounded-lg p-3 font-mono text-xs text-green-400 h-48 overflow-y-auto border border-brand-accent/50 shadow-inner"
                        >
                            {terminalOutput.map((line, i) => (
                                <div key={i} className="whitespace-pre-wrap leading-tight mb-1">{line}</div>
                            ))}
                            {isExecuting && <div className="animate-pulse">_</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemUpdateCard;
