
import { GoogleGenAI, Type } from "@google/genai";
import type { SuggestedSource, DashboardData, Politician, GeminiAnalysisResult, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, User, PoliticalModuleRules } from '../types';

// --- CONSTANTES DE FALLBACK (MODO DE SEGURANÇA) ---
const FALLBACK_DASHBOARD_DATA: DashboardData = {
    municipality: "Modo Offline (Cota de API Excedida)",
    stats: { facebook: 0, instagram: 0, twitter: 0, judicialProcesses: 0 },
    mayor: {
        name: "Dados Indisponíveis", position: "Prefeito", party: "---",
        mandate: { start: new Date().toISOString(), end: new Date().toISOString() },
        avatarUrl: "https://ui-avatars.com/api/?name=Error&background=random"
    },
    viceMayor: {
        name: "Dados Indisponíveis", position: "Vice-Prefeito", party: "---",
        mandate: { start: new Date().toISOString(), end: new Date().toISOString() },
        avatarUrl: "https://ui-avatars.com/api/?name=Error&background=random"
    },
    reputationRadar: { score: 0, tendency: 'Estável', summary: "A análise de reputação não pôde ser gerada devido a limites temporários de tráfego da API de Inteligência Artificial." },
    crisisThemes: [],
    sentimentDistribution: { positive: 0, negative: 0, neutral: 100 },
    irregularitiesPanorama: [{ severity: 'Baixa', description: 'Não foi possível verificar irregularidades no momento (API Limitada).' }],
    highImpactNews: [],
    masterItems: [],
    dataSources: ["Sistema em Modo de Segurança: Cota da API do Google Excedida. Tente novamente mais tarde."]
};

// Helper para extrair JSON limpo de respostas que podem conter texto ou markdown
const extractJson = (text: string | undefined): any => {
    if (!text) return null;
    try {
        // 1. Tenta parse direto
        return JSON.parse(text);
    } catch (e) {
        // 2. Tenta extrair de blocos de código markdown (json ou sem linguagem)
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch (e2) {
                console.warn("Falha ao parsear bloco JSON extraído:", e2);
            }
        }
        
        // 3. Heurística de chaves/colchetes (último recurso)
        const firstBrace = text.indexOf('{');
        const firstBracket = text.indexOf('[');
        
        let startIdx = -1;
        let endIdx = -1;

        // Determina se estamos procurando um objeto ou array
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startIdx = firstBrace;
            endIdx = text.lastIndexOf('}');
        } else if (firstBracket !== -1) {
            startIdx = firstBracket;
            endIdx = text.lastIndexOf(']');
        }

        if (startIdx !== -1 && endIdx !== -1) {
             const candidate = text.substring(startIdx, endIdx + 1);
             try {
                return JSON.parse(candidate);
            } catch (e3) {
                 console.warn("Falha ao parsear candidato a JSON:", e3);
            }
        }
        
        return null;
    }
};

// Helper para recuperar a chave do usuário atual ou usar o Load Balancer do sistema
// E para verificar/incrementar a cota de uso
const getEffectiveApiKey = async (currentUser?: User | null): Promise<string> => {
    // Import dinâmico para evitar dependência circular
    const { dbService } = await import('./dbService');

    // Se tiver usuário logado (não sendo uma operação puramente de sistema anônimo)
    if (currentUser) {
        // 1. Verifica Cota
        const quotaStatus = await dbService.checkAndIncrementQuota(currentUser.id, true); // increment = true
        
        if (!quotaStatus.allowed) {
            throw new Error(`Limite de cota excedido para o plano atual. Upgrade necessário. (${quotaStatus.usage}/${quotaStatus.limit})`);
        }

        // 2. Se permitido, usa a chave (própria ou sistema)
        if (currentUser.canUseOwnApiKey && currentUser.apiKey) {
            return currentUser.apiKey;
        }
    }
    
    try {
        const systemKey = await dbService.getNextSystemApiKey();
        return systemKey;
    } catch (e) {
        // Fallback silencioso para tentar ler do env se o DB falhar, ou lança erro
        if (process.env.API_KEY) return process.env.API_KEY;
        throw new Error("Nenhuma chave de API válida disponível no sistema. Contate o administrador.");
    }
};

const getAiClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("Chave de API do Google Gemini não configurada.");
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

