
const { GoogleGenAI } = require("@google/genai");
const { ApiKey, SystemSetting, DashboardData, AuditLog, Politician, Employee } = require('../models');

// Rotates system keys for load balancing
const getSystemApiKey = async () => {
    try {
        const keys = await ApiKey.findAll({ where: { status: 'Ativa', type: 'System' } });
        if (keys.length === 0) {
            if (process.env.API_KEY) return process.env.API_KEY;
            throw new Error("Nenhuma chave de sistema disponível.");
        }
        const keyRecord = keys[Math.floor(Math.random() * keys.length)];
        keyRecord.increment('usageCount').catch(err => console.error('Erro ao atualizar contador:', err));
        return keyRecord.key;
    } catch (e) {
        console.error("Erro ao obter chave de API:", e);
        return process.env.API_KEY;
    }
};

const extractJson = (text) => {
    if (!text) return null;
    try {
        // Tenta encontrar bloco JSON Markdown
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) return JSON.parse(jsonMatch[1]);
        
        // Tenta encontrar limites de objeto ou array
        const firstBrace = text.indexOf('['); 
        const lastBrace = text.lastIndexOf(']');
        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) return JSON.parse(text.substring(firstBrace, lastBrace + 1));
        
        const objStart = text.indexOf('{');
        const objEnd = text.lastIndexOf('}');
        if (objStart !== -1 && objEnd !== -1 && objStart < objEnd) return JSON.parse(text.substring(objStart, objEnd + 1));
        
        // Tenta parse direto
        return JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Error:", e.message);
        return null;
    }
};

const BackendAiService = {
    /**
     * Gera e atualiza o Dashboard Estratégico completo para um município
     */
    refreshDashboardData: async (municipality) => {
        try {
            const apiKey = await getSystemApiKey();
            const ai = new GoogleGenAI({ apiKey });
            
            const prompt = `
            Atue como um Analista de Inteligência Governamental.
            Gere um dashboard estratégico JSON para o município de: ${municipality}.
            
            Busque dados REAIS e RECENTES na web sobre:
            1. Prefeito e Vice (Nome, Partido, Foto se possível).
            2. Escândalos ou crises recentes (Saúde, Educação, Obras).
            3. Principais irregularidades apontadas pelo MP ou Tribunal de Contas.
            4. Sentimento geral nas redes sociais.
            
            Retorne APENAS um JSON com esta estrutura exata:
            {
                "stats": { "facebook": 0, "instagram": 0, "twitter": 0, "judicialProcesses": 0 },
                "mayor": { "name": "Nome", "party": "Partido", "position": "Prefeito", "mandate": {"start": "2021", "end": "2024"}, "avatarUrl": "" },
                "viceMayor": { "name": "Nome", "party": "Partido", "position": "Vice-Prefeito", "mandate": {"start": "2021", "end": "2024"}, "avatarUrl": "" },
                "reputationRadar": { "score": 0-100, "tendency": "Estável/Positiva/Negativa", "summary": "Resumo curto" },
                "crisisThemes": [ { "theme": "Saúde", "occurrences": 10 } ],
                "sentimentDistribution": { "positive": 30, "negative": 50, "neutral": 20 },
                "irregularitiesPanorama": [ { "severity": "Alta", "description": "Descrição" } ],
                "highImpactNews": [ { "title": "Titulo", "source": "Fonte", "date": "YYYY-MM-DD", "impact": "Alto", "url": "" } ],
                "masterItems": [],
                "dataSources": ["Fonte 1", "Fonte 2"]
            }
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json", 
                    tools: [{ googleSearch: {} }] 
                }
            });

            const data = extractJson(response.candidates?.[0]?.content?.parts?.[0]?.text);
            
            if (data) {
                // Adiciona metadados de controle
                data.lastAnalysis = new Date().toISOString();
                data.nextUpdate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // +24h

                await DashboardData.upsert({ 
                    municipality, 
                    data, 
                    last_updated: new Date() 
                });
                
                await AuditLog.create({
                    level: 'INFO',
                    message: `Dashboard atualizado via IA para ${municipality}`,
                    user: 'System AI'
                });
                
                return true;
            }
            return false;
        } catch (e) { 
            console.error("Dashboard AI Error:", e);
            return false; 
        }
    },

    /**
     * Gera lista de políticos (Vereadores/Secretários) e salva no MySQL
     */
    scanPoliticians: async (municipality) => {
        try {
            const apiKey = await getSystemApiKey();
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
            Liste os vereadores, prefeito e principais secretários atuais de ${municipality}.
            Busque dados REAIS e RECENTES.
            
            Retorne um JSON Array exato com objetos:
            {
                "id": "slug-nome-unico",
                "name": "Nome Completo",
                "party": "Partido (Sigla)",
                "position": "Cargo (Ex: Vereador, Prefeito)",
                "state": "UF",
                "risk_judicial": "Baixo/Médio/Alto",
                "risk_financial": "Baixo/Médio/Alto",
                "bio": "Resumo curto de 1 frase."
            }
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    responseMimeType: "application/json"
                }
            });

            const items = extractJson(response.candidates?.[0]?.content?.parts?.[0]?.text);

            if (Array.isArray(items)) {
                for (const item of items) {
                    await Politician.upsert({
                        id: item.id || item.name.toLowerCase().replace(/\s+/g, '-'),
                        name: item.name,
                        party: item.party,
                        position: item.position,
                        state: item.state || 'BR',
                        bio: item.bio,
                        risks: {
                            judicial: item.risk_judicial || 'Baixo',
                            financial: item.risk_financial || 'Baixo',
                            media: 'Baixo'
                        },
                        monitored: true // Auto-monitorar novos encontrados
                    });
                }
                
                await AuditLog.create({
                    level: 'INFO',
                    message: `AI Scan: ${items.length} políticos atualizados para ${municipality}`,
                    user: 'System AI'
                });
                return items.length;
            }
            return 0;
        } catch (error) {
            console.error("Politician Scan Error:", error);
            throw error;
        }
    },

    /**
     * Gera lista de funcionários/nomeações recentes e salva no MySQL
     */
    scanEmployees: async (municipality) => {
        try {
            const apiKey = await getSystemApiKey();
            const ai = new GoogleGenAI({ apiKey });

            const prompt = `
            Pesquise no Diário Oficial ou Portal da Transparência de ${municipality} por nomeações recentes de cargos comissionados.
            
            Retorne um JSON Array:
            {
                "name": "Nome",
                "position": "Cargo",
                "department": "Secretaria/Setor",
                "appointedBy": "Quem nomeou (se houver)",
                "riskScore": 0.0 to 10.0 (Baseado se é cargo crítico ou parente de politico)
            }
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    responseMimeType: "application/json"
                }
            });

            const items = extractJson(response.candidates?.[0]?.content?.parts?.[0]?.text);

            if (Array.isArray(items)) {
                for (const item of items) {
                    await Employee.create({
                        name: item.name,
                        position: item.position,
                        department: item.department,
                        appointedBy: item.appointedBy,
                        riskScore: item.riskScore || 0,
                        startDate: new Date().toISOString()
                    });
                }
                return items.length;
            }
            return 0;
        } catch (error) {
            console.error("Employee Scan Error:", error);
            throw error;
        }
    }
};

module.exports = BackendAiService;
