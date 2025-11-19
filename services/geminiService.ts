
import { GoogleGenAI, Type } from "@google/genai";
import type { SuggestedSource, DashboardData, Politician, GeminiAnalysisResult, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, User, PoliticalModuleRules, InvestigationResult, SearchFilters } from '../types';

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

// Helper robusto para extrair JSON limpo de respostas que podem conter markdown ou texto adicional
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
                console.warn("Falha ao parsear bloco JSON extraído, tentando limpeza manual:", e2);
            }
        }
        
        // 3. Heurística de chaves/colchetes (procura o maior bloco JSON válido)
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
                 // Tentativa final: remover caracteres de controle invisíveis
                 try {
                    const cleanedCandidate = candidate.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
                    return JSON.parse(cleanedCandidate);
                 } catch(e4) {
                    console.warn("Falha crítica no parser de JSON:", e4);
                 }
            }
        }
        
        return null;
    }
};

// Helper para recuperar a chave do usuário atual ou usar o Load Balancer do sistema
const getEffectiveApiKey = async (currentUser?: User | null): Promise<string> => {
    const { dbService } = await import('./dbService');

    if (currentUser) {
        const quotaStatus = await dbService.checkAndIncrementQuota(currentUser.id, true); 
        
        if (!quotaStatus.allowed) {
            throw new Error(`Limite de cota excedido para o plano atual. Upgrade necessário. (${quotaStatus.usage}/${quotaStatus.limit})`);
        }

        if (currentUser.canUseOwnApiKey && currentUser.apiKey) {
            return currentUser.apiKey;
        }
    }
    
    try {
        const systemKey = await dbService.getNextSystemApiKey();
        return systemKey;
    } catch (e) {
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
             return `\n\n[REGRAS ESTRATÉGICAS DO ADMINISTRADOR PARA ${moduleName.toUpperCase()}]:\n${module.rules}\n\n`;
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
        const { dbService } = await import('./dbService');
        const users = await dbService.getUsers();
        currentUser = users.find(u => u.status === 'Ativo') || users[0]; 
    } catch(e) {}

    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
    
        let moduleRulesText = await getModuleContextRules('political');
        
        try {
            const { dbService } = await import('./dbService');
            const module = await dbService.getModule('political');
            if (module && module.rules && module.rules.startsWith('{')) {
                const rules = JSON.parse(module.rules) as PoliticalModuleRules;
                const structuredInstructions = [
                    `\n[DIRETRIZES DE ANÁLISE]:`,
                    `- Área de Risco Prioritária: ${rules.priority_risk_areas.join(', ') || 'Geral'}.`,
                    `- Peso do Risco Judicial (1-10): ${rules.weight_judicial_risk} (Considere alto se > 7).`,
                    `- Profundidade: Nível ${rules.network_depth_level}.`,
                ].join('\n');
                
                moduleRulesText = structuredInstructions;
            }
        } catch (e) {
            console.warn("Erro ao processar regras estruturadas de IA, usando texto padrão.", e);
        }
    
        const systemInstruction = `Você é um Auditor Forense Político do S.I.E.
        ${moduleRulesText}
        
        Analise os dados fornecidos e gere um dossiê JSON estrito.
        
        REGRAS DE OUTPUT:
        1. Responda APENAS JSON. Sem intro, sem markdown fora do JSON.
        2. Seja imparcial, factual e direto (estilo perito criminal).
        3. Se faltarem dados, inferir baseando-se no cargo e partido, mas indique como "Estimado".
        `;

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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analise este perfil:\n\n${JSON.stringify(politician, null, 2)}`,
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
    return "Ocorreu um erro ao comunicar com a IA. Verifique sua chave de API ou tente novamente.";
  }
};

// --- INVESTIGAÇÃO PROFUNDA (DEEP SEARCH - PERPLEXITY STYLE) ---

export const performDeepInvestigation = async (
    query: string, 
    filters: SearchFilters, 
    currentUser?: User | null
): Promise<InvestigationResult> => {
    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        
        let advancedQuery = query;
        if (filters.sourceType === 'official') advancedQuery += ' site:gov.br OR site:jus.br OR site:leg.br';
        if (filters.sourceType === 'news') advancedQuery += ' (notícia OR reportagem OR escândalo)';
        if (filters.fileType === 'pdf') advancedQuery += ' filetype:pdf';
        if (filters.fileType === 'xlsx') advancedQuery += ' filetype:xlsx OR filetype:xls OR filetype:csv';
        if (filters.domain) advancedQuery += ` site:${filters.domain}`;

        let dateInstruction = "";
        if (filters.dateRange === '24h') dateInstruction = "Priorize informações publicadas nas últimas 24 horas.";
        if (filters.dateRange === 'week') dateInstruction = "Priorize informações da última semana.";
        if (filters.dateRange === 'year') dateInstruction = "Limite a busca ao último ano.";

        const systemInstruction = `Você é o "DeepSearch Intel", um motor de busca investigativo avançado do S.I.E. 3.0.
        
        MISSÃO: Varrer a web, cruzar fontes e fornecer um relatório forense sobre: "${query}".
        ${dateInstruction}
        
        DIRETRIZES DE EXTRAÇÃO DE ENTIDADES (ESTRITO):
        Ao preencher o array "entities", siga rigorosamente estas regras:
        - **Person**: Nome completo de pessoas politicamente expostas ou envolvidas.
        - **Company**: Nome da empresa. Se encontrar CNPJ, inclua no nome ou contexto.
        - **Value**: Valores monetários EXATOS encontrados (Contratos, Salários, Desvios). Formato: "R$ X.XXX,XX".
        - **Date**: Datas específicas de eventos (Assinatura, Decisão Judicial). Formato: "DD/MM/AAAA".
        - **Location**: Locais específicos (Bairros, Obras, Órgãos).

        DIRETRIZES DE MÍDIA (IMPORTANTE):
        - Busque URLs de imagens REAIS (jpg, png, webp) relacionadas ao tema (ex: fotos de contratos, fotos das pessoas, locais).
        - Se encontrar, preencha o array "media". Não invente URLs.
        
        DIRETRIZES DE RESPOSTA (FORMATO ESTRITO):
        Após investigar, sua resposta DEVE conter um bloco JSON no final com a estrutura exata abaixo.
        
        \`\`\`json
        {
           "answer": "Texto detalhado em markdown citando fontes como [1], [2]...",
           "entities": [
              { "name": "Nome ou Valor", "type": "Person" | "Company" | "Value" | "Date" | "Location", "context": "Explicação breve..." }
           ],
           "media": [
              { "type": "image", "url": "url_da_imagem", "source": "fonte", "description": "descrição" }
           ],
           "relatedProfiles": [],
           "followUpQuestions": ["Pergunta sugerida 1?", "Pergunta sugerida 2?"]
        }
        \`\`\`
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Investigação Forense: ${advancedQuery}`,
            config: {
                systemInstruction,
                tools: [{googleSearch: {}}],
            }
        });

        const resultText = response.text;
        const parsedResult = extractJson(resultText);
        
        // Process Sources
        const sources: any[] = [];
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (groundingChunks) {
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    sources.push({
                        title: chunk.web.title || 'Fonte Web',
                        uri: chunk.web.uri,
                        snippet: 'Fonte utilizada na investigação.'
                    });
                }
            });
        }
        const uniqueSources = Array.from(new Set(sources.map(s => s.uri)))
            .map(uri => sources.find(s => s.uri === uri));

        if (parsedResult && parsedResult.answer) {
            return {
                answer: parsedResult.answer,
                entities: parsedResult.entities || [],
                media: parsedResult.media || [],
                relatedProfiles: parsedResult.relatedProfiles || [],
                followUpQuestions: parsedResult.followUpQuestions || [],
                sources: uniqueSources
            };
        } else {
            return {
                answer: resultText || "Não foi possível estruturar a resposta, mas aqui está o texto bruto.",
                entities: [],
                media: [],
                relatedProfiles: [],
                followUpQuestions: [],
                sources: uniqueSources
            };
        }
    } catch (error) {
        console.error("Deep Investigation Error:", error);
        throw error;
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Encontre URLs de fontes de dados OFICIAIS e REAIS no Brasil para: ${sourceTypes}.
            IMPORTANTE: Sua resposta DEVE ser estritamente um ARRAY JSON válido.`,
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

// --- Geração de Dados Dinâmicos e Reais (GRANULAR) ---

const executeGranularQuery = async (municipality: string, task: string, outputSchema: string): Promise<{ data: any, sources: string[] }> => {
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

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Contexto: Análise estratégica de "${municipality}".
            Tarefa: ${task}
            
            Sua resposta DEVE ser APENAS um JSON válido seguindo esta estrutura:
            ${outputSchema}
            
            ${moduleRules}`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const data = extractJson(response.text);
        
        let sources: string[] = [];
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks && groundingChunks.length > 0) {
             sources = (groundingChunks
                .map((chunk: any) => chunk.web?.uri) as any[])
                .filter((uri): uri is string => typeof uri === 'string' && !!uri);
        }

        if (!data) throw new Error("Failed to parse JSON");
        return { data, sources };

    } catch (error: any) {
        console.warn(`Granular query failed for task: ${task}`, error);
        throw error;
    }
};

