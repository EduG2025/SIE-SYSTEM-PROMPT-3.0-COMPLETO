
import React, { useState } from 'react';
import type { Politician } from '../../types';
import Section from './Section';

interface AnalysisToolsProps {
    politician: Politician;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const ChartSquareBarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const CalculatorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const AnalysisTools: React.FC<AnalysisToolsProps> = ({ politician }) => {
    const [isExporting, setIsExporting] = useState(false);

    const assets = [...(politician.assets?.declarations || [])].sort((a, b) => a.year - b.year);
    const firstAsset = assets.length > 0 ? assets[0] : null;
    const lastAsset = assets.length > 0 ? assets[assets.length - 1] : null;
    
    const totalGrowthValue = (lastAsset && firstAsset) ? lastAsset.value - firstAsset.value : 0;
    const totalGrowthPercent = (lastAsset && firstAsset && firstAsset.value > 0) 
        ? ((lastAsset.value - firstAsset.value) / firstAsset.value) * 100 
        : 0;

    const handleExportCSV = () => {
        const headers = "Ano,Valor Patrimonial,Descrição\n";
        const rows = assets.map(a => `${a.year},${a.value},"${a.description || 'Bens declarados'}"`).join("\n");
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${politician.name.replace(/\s+/g, '_')}_patrimonio.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportReport = () => {
        setIsExporting(true);
        // Simulação de geração de PDF (Download de TXT formatado)
        setTimeout(() => {
            const content = `
RELATÓRIO DE ANÁLISE POLÍTICA - S.I.E. 3.0
==========================================
Político: ${politician.name}
Cargo: ${politician.position}
Partido: ${politician.party}
Estado: ${politician.state}

RESUMO DE RISCO
---------------
Judicial: ${politician.risks.judicial}
Financeiro: ${politician.risks.financial}
Mídia: ${politician.risks.media}

EVOLUÇÃO PATRIMONIAL
--------------------
Crescimento Total: ${totalGrowthPercent.toFixed(2)}%
${assets.map(a => `- ${a.year}: R$ ${a.value.toLocaleString('pt-BR')}`).join('\n')}

--------------------
Gerado automaticamente pelo Sistema de Investigação Estratégica.
            `;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `DOSSIE_${politician.name.toUpperCase().replace(/\s+/g, '_')}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsExporting(false);
        }, 1500);
    };

    return (
        <Section icon={<CalculatorIcon />} title="Ferramentas de Análise">
            <div className="space-y-4">
                {/* Comparativo Rápido */}
                {firstAsset && lastAsset && (
                    <div className="bg-brand-primary/40 p-3 rounded-lg border border-brand-accent/30 text-sm">
                        <p className="text-brand-light font-semibold mb-2 flex items-center">
                            <ChartSquareBarIcon />
                            Comparativo Histórico ({firstAsset.year} - {lastAsset.year})
                        </p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-brand-light">Diferença Absoluta</p>
                                <p className={`font-mono font-bold ${totalGrowthValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {totalGrowthValue >= 0 ? '+' : ''}{totalGrowthValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-brand-light">Variação %</p>
                                <p className={`font-mono font-bold ${totalGrowthPercent > 100 ? 'text-orange-400' : 'text-white'}`}>
                                    {totalGrowthPercent.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ações de Exportação */}
                <div className="grid grid-cols-1 gap-2">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center justify-center w-full bg-brand-secondary hover:bg-brand-accent border border-brand-accent text-brand-light hover:text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                        <DownloadIcon />
                        Exportar Patrimônio (CSV)
                    </button>
                    <button 
                        onClick={handleExportReport}
                        disabled={isExporting}
                        className="flex items-center justify-center w-full bg-brand-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-bold shadow-md disabled:opacity-70"
                    >
                        {isExporting ? (
                            <span className="animate-pulse">Gerando Relatório...</span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Baixar Dossiê Completo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Section>
    );
};

export default AnalysisTools;
