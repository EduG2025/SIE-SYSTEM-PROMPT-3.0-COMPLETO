
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { LogEntry, AiAutomationSettings } from '../../types';
import SystemUpdateCard from './dashboard/SystemUpdateCard';

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

// Componente de Velocímetro (Gauge) Otimizado
const ResourceGauge: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
    const safeValue = Math.min(100, Math.max(0, value));
    const data = [{ name: 'Used', value: safeValue }, { name: 'Free', value: 100 - safeValue }];
    const dynamicColor = safeValue > 90 ? '#EF4444' : safeValue > 70 ? '#EAB308' : color;

    return (
        <div className="flex flex-col items-center bg-brand-primary p-4 rounded-lg border border-brand-accent/30 w-full relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-1000" style={{ backgroundColor: dynamicColor }}></div>
            <h4 className="text-sm font-bold text-brand-light mb-2 uppercase z-10">{label}</h4>
            <div className="h-32 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data} cx="50%" cy="70%" startAngle={180} endAngle={0}
                            innerRadius={60} outerRadius={80} paddingAngle={0}
                            dataKey="value" stroke="none"
                        >
                            <Cell key="used" fill={dynamicColor} className="transition-all duration-500" />
                            <Cell key="free" fill="#1F2937" />
                        </Pie>
                        <Tooltip cursor={false} contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '8px' }} formatter={(val: number) => [`${val}%`, label]} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute bottom-4 left-0 w-full text-center flex flex-col items-center">
                    <span className="text-3xl font-bold text-white drop-shadow-md">{safeValue}%</span>
                    <span className="text-[10px] text-brand-light uppercase tracking-wider">Uso Atual</span>
                </div>
            </div>
        </div>
    );
};

