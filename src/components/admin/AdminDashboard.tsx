
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Tipos para o Dashboard
interface SystemStats {
    server: {
        cpuLoad: number;
        memoryUsage: number;
        totalMemoryGB: string;
        uptimeSeconds: number;
        platform: string;
    };
    system: {
        usersTotal: number;
        usersActive: number;
        modulesTotal: number;
        modulesActive: number;
        logsTotal: number;
        version: string;
    };
}

// Componente de Velocímetro (Gauge)
const ResourceGauge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
    const data = [
        { name: 'Used', value: value },
        { name: 'Free', value: 100 - value }
    ];

    return (
        <div className="flex flex-col items-center bg-brand-primary p-4 rounded-lg border border-brand-accent/30 w-full">
            <h4 className="text-sm font-bold text-brand-light mb-2 uppercase">{label}</h4>
            <div className="h-32 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="used" fill={color} />
                            <Cell key="free" fill="#30363D" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-0 left-0 w-full text-center">
                    <span className="text-2xl font-bold text-white">{value}%</span>
                </div>
            </div>
        </div>
    );
};

// Card Informativo Simples
const InfoCard: React.FC<{ title: string; value: string | number; subtext?: string; icon: React.ReactNode }> = ({ title, value, subtext, icon }) => (
    <div className="bg-brand-secondary p-5 rounded-lg shadow-lg border border-brand-accent/30 flex items-center justify-between">
        <div>
            <p className="text-sm text-brand-light uppercase tracking-wider font-bold">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
            {subtext && <p className="text-xs text-brand-light mt-1">{subtext}</p>}
        </div>
        <div className="p-3 bg-brand-primary rounded-full text-brand-blue">
            {icon}
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const data = await dbService.getSystemDashboardStats();
            setStats(data);
            setLoading(false);
        };

        fetchStats();
        const interval = setInterval(fetchStats, 5000); // Atualiza a cada 5s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-10 text-center text-brand-light">Carregando telemetria do sistema...</div>;
    if (!stats) return <div className="p-10 text-center text-red-400">Falha ao conectar com o backend.</div>;

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600*24));
        const hours = Math.floor(seconds % (3600*24) / 3600);
        return `${days}d ${hours}h`;
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Seção 1: Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoCard 
                    title="Usuários Totais" 
                    value={stats.system.usersTotal} 
                    subtext={`${stats.system.usersActive} ativos recentemente`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                <InfoCard 
                    title="Módulos Ativos" 
                    value={`${stats.system.modulesActive}/${stats.system.modulesTotal}`}
                    subtext="Funcionalidades habilitadas"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                />
                <InfoCard 
                    title="Banco de Dados" 
                    value="Online" 
                    subtext={`${stats.system.logsTotal} registros de log`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" /></svg>}
                />
                <InfoCard 
                    title="Versão do Sistema" 
                    value={stats.system.version} 
                    subtext={`Uptime: ${formatUptime(stats.server.uptimeSeconds)}`}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            {/* Seção 2: Monitoramento de Recursos */}
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-accent/30">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Monitoramento de Recursos (VPS)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ResourceGauge 
                        label="Carga de CPU" 
                        value={Math.min(100, Math.round(stats.server.cpuLoad * 10))} // Load avg aproximado para %
                        color="#3B82F6" 
                    />
                    <ResourceGauge 
                        label="Uso de Memória" 
                        value={Math.round(stats.server.memoryUsage)} 
                        color="#8B5CF6" 
                    />
                    <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent/30 flex flex-col justify-center">
                         <h4 className="text-sm font-bold text-brand-light mb-3 uppercase text-center">Detalhes do Host</h4>
                         <div className="space-y-2 text-sm">
                             <div className="flex justify-between border-b border-brand-accent/20 pb-1">
                                 <span className="text-brand-light">Plataforma:</span>
                                 <span className="text-white font-mono capitalize">{stats.server.platform}</span>
                             </div>
                             <div className="flex justify-between border-b border-brand-accent/20 pb-1">
                                 <span className="text-brand-light">Memória Total:</span>
                                 <span className="text-white font-mono">{stats.server.totalMemoryGB} GB</span>
                             </div>
                             <div className="flex justify-between pt-1">
                                 <span className="text-brand-light">Node.js:</span>
                                 <span className="text-green-400 font-mono">Ativo</span>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
