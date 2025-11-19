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
        if (window.confirm('ATENÇÃO: Esta ação é irreversível e irá restaurar todos os dados do sistema para o estado padrão. Deseja continuar?')) {
            await dbService.resetDatabase();
            await fetchStats();
            showToast('Banco de dados restaurado para o estado padrão!', 'success');
        }
    };

    const handleBackupDatabase = async () => {
        try {
            const data = await dbService.getFullDatabaseBackup();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `sie_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Backup do banco de dados gerado com sucesso!', 'success');
        } catch (error) {
            console.error("Failed to create backup:", error);
            showToast('Erro ao gerar o backup do banco de dados.', 'error');
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
        
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h4 className="font-bold text-lg mb-2">Manutenção do Banco de Dados</h4>
                <p className="text-sm text-brand-light mb-4">Realize backups do estado atual do banco de dados ou restaure-o para a configuração padrão.</p>
                <div className="flex items-center space-x-4">
                     <button onClick={handleBackupDatabase} className="text-sm bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Realizar Backup e Download
                    </button>
                    <button onClick={handleResetDatabase} className="text-sm bg-brand-red hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Restaurar Banco de Dados Padrão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataManagement;