
import type { 
    InvestigationReport, SearchFilters, Politician, GeminiAnalysisResult, 
    DashboardData, Employee, Company, Contract, Lawsuit, SocialPost, TimelineEvent, SuggestedSource,
    PoliticalModuleRules
} from '../types';
import { dbService } from './dbService';

// Helper para processar respostas JSON vindas do Backend
const extractJson = (data: any): any => {
    if (typeof data === 'object' && data !== null) return data;
    if (typeof data === 'string') {
        try {
            // Tenta limpar markdown
            const clean = data.replace(/```json\n?|```/g, '').trim();
            return JSON.parse(clean);
        } catch (e) {
            return null;
        }
    }
    return null;
};

// Função Genérica para chamar o Proxy de IA do Backend
const callBackendAI = async (prompt: string, model: string = 'gemini-2.5-flash', config: any = {}): Promise<any> => {
    try {
        // O dbService agora possui um método proxyAiRequest que chama /api/ai/generate
        const response = await dbService.proxyAiRequest({
            model,
            contents: prompt,
            config
        });
        
        // O backend retorna o objeto de resposta do Gemini.
        // O texto geralmente está em candidates[0].content.parts[0].text
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        return { text, raw: response };
    } catch (error) {
        console.error("AI Backend Call Failed:", error);
        throw error;
    }
};

// --- Features ---

export const performDeepInvestigation = async (
    query: string, 
    filters: SearchFilters, 
    userContext?: any
): Promise<InvestigationReport> => {
    
    // Build Prompt
    let promptContext = `Contexto: Investigação Governamental. Tópico: ${query}.\n`;
    if (filters.sourceType === 'official') promptContext += "Restringir busca a sites oficiais (.gov.br, .jus.br).\n";
    if (filters.dateRange === '24h') promptContext += "Focar em eventos das últimas 24 horas.\n";

    const systemInstruction = `
    Você é o S.I.E. Intelligence Core, um auditor forense digital.
    Sua missão é realizar uma investigação profunda na web sobre o tópico solicitado.
    
    REGRAS:
    1. Responda APENAS em formato JSON estrito.
    2. Cite fontes reais (URLs) encontradas pela ferramenta de busca.
    3. Analise o sentimento e identifique riscos (Red Flags).
    4. Cruze informações de pessoas e empresas.

    Schema de Resposta (JSON):
    {
        "query": "string",
        "timestamp": "ISO String",
        "executiveSummary": "Markdown string",
        "sentiment": { "score": number (-100 to 100), "label": "Positivo/Neutro/Negativo", "summary": "string" },
        "redFlags": [ { "title": "string", "severity": "Alta/Média/Baixa", "description": "string" } ],
        "timeline": [ { "date": "string", "description": "string" } ],
        "connections": [ { "name": "string", "role": "string", "type": "Pessoa/Empresa" } ],
        "sources": [ { "title": "string", "uri": "string", "snippet": "string" } ],
        "detectedProfiles": [ { "name": "string", "role": "string" } ],
        "followUpActions": [ "string" ]
    }
    `;

    try {
        const result = await callBackendAI(promptContext, "gemini-2.5-flash", {
            systemInstruction,
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        });

        const json = extractJson(result.text);
        
        // Enriquecimento de fontes via metadados do backend/gemini
        const grounding = result.raw?.candidates?.[0]?.groundingMetadata?.groundingChunks;
        let sources = json?.sources || [];
        
        if (grounding) {
            const groundSources = grounding
                .filter((c: any) => c.web?.uri)
                .map((c: any) => ({
                    title: c.web.title || 'Fonte Web',
                    uri: c.web.uri,
                    snippet: 'Fonte verificada via Google Search Grounding'
                }));
            if (groundSources.length > 0) sources = groundSources;
        }

        return {
            ...json,
            sources: sources.slice(0, 15)
        } as InvestigationReport;

    } catch (error) {
        console.error("Investigation Error:", error);
        return {
            query,
            timestamp: new Date().toISOString(),
            executiveSummary: "Erro ao processar investigação. Verifique sua cota ou conexão.",
            sentiment: { score: 0, label: "Neutro", summary: "Erro" },
            redFlags: [],
            timeline: [],
            connections: [],
            sources: [],
            followUpActions: []
        };
    }
};

