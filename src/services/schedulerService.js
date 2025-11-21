
const cron = require('node-cron');
const { SystemSetting } = require('../models');
const BackendAiService = require('./backendAiService');

class SchedulerService {
    constructor() {
        this.task = null;
        this.isRunning = false;
    }

    // Inicializa o agendador lendo as configurações do banco
    async init() {
        try {
            const setting = await SystemSetting.findByPk('ai_automation_settings');
            if (setting && setting.value && setting.value.isEnabled) {
                this.scheduleTask(setting.value.frequency);
                console.log(`🕒 Scheduler iniciado. Frequência: ${setting.value.frequency}`);
            } else {
                console.log('🕒 Scheduler inativo (Desabilitado nas configurações).');
                if (this.task) this.task.stop();
            }
        } catch (error) {
            console.error('Erro ao inicializar Scheduler:', error);
        }
    }

    // Converte frequência amigável em expressão CRON
    getExpression(frequency) {
        switch (frequency) {
            case 'daily': return '0 6 * * *'; // Todo dia às 06:00
            case 'weekly': return '0 6 * * 1'; // Toda segunda às 06:00
            case 'monthly': return '0 6 1 * *'; // Dia 1 do mês
            case 'hourly': return '0 * * * *'; // Toda hora (para testes/realtime)
            default: return '0 6 * * *';
        }
    }

    scheduleTask(frequency) {
        if (this.task) {
            this.task.stop();
        }

        const expression = this.getExpression(frequency);

        this.task = cron.schedule(expression, async () => {
            if (this.isRunning) return;
            this.isRunning = true;
            
            console.log('🤖 Iniciando tarefa agendada: Atualização de Inteligência...');
            
            // Aqui definimos o município alvo. Em um sistema multi-tenant, iteraríamos por configurações.
            const municipality = 'Brasília, DF'; // Default ou ler de UserSettings
            
            await BackendAiService.refreshDashboardData(municipality);
            
            // Atualiza timestamp da última execução
            const setting = await SystemSetting.findByPk('ai_automation_settings');
            if (setting) {
                const newValue = { 
                    ...setting.value, 
                    lastRun: new Date().toISOString(), 
                    lastRunResult: 'Sucesso (Automático)' 
                };
                await setting.update({ value: newValue });
            }

            this.isRunning = false;
            console.log('🤖 Tarefa agendada concluída.');
        });
    }

    // Chamado quando o usuário salva configurações no painel
    async reload() {
        console.log('🔄 Recarregando Scheduler...');
        await this.init();
    }
    
    // Execução manual imediata (via botão "Rodar Agora")
    async runNow() {
        console.log('▶️ Execução manual solicitada.');
        const municipality = 'Brasília, DF'; 
        return await BackendAiService.refreshDashboardData(municipality);
    }
}

module.exports = new SchedulerService();
