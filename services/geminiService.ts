
import { GoogleGenAI, Type } from "@google/genai";
import type { SuggestedSource, DashboardData, Politician, GeminiAnalysisResult, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, User, PoliticalModuleRules, InvestigationReport, SearchFilters } from '../types';

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
    dataSources: ["Sistema em Modo de Segurança: Cota da API do Google Excedida. Tente novamente mais tarde."],
    lastAnalysis: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + 3600 * 1000).toISOString()
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

// --- INVESTIGAÇÃO PROFUNDA (PERPLEXITY STYLE) ---

export const performDeepInvestigation = async (
    query: string, 
    filters: SearchFilters, 
    currentUser?: User | null
): Promise<InvestigationReport> => {
    try {
        const apiKey = await getEffectiveApiKey(currentUser);
        const ai = getAiClient(apiKey);
        
        // 1. Construção da Query Avançada (Google Search Operators)
        let advancedQuery = query;
        if (filters.sourceType === 'official') advancedQuery += ' site:gov.br OR site:jus.br OR site:leg.br OR site:tce.*.br';
        if (filters.sourceType === 'news') advancedQuery += ' (notícia OR denúncia OR escândalo OR reportagem)';
        if (filters.fileType === 'pdf') advancedQuery += ' filetype:pdf';
        if (filters.fileType === 'xlsx') advancedQuery += ' filetype:xlsx OR filetype:csv';
        if (filters.domain) advancedQuery += ` site:${filters.domain}`;

        let dateInstruction = "";
        const today = new Date().toISOString().split('T')[0];
        if (filters.dateRange === '24h') dateInstruction = `Priorize estritamente informações publicadas nas últimas 24 horas (Referência: ${today}).`;
        if (filters.dateRange === 'year') dateInstruction = "Filtre resultados para o último ano.";

        // 2. System Prompt "Perplexity-Style Auditor"
        const systemInstruction = `
        Você é o "S.I.E. Intelligence Core", um motor de Pesquisa Investigativa Forense (estilo Perplexity).
        
        OBJETIVO DO MÓDULO:
        Realizar buscas profundas baseadas em linguagem natural, agregando dados oficiais, análise de risco e cruzamento de informações.

        REGRAS DE COMPLIANCE E OPERAÇÃO (RIGOROSAS):
        1. TRABALHE APENAS COM DADOS REAIS E VERIFICÁVEIS. Proibido inventar ou alucinar.
        2. Se a informação não for encontrada, responda: "Informação não encontrada".
        3. Sempre cite as fontes (URLs) de onde extraiu cada fato.
        4. Linguagem neutra, técnica e sem viés político.
        5. Analise o sentimento baseado em fatos (notícias negativas = negativo, denúncias = negativo).

        FLUXO DE RACIOCÍNIO (CHAIN OF THOUGHT):
        1. **Interpretar**: Entenda a intenção da query "${query}". Identifique Entidades, Local e Tema.
        2. **Buscar**: Utilize a tool Google Search para varrer Diários Oficiais, Portais da Transparência, TCEs e Notícias.
        3. **Cruzar**: Se encontrar nomes, busque vínculos com empresas ou políticos mencionados.
        4. **Estruturar**: Sintetize tudo no formato JSON exigido.

        ESTRUTURA DE SAÍDA (JSON ESTRITO):
        Responda APENAS com este JSON válido:

        {
            "query": "${query}",
            "timestamp": "${new Date().toISOString()}",
            "executiveSummary": "Resumo técnico em Markdown. Destaque valores em negrito (ex: **R$ 1 mi**). Cite fontes como [1].",
            "sentiment": {
                "score": number (-100 a 100),
                "label": "Positivo" | "Neutro" | "Negativo",
                "summary": "Explicação breve do tom da informação encontrada."
            },
            "redFlags": [
                { "title": "Título do Risco", "severity": "Crítico" | "Alto" | "Médio", "description": "Descrição do fato.", "sourceIndex": 0 }
            ],
            "timeline": [
                { "date": "YYYY-MM-DD ou Ano", "description": "Fato relevante ordenado cronologicamente." }
            ],
            "connections": [
                { "name": "Nome", "role": "Cargo/Função", "type": "Pessoa" | "Empresa" | "Órgão" }
            ],
            "detectedProfiles": [
                { "name": "Nome", "role": "Cargo", "riskLevel": "Alto/Médio/Baixo", "matchType": "New" }
            ],
            "media": [
                { "type": "Image", "url": "URL_REAL_IMAGEM", "description": "Legenda", "sourceUrl": "URL_FONTE" }
            ],
            "sources": [
                { "title": "Título da Página", "uri": "URL", "snippet": "Trecho do texto" }
            ],
            "followUpActions": ["Sugestão de próxima pesquisa 1", "Sugestão 2"]
        }

        ${dateInstruction}
        `;

        // 3. Execução da Pesquisa
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Investigação Forense sobre: ${advancedQuery}`,
            config: {
                systemInstruction,
                tools: [{googleSearch: {}}],
            }
        });

        // 4. Processamento da Resposta
        const rawText = response.text;
        let parsedReport: any = extractJson(rawText);

        // Fallback se o JSON falhar mas houver texto
        if (!parsedReport && rawText) {
            parsedReport = {
                query,
                executiveSummary: rawText, // Usa o texto bruto como resumo
                sentiment: { score: 0, label: "Neutro", summary: "Análise estruturada falhou, exibindo texto bruto." },
                redFlags: [],
                timeline: [],
                connections: [],
                media: [],
                detectedProfiles: [],
                sources: [],
                followUpActions: []
            };
        }

        // 5. Enriquecimento de Fontes (Garante que as fontes da tool estejam no JSON final)
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const realSources: any[] = [];
        
        if (groundingChunks) {
            groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                    realSources.push({
                        title: chunk.web.title || 'Fonte Web',
                        uri: chunk.web.uri,
                        snippet: 'Fonte utilizada na investigação.'
                    });
                }
            });
        }
        
        // Remove duplicatas e limita a 15 fontes
        const uniqueSources = Array.from(new Set(realSources.map(s => s.uri)))
            .map(uri => realSources.find(s => s.uri === uri))
            .slice(0, 15);

        if (parsedReport) {
            parsedReport.sources = uniqueSources;
        }

        return parsedReport as InvestigationReport;

    } catch (error) {
        console.error("Deep Investigation Error:", error);
        return {
            query,
            timestamp: new Date().toISOString(),
            executiveSummary: "Ocorreu um erro ao processar a investigação. Verifique a conexão ou tente reformular a pesquisa.",
            sentiment: { score: 0, label: "Neutro", summary: "Erro de processamento." },
            redFlags: [],
            timeline: [],
            connections: [],
            sources: [],
            media: [],
            detectedProfiles: [],
            followUpActions: []
        };
    }
};

// --- Análise Política (Mantida para compatibilidade) ---
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

// ... (getAIResponse, validateApiKey, findAndClassifyDataSources mantidos) ...
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
        config: { systemInstruction: finalSystemInstruction, tools: [{googleSearch: {}}] }
    });

    let responseText = response.text || "Sem resposta gerada.";
    return responseText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Ocorreu um erro ao comunicar com a IA. Verifique sua chave de API ou tente novamente.";
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
            config: { tools: [{googleSearch: {}}] },
        });
        const result = extractJson(response.text);
        return Array.isArray(result) ? result : [];
    } catch (error) {
        console.error("Error calling Gemini API for source finding:", error);
        return [];
    }
};

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
            config: { tools: [{googleSearch: {}}] },
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

// 1. Busca Prefeito e Vice (ATUALIZADO: FOCO EM IMAGEM REAL)
const fetchPoliticalProfile = async (municipality: string) => {
    const schema = `{
        "mayor": { "name": "Nome Real", "position": "Prefeito", "party": "Partido", "mandate": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "avatarUrl": "URL_REAL_DA_FOTO_OFICIAL" },
        "viceMayor": { "name": "Nome Real", "position": "Vice-Prefeito", "party": "Partido", "mandate": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "avatarUrl": "URL_REAL_DA_FOTO_OFICIAL" }
    }`;
    return executeGranularQuery(municipality, "Encontre o Prefeito e Vice atuais. TAREFA CRÍTICA: Encontre a URL direta (terminada em .jpg, .png) da FOTO OFICIAL ou de urna no site do TSE (divulgacandcontas.tse.jus.br) ou site oficial da prefeitura. NÃO use placeholders.", schema);
};

const fetchSocialStats = async (municipality: string) => {
    const schema = `{ "stats": { "facebook": 0, "instagram": 0, "twitter": 0, "judicialProcesses": 0 } }`;
    return executeGranularQuery(municipality, "Estime estatísticas numéricas aproximadas de engajamento social e processos judiciais.", schema);
};
const fetchReputation = async (municipality: string) => {
    const schema = `{ "reputationRadar": { "score": 50, "tendency": "Estável", "summary": "..." } }`;
    return executeGranularQuery(municipality, "Analise a reputação da gestão atual e gere um resumo e score de 0 a 100.", schema);
};
const fetchSentiment = async (municipality: string) => {
    const schema = `{ "sentimentDistribution": { "positive": 33, "negative": 33, "neutral": 34 } }`;
    return executeGranularQuery(municipality, "Estime a distribuição de sentimento (positivo/negativo/neutro).", schema);
};
const fetchCrisisThemes = async (municipality: string) => {
    const schema = `{ "crisisThemes": [{ "theme": "Tema", "occurrences": 0 }] }`;
    return executeGranularQuery(municipality, "Identifique os principais temas de crise e reclamações frequentes.", schema);
};

// Atualizado para buscar irregularidades com mais detalhes para o Panorama
const fetchIrregularities = async (municipality: string) => {
    const schema = `{ "irregularitiesPanorama": [{ "severity": "Alta", "description": "..." }] }`;
    return executeGranularQuery(municipality, "Busque por indícios de irregularidades, denúncias no MP ou apontamentos de tribunais de contas. Seja específico.", schema);
};
const fetchHighImpactNews = async (municipality: string) => {
    const schema = `{ "highImpactNews": [{ "title": "...", "source": "...", "date": "YYYY-MM-DD", "impact": "Alto", "url": "..." }] }`;
    return executeGranularQuery(municipality, "Encontre 5 notícias recentes de ALTO IMPACTO político ou social.", schema);
};
const fetchMasterItems = async (municipality: string) => {
    const schema = `{ "masterItems": [{ "date": "YYYY-MM-DD", "title": "...", "source": "...", "platform": "Notícia", "sentiment": "Neutro", "impact": "Médio", "url": "...", "reliability": "Alta" }] }`;
    return executeGranularQuery(municipality, "Gere uma lista diversificada de 10 a 12 itens recentes para a tabela mestra.", schema);
};

export const generateFullDashboardData = async (municipality: string): Promise<DashboardData> => {
    const results = await Promise.allSettled([
        fetchPoliticalProfile(municipality), fetchSocialStats(municipality), fetchReputation(municipality),
        fetchSentiment(municipality), fetchCrisisThemes(municipality), fetchIrregularities(municipality),
        fetchHighImpactNews(municipality), fetchMasterItems(municipality)
    ]);

    const finalData: DashboardData = { ...FALLBACK_DASHBOARD_DATA, municipality, dataSources: [] };
    const allSources = new Set<string>();

    if (results[0].status === 'fulfilled') {
        const { data, sources } = results[0].value;
        if (data.mayor) finalData.mayor = data.mayor;
        if (data.viceMayor) finalData.viceMayor = data.viceMayor;
        sources.forEach(s => allSources.add(s));
    }
    if (results[1].status === 'fulfilled') { if (results[1].value.data.stats) finalData.stats = results[1].value.data.stats; }
    if (results[2].status === 'fulfilled') { if (results[2].value.data.reputationRadar) finalData.reputationRadar = results[2].value.data.reputationRadar; }
    if (results[3].status === 'fulfilled') { if (results[3].value.data.sentimentDistribution) finalData.sentimentDistribution = results[3].value.data.sentimentDistribution; }
    if (results[4].status === 'fulfilled') { if (Array.isArray(results[4].value.data.crisisThemes)) finalData.crisisThemes = results[4].value.data.crisisThemes; }
    if (results[5].status === 'fulfilled') { if (Array.isArray(results[5].value.data.irregularitiesPanorama)) finalData.irregularitiesPanorama = results[5].value.data.irregularitiesPanorama; }
    if (results[6].status === 'fulfilled') { if (Array.isArray(results[6].value.data.highImpactNews)) finalData.highImpactNews = results[6].value.data.highImpactNews; }
    if (results[7].status === 'fulfilled') { if (Array.isArray(results[7].value.data.masterItems)) finalData.masterItems = results[7].value.data.masterItems; }

    finalData.dataSources = Array.from(allSources);
    return finalData;
};

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
            Retorne APENAS um JSON Array válido. Sem markdown.
            ${moduleRules}`,
            config: { tools: [{googleSearch: {}}] },
        });
        const result = extractJson(response.text);
        return Array.isArray(result) ? result as T[] : [];
    } catch (e: any) {
        console.error(`Error generating ${moduleName} data:`, e);
        return [];
    }
};