// --- Funções Auxiliares de Prompt ---
const getModuleContextRules = async (moduleName: string): Promise<string> => {
    try {
        const { dbService } = await import('./dbService');
        const module = await dbService.getModule(moduleName);
        if (module && module.rules && module.rules.trim() !== '') {
             return `\n\n[REGRAS ESPECÍFICAS DO ADMINISTRADOR PARA O MÓDULO ${moduleName.toUpperCase()}]:\n${module.rules}\n\n`;
        }
    } catch (e) {
        console.warn("Could not fetch module rules", e);
    }
    return "";
};


// --- Análise Política ---

export const analyzePoliticianProfile = async (politician: Politician): Promise<GeminiAnalysisResult> => {
    let currentUser = null;
    try {
        // Tentativa de recuperar usuário para cota (workaround frontend-only)
        const { dbService } = await import('./dbService');
        const users = await dbService.getUsers();
        currentUser = users.find(u => u.status === 'Ativo') || users[0]; 
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
    
        // Recupera regras genéricas (texto)
        let moduleRulesText = await getModuleContextRules('political');
        
        // Lógica para processar regras estruturadas (JSON) se existirem
        try {
            const { dbService } = await import('./dbService');
            const module = await dbService.getModule('political');
            if (module && module.rules && module.rules.startsWith('{')) {
                const rules = JSON.parse(module.rules) as PoliticalModuleRules;
                // Converte o objeto de regras em instruções naturais para a IA
                const structuredInstructions = [
                    `\n[DIRETRIZES ESTRATÉGICAS DO ADMINISTRADOR]:`,
                    `- Prioridade Máxima de Risco: ${rules.priority_risk_areas.join(', ') || 'Nenhuma específica'}.`,
                    `- Peso do Risco Judicial (1-10): ${rules.weight_judicial_risk} (Considere isso ao calcular a gravidade).`,
                    `- Profundidade da Análise de Rede: Nível ${rules.network_depth_level} (1=Direta, 3=Profunda).`,
                    `- Cargos Críticos para Monitoramento: ${rules.critical_positions.join(', ') || 'Padrão'}.`,
                    `- Janela de Nepotismo: Analisar nomeações nos últimos ${rules.nepotism_window_months} meses.`,
                    `- Ignorar eventos da timeline do tipo: ${rules.timeline_event_filter.join(', ') || 'Nenhum'}.`
                ].join('\n');
                
                moduleRulesText = structuredInstructions;
            }
        } catch (e) {
            console.warn("Erro ao processar regras estruturadas de IA, usando texto padrão.", e);
        }
    
        const systemInstruction = `Você é um assistente de IA especializado em análise política investigativa para o sistema "S.I.E.". Sua função é analisar os dados brutos de um político e fornecer um dossiê objetivo, estruturado e imparcial.
        ${moduleRulesText}
        REGRAS ESTRITAS:
        1. Baseie sua análise EXCLUSIVAMENTE nos dados JSON fornecidos.
        2. Seja direto e analítico. Evite linguagem opinativa.
        3. Sua resposta DEVE ser um único objeto JSON válido.
        4. Siga o schema de resposta com precisão.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: 'Resumo executivo (2-3 frases).' },
                riskAnalysis: { type: Type.STRING, description: 'Análise detalhada dos riscos (Judicial, Financeiro, Mídia).' },
                connectionAnalysis: { type: Type.STRING, description: 'Análise da rede de conexões e influências.' },
                campaignStrategy: { type: Type.STRING, description: 'Provável estratégia de campanha e perfil do eleitorado.' },
                overallAssessment: { type: Type.STRING, description: 'Avaliação geral, pontos fortes e vulnerabilidades.' },
            },
            required: ["summary", "riskAnalysis", "connectionAnalysis", "campaignStrategy", "overallAssessment"],
        };

        // Esta função NÃO usa googleSearch, então podemos usar responseMimeType JSON com segurança.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analise o seguinte perfil político e retorne um dossiê JSON:\n\n${JSON.stringify(politician, null, 2)}`,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        
        const result = extractJson(response.text);
        return result || {
            summary: "Análise indisponível.",
            riskAnalysis: "Erro ao gerar análise de risco.",
            connectionAnalysis: "Erro ao analisar conexões.",
            campaignStrategy: "Indisponível.",
            overallAssessment: "Ocorreu um erro ao processar a análise."
        };
    } catch (error) {
        console.error("Error calling Gemini for politician analysis:", error);
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        // Tratamento genérico de erro de cota
        if (msg.includes("429") || msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED")) {
             return {
                summary: "ANÁLISE INTERROMPIDA (COTA DE API)",
                riskAnalysis: "O sistema atingiu o limite de requisições do Google Gemini.",
                connectionAnalysis: "Aguarde alguns instantes ou verifique o plano.",
                campaignStrategy: "Indisponível temporariamente.",
                overallAssessment: "Modo de segurança ativado."
            };
        }
        return {
            summary: "Erro na análise.",
            riskAnalysis: "Indisponível.",
            connectionAnalysis: "Indisponível.",
            campaignStrategy: "Indisponível.",
            overallAssessment: "Erro técnico ao contatar a IA."
        };
    }
};