export const analyzePoliticianProfile = async (politician: Politician): Promise<GeminiAnalysisResult> => {
    const systemInstruction = `
    Analise este perfil político com rigor de auditoria.
    Identifique inconsistências, riscos e padrões de influência.
    Retorne JSON.
    `;

    const prompt = `Perfil: ${JSON.stringify(politician)}`;

    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            systemInstruction,
            responseMimeType: "application/json"
        });
        return extractJson(result.text) || {};
    } catch (e) {
        return {
            summary: "Erro na análise.",
            riskAnalysis: "Indisponível.",
            connectionAnalysis: "Indisponível.",
            campaignStrategy: "Indisponível.",
            overallAssessment: "Erro de conexão."
        };
    }
};

export const analyzeCampaignStrategyOnly = async (politician: Politician): Promise<string> => {
    try {
        const prompt = `Aprofunde a estratégia de campanha para: ${politician.name} (${politician.party}). Foco em eleitorado e alianças.`;
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            systemInstruction: "Você é um estrategista político sênior."
        });
        return result.text || "Sem análise.";
    } catch (e) { return "Erro na análise."; }
};

export const getAIResponse = async (query: string, systemPrompt: string): Promise<string> => {
    try {
        const result = await callBackendAI(query, "gemini-2.5-flash", {
            systemInstruction: systemPrompt,
            tools: [{ googleSearch: {} }]
        });
        return result.text || "Sem resposta.";
    } catch (e) { return "Erro ao processar solicitação."; }
};

export const validateApiKey = async (key: string): Promise<boolean> => {
    return true; 
};

export const findAndClassifyDataSources = async (query: string): Promise<SuggestedSource[]> => {
    const prompt = `Encontre fontes de dados governamentais oficiais sobre: ${query}.
    Retorne um JSON Array com objetos contendo: name, url, category, type (API, Web Scraping, RSS, Banco de Dados).`;
    
    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }]
        });
        const data = extractJson(result.text);
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
};

// --- Real Generators ---

export const generateRealSocialPosts = async (municipality: string): Promise<SocialPost[]> => {
    const prompt = `Pesquise o que as pessoas estão falando nas redes sociais e notícias sobre a gestão atual da prefeitura de ${municipality}.
    Foque em reclamações de saúde, educação, obras e escândalos.
    
    Retorne um JSON Array com 5-8 posts simulados baseados em fatos reais recentes encontrados na web.
    Estrutura: { "platform": "Facebook/Instagram/Twitter", "author": "Nome Fictício ou Real", "content": "Texto", "sentiment": "Negative/Positive/Neutral", "timestamp": "Data Recente", "url": "Link da notícia ou post real se houver" }`;

    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }]
        });
        const data = extractJson(result.text);
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
};

export const generateRealTimeline = async (municipality: string): Promise<TimelineEvent[]> => {
    const prompt = `Crie uma linha do tempo dos principais eventos políticos e administrativos de ${municipality} nos últimos 12 meses.
    Inclua: Escândalos, Inaugurações, Operações Policiais, Cassação de mandato, Aprovação de leis polêmicas.
    
    Retorne um JSON Array.
    Estrutura: { "date": "YYYY-MM-DD", "title": "Título Curto", "description": "Descrição", "category": "Lawsuit/Nomination/Contract/Political", "icon": "nomination" }`;

    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }]
        });
        const data = extractJson(result.text);
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
};

