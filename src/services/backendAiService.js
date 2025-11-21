
const { GoogleGenAI } = require("@google/genai");
const { ApiKey, SystemSetting, DashboardData, AuditLog } = require('../models');

// Função auxiliar para obter chave de API do sistema
const getSystemApiKey = async () => {
    const keys = await ApiKey.findAll({ where: { status: 'Ativa', type: 'System' } });
    if (keys.length === 0) {
        if (process.env.API_KEY) return process.env.API_KEY;
        throw new Error("Nenhuma chave de sistema disponível para automação.");
    }
    // Load Balancer Simples
    const keyRecord = keys[Math.floor(Math.random() * keys.length)];
    await keyRecord.increment('usageCount');
    return keyRecord.key;
};

// Helper para extrair JSON
const extractJson = (text) => {
    try {
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) return JSON.parse(jsonMatch[1]);
        
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        }
        return null;
    } catch (e) {
        console.error("JSON Parse Error in Backend AI:", e);
        return null;
    }
};

const BackendAiService = {
    /**
     * Executa a atualização autônoma do Dashboard Principal
     * @param {string} municipality Município alvo (obtido da configuração ou padrão)
     */
    refreshDashboardData: async (municipality = 'Brasília, DF') => {
        try {
            const apiKey = await getSystemApiKey();
            const ai = new GoogleGenAI({ apiKey });
            
            // Carrega prompt do sistema
            const promptSetting = await SystemSetting.findByPk('ai_system_prompt');
            const systemInstruction = promptSetting ? promptSetting.value.prompt : "Você é um analista de inteligência.";

            const prompt = `
            Gere um dashboard estratégico JSON atualizado para: ${municipality}.
            Busque dados REAIS e RECENTES na web sobre política, crises e estatísticas.
            
            Retorne APENAS JSON com esta estrutura:
            {
                "stats": { "facebook": 0, "instagram": 0, "twitter": 0, "judicialProcesses": 0 },
                "mayor": { "name": "Nome", "party": "Partido", "position": "Prefeito", "avatarUrl": "" },
                "viceMayor": { "name": "Nome", "party": "Partido", "position": "Vice-Prefeito", "avatarUrl": "" },
                "crisisThemes": [{ "theme": "Tema", "occurrences": 0 }],
                "sentimentDistribution": { "positive": 0, "negative": 0, "neutral": 0 },
                "highImpactNews": [{ "title": "Manchete", "source": "Fonte", "date": "YYYY-MM-DD", "impact": "Alto", "url": "" }],
                "irregularitiesPanorama": [{ "severity": "Alta", "description": "Resumo" }]
            }
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    systemInstruction,
                    tools: [{ googleSearch: {} }],
                    responseMimeType: "application/json"
                }
            });

            const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text;
            const data = extractJson(rawText);

            if (data) {
                // Salva no Banco de Dados
                const nextUpdate = new Date(Date.now() + (24 * 60 * 60 * 1000)); // +24h padrão, ajustado pelo scheduler depois
                
                // Mescla com dados existentes para não perder widgets que a IA não gerou agora
                const existingRecord = await DashboardData.findByPk(municipality);
                const mergedData = existingRecord 
                    ? { ...existingRecord.data, ...data, lastAnalysis: new Date(), nextUpdate } 
                    : { ...data, municipality, lastAnalysis: new Date(), nextUpdate };

                await DashboardData.upsert({
                    municipality,
                    data: mergedData,
                    last_updated: new Date()
                });

                await AuditLog.create({
                    level: 'INFO',
                    message: `Automated Dashboard Update for ${municipality}`,
                    user: 'System Cron',
                    metadata: { success: true }
                });

                return true;
            }
            return false;

        } catch (error) {
            console.error("Backend AI Task Failed:", error);
            await AuditLog.create({
                level: 'ERROR',
                message: `Automated Update Failed: ${error.message}`,
                user: 'System Cron'
            });
            return false;
        }
    }
};

module.exports = BackendAiService;
