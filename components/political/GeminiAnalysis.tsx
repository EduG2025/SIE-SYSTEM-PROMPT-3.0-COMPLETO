import React, { useState } from 'react';
import MarkdownIt from 'markdown-it';
import type { Politician, GeminiAnalysisResult } from '../../types';
import { analyzePoliticianProfile, analyzeCampaignStrategyOnly } from '../../services/geminiService';
import Spinner from '../common/Spinner';

// --- Helper Components ---
const SparklesIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const AnalysisBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-brand-primary p-4 rounded-lg">
        <h4 className="font-semibold text-lg text-brand-cyan mb-2">{title}</h4>
        <div className="prose prose-sm prose-invert max-w-none text-gray-300">{children}</div>
    </div>
);

// --- Main Component ---
const GeminiAnalysis: React.FC<{ politician: Politician }> = ({ politician }) => {
    const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeepening, setIsDeepening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const md = new MarkdownIt();

    const handleGenerateAnalysis = async () => {
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await analyzePoliticianProfile(politician);
            setAnalysis(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.');
        }
        setIsLoading(false);
    };

    const handleDeepenAnalysis = async () => {
        if (!analysis) return;
        setIsDeepening(true);
        try {
            const newStrategyText = await analyzeCampaignStrategyOnly(politician);
            setAnalysis(prev => prev ? { ...prev, campaignStrategy: newStrategyText } : null);
        } catch (e) {
            // Handle error silently or with a toast in a real app
            console.error(e);
        }
        setIsDeepening(false);
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex flex-col items-center justify-center h-48"><Spinner /><p className="mt-2">Gerando análise com IA...</p></div>;
        }
        if (error) {
            return <div className="text-center text-red-400 p-4 bg-red-500/10 rounded-lg">{error}</div>;
        }
        if (analysis) {
            return (
                <div className="space-y-4">
                    <AnalysisBlock title="Resumo Executivo">
                        <div dangerouslySetInnerHTML={{ __html: md.render(analysis.summary) }} />
                    </AnalysisBlock>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnalysisBlock title="Análise de Risco">
                            <div dangerouslySetInnerHTML={{ __html: md.render(analysis.riskAnalysis) }} />
                        </AnalysisBlock>
                        <AnalysisBlock title="Análise de Conexões">
                            <div dangerouslySetInnerHTML={{ __html: md.render(analysis.connectionAnalysis) }} />
                        </AnalysisBlock>
                    </div>
                     <AnalysisBlock title="Estratégia de Campanha">
                        <div dangerouslySetInnerHTML={{ __html: md.render(analysis.campaignStrategy) }} />
                        <button 
                            onClick={handleDeepenAnalysis} 
                            disabled={isDeepening}
                            className="text-xs bg-brand-accent hover:bg-brand-blue text-white font-semibold py-1 px-3 rounded-full mt-3 flex items-center disabled:opacity-50"
                        >
                           {isDeepening ? 'Analisando...' : 'Aprofundar Análise'}
                        </button>
                    </AnalysisBlock>
                     <AnalysisBlock title="Avaliação Geral">
                        <div dangerouslySetInnerHTML={{ __html: md.render(analysis.overallAssessment) }} />
                    </AnalysisBlock>
                </div>
            );
        }
        return (
            <div className="text-center py-10">
                <p className="text-brand-light mb-4">Gere um dossiê analítico completo sobre o político usando a IA do S.I.E.</p>
                <button
                    onClick={handleGenerateAnalysis}
                    className="bg-sie-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-sie-blue-800 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 inline-flex items-center"
                >
                    <SparklesIcon />
                    <span className="ml-2">Gerar Análise</span>
                </button>
            </div>
        );
    };

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg">
             <div className="flex items-center p-4 border-b border-white/10">
                <div className="text-brand-cyan"><SparklesIcon /></div>
                <h3 className="font-bold text-lg ml-3 text-gray-100">Dossiê Analítico (IA)</h3>
            </div>
            <div className="p-4 md:p-6">{renderContent()}</div>
        </div>
    );
};

export default GeminiAnalysis;