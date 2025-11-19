

import React, { useState, useEffect } from 'react';
import type { Lawsuit } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

const statusColorMap: Record<Lawsuit['status'], string> = {
  Ongoing: 'bg-blue-500/20 text-blue-400',
  Finished: 'bg-green-500/20 text-green-400',
  Suspended: 'bg-yellow-500/20 text-yellow-400',
};

const getStatusColor = (status: Lawsuit['status']) => {
  return statusColorMap[status];
};

const JudicialModule: React.FC = () => {
  const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await dbService.getLawsuits();
        setLawsuits(data);
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
      <h3 className="text-xl font-semibold mb-4">Processos Judiciais</h3>
       <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-brand-accent">
            <tr>
              <th className="p-3">Nº Processo</th>
              <th className="p-3">Partes Envolvidas</th>
              <th className="p-3">Tribunal</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {lawsuits.map((l) => (
              <tr key={l.id} className="border-b border-brand-accent/50 hover:bg-brand-accent/50 transition-colors">
                <td className="p-3 font-mono text-sm">{l.id}</td>
                <td className="p-3 font-medium">{l.parties}</td>
                <td className="p-3 text-brand-light">{l.court}</td>
                <td className="p-3 text-center">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(l.status)}`}>
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JudicialModule;