// 1. Busca Prefeito e Vice
const fetchPoliticalProfile = async (municipality: string) => {
    const schema = `{
        "mayor": { "name": "Nome Real", "position": "Prefeito", "party": "Partido", "mandate": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "avatarUrl": "URL_DA_FOTO_OFICIAL" },
        "viceMayor": { "name": "Nome Real", "position": "Vice-Prefeito", "party": "Partido", "mandate": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "avatarUrl": "URL_DA_FOTO_OFICIAL" }
    }`;
    return executeGranularQuery(municipality, "Encontre o Prefeito e Vice atuais. IMPORTANTE: Busque a URL direta da FOTO oficial deles no site da prefeitura ou TSE. Se não encontrar foto oficial, deixe string vazia.", schema);
};

// 2. Busca Estatísticas Sociais
const fetchSocialStats = async (municipality: string) => {
    const schema = `{
        "stats": { "facebook": 0, "instagram": 0, "twitter": 0, "judicialProcesses": 0 }
    }`;
    return executeGranularQuery(municipality, "Estime estatísticas numéricas aproximadas de engajamento social e processos judiciais.", schema);
};

// 3.a Busca Reputação (Texto/Radar)
const fetchReputation = async (municipality: string) => {
    const schema = `{
        "reputationRadar": { "score": 50, "tendency": "Estável", "summary": "..." }
    }`;
    return executeGranularQuery(municipality, "Analise a reputação da gestão atual e gere um resumo e score de 0 a 100.", schema);
};

