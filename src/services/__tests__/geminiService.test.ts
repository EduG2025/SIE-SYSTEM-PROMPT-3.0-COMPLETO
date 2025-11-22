
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performDeepInvestigation } from '../geminiService';
import { dbService } from '../dbService';

// Mock do dbService para evitar chamadas reais ao backend
vi.mock('../dbService', () => ({
  dbService: {
    proxyAiRequest: vi.fn(),
    checkAndIncrementQuota: vi.fn().mockResolvedValue({ allowed: true }),
    getNextSystemApiKey: vi.fn().mockResolvedValue('mock-api-key'),
  },
}));

describe('geminiService', () => {
  const mockFilters = {
    fileType: 'any' as const,
    sourceType: 'any' as const,
    dateRange: 'any' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve realizar parsing correto de uma resposta JSON limpa da IA', async () => {
    const mockAiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  query: "Teste",
                  executiveSummary: "Resumo teste",
                  sentiment: { score: 50, label: "Neutro", summary: "Ok" },
                  redFlags: [],
                  timeline: [],
                  connections: [],
                  sources: [],
                  followUpActions: []
                })
              }
            ]
          }
        }
      ]
    };

    (dbService.proxyAiRequest as any).mockResolvedValue(mockAiResponse);

    const result = await performDeepInvestigation("Teste Query", mockFilters);

    expect(result.executiveSummary).toBe("Resumo teste");
    expect(result.sentiment.label).toBe("Neutro");
  });

  it('deve realizar parsing correto de uma resposta JSON envolvida em Markdown', async () => {
    const jsonString = JSON.stringify({
      query: "Teste Markdown",
      executiveSummary: "Resumo Markdown",
      sentiment: { score: 10, label: "Positivo", summary: "Bom" },
      redFlags: [],
      timeline: [],
      connections: [],
      sources: [],
      followUpActions: []
    });

    const mockAiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: "Aqui está o JSON:\n```json\n" + jsonString + "\n```"
              }
            ]
          }
        }
      ]
    };

    (dbService.proxyAiRequest as any).mockResolvedValue(mockAiResponse);

    const result = await performDeepInvestigation("Teste Markdown", mockFilters);

    expect(result.executiveSummary).toBe("Resumo Markdown");
  });

  it('deve lidar graciosamente com falhas na API de IA retornando um objeto de erro estruturado', async () => {
    (dbService.proxyAiRequest as any).mockRejectedValue(new Error("API Error"));

    const result = await performDeepInvestigation("Erro Query", mockFilters);

    expect(result.executiveSummary).toContain("Ocorreu um erro");
    expect(result.sentiment.label).toBe("Neutro");
    expect(result.redFlags).toEqual([]);
  });

  it('deve processar corretamente o Grounding Metadata (Fontes do Google)', async () => {
    const mockAiResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: "{}" }] // JSON vazio válido
          },
          groundingMetadata: {
            groundingChunks: [
              { web: { title: "Fonte 1", uri: "http://example.com" } }
            ]
          }
        }
      ]
    };

    (dbService.proxyAiRequest as any).mockResolvedValue(mockAiResponse);

    const result = await performDeepInvestigation("Grounding Test", mockFilters);

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].title).toBe("Fonte 1");
    expect(result.sources[0].uri).toBe("http://example.com");
  });
});
