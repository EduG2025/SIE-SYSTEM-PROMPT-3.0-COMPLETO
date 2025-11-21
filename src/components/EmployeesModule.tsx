
import React, { useState, useEffect } from 'react';
import type { Employee } from '../types';
import { dbService } from '../services/dbService';
import { investigateEmployee } from '../services/geminiService';
import Spinner from './common/Spinner';
import { useNotification } from '../contexts/NotificationContext';
import Modal from './common/Modal';
import MarkdownIt from 'markdown-it';

const RiskScore: React.FC<{ score: number; analysis: string }> = ({ score, analysis }) => {
    const safeScore = (typeof score === 'number' && !isNaN(score)) ? score : 0;

    const getColor = (s: number) => {
        if (s >= 9) return 'bg-brand-red';
        if (s >= 7) return 'bg-brand-orange';
        if (s >= 4) return 'bg-brand-yellow';
        return 'bg-brand-green';
    };

    const widthPercentage = (safeScore / 10) * 100;

    return (
        <div className="group relative w-full" title={analysis}>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: safeScore >= 9 ? '#EF4444' : safeScore >= 7 ? '#F97316' : safeScore >= 4 ? '#EAB308' : '#22C55E' }}>
                    {safeScore.toFixed(1)} / 10
                </span>
            </div>
            <div className="w-full bg-brand-accent rounded-full h-2">
                <div
                    className={`${getColor(safeScore)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${widthPercentage}%` }}
                ></div>
            </div>
            {analysis && (
                <div className="absolute bottom-full mb-2 w-64 p-3 bg-brand-primary text-xs text-brand-light rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-brand-accent">
                    <h5 className="font-bold mb-1">Análise de Risco:</h5>
                    {analysis}
                </div>
            )}
        </div>
    );
};

