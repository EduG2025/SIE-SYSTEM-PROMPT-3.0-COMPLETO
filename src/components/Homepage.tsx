
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { HomepageConfig, HomepageFeature } from '../types';

interface HomepageProps {
    config: HomepageConfig;
}

const IconRenderer: React.FC<{ icon: HomepageFeature['icon']; className?: string }> = ({ icon, className }) => {
    const icons = {
        search: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
        chart: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        shield: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
        ai: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
        database: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" /></svg>,
        lock: <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    };
    return icons[icon] || icons.chart;
};

// --- Theme: Modern (Dark/Glass) ---
const ModernTheme: React.FC<{ config: HomepageConfig }> = ({ config }) => {
    const navigate = useNavigate();
    const { customColors } = config;

    return (
        <div className="min-h-screen text-white font-sans" style={{ backgroundColor: customColors.background }}>
            {/* Navbar */}
            <nav className="flex justify-between items-center px-8 py-6 absolute w-full z-20">
                <div className="flex items-center gap-3">
                    {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="h-10 w-auto" />
                    ) : (
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                    )}
                    <span className="font-bold text-xl tracking-tight">S.I.E.</span>
                </div>
                <button 
                    onClick={() => navigate('/login')}
                    className="px-6 py-2.5 rounded-full font-semibold bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all hover:scale-105"
                >
                    Área Restrita
                </button>
            </nav>

            {/* Hero Section */}
            <header className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 z-10"></div>
                    <img src={config.heroImageUrl} alt="Hero" className="w-full h-full object-cover opacity-60" />
                </div>
                
                <div className="relative z-10 text-center max-w-4xl px-4 animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-400">
                        {config.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-10 font-light">
                        {config.subtitle}
                    </p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_50px_rgba(59,130,246,0.7)] transition-all transform hover:-translate-y-1"
                        style={{ backgroundColor: customColors.primary }}
                    >
                        Acessar Painel
                    </button>
                </div>
            </header>

            {/* Features Section */}
            <section className="py-24 px-6 relative z-10 -mt-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {config.features.map((feature, idx) => (
                        <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors group">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <IconRenderer icon={feature.icon} className="h-8 w-8 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="py-10 text-center text-gray-500 text-sm border-t border-white/5">
                <p>© {new Date().getFullYear()} S.I.E. - Sistema de Investigação Estratégica. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

// --- Theme: Corporate (Light/Clean) ---
const CorporateTheme: React.FC<{ config: HomepageConfig }> = ({ config }) => {
    const navigate = useNavigate();
    const { customColors } = config;

    return (
        <div className="min-h-screen font-sans bg-gray-50 text-gray-800">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-3">
                    {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="h-8 w-auto" />
                    ) : (
                        <div className="bg-blue-900 p-1.5 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                    )}
                    <span className="font-bold text-xl text-blue-900">S.I.E.</span>
                </div>
                <button 
                    onClick={() => navigate('/login')}
                    className="text-sm font-bold text-blue-900 hover:text-blue-700 uppercase tracking-wide"
                >
                    Login
                </button>
            </nav>

            {/* Hero Section */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6 leading-tight">
                            {config.title}
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            {config.subtitle}
                        </p>
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-8 py-3 rounded shadow-lg text-white font-bold transition-transform hover:-translate-y-0.5"
                            style={{ backgroundColor: customColors.primary }}
                        >
                            Acessar Plataforma
                        </button>
                    </div>
                    <div className="order-1 md:order-2">
                        <img src={config.heroImageUrl} alt="Hero" className="rounded-lg shadow-2xl w-full object-cover h-[400px]" />
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-gray-100 py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-blue-900">Recursos Principais</h2>
                        <div className="w-16 h-1 bg-blue-600 mx-auto mt-4"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {config.features.map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow border-t-4 border-blue-900">
                                <div className="mb-4 text-blue-600">
                                    <IconRenderer icon={feature.icon} className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="bg-blue-900 text-white py-8 px-6 text-center">
                <p className="text-sm opacity-70">© {new Date().getFullYear()} S.I.E. | Governança e Transparência.</p>
            </footer>
        </div>
    );
};

const Homepage: React.FC<HomepageProps> = ({ config }) => {
    if (config.theme === 'corporate') {
        return <CorporateTheme config={config} />;
    }
    return <ModernTheme config={config} />;
};

export default Homepage;