export const analyzeCampaignStrategyOnly = async (politician: Politician): Promise<string> => {
    let currentUser = null;
    try {
         const { dbService } = await import('./dbService');
         const users = await dbService.getUsers();
         currentUser = users[0];
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Aprofunde a análise de estratégia de campanha para este político:\n\n${JSON.stringify(politician, null, 2)}`,
            config: {
                systemInstruction: `Você é um estrategista político sênior. Foco em táticas e público-alvo.`,
            },
        });
        return response.text || "Sem análise disponível.";
    } catch (error) {
        console.error("Error calling Gemini for campaign strategy analysis:", error);
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) return "Limite de tráfego da IA excedido. Tente novamente mais tarde.";
        return "Não foi possível aprofundar a análise.";
    }
};

export const getAIResponse = async (query: string, systemPrompt: string, currentUser?: User | null): Promise<string> => {
  try {
    const apiKey = await getEffectiveApiKey(currentUser);
    const ai = getAiClient(apiKey);

    const { dbService } = await import('./dbService');
    const dynamicContext = await dbService.getCompactDatabaseSnapshot();
    const dashboardRules = await getModuleContextRules('dashboard');
    
    const finalSystemInstruction = `${systemPrompt}\n${dashboardRules}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Contexto do Banco de Dados Atual:\n${dynamicContext}\n\nConsulta do Usuário: ${query}`,
        config: {
            systemInstruction: finalSystemInstruction,
            tools: [{googleSearch: {}}],
        }
    });

    let responseText = response.text || "Sem resposta gerada.";

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && groundingChunks.length > 0) {
        const sources = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web): web is { uri: string; title: string } => !!web?.uri);

        if (sources.length > 0) {
             const uniqueSources = Array.from(new Set(sources.map(s => s.uri)))
                .map(uri => sources.find(s => s.uri === uri)!);

            responseText += "\n\n---\n**Fontes Consultadas:**\n";
            uniqueSources.forEach((source, index) => {
                responseText += `${index + 1}. [${source.title || source.uri}](${source.uri})\n`;
            });
        }
    }
    
    return responseText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) return "⚠️ A IA está sobrecarregada (Erro 429 - Cota Excedida). Por favor, aguarde um momento antes de fazer novas perguntas.";
    if (msg.includes("Limite de cota")) return "Você atingiu o limite de requisições diárias do seu plano. Atualize para continuar.";
    return "Ocorreu um erro ao comunicar com a IA. Verifique sua chave de API ou tente novamente.";
  }
};

// --- Geração de Fontes ---

export const findAndClassifyDataSources = async (sourceTypes: string): Promise<SuggestedSource[]> => {
    let currentUser = null;
    try {
         const { dbService } = await import('./dbService');
         const users = await dbService.getUsers();
         currentUser = users[0];
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        // IMPORTANTE: responseMimeType JSON removido devido ao uso de googleSearch.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Encontre URLs de fontes de dados OFICIAIS e REAIS no Brasil para: ${sourceTypes}.
            
            IMPORTANTE: Sua resposta DEVE ser estritamente um ARRAY JSON válido, onde cada item segue este formato:
            {
                "name": "Nome oficial",
                "url": "URL válida",
                "category": "Categoria",
                "type": "Tipo técnico"
            }
            Não inclua markdown, apenas o JSON puro.`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const result = extractJson(response.text);
        return Array.isArray(result) ? result : [];
    } catch (error) {
        console.error("Error calling Gemini API for source finding:", error);
        return [];
    }
};