export const generateRealEmployees = (municipality: string) => generateListFromSearch<Employee>(municipality, "Liste 10 secretários municipais...", 'employees');

// Atualizado para buscar dados profundos de empresas
export const generateRealCompanies = (municipality: string) => generateListFromSearch<Company>(municipality, `
    Liste 5 empresas que venceram licitações recentes. Para cada empresa, inclua:
    - 'cnpj' (formato XX.XXX.XXX/0001-XX)
    - 'cnae' (Atividade principal)
    - 'partners' (Lista de sócios com cargo e se é PEP)
    - 'riskScore' (Calculado com base em capital social baixo vs contratos altos)
    - 'alerts' (Array de objetos { type: 'Laranja' | 'Capital Incompatível', severity: 'Alta', description: '...' })
`, 'companies');

export const generateRealContracts = (municipality: string) => generateListFromSearch<Contract>(municipality, "Liste 5 contratos recentes...", 'contracts');

// Atualizado para buscar processos reais e linkar partes
export const generateRealLawsuits = (municipality: string) => generateListFromSearch<Lawsuit>(municipality, `
    Pesquise processos judiciais envolvendo a prefeitura ou políticos.
    Para cada processo, inclua:
    - 'involvedParties': Array de objetos { name: 'Nome', type: 'Réu' | 'Autor', entityType: 'Pessoa' | 'Empresa' }
    - 'description': Resumo do caso.
`, 'judicial');