// 3.b Busca Sentimento (Numérico)
const fetchSentiment = async (municipality: string) => {
    const schema = `{
        "sentimentDistribution": { "positive": 33, "negative": 33, "neutral": 34 }
    }`;
    return executeGranularQuery(municipality, "Estime a distribuição de sentimento (positivo/negativo/neutro) da população nas redes sociais.", schema);
};

// 4.a Busca Temas de Crise
const fetchCrisisThemes = async (municipality: string) => {
    const schema = `{
        "crisisThemes": [{ "theme": "Tema", "occurrences": 0 }]
    }`;
    return executeGranularQuery(municipality, "Identifique os principais temas de crise e reclamações frequentes.", schema);
};

// 4.b Busca Irregularidades
const fetchIrregularities = async (municipality: string) => {
    const schema = `{
        "irregularitiesPanorama": [{ "severity": "Alta", "description": "..." }]
    }`;
    return executeGranularQuery(municipality, "Busque por indícios de irregularidades ou apontamentos de tribunais de contas recentes.", schema);
};

// 5. Busca Notícias de Impacto (Widget)
const fetchHighImpactNews = async (municipality: string) => {
    const schema = `{
        "highImpactNews": [{ "title": "...", "source": "...", "date": "YYYY-MM-DD", "impact": "Alto", "url": "..." }]
    }`;
    return executeGranularQuery(municipality, "Encontre 5 notícias recentes de ALTO IMPACTO político ou social (escândalos, obras, denúncias).", schema);
};

// 6. Busca Master Items (Tabela)
const fetchMasterItems = async (municipality: string) => {
    const schema = `{
        "masterItems": [{ "date": "YYYY-MM-DD", "title": "...", "source": "...", "platform": "Notícia", "sentiment": "Neutro", "impact": "Médio", "url": "...", "reliability": "Alta" }]
    }`;
    return executeGranularQuery(municipality, "Gere uma lista diversificada de 10 a 12 itens recentes para a tabela mestra (Notícias, Diários Oficiais, Redes Sociais).", schema);
};

