const { GoogleGenAI } = require("@google/genai");
const { ApiKey, SystemSetting, DashboardData, AuditLog } = require('../models');

// Rotates system keys for load balancing
const getSystemApiKey = async () => {
    const keys = await ApiKey.findAll({ where: { status: 'Ativa', type: 'System' } });
    if (keys.length === 0) {
        if (process.env.API_KEY) return process.env.API_KEY;
        throw new Error("Nenhuma chave de sistema disponível para automação.");
    }
    // Simple Random Load Balancer
    const keyRecord = keys[Math.floor(Math.random() * keys.length)];
    // Fire and forget update
    keyRecord.increment('usageCount');
    return keyRecord.key;
};

// Robust JSON Extractor that handles Markdown blocks and loose text
const extractJson = (text) => {
    if (!text) return null;
    try {
        // 1. Try extracting from Markdown code blocks
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]);
        }
        
        // 2. Try finding the first '{' and last '}'
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        }
        
        // 3. Try raw parse
        return JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Error in Backend AI:", e.message);
        // Return null to indicate failure
        return null;
    }
};

const BackendAiService = {
    /**
     * Executa a atualização autônoma do Dashboard Principal
     * @param {string} municipality Município alvo
     */
    refreshDashboardData: async (municipality = 'Brasília, DF') => {
        try {
            const apiKey = await getSystemApiKey();
            const ai = new GoogleGenAI({ apiKey });
            
            // Carrega prompt do sistema
            const promptSetting = await SystemSetting.findByPk('ai_system_prompt');
            const systemInstruction = promptSetting ? promptSetting.value.prompt : "Você é um analista de inteligência governamental.";

            const prompt = `
            Gere um dashboard estratégico JSON atualizado para: ${municipality}.
            Busque dados REAIS e RECENTES na web sobre política, crises e estatísticas.
            
            Retorne APENAS JSON com esta estrutura exata:
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
                const nextUpdate = new Date(Date.now() + (24 * 60 * 60 * 1000)); // +24h default
                
                // Merge with existing data to preserve history/settings
                const existingRecord = await DashboardData.findByPk(municipality);
                const mergedData = existingRecord 
                    ? { ...existingRecord.data, ...data, lastAnalysis: new Date(), nextUpdate } 
                    : { ...data, municipality, lastAnalysis: new Date(), nextUpdate };

                await DashboardData.upsert({
                    municipality,
                    data: mergedData,
                    last_updated: new Date()
                });

                // Audit Log
                await AuditLog.create({
                    level: 'INFO',
                    message: `Automated Dashboard Update for ${municipality}`,
                    user: 'System Cron',
                    metadata: { success: true }
                });

                return true;
            }
            
            throw new Error("Invalid JSON response from AI");

        } catch (error) {
            console.error("Backend AI Task Failed:", error.message);
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