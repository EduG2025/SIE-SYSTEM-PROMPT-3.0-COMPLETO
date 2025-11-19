import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import type { LogEntry } from '../../types';
import SystemUpdateCard from './dashboard/SystemUpdateCard';

interface DashboardStats {
    users: number;
    modules: number;
    totalModules: number;
    apiKeys: number;
    dbStatus: string;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-brand-secondary p-6 rounded-lg flex items-center shadow-lg">
        <div className="p-3 rounded-full bg-brand-accent mr-4">{icon}</div>
        <div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-brand-light">{title}</p>
        </div>
    </div>
);

const getLogLevelColor = (level: LogEntry['level']) => {
    const colors: Record<LogEntry['level'], string> = {
        INFO: 'text-green-400',
        AUDIT: 'text-blue-400',
        WARN: 'text-yellow-400',
        ERROR: 'text-red-400',
    };
    return colors[level];
}

const AdminDashboard: React.FC = () => {
    const iconClass = "h-7 w-7 text-brand-blue";
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const [statsData, logsData] = await Promise.all([
                dbService.getStats(),
                dbService.getLogs()
            ]);
            setStats({
                users: statsData.users,
                modules: statsData.modules,
                totalModules: statsData.totalModules,
                apiKeys: statsData.apiKeys,
                dbStatus: statsData.dbStatus,
            });
            setLogs(logsData);
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh data every 5 seconds
        return () => clearInterval(interval);

    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Usuários Ativos" 
                    value={stats?.users || 0} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                />
                 <StatCard 
                    title="Módulos Ativos" 
                    value={`${stats?.modules || 0} / ${stats?.totalModules || 0}`} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>} 
                />
                 <StatCard 
                    title="Chaves de API" 
                    value={stats?.apiKeys || 0} 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h7.5a6 6 0 016 6z" /></svg>} 
                />
                 <StatCard 
                    title="Banco de Dados" 
                    value={stats?.dbStatus || "Desconectado"}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" /></svg>} 
                />
            </div>

            <SystemUpdateCard />

            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Logs de Atividade em Tempo Real</h3>
                <ul className="space-y-3 text-sm h-96 overflow-y-auto font-mono">
                    {logs.length > 0 ? logs.map(log => (
                         <li key={log.id} className="flex items-start">
                             <span className={`${getLogLevelColor(log.level)} mr-3 font-bold w-12 flex-shrink-0`}>[{log.level}]</span> 
                             <span className="text-brand-light mr-4">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                             <span className="text-brand-text break-all">[{log.user}] {log.message}</span>
                        </li>
                    )) : (
                        <li className="text-brand-light">Nenhum log de atividade registrado.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AdminDashboard;