export const generateFullDashboardData = async (municipality: string): Promise<DashboardData> => {
    console.log(`Starting granular dashboard generation for ${municipality} (8 parallel requests)...`);
    
    // Executa 8 requisições em paralelo para máxima granularidade
    const results = await Promise.allSettled([
        fetchPoliticalProfile(municipality), // 0: Prefeito/Vice
        fetchSocialStats(municipality),      // 1: Stats
        fetchReputation(municipality),       // 2: Reputação
        fetchSentiment(municipality),        // 3: Sentimento
        fetchCrisisThemes(municipality),     // 4: Crise
        fetchIrregularities(municipality),   // 5: Irregularidades
        fetchHighImpactNews(municipality),   // 6: Notícias
        fetchMasterItems(municipality)       // 7: Tabela Mestra
    ]);

    const finalData: DashboardData = {
        ...FALLBACK_DASHBOARD_DATA,
        municipality,
        dataSources: []
    };

    const allSources = new Set<string>();

    // --- Processamento dos Resultados ---
    
    // 0. Political Profile
    if (results[0].status === 'fulfilled') {
        const { data, sources } = results[0].value;
        if (data.mayor) finalData.mayor = data.mayor;
        if (data.viceMayor) finalData.viceMayor = data.viceMayor;
        sources.forEach(s => allSources.add(s));
    }
    
    // 1. Stats
    if (results[1].status === 'fulfilled') {
        const { data, sources } = results[1].value;
        if (data.stats) finalData.stats = data.stats;
        sources.forEach(s => allSources.add(s));
    }
    
    // 2. Reputation Radar
    if (results[2].status === 'fulfilled') {
        const { data, sources } = results[2].value;
        if (data.reputationRadar) finalData.reputationRadar = data.reputationRadar;
        sources.forEach(s => allSources.add(s));
    }
    
    // 3. Sentiment Distribution
    if (results[3].status === 'fulfilled') {
        const { data, sources } = results[3].value;
        if (data.sentimentDistribution) finalData.sentimentDistribution = data.sentimentDistribution;
        sources.forEach(s => allSources.add(s));
    }
    
    // 4. Crisis Themes
    if (results[4].status === 'fulfilled') {
        const { data, sources } = results[4].value;
        if (Array.isArray(data.crisisThemes)) finalData.crisisThemes = data.crisisThemes;
        sources.forEach(s => allSources.add(s));
    }
    
    // 5. Irregularities
    if (results[5].status === 'fulfilled') {
        const { data, sources } = results[5].value;
        if (Array.isArray(data.irregularitiesPanorama)) finalData.irregularitiesPanorama = data.irregularitiesPanorama;
        sources.forEach(s => allSources.add(s));
    }
    
    // 6. High Impact News
    if (results[6].status === 'fulfilled') {
        const { data, sources } = results[6].value;
        if (Array.isArray(data.highImpactNews)) finalData.highImpactNews = data.highImpactNews;
        sources.forEach(s => allSources.add(s));
    }
    
    // 7. Master Items
    if (results[7].status === 'fulfilled') {
        const { data, sources } = results[7].value;
        if (Array.isArray(data.masterItems)) finalData.masterItems = data.masterItems;
        sources.forEach(s => allSources.add(s));
    }

    finalData.dataSources = Array.from(allSources);

    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed) {
        console.warn("All granular dashboard requests failed. Returning full fallback.");
        const firstError = (results[0] as PromiseRejectedResult).reason;
        if (firstError?.message?.includes('429') || firstError?.message?.includes('Quota exceeded')) {
             return {
                ...FALLBACK_DASHBOARD_DATA,
                municipality: `${municipality} (Offline - Cota)`,
            };
        }
    }

    return finalData;
};

// --- GERADORES DE LISTAS (EMPRESA, FUNCIONÁRIOS) ---

// Generic generator for lists
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
            contents: `Pesquise dados reais e atuais para ${municipality}. ${promptContext}
            Retorne APENAS um JSON Array válido. Sem markdown. Use ponto flutuante simples para valores monetários (ex: 1500.50) não string formatada.
            ${moduleRules}`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });
        
        const result = extractJson(response.text);
        return Array.isArray(result) ? result as T[] : [];
    } catch (e: any) {
        console.error(`Error generating ${moduleName} data:`, e);
        return [];
    }
};

export const generateRealEmployees = (municipality: string) => 
    generateListFromSearch<Employee>(municipality, "Liste 10 secretários municipais, assessores ou cargos de confiança ATUAIS. Busque nomes em portais de transparência e diários oficiais. Retorne JSON Array: [{id: 1, name: '...', position: '...', department: '...', appointedBy: '...', startDate: 'YYYY-MM-DD', riskScore: 0, riskAnalysis: '...'}]", 'employees');

export const generateRealCompanies = (municipality: string) => 
    generateListFromSearch<Company>(municipality, "Liste 5 empresas que venceram licitações recentes na prefeitura. Retorne JSON Array: [{id: 1, name:'...', cnpj: '...', totalContractsValue: 100000 (number), riskScore: 0}]", 'companies');

