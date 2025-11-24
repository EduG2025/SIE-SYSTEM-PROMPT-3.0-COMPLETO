
import React, { useState, useEffect, useRef } from 'react';
import type { AiAutomationSettings } from '../../../types';
import ToggleSwitch from '../../common/ToggleSwitch';
import { dbService } from '../../../services/dbService';

interface AIAutomationPanelProps {
    initialSettings: AiAutomationSettings;
    onSave: (settings: AiAutomationSettings) => Promise<void>;
}

const frequencySeconds: Record<AiAutomationSettings['frequency'], number> = {
    daily: 24 * 60 * 60,
    weekly: 7 * 24 * 60 * 60,
    monthly: 30 * 24 * 60 * 60,
};

const formatTimeLeft = (seconds: number) => {
    if (seconds <= 0) return "Executando...";
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
};

const AIAutomationPanel: React.FC<AIAutomationPanelProps> = ({ initialSettings, onSave }) => {
    const [settings, setSettings] = useState(initialSettings);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isManualRunning, setIsManualRunning] = useState(false);
    const isRunningRef = useRef(false);
    
    const calculateTimeLeft = (currentSettings: AiAutomationSettings): number => {
        if (!currentSettings.isEnabled) return 0;
        // If never run, run immediately (0 seconds left)
        if (!currentSettings.lastRun) return 0;

        const lastRunTime = new Date(currentSettings.lastRun).getTime();
        const nextRunTime = lastRunTime + frequencySeconds[currentSettings.frequency] * 1000;
        const now = new Date().getTime();
        return Math.max(0, Math.floor((nextRunTime - now) / 1000));
    };

    useEffect(() => {
        // Initial calculation on settings change
        setTimeLeft(calculateTimeLeft(settings));
        
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev > 0) return prev - 1;
                
                // Trigger execution when countdown reaches 0
                if (settings.isEnabled && !isRunningRef.current) {
                    isRunningRef.current = true;
                    
                    dbService.runAiAutomationTask().then(async () => {
                        const newSettings = await dbService.getAiAutomationSettings();
                        setSettings(newSettings);
                        isRunningRef.current = false;
                    });
                }
                return 0;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [settings]);

    const handleChange = (field: keyof AiAutomationSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(settings);
        const newSettings = await dbService.getAiAutomationSettings();
        setSettings(newSettings);
        setIsSaving(false);
    };

    const handleManualRun = async () => {
        if (isManualRunning) return;
        setIsManualRunning(true);
        await dbService.runAiAutomationTask();
        const newSettings = await dbService.getAiAutomationSettings();
        setSettings(newSettings);
        setIsManualRunning(false);
    };

    // Calculate display date
    const nextRunDate = settings.isEnabled 
        ? (settings.lastRun 
            ? new Date(new Date(settings.lastRun).getTime() + frequencySeconds[settings.frequency] * 1000) 
            : new Date()) // Now
        : null;

    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-2">Automação IA em Segundo Plano</h3>
            <p className="text-sm text-brand-light mb-4">Configure a IA para buscar e validar fontes de dados automaticamente em intervalos programados.</p>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-brand-primary rounded-lg">
                    <label htmlFor="enable-automation" className="font-medium">Habilitar busca automática</label>
                    <ToggleSwitch
                        id="enable-automation"
                        checked={settings.isEnabled}
                        onChange={(checked) => handleChange('isEnabled', checked)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-3 bg-brand-primary rounded-lg">
                        <label htmlFor="automation-frequency" className="text-sm text-brand-light mb-1 block">Frequência</label>
                        <select
                            id="automation-frequency"
                            name="frequency"
                            value={settings.frequency}
                            onChange={(e) => handleChange('frequency', e.target.value as AiAutomationSettings['frequency'])}
                            disabled={!settings.isEnabled}
                            className="w-full bg-brand-secondary p-2 rounded border border-brand-accent focus:ring-brand-blue focus:border-brand-blue disabled:opacity-50"
                        >
                            <option value="daily">Diariamente</option>
                            <option value="weekly">Semanalmente</option>
                            <option value="monthly">Mensalmente</option>
                        </select>
                    </div>
                     <div className="p-3 bg-brand-primary rounded-lg">
                         <label className="text-sm text-brand-light mb-1 block">Próxima Execução</label>
                        <div className="h-full flex flex-col justify-center">
                            {settings.isEnabled ? (
                                <>
                                    <div className="flex items-center mb-1">
                                         {timeLeft > 0 && (
                                            <svg className="h-3 w-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 8 8">
                                                <circle cx="4" cy="4" r="3" className="animate-pulse" />
                                            </svg>
                                        )}
                                        <span className="text-lg font-mono text-brand-text">{formatTimeLeft(timeLeft)}</span>
                                    </div>
                                    {nextRunDate && (
                                        <span className="text-xs text-brand-light">
                                            Data: {nextRunDate.toLocaleString('pt-BR')}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-brand-light italic">Desativado</span>
                            )}
                        </div>
                    </div>
                    <div className="p-3 bg-brand-primary rounded-lg">
                         <label className="text-sm text-brand-light mb-1 block">Última Execução</label>
                        <div className="h-full flex flex-col justify-center">
                             <p className="text-sm text-brand-text">{settings.lastRun ? new Date(settings.lastRun).toLocaleString('pt-BR') : '-'}</p>
                             {settings.lastRunResult && <p className="text-xs text-green-400 mt-1">{settings.lastRunResult}</p>}
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end mt-4 gap-3">
                    <button
                        onClick={handleManualRun}
                        disabled={isManualRunning}
                        className="bg-brand-primary border border-brand-accent hover:bg-brand-accent text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                    >
                        {isManualRunning ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Executando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Rodar Tarefa Manualmente
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAutomationPanel;
