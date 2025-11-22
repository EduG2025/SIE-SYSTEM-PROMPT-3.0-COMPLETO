
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import UserProfile from './user/UserProfile';
import PlanAndFeatures from './user/PlanAndFeatures';
import ApiKeySettings from './user/ApiKeySettings';

const { useNavigate } = ReactRouterDOM as any;

type Tab = 'profile' | 'plan' | 'api';

const UserSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('plan'); // Default to Plan to show off the modularity
    const navigate = useNavigate();

    const tabs: { id: Tab; label: string; description: string; icon: React.ReactNode }[] = [
        { 
            id: 'plan', 
            label: 'Assinatura & Módulos', 
            description: 'Gerencie seu acesso aos módulos de inteligência',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> 
        },
        { 
            id: 'profile', 
            label: 'Meu Perfil', 
            description: 'Dados pessoais, avatar e segurança',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 
        },
        { 
            id: 'api', 
            label: 'Chave de API (BYOK)', 
            description: 'Conecte sua própria chave Google Gemini',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h7.5a6 6 0 016 6z" /></svg> 
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up min-h-screen pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-brand-secondary p-6 rounded-xl border border-brand-accent/30 shadow-lg">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Minha Conta</h2>
                    <p className="text-sm text-brand-light mt-1">Gerencie suas credenciais e personalize sua experiência no S.I.E.</p>
                </div>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    className="mt-4 md:mt-0 flex items-center bg-brand-primary hover:bg-brand-accent text-white px-4 py-2 rounded-lg transition-all border border-brand-accent group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Voltar ao Dashboard
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar de Navegação */}
                <div className="lg:col-span-3 space-y-4">
                    <nav className="space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center p-4 rounded-xl text-left transition-all duration-300 border ${
                                    activeTab === tab.id 
                                        ? 'bg-brand-blue text-white shadow-lg border-brand-blue scale-[1.02]' 
                                        : 'bg-brand-secondary/50 text-brand-light hover:bg-brand-secondary hover:text-white border-transparent hover:border-brand-accent'
                                }`}
                            >
                                <div className={`p-2 rounded-lg mr-3 shadow-inner ${activeTab === tab.id ? 'bg-white/20' : 'bg-brand-primary'}`}>
                                    {tab.icon}
                                </div>
                                <div>
                                    <span className="block font-bold text-sm">{tab.label}</span>
                                    <span className={`text-[10px] ${activeTab === tab.id ? 'text-white/80' : 'text-brand-light/60'}`}>
                                        {tab.description}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </nav>

                    {/* Cartão de Ajuda Rápida */}
                    <div className="bg-gradient-to-br from-brand-secondary to-brand-primary p-4 rounded-xl border border-brand-accent/30 mt-6">
                        <h4 className="text-white font-bold text-sm mb-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-brand-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Precisa de ajuda?
                        </h4>
                        <p className="text-xs text-brand-light mb-3">
                            Dúvidas sobre upgrades ou uso da API? Nossa documentação cobre tudo.
                        </p>
                        <button className="w-full py-2 text-xs font-bold text-brand-text bg-brand-accent/50 hover:bg-brand-accent rounded transition-colors">
                            Ler Documentação
                        </button>
                    </div>
                </div>

                {/* Área de Conteúdo */}
                <div className="lg:col-span-9">
                     <div className="bg-brand-secondary/50 backdrop-blur-sm rounded-2xl border border-brand-accent/30 p-6 min-h-[600px] shadow-xl">
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
