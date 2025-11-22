import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dbService } from '../dbService';

// O fetch é mockado globalmente no setup.ts
const mockedFetch = globalThis.fetch as any;

describe('dbService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('deve autenticar usuário com sucesso e salvar token', async () => {
      const mockUser = { id: 1, username: 'admin', role: 'admin' };
      const mockToken = 'fake-jwt-token';

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken }),
      });

      const result = await dbService.login('admin', '123456');

      expect(mockedFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: '123456' })
      }));

      expect(result).toEqual(mockUser);
      expect(localStorage.getItem('auth_token')).toBe(mockToken);
    });

    it('deve lançar erro se as credenciais forem inválidas', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Senha incorreta' }),
      });

      await expect(dbService.login('admin', 'wrongpass')).rejects.toThrow('Senha incorreta');
    });
  });

  describe('testConnection', () => {
    it('deve retornar status Conectado quando o backend responde', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ status: 'online', port: 3000, mysql: 'ok' }),
      });

      const result = await dbService.testConnection();

      expect(result.status).toBe('Conectado');
      expect(result.details).toContain('API: Online');
    });

    it('deve detectar erro de Proxy Nginx (HTML retornado)', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'text/html' }, // Simula Nginx devolvendo index.html
      });

      const result = await dbService.testConnection();

      expect(result.status).toBe('Falha');
      expect(result.details).toContain('Erro de Proxy Nginx');
    });

    it('deve lidar com erro de rede (fetch falhando)', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network Error'));

      const result = await dbService.testConnection();

      expect(result.status).toBe('Falha');
      expect(result.details).toContain('Network Error');
    });
  });

  describe('Gestão de Configurações (Theme)', () => {
    it('deve salvar o tema localmente e tentar enviar para o backend', async () => {
      const newTheme = { primary: '#000', secondary: '#111', accent: '#222', text: '#fff', blue: '#333' };
      
      // Mock da resposta do backend (sucesso silencioso)
      mockedFetch.mockResolvedValue({ ok: true });

      await dbService.saveTheme(newTheme, 'admin');

      // Verifica persistência local
      expect(localStorage.getItem('sie_theme')).toBe(JSON.stringify(newTheme));

      // Verifica chamada ao backend
      expect(mockedFetch).toHaveBeenCalledWith(
        expect.stringContaining('/settings/theme'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTheme)
        })
      );
    });
  });
});