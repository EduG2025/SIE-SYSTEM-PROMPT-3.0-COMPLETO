
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';

interface DataManagementProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

interface DbStats {
    politicians: number;
    employees: number;
    companies: number;
    lawsuits: number;
}

const DataManagement: React.FC<DataManagementProps> = ({ showToast }) => {
    const [stats, setStats] = useState<DbStats | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {
        const currentStats = await dbService.getStats();
        setStats({
            politicians: currentStats.politicians,
            employees: currentStats.employees,
            companies: currentStats.companies,
            lawsuits: currentStats.lawsuits,
        });
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleResetDatabase = async () => {
        if (window.confirm('ATENÇÃO: Esta ação é irreversível e irá restaurar todos os dados locais do navegador para o estado padrão (Factory Reset). Deseja continuar?')) {
            setLoading(true);
            await dbService.resetDatabase();
            await fetchStats();
            setLoading(false);
            showToast('Banco de dados local restaurado para o estado padrão!', 'success');
        }
    };

    const handleBackupJson = async () => {
        setLoading(true);
        try {
            const data = await dbService.getFullDatabaseBackup();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `sie_backup_json_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Backup JSON gerado com sucesso!', 'success');
        } catch (error) {
            console.error("Failed to create backup:", error);
            showToast('Erro ao gerar o backup JSON.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateMysqlInstaller = async () => {
        setLoading(true);
        try {
            // Esta função agora chama o gerador no dbService que usa sqlGenerator.ts
            await dbService.downloadMysqlInstaller();
            showToast('Arquivo install.sql gerado! Importe este arquivo no seu banco de dados MySQL no VPS.', 'success');
        } catch (error) {
            console.error("Failed to generate SQL:", error);
            showToast('Erro ao gerar o instalador SQL.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h4 className="font-bold text-lg mb-2">Visão Geral do Banco de Dados</h4>
                <p className="text-sm text-brand-light mb-4">Estatísticas dos registros atualmente no sistema.</p>
                {stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-brand-primary p-4 rounded-lg">
                            <p className="text-3xl font-bold">{stats.politicians}</p>
                            <p className="text-sm text-brand-light">Políticos</p>
                        </div>
                         <div className="bg-brand-primary p-4 rounded-lg">
                            <p className="text-3xl font-bold">{stats.employees}</p>
                            <p className="text-sm text-brand-light">Funcionários</p>
                        </div>
                         <div className="bg-brand-primary p-4 rounded-lg">
                            <p className="text-3xl font-bold">{stats.companies}</p>
                            <p className="text-sm text-brand-light">Empresas</p>
                        </div>
                        <div className="bg-brand-primary p-4 rounded-lg">
                            <p className="text-3xl font-bold">{stats.lawsuits}</p>
                            <p className="text-sm text-brand-light">Processos</p>
                        </div>
                    </div>
                ) : (
                    <p>Carregando estatísticas...</p>
                )}
            </div>
        
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border-l-4 border-brand-blue">
                <h4 className="font-bold text-lg mb-2 text-white">Instalação e Backup Profissional (MySQL/VPS)</h4>
                <p className="text-sm text-brand-light mb-4">
                    Utilize estas opções para migrar seus dados do navegador para um servidor VPS real (Ubuntu 24.04 + MySQL) ou realizar backups compatíveis.
                </p>
                <div className="flex flex-wrap gap-4">
                     <button 
                        onClick={handleGenerateMysqlInstaller} 
                        disabled={loading}
                        className="text-sm bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {loading ? 'Gerando...' : 'Baixar Instalador MySQL (.sql)'}
                    </button>
                    <button 
                        onClick={handleBackupJson} 
                        disabled={loading}
                        className="text-sm bg-brand-accent hover:bg-brand-light text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Backup Local (JSON)
                    </button>
                </div>
                <div className="mt-4 p-3 bg-brand-primary/50 rounded border border-brand-accent/30 text-xs text-brand-light">
                    <strong>Nota Técnica:</strong> O arquivo <code>install.sql</code> contém a estrutura completa do banco de dados e todos os dados atuais. Importe-o no seu servidor usando PHPMyAdmin ou via terminal: <code>mysql -u user -p sie_db &lt; install.sql</code>.
                </div>
            </div>

            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-red-500/20">
                <h4 className="font-bold text-lg mb-2 text-red-400">Zona de Perigo (Local)</h4>
                <p className="text-sm text-brand-light mb-4">Restaura as configurações originais do navegador. Não afeta o banco de dados MySQL se conectado.</p>
                <button onClick={handleResetDatabase} disabled={loading} className="text-sm bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                    Resetar Dados Locais (Factory Reset)
                </button>
            </div>
        </div>
    );
};

export default DataManagement;
