
import React, { useState } from 'react';
import UserProfile from './user/UserProfile';
import PlanAndFeatures from './user/PlanAndFeatures';
import ApiKeySettings from './user/ApiKeySettings';

type Tab = 'profile' | 'plan' | 'api';

const UserSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    const tabs: { id: Tab; label: string; description: string; icon: React.ReactNode }[] = [
        { 
            id: 'profile', 
            label: 'Meu Perfil', 
            description: 'Gerencie seus dados pessoais e senha',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 
        },
        { 
            id: 'plan', 
            label: 'Plano e Limites', 
            description: 'Visualize recursos e cotas de uso',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> 
        },
        { 
            id: 'api', 
            label: 'Chave de API', 
            description: 'Configure sua chave Gemini pessoal',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h7.5a6 6 0 016 6z" /></svg> 
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h2 className="text-3xl font-bold text-white">Configurações da Conta</h2>
                <p className="text-sm text-brand-light mt-1 md:mt-0">Gerencie suas preferências e acesso ao sistema.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <nav className="space-y-2 sticky top-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-200 group ${
                                    activeTab === tab.id 
                                        ? 'bg-brand-blue text-white shadow-lg' 
                                        : 'bg-brand-secondary/50 text-brand-light hover:bg-brand-secondary hover:text-white'
                                }`}
                            >
                                <div className={`p-2 rounded-md mr-3 ${activeTab === tab.id ? 'bg-white/20' : 'bg-brand-primary group-hover:bg-brand-accent'}`}>
                                    {tab.icon}
                                </div>
                                <div>
                                    <span className="block font-semibold text-sm">{tab.label}</span>
                                    <span className={`text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-brand-light/60 group-hover:text-brand-light'}`}>
                                        {tab.description}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                     <div className="bg-brand-secondary/30 rounded-xl border border-brand-accent/30 p-1 min-h-full">
                        {activeTab === 'profile' && <UserProfile />}
                        {activeTab === 'plan' && <PlanAndFeatures />}
                        {activeTab === 'api' && <ApiKeySettings />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSettings;
