
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import type { Lawsuit } from '../types';
import { dbService } from '../services/dbService';
import Spinner from './common/Spinner';

const { Link } = ReactRouterDOM as any;

const statusColorMap: Record<Lawsuit['status'], string> = {
  Ongoing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Finished: 'bg-green-500/20 text-green-400 border-green-500/30',
  Suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
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
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-white">Processos Judiciais</h3>
            <p className="text-brand-light">Monitoramento de ações civis, criminais e administrativas.</p>
          </div>
          <button onClick={() => {setLoading(true); dbService.getLawsuits().then(d => {setLawsuits(d); setLoading(false)})}} className="text-brand-blue hover:text-white text-sm">Atualizar Lista</button>
      </div>

      <div className="grid gap-4">
        {lawsuits.length === 0 ? (
             <div className="text-center py-12 text-brand-light bg-brand-secondary rounded-lg">Nenhum processo encontrado.</div>
        ) : (
            lawsuits.map((l) => (
            <div key={l.id} className="bg-brand-secondary border border-brand-accent rounded-xl p-5 hover:border-brand-blue/50 transition-all shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm bg-brand-primary px-2 py-1 rounded text-brand-light">{l.id}</span>
                            <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${statusColorMap[l.status]}`}>{l.status}</span>
                        </div>
                        <h4 className="font-semibold text-lg text-white">{l.court}</h4>
                        {l.description && <p className="text-sm text-gray-400 mt-2">{l.description}</p>}
                    </div>
                </div>

                <div className="bg-brand-primary/30 rounded-lg p-3 border border-brand-accent/30">
                    <p className="text-xs font-bold text-brand-light uppercase mb-2">Partes Envolvidas</p>
                    <div className="flex flex-wrap gap-2">
                        {l.involvedParties && l.involvedParties.length > 0 ? (
                            l.involvedParties.map((party, idx) => (
                                <div key={idx} className="flex items-center bg-brand-secondary px-3 py-1.5 rounded-full border border-brand-accent text-sm">
                                    <span className={`w-2 h-2 rounded-full mr-2 ${party.type === 'Réu' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    {party.systemId && party.entityType === 'Pessoa' ? (
                                        <Link to={`/political/${party.systemId}`} className="text-brand-cyan hover:underline font-medium">
                                            {party.name}
                                        </Link>
                                    ) : party.entityType === 'Empresa' ? (
                                         <Link to={`/companies?highlight=${encodeURIComponent(party.name)}`} className="text-brand-orange hover:underline font-medium">
                                            {party.name}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-300">{party.name}</span>
                                    )}
                                    <span className="ml-2 text-xs text-brand-light opacity-70">({party.type})</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-sm text-gray-400">{l.parties}</span>
                        )}
                    </div>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};

export default JudicialModule;