export const generateRealEmployees = async (municipality: string): Promise<Employee[]> => {
    // 1. Busca Lista Base via IA com instrução específica de Nepotismo
    const prompt = `Liste 8 a 10 nomes de secretários municipais e cargos de confiança ATUAIS de ${municipality}.
    Busque em Diários Oficiais e site da Prefeitura.
    
    TAREFA DE NEPOTISMO:
    Para cada nome, verifique se o sobrenome coincide com o Prefeito, Vice ou outros Secretários. 
    Se houver suspeita, preencha o campo "nepotismAlert".
    
    Retorne JSON Array: { "name": "Nome", "position": "Cargo", "department": "Secretaria", "appointedBy": "Nome do Prefeito/Gestor", "startDate": "YYYY-MM-DD", "riskScore": 0, "nepotismAlert": "Descrição do parentesco suspeito ou null" }`;

    let employees: Employee[] = [];

    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        });
        employees = extractJson(result.text) || [];
    } catch (e) { 
        return []; 
    }

    // 2. Obter Regras do Módulo Político
    let criticalPositions: string[] = ['Finanças', 'Licitação', 'Obras', 'Saúde', 'Educação', 'Chefe de Gabinete', 'Tesouraria'];
    
    try {
        const politicalModule = await dbService.getModule('political');
        if (politicalModule && politicalModule.rules) {
            try {
                const rules = JSON.parse(politicalModule.rules) as PoliticalModuleRules;
                if (rules.critical_positions && rules.critical_positions.length > 0) {
                    criticalPositions = rules.critical_positions;
                }
            } catch(e) {}
        }
    } catch (e) {
        console.warn("Using default critical positions due to load error");
    }
    
    // 3. Cruzamento Lógico e Enriquecimento
    employees = employees.map(emp => {
        const isCritical = criticalPositions.some(cp => 
            emp.position.toLowerCase().includes(cp.toLowerCase()) || 
            (emp.department && emp.department.toLowerCase().includes(cp.toLowerCase()))
        );

        if (isCritical) {
            emp.criticalPosition = true;
            emp.riskScore = Math.max(emp.riskScore || 0, 7.0); 
            if (!emp.alerts) emp.alerts = [];
            emp.alerts.push({
                type: 'Cargo Crítico',
                severity: 'Alto',
                description: `Cargo listado nas regras de monitoramento político: ${emp.position}`
            });
        } else {
            emp.criticalPosition = false;
        }

        // Heurística de Fallback para Nepotismo (caso a IA não tenha pego, mas os sobrenomes batam)
        if (emp.appointedBy && emp.name && !emp.nepotismAlert) {
            const empSurname = emp.name.split(' ').pop();
            const appointSurname = emp.appointedBy.split(' ').pop();
            const commonSurnames = ['SILVA', 'SANTOS', 'OLIVEIRA', 'SOUZA', 'COSTA', 'PEREIRA', 'FERREIRA', 'RODRIGUES'];
            
            if (empSurname && appointSurname && empSurname.length > 3 && empSurname === appointSurname && !commonSurnames.includes(empSurname.toUpperCase())) {
                emp.nepotismAlert = `Sobrenome coincidente com autoridade nomeadora (${emp.appointedBy}). Necessário investigação.`;
            }
        }

        if (emp.nepotismAlert) {
            emp.riskScore = 10.0; // Risco Máximo
            if (!emp.alerts) emp.alerts = [];
            emp.alerts.push({
                type: 'Nepotismo',
                severity: 'Crítico',
                description: emp.nepotismAlert
            });
        }

        return emp;
    });

    return employees;
};

export const generateRealCompanies = async (municipality: string): Promise<Company[]> => {
    const prompt = `Liste 5 empresas que ganharam licitações recentes em ${municipality}.
    Retorne JSON Array: { "name": "Razão Social", "cnpj": "XX.XXX...", "totalContractsValue": 0.00, "riskScore": 0 }`;

    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        });
        const data = extractJson(result.text);
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
};

export const generateRealContracts = async (municipality: string): Promise<Contract[]> => {
    const prompt = `Liste 5 contratos públicos recentes de ${municipality}.
    Retorne JSON Array: { "id": "Num Contrato", "companyName": "Empresa", "object": "Objeto", "value": 0.00, "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" }`;

    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        });
        const data = extractJson(result.text);
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
};

export const generateRealLawsuits = async (municipality: string): Promise<Lawsuit[]> => {
    const prompt = `Busque processos judiciais (MP, TJ) envolvendo a Prefeitura de ${municipality} ou o Prefeito atual.
    Retorne JSON Array: { "id": "Num Processo", "parties": "Autor x Réu", "court": "Tribunal", "status": "Ongoing", "description": "Resumo" }`;

    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        });
        const data = extractJson(result.text);
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
};

