
import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../../services/dbService';
import { findAndClassifyDataSources } from '../../services/geminiService';
import type { DataSource, DataSourceCategory, SuggestedSource, AiAutomationSettings } from '../../types';
import Modal from '../common/Modal';
import DataSourceForm from './datasources/DataSourceForm';
import SuggestedSourcesModal from './datasources/SuggestedSourcesModal';
import AIActionsPanel from './datasources/AIActionsPanel';
import AIAutomationPanel from './datasources/AIAutomationPanel';
import DataSourceCategoryView from './datasources/DataSourceCategoryView';
import PoliticalRulesPanel from './datasources/PoliticalRulesPanel';

interface DataSourcesManagementProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const DataSourcesManagement: React.FC<DataSourcesManagementProps> = ({ showToast }) => {
    const [dataSources, setDataSources] = useState<DataSourceCategory[]>([]);
    const [modal, setModal] = useState<'closed' | 'editSource' | 'suggestedSources'>('closed');
    const [editingSource, setEditingSource] = useState<{ source?: DataSource; categoryId?: number; }>({});
    const [suggestedSources, setSuggestedSources] = useState<SuggestedSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [automationSettings, setAutomationSettings] = useState<AiAutomationSettings | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [data, settings] = await Promise.all([
                dbService.getDataSources(),
                dbService.getAiAutomationSettings()
            ]);
            setDataSources(data);
            setAutomationSettings(settings);
        } catch (e) {
            console.error("Failed to fetch data sources:", e);
            // Fallback empty data if backend fails
            setDataSources([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveSource = async (sourceData: Omit<DataSource, 'id' | 'active' | 'status'>, categoryId: number) => {
        try {
            if (editingSource.source) {
                await dbService.updateDataSource(editingSource.source.id, sourceData);
                showToast('Fonte de dados atualizada!', 'success');
            } else {
                await dbService.addDataSource(categoryId, sourceData);
                showToast('Nova fonte de dados adicionada!', 'success');
            }
            fetchData();
            setModal('closed');
        } catch (error) {
            showToast('Erro ao salvar fonte de dados.', 'error');
        }
    };

    const handleDeleteSource = async (sourceId: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta fonte de dados?')) {
            await dbService.deleteDataSource(sourceId);
            showToast('Fonte de dados excluída!', 'success');
            fetchData();
        }
    };
    
    const handleToggleActive = async (sourceId: number) => {
        await dbService.toggleDataSourceStatus(sourceId);
        fetchData();
    };

    const handleAddCategory = async () => {
        const name = prompt('Nome da nova categoria:');
        if (name) {
            try {
                await dbService.addDataSourceCategory(name);
                showToast('Categoria adicionada!', 'success');
                fetchData();
            } catch (error) {
                showToast((error as Error).message, 'error');
            }
        }
    };

    const handleRenameCategory = async (category: DataSourceCategory) => {
        const newName = prompt('Novo nome para a categoria:', category.name);
        if (newName && newName !== category.name) {
            await dbService.renameDataSourceCategory(category.id, newName);
            showToast('Categoria renomeada!', 'success');
            fetchData();
        }
    };

    const handleDeleteCategory = async (categoryId: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta categoria e todas as suas fontes?')) {
            await dbService.deleteDataSourceCategory(categoryId);
            showToast('Categoria excluída!', 'success');
            fetchData();
        }
    };

    const handleSearchSources = async () => {
        setLoading(true);
        const searchPrompt = `• Portal da Transparência (União, Estados, Municípios) • Diário Oficial (União/Estados/Municípios) • TSE – DivulgaCand / Fundo Eleitoral • TREs • CNJ • TRFs • TJs • MPF • MPEs • Câmaras Municipais • Câmara dos Deputados • Senado Federal • Receita Federal • Juntas Comerciais • ComprasNet • LicitaCon`;
        const results = await findAndClassifyDataSources(searchPrompt);
        setSuggestedSources(results);
        setLoading(false);
        if (results.length > 0) {
            setModal('suggestedSources');
        } else {
            showToast('Nenhuma nova fonte encontrada ou ocorreu um erro na busca.', 'error');
        }
    };
    
    const handleAddSuggestedSource = async (suggested: SuggestedSource) => {
        setLoading(true);
        try {
            await dbService.addSourceToCategoryByName(suggested);
            showToast(`Fonte '${suggested.name}' adicionada!`, 'success');
            setSuggestedSources(prev => prev.filter(s => s.url !== suggested.url));
            await fetchData();
        } catch (error) {
            showToast((error as Error).message, 'error');
        }
        setLoading(false);
    };

    const handleAddAllSuggestedSources = async () => {
        if (suggestedSources.length === 0) return;

        setLoading(true);
        try {
            for (const source of suggestedSources) {
                await dbService.addSourceToCategoryByName(source);
            }
            showToast(`${suggestedSources.length} fontes foram adicionadas com sucesso!`, 'success');
            setSuggestedSources([]);
            setModal('closed');
            await fetchData();
        } catch (error) {
            showToast('Ocorreu um erro ao adicionar as fontes.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleValidateSources = async () => {
        setLoading(true);
        await dbService.validateAllDataSources();
        await fetchData();
        setLoading(false);
        showToast('Validação das fontes concluída!', 'success');
    };

    return (
        <div className="space-y-6">
            {modal === 'editSource' && (
                <Modal title={editingSource.source ? 'Editar Fonte de Dados' : 'Adicionar Fonte'} onClose={() => setModal('closed')}>
                    <DataSourceForm
                        source={editingSource.source}
                        categories={dataSources}
                        onSave={handleSaveSource}
                        onCancel={() => setModal('closed')}
                        initialCategoryId={editingSource.categoryId}
                    />
                </Modal>
            )}
            {modal === 'suggestedSources' && (
                 <SuggestedSourcesModal
                    sources={suggestedSources}
                    onClose={() => setModal('closed')}
                    onAddSource={handleAddSuggestedSource}
                    onAddAll={handleAddAllSuggestedSources}
                    loading={loading}
                 />
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <AIActionsPanel
                        onSearch={handleSearchSources}
                        onValidate={handleValidateSources}
                        loading={loading}
                    />
                    {automationSettings && (
                        <AIAutomationPanel
                            initialSettings={automationSettings}
                            onSave={async (settings) => {
                                await dbService.saveAiAutomationSettings(settings);
                                showToast('Configurações de automação salvas!', 'success');
                                fetchData();
                            }}
                        />
                    )}
                </div>
                <div>
                    <PoliticalRulesPanel onSave={() => showToast('Regras de Inteligência Política atualizadas!', 'success')} />
                </div>
            </div>

            <div className="flex justify-between items-center mt-8">
                <h2 className="text-2xl font-bold">Fontes de Dados Cadastradas</h2>
                <button onClick={handleAddCategory} className="bg-brand-accent hover:bg-brand-blue text-white font-bold py-2 px-4 rounded-lg">
                    Adicionar Categoria
                </button>
            </div>
            
            {dataSources.map(category => (
                <DataSourceCategoryView
                    key={category.id}
                    category={category}
                    onEditSource={(source, categoryId) => { setEditingSource({ source, categoryId }); setModal('editSource'); }}
                    onAddSource={(categoryId) => { setEditingSource({ categoryId }); setModal('editSource'); }}
                    onDeleteSource={handleDeleteSource}
                    onToggleActive={handleToggleActive}
                    onRenameCategory={handleRenameCategory}
                    onDeleteCategory={handleDeleteCategory}
                />
            ))}
        </div>
    );
};

export default DataSourcesManagement;