// Atualizado para tendências e alertas sociais
export const generateRealSocialPosts = (municipality: string) => generateListFromSearch<SocialPost>(municipality, `
    Encontre opiniões recentes no Facebook/Instagram/Twitter sobre a gestão.
    Classifique o sentimento e identifique tendências negativas repetidas.
`, 'social');

export const generateRealTimeline = (municipality: string) => generateListFromSearch<TimelineEvent>(municipality, `
    Crie uma linha do tempo unificada com Nomeações, Contratos assinados, Processos iniciados e Escândalos recentes.
    Ordene cronologicamente.
`, 'timeline');

// ... (Political functions maintaind as they were recently updated) ...
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
            
            TAREFA CRÍTICA DE IMAGEM (PRIORIDADE MÁXIMA):
            Você DEVE encontrar a URL direta (.jpg ou .png) da foto oficial de urna (DivulgaCand/TSE) ou do perfil oficial no site da prefeitura.
            - Procure no dominio "divulgacandcontas.tse.jus.br".
            - Procure em redes sociais oficiais se necessário.
            - Se não encontrar foto real, deixe vazio string vazia, mas TENTE MUITO encontrar.
            
            Retorne APENAS um ARRAY JSON válido contendo 2 objetos seguindo esta estrutura:
            {
                "id": "slug-nome-cargo",
                "name": "Nome Completo",
                "party": "Partido",
                "position": "Prefeito" ou "Vice-Prefeito",
                "state": "Sigla do Estado",
                "imageUrl": "URL_DA_FOTO_REAL",
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
            config: { tools: [{googleSearch: {}}] },
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
            Para cada político, tente encontrar uma URL de foto real (perfil oficial, TSE, DivulgaCand).
            
            Retorne um ARRAY JSON válido com perfis.
            ${moduleRules}`,
            config: { tools: [{googleSearch: {}}] },
        });

        const result = extractJson(response.text);
        return Array.isArray(result) ? result as Politician[] : [];
    } catch (e: any) {
        console.error("Error generating political squad:", e);
        return [];
    }
};

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
            contents: `Atue como um Auditor Forense Sênior do S.I.E (Sistema de Investigação Estratégica).
            Realize uma INVESTIGAÇÃO MINUCIOSA, PROFUNDA E COMPLETA sobre: ${partialPolitician.name} (${partialPolitician.position} - ${partialPolitician.party}).
            
            OBJETIVOS DA INVESTIGAÇÃO (Seja detalhista e crítico):
            1. **SALÁRIO REAL & BENEFÍCIOS**: Busque no Portal da Transparência do município o salário bruto mensal mais recente. Retorne o valor numérico exato.
            2. **REDES SOCIAIS ATIVAS**: Encontre links reais e o número aproximado de seguidores ATUAIS no Instagram/Facebook. Calcule a taxa de engajamento (Baixo/Médio/Alto) baseada em comentários recentes.
            3. **HISTÓRICO DE VOTOS & DECISÕES**: Liste 5 votações recentes ou atos administrativos assinados por ele. Indique se foi "Favorável", "Contrário" e descreva o IMPACTO real na sociedade. Destaque polêmicas.
            4. **NOTÍCIAS RECENTES**: Busque 3 manchetes na mídia local/nacional. Analise o sentimento real da matéria.
            5. **EVOLUÇÃO PATRIMONIAL**: Busque declarações de bens no TSE (DivulgaCand). Compare o valor total declarado em anos diferentes.
            6. **CONEXÕES DE RISCO**: Mapeie doadores de campanha (empresas/pessoas), parentes nomeados (indícios de Nepotismo) ou aliados políticos próximos.
            7. **FOTO**: Confirme se a URL da imagem é válida e atual.

            Complete e retorne o JSON abaixo. Mantenha a estrutura rígida.
            
            {
                ... (mantenha os dados existentes de ${partialPolitician.name}),
                "imageUrl": "URL_DA_FOTO_REAL_OU_TSE",
                "salary": 0000.00,
                "socialMedia": { "instagram": "...", "facebook": "...", "followers": 0, "engagementRate": "Baixo/Médio/Alto" },
                "votingHistory": [
                    { "title": "Nome do Projeto/Decisão", "date": "YYYY-MM-DD", "vote": "Favorável/Contrário/Abstenção", "impact": "Alto/Médio", "description": "Detalhe do que foi votado e a polêmica envolvida." }
                ],
                "latestNews": [
                    { "headline": "Título da Notícia", "source": "Fonte", "date": "YYYY-MM-DD", "sentiment": "Positivo/Negativo", "url": "..." }
                ],
                "connections": [
                     { "name": "Nome", "type": "Empresa/Político/Doador", "relationship": "Doador de Campanha/Sócio", "risk": "Alto/Médio/Baixo", "details": "Motivo do risco ou valor doado" }
                ],
                "assets": { "growthPercentage": 0, "declarations": [{ "year": 2024, "value": 0, "description": "Bens" }] }
            }
            
            Retorne APENAS o JSON completo e atualizado.`,
            config: { tools: [{googleSearch: {}}] },
        });

        const fullData = extractJson(response.text);
        if (fullData) return { ...partialPolitician, ...fullData };
        return partialPolitician;
    } catch (e: any) {
        console.error("Deep analysis failed", e);
        return partialPolitician;
    }
};
