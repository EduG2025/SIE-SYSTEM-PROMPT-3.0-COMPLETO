import React, { useState, useCallback } from 'react';
import Spinner from './common/Spinner';

const OcrModule: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [ocrResult, setOcrResult] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileProcess = useCallback(() => {
        if (!fileName) return;

        setIsProcessing(true);
        setOcrResult(null);

        // Simula uma análise de OCR com um timeout
        setTimeout(() => {
            const mockResult = `
PROCESSO Nº: 12345-67.2023.8.26.0001
CLASSE: AÇÃO CIVIL PÚBLICA
REQUERENTE: MINISTÉRIO PÚBLICO DO ESTADO DE SÃO PAULO
REQUERIDO: CONSTRUTORA ABC LTDA e outros

DECISÃO

Vistos.

1.  Recebo a petição inicial, pois preenche os requisitos legais.
2.  Defiro o pedido de liminar para determinar a suspensão imediata do Contrato Administrativo nº 99/2023, firmado entre a Prefeitura Municipal de Japeri e a empresa CONSTRUTORA ABC LTDA, até ulterior deliberação.
3.  Citem-se os requeridos para, querendo, apresentarem contestação no prazo legal de 15 (quinze) dias.

Intimem-se.

São Paulo, 30 de Julho de 2024.

[Assinatura Eletrônica]
JUIZ DE DIREITO
`;
            setOcrResult(mockResult.trim());
            setIsProcessing(false);
        }, 2500);
    }, [fileName]);

    const handleFileChange = (file: File | null) => {
        if (file) {
            setFileName(file.name);
            setOcrResult(null);
        }
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Análise de Documentos com OCR</h3>
                <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-brand-blue bg-brand-accent' : 'border-brand-accent'}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="mt-2 text-brand-text">Arraste e solte um documento aqui</p>
                        <p className="text-xs text-brand-light">ou clique para selecionar</p>
                        <p className="text-xs text-brand-light mt-1">PDF, PNG, JPG</p>
                    </label>
                </div>
                {fileName && <p className="mt-4 text-center text-sm text-brand-light">Arquivo selecionado: <span className="font-semibold text-brand-text">{fileName}</span></p>}
                <div className="mt-6 text-center">
                    <button 
                        onClick={handleFileProcess} 
                        disabled={!fileName || isProcessing}
                        className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-brand-accent disabled:cursor-not-allowed w-full"
                    >
                        {isProcessing ? 'Analisando...' : 'Analisar Documento'}
                    </button>
                </div>
            </div>

            <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
                 <h3 className="text-xl font-semibold mb-4">Texto Extraído</h3>
                 <div className="bg-brand-primary p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm leading-relaxed">
                    {isProcessing && (
                        <div className="flex items-center justify-center h-full">
                            <Spinner />
                        </div>
                    )}
                    {ocrResult && <pre className="whitespace-pre-wrap">{ocrResult}</pre>}
                    {!isProcessing && !ocrResult && (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-brand-light">O resultado da análise aparecerá aqui.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default OcrModule;
