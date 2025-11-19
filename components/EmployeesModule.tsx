
import React, { useState, useEffect } from 'react';
import type { Employee } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';
import { useNotification } from '../contexts/NotificationContext';

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
  const { notify } = useNotification();

  const fetchData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
        const data = await dbService.getEmployees(forceRefresh);
        setEmployees(data || []); // Garante array vazio se falhar
        
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

  if (loading) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <Spinner />
        </div>
    );
  }

  return (
    <div className="bg-brand-secondary shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Funcionários Públicos e Cargos de Confiança</h3>
        <button 
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center bg-brand-blue hover:bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
            {refreshing ? <Spinner /> : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l1.714 1.714a9 9 0 1012.572 0M20 20l-1.714-1.714a9 9 0 10-12.572 0" /></svg>
            )}
            {refreshing ? 'Investigando Portal da Transparência...' : 'Forçar Varredura de Dados'}
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
            <thead className="border-b border-brand-accent">
                <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Departamento</th>
                <th className="p-3">Nomeado por</th>
                <th className="p-3">Data de Início</th>
                <th className="p-3">Pontuação de Risco</th>
                </tr>
            </thead>
            <tbody>
                {employees.map((e, idx) => (
                <tr key={e.id || idx} className="border-b border-brand-accent/50 hover:bg-brand-accent/50 transition-colors">
                    <td className="p-3 font-medium">{e.name}</td>
                    <td className="p-3 text-brand-light">{e.position}</td>
                    <td className="p-3 text-brand-light">{e.department}</td>
                    <td className="p-3 text-brand-light">{e.appointedBy || '-'}</td>
                    <td className="p-3 text-brand-light">{e.startDate ? new Date(e.startDate).toLocaleDateString() : '-'}</td>
                    <td className="p-3 w-48">
                        <RiskScore score={e.riskScore} analysis={e.riskAnalysis} />
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