export const generateFullDashboardData = async (municipality: string): Promise<DashboardData> => {
     const prompt = `Gere um dashboard estratégico JSON para ${municipality}.
            Inclua: stats (facebook, instagram, twitter, judicialProcesses), mayor (name, party, position, avatarUrl), viceMayor, reputationRadar (score, tendency, summary), crisisThemes, sentimentDistribution, irregularitiesPanorama, highImpactNews, masterItems.
            Use dados REAIS buscados na web.`;

     try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        });
        const data = extractJson(result.text);
        
        return {
            municipality,
            stats: data?.stats || { facebook: 0, instagram: 0, twitter: 0, judicialProcesses: 0 },
            mayor: data?.mayor || { name: 'Indisponível', position: 'Prefeito', party: '-', mandate: { start: '', end: '' }, avatarUrl: '' },
            viceMayor: data?.viceMayor || { name: 'Indisponível', position: 'Vice-Prefeito', party: '-', mandate: { start: '', end: '' }, avatarUrl: '' },
            reputationRadar: data?.reputationRadar || { score: 0, tendency: 'Estável', summary: 'Sem dados.' },
            crisisThemes: data?.crisisThemes || [],
            sentimentDistribution: data?.sentimentDistribution || { positive: 0, negative: 0, neutral: 100 },
            irregularitiesPanorama: data?.irregularitiesPanorama || [],
            highImpactNews: data?.highImpactNews || [],
            masterItems: data?.masterItems || [],
            dataSources: [],
            lastAnalysis: new Date().toISOString(),
            nextUpdate: new Date(Date.now() + 3600000).toISOString()
        };
     } catch(e) {
         throw new Error("Failed to generate dashboard");
     }
};

export const generatePoliticalLeadership = async (municipality: string): Promise<Politician[]> => {
     const prompt = `Quem são o Prefeito e Vice de ${municipality}? Retorne JSON Array de Politician com foto real se possível.`;
     try {
         const result = await callBackendAI(prompt, "gemini-2.5-flash", {
             tools: [{ googleSearch: {} }],
             responseMimeType: "application/json"
         });
         return extractJson(result.text) || [];
     } catch(e) { return []; }
};

export const generatePoliticalSquad = async (municipality: string): Promise<Politician[]> => {
     const prompt = `Liste 5 vereadores influentes de ${municipality}. Retorne JSON Array de Politician.`;
     try {
         const result = await callBackendAI(prompt, "gemini-2.5-flash", {
             tools: [{ googleSearch: {} }],
             responseMimeType: "application/json"
         });
         return extractJson(result.text) || [];
     } catch(e) { return []; }
};

export const generateDeepPoliticianAnalysis = async (p: Politician): Promise<Politician> => {
    const prompt = `Aprofunde os dados deste político: ${p.name} (${p.state}). Busque patrimônio (assets), votos recentes (votingHistory) e notícias (latestNews). Retorne JSON completo do objeto Politician atualizado.`;
    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        });
        const data = extractJson(result.text);
        return { ...p, ...data };
    } catch(e) { return p; }
};

export const investigateEmployee = async (e: Employee, m: string): Promise<string> => {
    const prompt = `Atue como um Auditor de Integridade Pública.
    Realize uma INVESTIGAÇÃO FORENSE PROFUNDA sobre:
    
    Indivíduo: ${e.name}
    Cargo: ${e.position}
    Departamento: ${e.department}
    Município: ${m}
    
    Busque em Diários Oficiais, Portais de Transparência e Processos Judiciais.
    
    FOCO DA ANÁLISE:
    1. **Nepotismo**: Verifique se há parentesco com Prefeito, Vice ou Secretários.
    2. **Antecedentes**: Busque processos (TJs, TRFs) no nome.
    3. **Conflito de Interesses**: Verifique se é sócio de empresas com contratos ativos na prefeitura.
    4. **Histórico**: Cargos anteriores e exonerações.
    
    Responda em Markdown estruturado com seções claras e conclusão de risco. Se não houver dados, informe explicitamente.`;
    
    try {
        const result = await callBackendAI(prompt, "gemini-2.5-flash", {
            tools: [{ googleSearch: {} }]
        });
        return result.text || "Sem dados disponíveis para este funcionário.";
    } catch(e) { return "Erro na investigação."; }
};