const InfoCard: React.FC<{ title: string; value: string | number; subtext?: string; icon: React.ReactNode }> = ({ title, value, subtext, icon }) => (
    <div className="bg-brand-secondary p-5 rounded-lg shadow-lg border border-brand-accent/30 flex items-center justify-between hover:border-brand-blue/30 transition-colors">
        <div>
            <p className="text-sm text-brand-light uppercase tracking-wider font-bold">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
            {subtext && <p className="text-xs text-brand-light mt-1">{subtext}</p>}
        </div>
        <div className="p-3 bg-brand-primary rounded-full text-brand-blue shadow-inner">{icon}</div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Novos estados para status detalhado
    const [connectionStatus, setConnectionStatus] = useState<{ status: string, details: string } | null>(null);
    const [aiConfig, setAiConfig] = useState<{ prompt: string, automation: AiAutomationSettings | null }>({ prompt: '', automation: null });

    const fetchData = async () => {
        try {
            const [statsData, logsData, connData, promptData, automationData] = await Promise.all([
                dbService.getSystemDashboardStats(),
                dbService.getLogs(),
                dbService.testConnection(),
                dbService.getSystemPrompt(),
                dbService.getAiAutomationSettings()
            ]);

            setStats(statsData);
            setLogs(logsData);
            setConnectionStatus(connData);
            setAiConfig({ prompt: promptData, automation: automationData });
        } catch (error) {
            console.error("Dashboard refresh error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const getLogLevelColor = (level: LogEntry['level']) => {
        const colors: Record<LogEntry['level'], string> = {
            INFO: 'text-green-400',
            AUDIT: 'text-blue-400',
            WARN: 'text-yellow-400',
            ERROR: 'text-red-400',
        };
        return colors[level];
    }

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue mx-auto mb-4"></div><p className="text-brand-light">Estabelecendo telemetria...</p></div>;
    if (!stats) return <div className="p-10 text-center text-red-400">Falha ao conectar com o backend.</div>;

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600*24));
        const hours = Math.floor(seconds % (3600*24) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Status do Sistema e IA (Novo Painel) */}
            <div className="bg-brand-secondary p-4 rounded-lg shadow-lg border border-brand-accent/30">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                    Status do Sistema & Inteligência Artificial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Conexão Backend/DB */}
                    <div className="bg-brand-primary/50 p-3 rounded border border-brand-accent/20 flex items-center justify-between">
                        <span className="text-xs text-brand-light">Conexão Backend</span>
                        <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${connectionStatus?.status === 'Conectado' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className={`text-xs font-bold ${connectionStatus?.status === 'Conectado' ? 'text-green-400' : 'text-red-400'}`}>
                                {connectionStatus?.status || 'Verificando...'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-brand-primary/50 p-3 rounded border border-brand-accent/20 flex items-center justify-between">
                        <span className="text-xs text-brand-light">Banco de Dados</span>
                        <div className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${stats.system.logsTotal > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            <span className="text-xs font-bold text-white">Online ({stats.system.logsTotal} registros)</span>
                        </div>
                    </div>

                    {/* Status da IA */}
                    <div className="bg-brand-primary/50 p-3 rounded border border-brand-accent/20 flex items-center justify-between">
                        <span className="text-xs text-brand-light">Automação IA</span>
                        <div className="flex items-center">
                            {aiConfig.automation?.isEnabled ? (
                                <span className="px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 text-xs font-bold border border-green-500/30">
                                    Ativo ({aiConfig.automation.frequency})
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full bg-gray-700 text-gray-400 text-xs font-bold border border-gray-600">
                                    Inativo
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="bg-brand-primary/50 p-3 rounded border border-brand-accent/20 flex items-center justify-between">
                        <span className="text-xs text-brand-light">Prompt do Sistema</span>
                        <span className="text-xs font-mono text-brand-blue" title={aiConfig.prompt}>
                            {aiConfig.prompt ? `${aiConfig.prompt.length} caracteres` : 'Padrão'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoCard title="Usuários Totais" value={stats.system.usersTotal} subtext={`${stats.system.usersActive} sessões ativas`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                <InfoCard title="Módulos Ativos" value={`${stats.system.modulesActive}/${stats.system.modulesTotal}`} subtext="Serviços de inteligência" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
                <InfoCard title="Banco de Dados" value="Online" subtext={`${stats.system.logsTotal} logs auditados`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" /></svg>} />
                <InfoCard title="Versão do Sistema" value={stats.system.version} subtext={`Uptime: ${formatUptime(stats.server.uptimeSeconds)}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            <SystemUpdateCard />

            {/* Monitoramento de Recursos */}
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-accent/30">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center border-b border-brand-accent/20 pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Monitoramento de Recursos em Tempo Real (VPS)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ResourceGauge label="Carga de CPU" value={Math.min(100, Math.round(stats.server.cpuLoad * 10))} color="#3B82F6" />
                    <ResourceGauge label="Uso de Memória" value={Math.round(stats.server.memoryUsage)} color="#8B5CF6" />
                    <div className="bg-brand-primary p-5 rounded-lg border border-brand-accent/30 flex flex-col justify-center h-full shadow-inner">
                         <h4 className="text-sm font-bold text-brand-light mb-4 uppercase text-center tracking-widest">Infraestrutura</h4>
                         <div className="space-y-3 text-sm">
                             <div className="flex justify-between border-b border-brand-accent/20 pb-2"><span className="text-brand-light">SO:</span><span className="text-white font-mono capitalize">{stats.server.platform}</span></div>
                             <div className="flex justify-between border-b border-brand-accent/20 pb-2"><span className="text-brand-light">Memória Total:</span><span className="text-white font-mono">{stats.server.totalMemoryGB} GB</span></div>
                             <div className="flex justify-between pt-1"><span className="text-brand-light">Status:</span><span className="text-green-400 font-mono bg-green-900/20 px-2 py-0.5 rounded text-xs font-bold border border-green-500/30">ATIVO</span></div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Logs Recentes */}
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-accent/30">
                <h3 className="text-xl font-semibold mb-4 text-white">Logs de Atividade em Tempo Real</h3>
                <ul className="space-y-3 text-sm h-64 overflow-y-auto font-mono bg-black/20 p-4 rounded-lg border border-brand-accent/20 custom-scrollbar">
                    {logs.length > 0 ? logs.map(log => (
                         <li key={log.id} className="flex items-start border-b border-white/5 pb-2 last:border-0 last:pb-0">
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
