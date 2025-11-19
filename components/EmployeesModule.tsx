

import React, { useState, useEffect } from 'react';
import type { Employee } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';
import { useNotification } from '../contexts/NotificationContext';

const RiskScore: React.FC<{ score: number; analysis: string }> = ({ score, analysis }) => {
    const getColor = (s: number) => {
        if (s >= 9) return 'bg-brand-red';
        if (s >= 7) return 'bg-brand-orange';
        if (s >= 4) return 'bg-brand-yellow';
        return 'bg-brand-green';
    };

    const widthPercentage = (score / 10) * 100;

    return (
        <div className="group relative w-full" title={analysis}>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: score >= 9 ? '#EF4444' : score >= 7 ? '#F97316' : score >= 4 ? '#EAB308' : '#22C55E' }}>
                    {score.toFixed(1)} / 10
                </span>
            </div>
            <div className="w-full bg-brand-accent rounded-full h-2">
                <div
                    className={`${getColor(score)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${widthPercentage}%` }}
                ></div>
            </div>
            <div className="absolute bottom-full mb-2 w-64 p-3 bg-brand-primary text-xs text-brand-light rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-brand-accent">
                <h5 className="font-bold mb-1">Análise de Risco:</h5>
                {analysis}
            </div>
        </div>
    );
};

const EmployeesModule: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await dbService.getEmployees();
      setEmployees(data);
      setLoading(false);

      // Check for high risk employees and notify
      const highRiskEmployees = data.filter(e => e.riskScore > 8.0);
      if (highRiskEmployees.length > 0) {
          if (highRiskEmployees.length === 1) {
             notify(`Alerta de Risco Crítico: ${highRiskEmployees[0].name} detectado com score ${highRiskEmployees[0].riskScore}.`, 'error');
          } else {
             notify(`Alerta: Detectados ${highRiskEmployees.length} funcionários com pontuação de risco crítica (acima de 8.0).`, 'error');
          }
      }
    };
    fetchData();
  }, [notify]);
  
  if (loading) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <Spinner />
        </div>
    );
  }

  return (
    <div className="bg-brand-secondary shadow-lg rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Funcionários Públicos</h3>
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
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-brand-accent/50 hover:bg-brand-accent/50 transition-colors">
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3 text-brand-light">{e.position}</td>
                <td className="p-3 text-brand-light">{e.department}</td>
                <td className="p-3 text-brand-light">{e.appointedBy}</td>
                <td className="p-3 text-brand-light">{new Date(e.startDate).toLocaleDateString()}</td>
                <td className="p-3 w-48">
                    <RiskScore score={e.riskScore} analysis={e.riskAnalysis} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeesModule;