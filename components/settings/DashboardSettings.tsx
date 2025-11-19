
import React, { useState, useEffect } from 'react';
import ModuleSettingsLayout from './ModuleSettingsLayout';
import ToggleSwitch from '../common/ToggleSwitch';
import { dbService } from '../../services/dbService';
import type { DashboardWidget } from '../../types';

const DashboardSettings: React.FC = () => {
    const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            const data = await dbService.getDashboardWidgets();
            setWidgets(data);
            setLoading(false);
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        await dbService.saveDashboardWidgets(widgets);
        setTimeout(() => setIsSaving(false), 800);
    };

    const handleToggleVisibility = (id: string) => {
        setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
    };

    const moveWidget = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === widgets.length - 1) return;

        const newWidgets = [...widgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        [newWidgets[index], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[index]];
        setWidgets(newWidgets);
    };

    if (loading) return <div className="p-8 text-center text-brand-light">Carregando configurações...</div>;

    return (
        <ModuleSettingsLayout moduleName="Dashboard" onSave={handleSave} isSaving={isSaving}>
            <div className="bg-brand-primary p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-white">Personalização do Layout</h4>
                <p className="text-sm text-brand-light mb-4">Ative, desative e reordene os widgets para personalizar sua visão estratégica.</p>
                
                <div className="space-y-2">
                    {widgets.map((widget, index) => (
                        <div key={widget.id} className="flex items-center justify-between p-3 bg-brand-secondary rounded-md border border-brand-accent/30 hover:border-brand-blue/30 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => moveWidget(index, 'up')} 
                                        disabled={index === 0}
                                        className="text-brand-light hover:text-brand-blue disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded hover:bg-brand-primary"
                                        title="Mover para cima"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => moveWidget(index, 'down')} 
                                        disabled={index === widgets.length - 1}
                                        className="text-brand-light hover:text-brand-blue disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded hover:bg-brand-primary"
                                        title="Mover para baixo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                </div>
                                <span className="font-medium text-white">{widget.title}</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-mono ${widget.visible ? 'text-green-400' : 'text-gray-500'}`}>
                                    {widget.visible ? 'Visível' : 'Oculto'}
                                </span>
                                <ToggleSwitch 
                                    checked={widget.visible} 
                                    onChange={() => handleToggleVisibility(widget.id)} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ModuleSettingsLayout>
    );
};

export default DashboardSettings;