const EmployeesModule: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [investigating, setInvestigating] = useState(false);
  
  const { notify } = useNotification();
  const md = new MarkdownIt();

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
        const data = await dbService.getEmployees(forceRefresh);
        setEmployees(data || []); 
        
        if (data.length > 0 && !refreshing && forceRefresh) {
            notify(`${data.length} funcionários encontrados.`, 'success');
        } else if (data.length === 0 && forceRefresh) {
             notify('A IA não encontrou dados públicos de funcionários. Tente novamente mais tarde.', 'error');
        }
    } catch (e) {
        notify('Erro ao carregar funcionários.', 'error');
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvestigate = async (employee: Employee) => {
    setSelectedEmployee(employee);
    
    // Se já tiver relatório, só abre. Se não, gera.
    if (!employee.investigationReport) {
        setInvestigating(true);
        try {
            const municipality = localStorage.getItem('selectedMunicipality') || 'Município';
            const report = await investigateEmployee(employee, municipality);
            
            // Atualiza objeto local e salva no DB implicitamente
            employee.investigationReport = report; 
            
            setInvestigating(false);
        } catch (error) {
            setInvestigating(false);
            notify('Erro ao gerar investigação.', 'error');
        }
    }
  };

  if (loading) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <Spinner />
        </div>
    );
  }

  return (
    <div className="bg-brand-secondary shadow-lg rounded-lg p-6 animate-fade-in-up">
      {selectedEmployee && (
          <Modal title={`Dossiê Investigativo: ${selectedEmployee.name}`} onClose={() => setSelectedEmployee(null)} size="2xl">
               <div className="space-y-4">
                   <div className="flex items-center gap-4 bg-brand-primary/50 p-4 rounded-lg border border-brand-accent">
                       <div className="bg-brand-blue p-3 rounded-full text-white font-bold text-xl">
                           {selectedEmployee.name.charAt(0)}
                       </div>
                       <div>
                           <h4 className="font-bold text-white text-lg flex items-center">
                               {selectedEmployee.name}
                               {selectedEmployee.criticalPosition && (
                                   <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30 uppercase font-bold">Cargo Crítico</span>
                               )}
                               {selectedEmployee.nepotismAlert && (
                                   <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded border border-red-700 uppercase font-bold shadow-sm">NEPOTISMO?</span>
                               )}
                           </h4>
                           <p className="text-brand-cyan">{selectedEmployee.position}</p>
                           <p className="text-xs text-brand-light">{selectedEmployee.department}</p>
                           {selectedEmployee.nepotismAlert && (
                               <p className="text-xs text-red-400 mt-1 font-semibold bg-red-500/10 p-1 rounded border border-red-500/20">
                                   ⚠️ {selectedEmployee.nepotismAlert}
                               </p>
                           )}
                       </div>
                   </div>
                   
                   <div className="bg-brand-primary p-6 rounded-lg border border-brand-accent h-96 overflow-y-auto custom-scrollbar">
                        {investigating ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Spinner />
                                <p className="mt-4 text-brand-light animate-pulse text-center">
                                    O Agente IA está analisando diários oficiais, processos e redes sociais...<br/>
                                    Isso pode levar alguns segundos.
                                </p>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none">
                                <div dangerouslySetInnerHTML={{ __html: md.render(selectedEmployee.investigationReport || "Nenhuma informação encontrada.") }} />
                            </div>
                        )}
                   </div>
                   <div className="flex justify-end">
                       <button onClick={() => setSelectedEmployee(null)} className="bg-brand-accent hover:bg-brand-light/20 text-white px-4 py-2 rounded transition-colors">
                           Fechar
                       </button>
                   </div>
               </div>
          </Modal>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
             <h3 className="text-xl font-semibold">Funcionários Públicos e Cargos de Confiança</h3>
             <p className="text-sm text-brand-light">Monitoramento de nomeações, nepotismo e conformidade.</p>
        </div>
        <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center bg-brand-blue hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
            {refreshing ? <Spinner /> : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" /></svg>
            )}
            {refreshing ? 'Varrendo Diários...' : 'Atualizar Lista'}
        </button>
      </div>
      
      {employees.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-accent rounded-lg bg-brand-primary/20">
              <p className="text-brand-light mb-2 text-lg font-semibold">Nenhum funcionário listado.</p>
              <p className="text-sm text-brand-light/70 max-w-md mx-auto">
                  Clique em "Atualizar Lista" para que a IA busque as nomeações mais recentes no município.
              </p>
          </div>
      ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="border-b border-brand-accent bg-brand-secondary sticky top-0">
                <tr>
                <th className="p-3 w-10"></th>
                <th className="p-3">Nome</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Departamento</th>
                <th className="p-3">Nomeado por</th>
                <th className="p-3">Data</th>
                <th className="p-3">Risco</th>
                <th className="p-3 text-right">Investigar</th>
                </tr>
            </thead>
            <tbody>
                {employees.map((e, idx) => (
                <tr key={e.id || idx} className={`border-b border-brand-accent/50 hover:bg-brand-accent/20 transition-colors ${e.nepotismAlert ? 'bg-red-900/20 border-red-500/30' : e.criticalPosition ? 'bg-yellow-900/10' : ''}`}>
                    <td className="p-3 text-center">
                        {e.nepotismAlert ? (
                            <div className="group relative cursor-help">
                                <div className="bg-red-600 p-1 rounded-full shadow-lg shadow-red-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                </div>
                                <div className="absolute left-8 top-0 w-64 bg-brand-secondary border border-brand-accent p-3 rounded-lg shadow-xl z-50 hidden group-hover:block">
                                    <p className="text-xs font-bold text-red-400 uppercase mb-1">Alerta de Nepotismo</p>
                                    <p className="text-xs text-white">{e.nepotismAlert}</p>
                                </div>
                            </div>
                        ) : ((e.alerts && e.alerts.length > 0) || e.criticalPosition) ? (
                            <div className="group relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400 cursor-help" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="absolute left-6 top-0 w-72 bg-brand-secondary border border-brand-accent p-3 rounded-lg shadow-xl z-50 hidden group-hover:block">
                                    <p className="text-xs font-bold text-white uppercase mb-2 border-b border-white/10 pb-1">Alertas de Compliance</p>
                                    <ul className="space-y-1">
                                        {e.criticalPosition && (
                                            <li className="text-xs text-orange-400 flex items-start">
                                                <span className="mr-1">•</span> Cargo Crítico (Regra Política)
                                            </li>
                                        )}
                                        {e.alerts?.map((alert, i) => (
                                            <li key={i} className="text-xs text-brand-light flex items-start">
                                                <span className="mr-1">•</span> {alert.type}: {alert.description}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : null}
                    </td>
                    <td className="p-3 font-medium text-white">
                        {e.name}
                    </td>
                    <td className="p-3 text-brand-light text-sm">
                        {e.position}
                        {e.criticalPosition && !e.nepotismAlert && <span className="ml-2 text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/30">CRÍTICO</span>}
                    </td>
                    <td className="p-3 text-brand-light text-sm">{e.department}</td>
                    <td className="p-3 text-brand-light text-sm">{e.appointedBy || '-'}</td>
                    <td className="p-3 text-brand-light text-sm whitespace-nowrap">{e.startDate ? new Date(e.startDate).toLocaleDateString() : '-'}</td>
                    <td className="p-3 w-40">
                        <RiskScore score={e.riskScore} analysis={e.riskAnalysis} />
                    </td>
                    <td className="p-3 text-right">
                        <button 
                            onClick={() => handleInvestigate(e)}
                            className="bg-brand-primary hover:bg-brand-accent border border-brand-accent text-brand-cyan hover:text-white p-2 rounded-lg transition-colors shadow-sm group"
                            title="Gerar Dossiê Completo (IA)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default EmployeesModule;