export const findDataSourcesForMunicipality = async (municipality: string): Promise<Omit<SuggestedSource, 'category'>[]> => {
    let currentUser = null;
    try {
         const { dbService } = await import('./dbService');
         const users = await dbService.getUsers();
         currentUser = users[0];
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Encontre as 3 fontes de dados OFICIAIS (Transparência, Diário Oficial, Site da Prefeitura) para ${municipality}.
            Retorne APENAS um ARRAY JSON válido com objetos: { "name": "...", "url": "...", "type": "..." }`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        const result = extractJson(response.text);
        return Array.isArray(result) ? result.slice(0, 3) : [];
    } catch (error) {
        console.error(`Error calling Gemini API for municipality sources:`, error);
        return [];
    } 
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey || apiKey.trim() === '') return false;
    try {
        const tempAi = new GoogleGenAI({ apiKey });
        await tempAi.models.generateContent({ model: "gemini-2.5-flash", contents: "test" });
        return true;
    } catch (error) {
        return false;
    }
};

// --- Geração de Dados Dinâmicos e Reais ---

export const generateFullDashboardData = async (municipality: string): Promise<DashboardData> => {
    let currentUser = null;
    try {
         const { dbService } = await import('./dbService');
         const users = await dbService.getUsers();
         currentUser = users[0];
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        const moduleRules = await getModuleContextRules('dashboard');
        // Schema simplificado para o prompt
        const promptSchema = `
        {
            "municipality": "${municipality}",
            "stats": { "facebook": 0, "instagram": 0, "twitter": 0, "judicialProcesses": 0 },
            "mayor": { "name": "Nome Real", "position": "Prefeito", "party": "Partido", "mandate": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "avatarUrl": "url" },
            "viceMayor": { "name": "Nome Real", "position": "Vice-Prefeito", ... },
            "reputationRadar": { "score": 50, "tendency": "Estável", "summary": "..." },
            "crisisThemes": [],
            "sentimentDistribution": { "positive": 33, "negative": 33, "neutral": 34 },
            "irregularitiesPanorama": [],
            "highImpactNews": [],
            "masterItems": [],
            "dataSources": []
        }`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Pesquise na web dados reais para o dashboard de inteligência de "${municipality}".
            Encontre o Prefeito e Vice atuais.
            
            Sua resposta DEVE ser APENAS um JSON válido seguindo esta estrutura:
            ${promptSchema}
            
            ${moduleRules}`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const dashboardData = extractJson(response.text);
        
        if (!dashboardData) {
            throw new Error("Falha ao parsear JSON do dashboard");
        }

        // Enrich sources
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks && groundingChunks.length > 0) {
             const sources = (groundingChunks
                .map((chunk: any) => chunk.web?.uri) as any[])
                .filter((uri): uri is string => typeof uri === 'string' && !!uri);
            dashboardData.dataSources = [...new Set(sources)];
        } else {
            dashboardData.dataSources = [];
        }
        
        return dashboardData as DashboardData;

    } catch (error: any) {
        console.error("Error generating dashboard data:", error);

        // Check specifically for 429 Resource Exhausted or Quota Exceeded from Google API
        if (
            error.message?.includes('429') || 
            error.status === 429 || 
            error.message?.includes('Quota exceeded') || 
            error.message?.includes('RESOURCE_EXHAUSTED')
        ) {
            console.warn("API Quota Exceeded. Returning Safe Mode data for Dashboard.");
            return {
                ...FALLBACK_DASHBOARD_DATA,
                municipality: `${municipality} (Modo Offline)`,
            };
        }

        throw new Error("Falha ao gerar dados do dashboard com a IA.");
    }
};