export const generateRealContracts = (municipality: string) => 
    generateListFromSearch<Contract>(municipality, "Liste 5 contratos recentes da prefeitura. Retorne JSON Array: [{id: '...', companyName: '...', value: 1000 (number), object: '...', startDate: '...', endDate: '...'}]", 'contracts');

export const generateRealLawsuits = (municipality: string) => 
    generateListFromSearch<Lawsuit>(municipality, "Pesquise processos judiciais públicos envolvendo a prefeitura ou gestores.", 'judicial');

export const generateRealSocialPosts = (municipality: string) => 
    generateListFromSearch<SocialPost>(municipality, "Encontre opiniões/comentários recentes em redes sociais/notícias sobre a gestão.", 'social');

export const generateRealTimeline = (municipality: string) => 
    generateListFromSearch<TimelineEvent>(municipality, "Crie uma linha do tempo com 5 eventos políticos/administrativos importantes dos últimos 2 anos. Use o campo 'relatedId' se puder associar a um ID de contrato ou processo.", 'timeline');

// --- Liderança Política e Rede ---
export const generatePoliticalLeadership = async (municipality: string): Promise<Politician[]> => {
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
            contents: `Pesquise o Prefeito e o Vice-Prefeito ATUAIS de ${municipality}.
            
            TAREFA CRÍTICA DE IMAGEM:
            Busque ativamente no Google Imagens, sites oficiais da Prefeitura, Câmaras ou TSE pela URL DIRETA (.jpg, .png) da foto oficial ou de urna dessas pessoas.
            Não use placeholders. Se não achar, deixe vazio.
            
            Retorne APENAS um ARRAY JSON válido contendo 2 objetos seguindo esta estrutura:
            {
                "id": "slug-nome-cargo",
                "name": "Nome Completo",
                "party": "Partido",
                "position": "Prefeito" ou "Vice-Prefeito",
                "state": "Sigla do Estado",
                "imageUrl": "URL_REAL_DA_FOTO",
                "bio": "Biografia",
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
        console.error("Error generating leadership:", e);
        return [];
    }
};

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
            contents: `Faça uma varredura política em ${municipality}. Identifique Vereadores influentes e Secretários.
            
            TAREFA CRÍTICA DE IMAGEM:
            Para cada político, tente encontrar uma URL de foto real (perfil oficial, TSE).
            
            Retorne um ARRAY JSON válido com perfis.
            ${moduleRules}`,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const result = extractJson(response.text);
        return Array.isArray(result) ? result as Politician[] : [];
    } catch (e: any) {
        console.error("Error generating political squad:", e);
        return [];
    }
};

// --- Deep Analysis for Politician Page (INVESTIGAÇÃO COMPLETA) ---
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
            contents: `Atue como um Auditor Forense Digital do sistema S.I.E.
            Realize uma INVESTIGAÇÃO MINUCIOSA, PROFUNDA E COMPLETA sobre: ${partialPolitician.name} (${partialPolitician.position} - ${partialPolitician.party}).
            
            OBJETIVOS DA INVESTIGAÇÃO:
            1. **FOTO REAL**: Encontre a URL direta da foto de urna no DivulgaCand ou perfil oficial. Priorize imagens de alta qualidade. Atualize o campo 'imageUrl'.
            2. **Evolução Patrimonial**: Busque declarações de bens no TSE de eleições passadas e atuais. Calcule o crescimento real. Preencha 'assets.declarations' com {year, value}.
            3. **Doações de Campanha**: Identifique os maiores doadores (Empresas ou Pessoas). Busque CNPJs e valores exatos. Preencha 'donations.received'.
            4. **Rede de Conexões e Nepotismo**: Identifique parentes nomeados, sócios em empresas ou aliados políticos com processos. Preencha 'connections' com detalhes 'details' explicando o vínculo.
            5. **Histórico Completo**: Liste todas as eleições disputadas, resultados e votos. Preencha 'electoralHistory'.
            6. **Salário e Redes**: Encontre o salário bruto atual no Portal da Transparência e links de redes sociais.
            7. **Escândalos e Processos**: Busque notícias de irregularidades, improbidade ou investigações. Atualize os níveis de risco ('risks').

            ATENÇÃO AOS DADOS:
            - Valores monetários devem ser NUMBER (ex: 150000.00).
            - Datas devem ser precisas.
            
            Complete o objeto JSON abaixo com os dados encontrados. Mantenha a estrutura, mas enriqueça o conteúdo.
            Objeto Base: ${JSON.stringify(partialPolitician)}
            
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
        return partialPolitician;
    }
};
