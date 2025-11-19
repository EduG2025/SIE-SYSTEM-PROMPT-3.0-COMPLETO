import React, { useState, useEffect } from 'react';
import type { Contract } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

const ContractsModule: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await dbService.getContracts();
      setContracts(data);
      setLoading(false);
    };
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
      <h3 className="text-xl font-semibold mb-4">Módulo de Contratos e Licitações</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-brand-accent">
            <tr>
              <th className="p-3">Contrato nº</th>
              <th className="p-3">Empresa Contratada</th>
              <th className="p-3">Objeto</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Vigência</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b border-brand-accent/50 hover:bg-brand-accent/50 transition-colors">
                <td className="p-3 font-mono text-sm">{c.id}</td>
                <td className="p-3 font-medium">{c.companyName}</td>
                <td className="p-3 text-brand-light max-w-sm truncate" title={c.object}>{c.object}</td>
                <td className="p-3 text-brand-light font-semibold">{c.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="p-3 text-brand-light text-sm whitespace-nowrap">
                  {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractsModule;
