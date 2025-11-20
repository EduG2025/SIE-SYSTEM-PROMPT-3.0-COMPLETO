const { GoogleGenAI } = require("@google/genai");
const { ApiKey, AuditLog } = require('../models');

// Helper to get a rotating key
const getSystemApiKey = async () => {
    const keys = await ApiKey.findAll({ where: { status: 'Ativa', type: 'System' } });
    if (keys.length === 0) {
        if (process.env.API_KEY) return process.env.API_KEY; // Fallback .env
        throw new Error("Nenhuma chave de sistema disponível.");
    }
    // Random Load Balancer
    const keyRecord = keys[Math.floor(Math.random() * keys.length)];
    
    // Async update usage count (fire and forget)
    keyRecord.increment('usageCount');
    keyRecord.update({ lastUsed: new Date() });
    
    return keyRecord.key;
};

const AiController = {
    generateContent: async (req, res) => {
        const { model, contents, config } = req.body;
        
        try {
            // 1. Determine API Key (User Own Key vs System Key)
            let apiKey;
            let usingOwnKey = false;

            if (req.user.canUseOwnApiKey && req.user.apiKey) {
                apiKey = req.user.apiKey;
                usingOwnKey = true;
            } else {
                apiKey = await getSystemApiKey();
            }

            // 2. Initialize Client
            const ai = new GoogleGenAI({ apiKey });
            
            // 3. Call Gemini
            const aiModel = model || "gemini-2.5-flash";
            
            const response = await ai.models.generateContent({
                model: aiModel,
                contents: contents,
                config: config
            });

            // 4. Increment Usage (Only if using system key or tracking is required for stats)
            if (!usingOwnKey && req.userWithPlan) {
                await req.userWithPlan.increment('usageCount');
            }

            // 5. Log Audit (Asynchronous)
            AuditLog.create({
                level: 'INFO',
                message: `AI Generation Request (${aiModel})`,
                user: req.user.username,
                metadata: { 
                    tokensUsed: response.usageMetadata?.totalTokenCount || 0,
                    usingOwnKey 
                }
            }).catch(console.error);

            res.json(response);

        } catch (error) {
            console.error("AI Proxy Error:", error);
            
            // Detailed error for debugging but sanitized for client
            const errorMessage = error.message || "Erro ao comunicar com a IA.";
            
            // Log failure
            AuditLog.create({
                level: 'ERROR',
                message: `AI Generation Failed: ${errorMessage}`,
                user: req.user ? req.user.username : 'Anonymous'
            }).catch(console.error);

            res.status(500).json({ 
                message: "Falha no processamento da IA", 
                error: errorMessage 
            });
        }
    }
};

module.exports = { AiController };