// Generic generator for lists (Employees, Companies, etc.)
const generateListFromSearch = async <T>(municipality: string, promptContext: string, moduleName: string): Promise<T[]> => {
    let currentUser = null;
    try {
         const { dbService } = await import('./dbService');
         const users = await dbService.getUsers();
         currentUser = users[0];
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        const moduleRules = await getModuleContextRules(moduleName);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Pesquise dados reais para ${municipality}. ${promptContext}
            Retorne APENAS um JSON Array válido. Sem markdown.
            ${moduleRules}`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        const result = extractJson(response.text);
        return Array.isArray(result) ? result as T[] : [];
    } catch (e: any) {
        console.error(`Error generating ${moduleName} data:`, e);
        // Se for erro de cota, retorna lista vazia em vez de quebrar
        if (
            e.message?.includes('429') || 
            e.status === 429 || 
            e.message?.includes('RESOURCE_EXHAUSTED')
        ) {
             console.warn(`Quota exceeded for ${moduleName}, returning empty list.`);
             return [];
        }
        return [];
    }
};

export const generateRealEmployees = (municipality: string) => 
    generateListFromSearch<Employee>(municipality, "Liste 5 secretários municipais ou cargos de confiança REAIS.", 'employees');

export const generateRealCompanies = (municipality: string) => 
    generateListFromSearch<Company>(municipality, "Liste 5 empresas que possuem contratos ou licitações com a prefeitura.", 'companies');

export const generateRealContracts = (municipality: string) => 
    generateListFromSearch<Contract>(municipality, "Liste 5 contratos ou licitações recentes da prefeitura.", 'contracts');

export const generateRealLawsuits = (municipality: string) => 
    generateListFromSearch<Lawsuit>(municipality, "Pesquise processos judiciais públicos envolvendo a prefeitura ou gestores.", 'judicial');

export const generateRealSocialPosts = (municipality: string) => 
    generateListFromSearch<SocialPost>(municipality, "Encontre opiniões/comentários recentes em redes sociais/notícias sobre a gestão.", 'social');

export const generateRealTimeline = (municipality: string) => 
    generateListFromSearch<TimelineEvent>(municipality, "Crie uma linha do tempo com 5 eventos políticos/administrativos importantes dos últimos 2 anos.", 'timeline');

export const generatePoliticalSquad = async (municipality: string): Promise<Politician[]> => {
    let currentUser = null;
    try {
         const { dbService } = await import('./dbService');
         const users = await dbService.getUsers();
         currentUser = users[0];
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        const moduleRules = await getModuleContextRules('political');
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Pesquise e liste os principais políticos ATUAIS de ${municipality} (Prefeito, Vice, principais vereadores/secretários).
            
            Retorne um ARRAY JSON válido de objetos seguindo esta estrutura mínima para cada político:
            {
                "id": "slug-unico-nome",
                "name": "Nome Completo",
                "party": "Partido",
                "position": "Cargo (Prefeito, Vereador, etc)",
                "state": "Sigla do Estado",
                "imageUrl": "URL da foto oficial se encontrar",
                "bio": "Breve biografia (1 parágrafo)",
                "risks": { "judicial": "Baixo", "financial": "Baixo", "media": "Baixo" },
                "reputation": [],
                "connections": [],
                "electoralHistory": [],
                "partyHistory": [],
                "donations": { "received": [] },
                "assets": { "growthPercentage": 0, "declarations": [] },
                "electoralMap": { "imageUrl": "", "description": "" }
            }
            
            ${moduleRules}`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const result = extractJson(response.text);
        return Array.isArray(result) ? result as Politician[] : [];
    } catch (e: any) {
        console.error("Error generating political squad:", e);
         if (e.message?.includes('429') || e.status === 429 || e.message?.includes('RESOURCE_EXHAUSTED')) {
             console.warn("Quota exceeded for Political Squad.");
             return [];
         }
        return [];
    }
};

// Deep Analysis for Politician Page
export const generateDeepPoliticianAnalysis = async (partialPolitician: Politician): Promise<Politician> => {
    let currentUser = null;
    try {
         const { dbService } = await import('./dbService');
         const users = await dbService.getUsers();
         currentUser = users[0];
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Realize uma investigação profunda na web sobre o político: ${partialPolitician.name} (${partialPolitician.position} - ${partialPolitician.party}).
            
            Complete o objeto JSON abaixo com dados REAIS encontrados (Histórico Eleitoral, Bens, Doadores, Conexões):
            ${JSON.stringify(partialPolitician)}
            
            Retorne APENAS o JSON completo e atualizado.`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const fullData = extractJson(response.text);
        
        if (fullData) {
             return { ...partialPolitician, ...fullData };
        }
        return partialPolitician;
    } catch (e: any) {
        console.error("Deep analysis failed", e);
         if (e.message?.includes('429') || e.status === 429 || e.message?.includes('RESOURCE_EXHAUSTED')) {
             // Return original data without modification if quota exceeded
             return partialPolitician;
         }
        return partialPolitician;
    }
};
