
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
    if (!employee.investigationReport) {
        setInvestigating(true);
        try {
            const municipality = localStorage.getItem('selectedMunicipality') || 'Município';
            const report = await investigateEmployee(employee, municipality);
            employee.investigationReport = report; // Update local object
            // Persist report implicitly if needed via dbService, assuming object ref is same
            // In a real app, call dbService.updateEmployee(employee)
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
          <Modal title={`Investigação Forense: ${selectedEmployee.name}`} onClose={() => setSelectedEmployee(null)} size="2xl">
               <div className="space-y-4">
                   <div className="flex items-center gap-4 bg-brand-primary/50 p-4 rounded-lg border border-brand-accent">
                       <div className="bg-brand-blue p-3 rounded-full text-white font-bold text-xl">
                           {selectedEmployee.name.charAt(0)}
                       </div>
                       <div>
                           <h4 className="font-bold text-white text-lg">{selectedEmployee.name}</h4>
                           <p className="text-brand-cyan">{selectedEmployee.position}</p>
                           <p className="text-xs text-brand-light">{selectedEmployee.department}</p>
                       </div>
                   </div>
                   
                   <div className="bg-brand-primary p-6 rounded-lg border border-brand-accent h-96 overflow-y-auto custom-scrollbar">
                        {investigating ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Spinner />
                                <p className="mt-4 text-brand-light animate-pulse">Analisando diários oficiais, processos e vínculos familiares...</p>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: md.render(selectedEmployee.investigationReport || "Sem relatório.") }} />
                        )}
                   </div>
               </div>
          </Modal>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
             <h3 className="text-xl font-semibold">Funcionários Públicos e Cargos de Confiança</h3>
             <p className="text-sm text-brand-light">Monitoramento de nomeações e alertas de compliance.</p>
        </div>
        <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center bg-brand-blue hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
            {refreshing ? <Spinner /> : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" /></svg>
            )}
            {refreshing ? 'Investigando...' : 'Forçar Varredura'}
        </button>
      </div>
      
      {employees.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-accent rounded-lg bg-brand-primary/20">
              <p className="text-brand-light mb-2 text-lg font-semibold">Nenhum funcionário listado ainda.</p>
              <p className="text-sm text-brand-light/70 max-w-md mx-auto">
                  Clique no botão acima para que a IA inicie uma varredura nos portais de transparência e diários oficiais do município.
              </p>
          </div>
      ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="border-b border-brand-accent bg-brand-secondary sticky top-0">
                <tr>
                <th className="p-3 w-10"></th> {/* Alert Icon Column */}
                <th className="p-3">Nome</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Departamento</th>
                <th className="p-3">Nomeado por</th>
                <th className="p-3">Data</th>
                <th className="p-3">Risco</th>
                <th className="p-3 text-right">Ações</th>
                </tr>
            </thead>
            <tbody>
                {employees.map((e, idx) => (
                <tr key={e.id || idx} className={`border-b border-brand-accent/50 hover:bg-brand-accent/20 transition-colors ${e.alerts?.some(a => a.severity === 'Alto') ? 'bg-red-900/10' : ''}`}>
                    <td className="p-3 text-center">
                        {e.alerts && e.alerts.length > 0 && (
                            <div className="group relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 animate-pulse cursor-help" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div className="absolute left-6 top-0 w-64 bg-brand-primary border border-red-500/50 p-3 rounded-lg shadow-xl z-50 hidden group-hover:block">
                                    <p className="text-xs font-bold text-red-400 uppercase mb-1">Alertas de Compliance</p>
                                    <ul className="list-disc list-inside text-xs text-gray-300">
                                        {e.alerts.map((alert, i) => <li key={i}>{alert.type}: {alert.description}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </td>
                    <td className="p-3 font-medium text-white">{e.name}</td>
                    <td className="p-3 text-brand-light text-sm">{e.position}</td>
                    <td className="p-3 text-brand-light text-sm">{e.department}</td>
                    <td className="p-3 text-brand-light text-sm">{e.appointedBy || '-'}</td>
                    <td className="p-3 text-brand-light text-sm whitespace-nowrap">{e.startDate ? new Date(e.startDate).toLocaleDateString() : '-'}</td>
                    <td className="p-3 w-40">
                        <RiskScore score={e.riskScore} analysis={e.riskAnalysis} />
                    </td>
                    <td className="p-3 text-right">
                        <button 
                            onClick={() => handleInvestigate(e)}
                            className="text-brand-cyan hover:text-white p-2 rounded-full hover:bg-brand-cyan/20 transition-colors"
                            title="Investigar Irregularidades (IA)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
