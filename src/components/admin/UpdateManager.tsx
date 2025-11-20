
import React from 'react';
import SystemUpdateCard from './dashboard/SystemUpdateCard';
import SystemAutoUpdater from './system/SystemAutoUpdater';

const UpdateManager: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border-l-4 border-brand-blue">
                <h2 className="text-2xl font-bold text-white mb-2">Gerenciador de Atualizações</h2>
                <p className="text-brand-light">Central de controle de versão e manutenção do sistema. Utilize estas ferramentas para aplicar patches, sincronizar com o repositório Git e corrigir a infraestrutura da VPS.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controle Manual e VPS */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Controle de Infraestrutura (Manual)</h3>
                    <SystemUpdateCard />
                </div>

                {/* Auto-Updater IA */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">Automação Inteligente</h3>
                    <SystemAutoUpdater />
                </div>
            </div>
        </div>
    );
};

export default UpdateManager;
