
import React, { useState, useRef, useCallback } from 'react';
import { dbService } from '../../services/dbService';

interface FileUploaderProps {
    onUploadComplete: (url: string, file: File) => void;
    onError?: (error: string) => void;
    maxSizeMB?: number;
    allowedTypes?: string[]; // Ex: ['image/png', 'application/pdf']
}

interface FileStatus {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
    error?: string;
    url?: string;
    abortController?: AbortController;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
    onUploadComplete, 
    onError, 
    maxSizeMB = 50, 
    allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf'] 
}) => {
    const [files, setFiles] = useState<FileStatus[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (!allowedTypes.includes(file.type)) {
            return `Tipo de arquivo inválido: ${file.type}. Permitidos: Imagens e PDF.`;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `Arquivo muito grande. Máximo: ${maxSizeMB}MB.`;
        }
        return null;
    };

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const newEntries: FileStatus[] = Array.from(newFiles).map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            progress: 0,
            status: 'pending'
        }));

        setFiles(prev => [...prev, ...newEntries]);
        
        // Inicia upload automaticamente para os novos arquivos
        newEntries.forEach(entry => uploadFile(entry));
    };

    const uploadFile = async (entry: FileStatus) => {
        const validationError = validateFile(entry.file);
        if (validationError) {
            updateFileStatus(entry.id, { status: 'error', error: validationError });
            return;
        }

        const controller = new AbortController();
        updateFileStatus(entry.id, { status: 'uploading', abortController: controller });

        try {
            // Usa lógica de Chunk para arquivos grandes (> 5MB)
            const isLarge = entry.file.size > 5 * 1024 * 1024;
            let url = '';

            if (isLarge) {
                url = await dbService.uploadFileChunked(
                    entry.file, 
                    (progress) => updateFileStatus(entry.id, { progress }),
                    controller.signal
                );
            } else {
                url = await dbService.uploadFile(entry.file); // Fallback simples
                updateFileStatus(entry.id, { progress: 100 });
            }

            updateFileStatus(entry.id, { status: 'completed', url, progress: 100 });
            onUploadComplete(url, entry.file);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                updateFileStatus(entry.id, { status: 'cancelled' });
            } else {
                const msg = error.message || 'Erro no upload';
                updateFileStatus(entry.id, { status: 'error', error: msg });
                if (onError) onError(msg);
            }
        }
    };

    const updateFileStatus = (id: string, updates: Partial<FileStatus>) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleCancel = (id: string) => {
        const file = files.find(f => f.id === id);
        if (file && file.abortController) {
            file.abortController.abort();
        }
        updateFileStatus(id, { status: 'cancelled' });
    };

    const handleRemove = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    // UI Helpers
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getIcon = (type: string) => {
        if (type.includes('pdf')) return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        );
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        );
    };

    return (
        <div className="w-full space-y-4">
            <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging ? 'border-brand-blue bg-brand-blue/10' : 'border-brand-accent hover:border-brand-light bg-brand-primary/30'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept={allowedTypes.join(',')}
                    onChange={(e) => handleFiles(e.target.files)} 
                />
                <div className="flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-brand-light mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-brand-text font-medium">Clique ou arraste arquivos aqui</p>
                    <p className="text-xs text-brand-light mt-1">Suporta múltiplos arquivos (PDF, PNG, JPG)</p>
                </div>
            </div>

            <div className="space-y-3">
                {files.map(item => (
                    <div key={item.id} className="bg-brand-secondary border border-brand-accent p-3 rounded-lg flex items-center gap-4 relative overflow-hidden group">
                        {/* Progress Bar Background */}
                        {item.status === 'uploading' && (
                            <div 
                                className="absolute bottom-0 left-0 h-1 bg-brand-blue transition-all duration-300" 
                                style={{ width: `${item.progress}%` }}
                            />
                        )}
                        
                        <div className="flex-shrink-0">
                            {getIcon(item.file.type)}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between mb-1">
                                <p className="text-sm font-medium text-white truncate" title={item.file.name}>{item.file.name}</p>
                                <span className="text-xs text-brand-light whitespace-nowrap">{formatSize(item.file.size)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs">
                                {item.status === 'uploading' && <span className="text-brand-blue">Enviando... {Math.round(item.progress)}%</span>}
                                {item.status === 'completed' && <span className="text-green-400 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Sucesso</span>}
                                {item.status === 'error' && <span className="text-red-400">{item.error}</span>}
                                {item.status === 'cancelled' && <span className="text-gray-500">Cancelado</span>}
                            </div>
                        </div>

                        <div className="flex-shrink-0">
                            {item.status === 'uploading' ? (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleCancel(item.id); }}
                                    className="p-1.5 rounded-full hover:bg-brand-primary text-brand-light hover:text-red-400 transition-colors"
                                    title="Cancelar Upload"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            ) : (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                                    className="p-1.5 rounded-full hover:bg-brand-primary text-brand-light hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remover da lista"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileUploader;
